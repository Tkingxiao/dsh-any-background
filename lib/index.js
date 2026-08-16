import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
//#region src/index.ts
/**
* Node half of the dsh-any-background plugin: file-backed theme persistence.
*
* The browser client cannot touch the filesystem, so this half owns the
* `.dsh-any-background-data/` store under the DSH data home and exposes a
* small RPC surface over the shared `/api` channel. The client reads the
* persisted theme on boot and writes it back on every setting change.
*
* Storage layout:
*   ~/.dsh/.dsh-any-background-data/
*     ├── theme-config.json   settings (color, opacities, blur, bg state)
*     └── wallpaper.jpg       the chosen background image (deleted on remove)
*
* @module dsh-any-background
*/
const name = "dsh-any-background";
const inject = ["connection"];
const DATA_DIR = ".dsh-any-background-data";
const CONFIG_FILE = "theme-config.json";
const WALLPAPER_FILE = "wallpaper.jpg";
const DEFAULT_CONFIG = {
	color: null,
	opacity: .85,
	settingsOpacity: 1,
	wallpaperOpacity: 1,
	blur: 0,
	bgState: {
		zoom: 1,
		x: 0,
		y: 0,
		iw: 0,
		ih: 0
	}
};
const dataDir = () => dshHomePath(DATA_DIR);
const configPath = () => dshHomePath(DATA_DIR, CONFIG_FILE);
const wallpaperPath = () => dshHomePath(DATA_DIR, WALLPAPER_FILE);
function clamp(n, lo, hi, def) {
	return typeof n === "number" && isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def;
}
/** Coerce an unknown persisted value into a valid ThemeConfig, falling back per-field. */
function normalizeConfig(raw) {
	const r = raw ?? {};
	const c = r.color;
	const color = Array.isArray(c) && c.length === 3 && c.every((x) => typeof x === "number" && isFinite(x)) ? [
		clamp(c[0], 0, 360, 220),
		clamp(c[1], 0, 1, .55),
		clamp(c[2], 0, 1, .25)
	] : null;
	const bg = r.bgState ?? {};
	return {
		color,
		opacity: clamp(r.opacity, 0, 1, DEFAULT_CONFIG.opacity),
		settingsOpacity: clamp(r.settingsOpacity, 0, 1, DEFAULT_CONFIG.settingsOpacity),
		wallpaperOpacity: clamp(r.wallpaperOpacity, 0, 1, DEFAULT_CONFIG.wallpaperOpacity),
		blur: clamp(r.blur, 0, 60, DEFAULT_CONFIG.blur),
		bgState: {
			zoom: clamp(bg.zoom, .1, 10, 1),
			x: typeof bg.x === "number" && isFinite(bg.x) ? bg.x : 0,
			y: typeof bg.y === "number" && isFinite(bg.y) ? bg.y : 0,
			iw: typeof bg.iw === "number" && bg.iw > 0 ? bg.iw : 0,
			ih: typeof bg.ih === "number" && bg.ih > 0 ? bg.ih : 0
		}
	};
}
async function ensureDir() {
	try {
		await mkdir(dataDir(), { recursive: true });
	} catch (e) {
		console.warn(`dsh-any-background: cannot create data dir "${dataDir()}"`, e);
	}
}
async function readConfig() {
	await ensureDir();
	try {
		await access(configPath());
	} catch {
		return { ...DEFAULT_CONFIG };
	}
	try {
		const raw = await readFile(configPath(), "utf8");
		return normalizeConfig(JSON.parse(raw));
	} catch (e) {
		console.warn(`dsh-any-background: cannot read "${CONFIG_FILE}", using defaults`, e);
		return { ...DEFAULT_CONFIG };
	}
}
async function writeConfig(config) {
	await ensureDir();
	try {
		await writeFile(configPath(), JSON.stringify(normalizeConfig(config), null, 2), "utf8");
		return true;
	} catch (e) {
		console.error(`dsh-any-background: failed to write "${CONFIG_FILE}"`, e);
		return false;
	}
}
/** Read the wallpaper file and return it as a JPEG data URL (null when absent). */
async function readWallpaper() {
	try {
		return `data:image/jpeg;base64,${(await readFile(wallpaperPath())).toString("base64")}`;
	} catch {
		return null;
	}
}
/**
* Persist a wallpaper. Passing null removes the stored file; otherwise the
* data URL is decoded and written to wallpaper.jpg. Returns false (and keeps
* the previous file) when the payload is invalid or the write fails.
*/
async function writeWallpaper(dataUrl) {
	await ensureDir();
	try {
		if (dataUrl === null) {
			await rm(wallpaperPath(), { force: true });
			return true;
		}
		const m = /^data:image\/[a-zA-Z0-9.+-]+;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
		if (!m) return false;
		await writeFile(wallpaperPath(), Buffer.from(m[1], "base64"));
		return true;
	} catch (e) {
		console.error(`dsh-any-background: failed to write "${WALLPAPER_FILE}"`, e);
		return false;
	}
}
const NS = "dshAnyBackground";
function apply(ctx) {
	const dispose = ctx.connection.rpc.handle("/dsh-any-background", async (ep, payload) => {
		const method = ep.slice(`${NS}/`.length);
		try {
			switch (method) {
				case "read": return {
					ok: true,
					value: {
						config: await readConfig(),
						wallpaper: await readWallpaper()
					}
				};
				case "writeConfig": return {
					ok: true,
					value: await writeConfig(payload?.config ?? {})
				};
				case "setWallpaper": return {
					ok: true,
					value: await writeWallpaper(payload?.dataUrl ?? null)
				};
				default: return {
					ok: false,
					error: {
						code: "bad-request",
						message: `unknown endpoint ${ep}`,
						details: { issues: [] }
					}
				};
			}
		} catch (e) {
			return {
				ok: false,
				error: {
					code: "internal",
					message: e instanceof Error ? e.message : String(e),
					details: {}
				}
			};
		}
	}, { authority: "trusted-host" });
	ctx.on("dispose", () => {
		dispose();
	});
}
//#endregion
export { apply, inject, name };
