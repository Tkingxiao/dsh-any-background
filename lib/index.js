import { access, mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
//#region src/index.ts
/**
* Node half of dsh-any-background: file-backed theme persistence.
*
* Owns the `~/.dsh/.dsh-any-background-data/` store and exposes a small RPC
* surface on the dedicated `/dsh-any-background` channel (never the shared
* `/api`, so slash commands stay intact).
*
*   theme-config.json   settings
*   wallpaper.jpg       background image
*   wallpaper.<ext>     background video, named by MIME (mp4/webm/ogv/mov/mkv);
*                       played over HTTP route /dsh-any-background/video and
*                       uploaded to /dsh-any-background/video/upload as raw
*                       bytes — never base64 through the RPC channel.
*/
const name = "dsh-any-background";
const inject = ["connection", "webServer"];
const DATA_DIR = ".dsh-any-background-data";
const CONFIG_FILE = "theme-config.json";
const WALLPAPER_FILE = "wallpaper.jpg";
const VIDEO_ROUTE = "/dsh-any-background/video";
const UPLOAD_ROUTE = "/dsh-any-background/video/upload";
const UPLOAD_TMP = "wallpaper.upload.tmp";
function videoFileName(mime) {
	switch (mime) {
		case "video/mp4": return "wallpaper.mp4";
		case "video/webm": return "wallpaper.webm";
		case "video/ogg": return "wallpaper.ogv";
		case "video/quicktime": return "wallpaper.mov";
		case "video/x-matroska": return "wallpaper.mkv";
		default: return "wallpaper.video";
	}
}
const VIDEO_CANDIDATES = [
	"wallpaper.mp4",
	"wallpaper.webm",
	"wallpaper.ogv",
	"wallpaper.mov",
	"wallpaper.mkv",
	"wallpaper.video"
];
const DEFAULT_CONFIG = {
	color: null,
	opacities: {
		bg: .85,
		sidebar: .93,
		card: 1,
		input: 1
	},
	blurs: {
		bg: 0,
		sidebar: 0,
		card: 0,
		settings: 0,
		chat: 0,
		trajectory: 0,
		input: 0
	},
	settingsOpacity: 1,
	wallpaperOpacity: 1,
	blur: 0,
	bgState: {
		zoom: 1,
		x: 0,
		y: 0,
		iw: 0,
		ih: 0
	},
	videoBgState: {
		zoom: 1,
		x: 0,
		y: 0,
		iw: 0,
		ih: 0
	},
	backgroundType: "image",
	bgMode: "fit",
	videoMime: null,
	generatedBg: null,
	regenerateOnReload: false,
	chatTextOpacity: 0,
	trajectoryOpacity: 1
};
const dataDir = () => dshHomePath(DATA_DIR);
const configPath = () => dshHomePath(DATA_DIR, CONFIG_FILE);
const wallpaperPath = () => dshHomePath(DATA_DIR, WALLPAPER_FILE);
const videoPathFor = (mime) => dshHomePath(DATA_DIR, videoFileName(mime));
const exists = async (p) => {
	try {
		await access(p);
		return true;
	} catch {
		return false;
	}
};
/** Locate the stored video: the recorded MIME decides the expected name; a
*  legacy extensionless wallpaper.video is renamed on first access. */
async function findVideoFile() {
	const cfg = await readConfig();
	const expected = videoPathFor(cfg.videoMime);
	if (await exists(expected)) return {
		path: expected,
		mime: cfg.videoMime
	};
	for (const name of VIDEO_CANDIDATES) {
		const p = dshHomePath(DATA_DIR, name);
		if (!await exists(p)) continue;
		if (cfg.videoMime !== null && name !== videoFileName(cfg.videoMime)) try {
			await rename(p, expected);
			return {
				path: expected,
				mime: cfg.videoMime
			};
		} catch {
			return null;
		}
		return {
			path: p,
			mime: cfg.videoMime
		};
	}
	return null;
}
function clamp(n, lo, hi, def) {
	return typeof n === "number" && isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def;
}
function normalizeBgState(s) {
	return {
		zoom: clamp(s.zoom, .1, 10, 1),
		x: typeof s.x === "number" && isFinite(s.x) ? s.x : 0,
		y: typeof s.y === "number" && isFinite(s.y) ? s.y : 0,
		iw: typeof s.iw === "number" && s.iw > 0 ? s.iw : 0,
		ih: typeof s.ih === "number" && s.ih > 0 ? s.ih : 0
	};
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
	const bgType = [
		"image",
		"video",
		"mesh",
		"shader",
		"pattern"
	].includes(r.backgroundType) ? r.backgroundType : DEFAULT_CONFIG.backgroundType;
	const bgMode = [
		"fit",
		"fill",
		"stretch",
		"tile",
		"center"
	].includes(r.bgMode) ? r.bgMode : DEFAULT_CONFIG.bgMode;
	const gen = r.generatedBg && typeof r.generatedBg === "object" ? r.generatedBg : null;
	const generatedBg = gen && gen.type === bgType ? normalizeGeneratedBg(r.generatedBg) : null;
	const legacy = typeof r.opacity === "number" ? r.opacity : null;
	const ops = r.opacities ?? {};
	const bl = r.blurs ?? {};
	const blurs = {};
	for (const k of [
		"bg",
		"sidebar",
		"card",
		"settings",
		"chat",
		"trajectory",
		"input"
	]) blurs[k] = clamp(bl[k], 0, 60, DEFAULT_CONFIG.blurs[k]);
	return {
		color,
		opacities: {
			bg: clamp(ops.bg, 0, 1, legacy ?? DEFAULT_CONFIG.opacities.bg),
			sidebar: clamp(ops.sidebar, 0, 1, legacy !== null ? Math.min(1, legacy + .08) : DEFAULT_CONFIG.opacities.sidebar),
			card: clamp(ops.card, 0, 1, DEFAULT_CONFIG.opacities.card),
			input: clamp(ops.input, 0, 1, DEFAULT_CONFIG.opacities.input)
		},
		blurs,
		settingsOpacity: clamp(r.settingsOpacity, 0, 1, DEFAULT_CONFIG.settingsOpacity),
		wallpaperOpacity: clamp(r.wallpaperOpacity, 0, 1, DEFAULT_CONFIG.wallpaperOpacity),
		blur: clamp(r.blur, 0, 60, DEFAULT_CONFIG.blur),
		bgState: normalizeBgState(r.bgState ?? {}),
		videoBgState: normalizeBgState(r.videoBgState ?? {}),
		backgroundType: bgType,
		bgMode,
		videoMime: typeof r.videoMime === "string" ? r.videoMime : null,
		generatedBg,
		regenerateOnReload: typeof r.regenerateOnReload === "boolean" ? r.regenerateOnReload : DEFAULT_CONFIG.regenerateOnReload,
		chatTextOpacity: clamp(r.chatTextOpacity, 0, 1, DEFAULT_CONFIG.chatTextOpacity),
		trajectoryOpacity: clamp(r.trajectoryOpacity, 0, 1, DEFAULT_CONFIG.trajectoryOpacity)
	};
}
function normalizeGeneratedBg(p) {
	if (p.type === "mesh") return {
		type: "mesh",
		seed: typeof p.seed === "number" ? p.seed : 0,
		scale: clamp(p.scale, .3, 3, 1),
		intensity: clamp(p.intensity, 0, 1, .6)
	};
	if (p.type === "shader") return {
		type: "shader",
		preset: [
			"aurora",
			"nebula",
			"noise"
		].includes(p.preset) ? p.preset : "aurora",
		speed: clamp(p.speed, 0, 2, .3),
		scale: clamp(p.scale, .3, 3, 1),
		seed: typeof p.seed === "number" ? Math.floor(p.seed) : 0
	};
	if (p.type === "pattern") return {
		type: "pattern",
		preset: [
			"dots",
			"waves",
			"poly"
		].includes(p.preset) ? p.preset : "dots",
		density: clamp(p.density, 0, 1, .5),
		scale: clamp(p.scale, .3, 3, 1),
		seed: typeof p.seed === "number" ? Math.floor(p.seed) : 0
	};
	return null;
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
		const raw = await readFile(configPath(), "utf8");
		return normalizeConfig(JSON.parse(raw));
	} catch {
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
async function readWallpaper() {
	try {
		return `data:image/jpeg;base64,${(await readFile(wallpaperPath())).toString("base64")}`;
	} catch {
		return null;
	}
}
/** Persist a wallpaper (null removes it); false keeps the previous file. */
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
async function videoUrl() {
	return await findVideoFile() ? VIDEO_ROUTE : null;
}
/** Persist a video from a data URL (null removes every variant); only used
*  for removal and small legacy/import payloads. */
async function writeVideo(dataUrl) {
	await ensureDir();
	try {
		if (dataUrl === null) {
			for (const name of VIDEO_CANDIDATES) await rm(dshHomePath(DATA_DIR, name), { force: true });
			return true;
		}
		const m = /^data:(video\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
		if (!m) return false;
		const target = videoPathFor(m[1]);
		for (const name of VIDEO_CANDIDATES) {
			const p = dshHomePath(DATA_DIR, name);
			if (p !== target) await rm(p, { force: true });
		}
		await writeFile(target, Buffer.from(m[2], "base64"));
		return true;
	} catch (e) {
		console.error("dsh-any-background: failed to write the background video", e);
		return false;
	}
}
/** Stream the stored video: correct MIME, no caching, Range answers so the
*  browser can seek (snapshot capture does). */
async function serveVideo(req, res) {
	if (req.method !== "GET" && req.method !== "HEAD") {
		res.writeHead(405, { "Content-Type": "application/json" });
		res.end(JSON.stringify({
			ok: false,
			error: "video route only serves GET/HEAD; uploads need the plugin upload route — restart the web server to load it"
		}));
		return;
	}
	try {
		const found = await findVideoFile();
		if (found === null) {
			res.writeHead(404);
			res.end("no background video stored");
			return;
		}
		const st = await stat(found.path);
		const baseHeaders = {
			"Content-Type": found.mime ?? "application/octet-stream",
			"Accept-Ranges": "bytes",
			"Cache-Control": "no-store"
		};
		const range = typeof req.headers.range === "string" ? req.headers.range.trim() : "";
		const m = /^bytes=(\d*)-(\d*)$/.exec(range);
		if (m !== null && (m[1] !== "" || m[2] !== "")) {
			let start;
			let end;
			if (m[1] === "") {
				const suffix = parseInt(m[2], 10);
				start = Math.max(0, st.size - suffix);
				end = st.size - 1;
			} else {
				start = parseInt(m[1], 10);
				end = m[2] !== "" ? Math.min(parseInt(m[2], 10), st.size - 1) : st.size - 1;
			}
			if (start >= st.size || start > end) {
				res.writeHead(416, { "Content-Range": `bytes */${st.size}` });
				res.end();
				return;
			}
			res.writeHead(206, {
				...baseHeaders,
				"Content-Range": `bytes ${start}-${end}/${st.size}`,
				"Content-Length": end - start + 1
			});
			if (req.method === "HEAD") {
				res.end();
				return;
			}
			createReadStream(found.path, {
				start,
				end
			}).pipe(res);
			return;
		}
		res.writeHead(200, {
			...baseHeaders,
			"Content-Length": st.size
		});
		if (req.method === "HEAD") {
			res.end();
			return;
		}
		createReadStream(found.path).pipe(res);
	} catch (e) {
		console.error("dsh-any-background: failed to serve the background video", e);
		try {
			res.writeHead(500);
			res.end();
		} catch {}
	}
}
/** Accept a raw video upload (POST): pipe the body into a temp file, then
*  rename it into the MIME-derived slot. Aborted transfers clean up. */
async function handleVideoUpload(req, res) {
	if (req.method !== "POST") {
		res.writeHead(405);
		res.end();
		return;
	}
	const mime = (typeof req.headers["content-type"] === "string" ? req.headers["content-type"] : "").split(";")[0].trim();
	if (!mime.startsWith("video/")) {
		req.resume();
		res.writeHead(415, { "Content-Type": "application/json" });
		res.end(JSON.stringify({
			ok: false,
			error: "unsupported media type, expected video/*"
		}));
		return;
	}
	try {
		await ensureDir();
		const tmp = dshHomePath(DATA_DIR, UPLOAD_TMP);
		const target = videoPathFor(mime);
		const out = createWriteStream(tmp);
		let failed = false;
		const fail = () => {
			if (failed) return;
			failed = true;
			out.destroy();
			rm(tmp, { force: true });
		};
		req.on("aborted", fail);
		req.on("error", fail);
		out.on("error", () => {
			fail();
			try {
				res.writeHead(500);
				res.end();
			} catch {}
		});
		req.pipe(out);
		out.on("finish", async () => {
			if (failed) return;
			try {
				for (const name of VIDEO_CANDIDATES) {
					const p = dshHomePath(DATA_DIR, name);
					if (p !== target) await rm(p, { force: true });
				}
				await rm(target, { force: true });
				await rename(tmp, target);
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: true }));
			} catch (e) {
				console.error("dsh-any-background: failed to finalize the uploaded video", e);
				rm(tmp, { force: true });
				try {
					res.writeHead(500);
					res.end();
				} catch {}
			}
		});
	} catch (e) {
		console.error("dsh-any-background: failed to accept the video upload", e);
		try {
			res.writeHead(500);
			res.end();
		} catch {}
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
						wallpaper: await readWallpaper(),
						videoUrl: await videoUrl()
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
				case "setVideo": return {
					ok: true,
					value: await writeVideo(payload?.dataUrl ?? null)
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
	const disposeRoute = ctx.webServer.register({
		kind: "prefix",
		path: VIDEO_ROUTE,
		handler: serveVideo
	});
	const disposeUpload = ctx.webServer.register({
		kind: "exact",
		path: UPLOAD_ROUTE,
		handler: handleVideoUpload
	});
	ctx.on("dispose", () => {
		disposeRoute();
		disposeUpload();
		dispose();
	});
}
//#endregion
export { apply, inject, name };
