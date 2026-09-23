import { access, mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
import { basename, dirname, join } from "node:path";
//#region src/host-compat/channel.ts
/** What this plugin supports, in upgrade order. One row = one build whose facts
*  were checked; several rows may share a `channel` when a newer build was
*  verified as needing no change to that folder's adapter (as `0.1.7-rc.1` was) —
*  a row then reports `exact` instead of `line`, and no new folder appears.
*  Adding an ADAPTER means adding a channel plus a folder in
*  `client/host-compat/versions/`. */
const SUPPORTED_RELEASES = [
	{
		channel: "0.1.5-rc",
		release: "0.1.5-rc.2"
	},
	{
		channel: "0.1.6-alpha",
		release: "0.1.6-alpha.2"
	},
	{
		channel: "0.1.7-alpha",
		release: "0.1.7-alpha.2"
	},
	{
		channel: "0.1.7-alpha",
		release: "0.1.7-rc.1"
	}
];
const UNKNOWN_HOST_INFO = {
	version: null,
	channel: "unknown"
};
/** True when a string looks like a release version. A bare `~/.dsh` directory
*  basename does not, which is why the disk probe sanity-checks before trusting
*  a path segment. */
const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
function looksLikeVersion(value) {
	return VERSION_RE.test(value);
}
const PARSE_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;
function parse(version) {
	const m = PARSE_RE.exec(version);
	if (m === null) return null;
	const parts = m[4] === void 0 ? [] : m[4].split(".");
	const build = parts.length > 1 ? Number(parts[1]) : NaN;
	return {
		core: [
			Number(m[1]),
			Number(m[2]),
			Number(m[3])
		],
		channel: parts.length > 0 ? parts[0] : null,
		build: Number.isFinite(build) ? build : null
	};
}
/** The table, parsed once: every row is a literal this file controls. */
const TABLE = SUPPORTED_RELEASES.map((row) => ({
	...row,
	parsed: parse(row.release)
}));
function cmpCore(a, b) {
	for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
	return 0;
}
/** Total order over releases, following the semver rule that a prerelease sorts
*  BELOW the release it precedes (`0.1.6-alpha.2 < 0.1.6`). */
function cmp(a, b) {
	const core = cmpCore(a.core, b.core);
	if (core !== 0) return core;
	if (a.channel === null || b.channel === null) {
		if (a.channel === b.channel) return 0;
		return a.channel === null ? 1 : -1;
	}
	if (a.channel !== b.channel) return a.channel < b.channel ? -1 : 1;
	const ab = a.build ?? 0;
	const bb = b.build ?? 0;
	return ab === bb ? 0 : ab < bb ? -1 : 1;
}
/** Pick the adapter for a release, clamping to the nearest verified line when the
*  release is outside everything this plugin has seen.
*
*  A release is matched by PATCH LINE before anything else: `0.1.6-alpha.4` and a
*  future `0.1.6` stable both belong to the line verified at `0.1.6-alpha.2`, and
*  handing them that adapter beats giving up — the DOM probes only cover panel
*  mechanics, not the surface decisions the line is known for.
*
*  Outside every verified line the answer is a guess, so it is the closest one and
*  it says so (`nearest`): newer than the newest line → that newest adapter, older
*  than the oldest → the oldest, strictly between two → the LOWER one, because an
*  adapter may only claim what it was verified for. A release that will not parse
*  at all is `unknown`, and the DOM arbitrates there. */
function classifyRelease(version) {
	const host = version === null ? null : parse(version);
	if (host === null) return {
		channel: "unknown",
		match: "unresolved"
	};
	const sameLine = TABLE.filter((row) => cmpCore(row.parsed.core, host.core) === 0);
	if (sameLine.length > 0) {
		const exact = sameLine.find((row) => row.release === version);
		if (exact !== void 0) return {
			channel: exact.channel,
			match: "exact"
		};
		const atOrBelow = sameLine.filter((row) => cmp(row.parsed, host) <= 0);
		return {
			channel: (atOrBelow.length > 0 ? atOrBelow[atOrBelow.length - 1] : sameLine[0]).channel,
			match: "line"
		};
	}
	const older = TABLE.filter((row) => cmp(row.parsed, host) < 0);
	if (older.length === 0) return {
		channel: TABLE[0].channel,
		match: "nearest"
	};
	if (TABLE.filter((row) => cmp(row.parsed, host) > 0).length === 0) return {
		channel: TABLE[TABLE.length - 1].channel,
		match: "nearest"
	};
	return {
		channel: older[older.length - 1].channel,
		match: "nearest"
	};
}
//#endregion
//#region src/host-compat/detect.ts
/**
* The front door: resolve which DSH release this plugin is running under.
*
* WHY IT RUNS HERE (node) AND NOT IN THE BROWSER
* The client context exposes no host version — verified against the harness: no
* `hostVersion`/`dshVersion` field on `ctx`, and `window.__DSH_BOOT__.version` is
* the module-table format tag `'client'`, not a release. Capability probing alone
* is also not enough, because the obvious probes do not separate the release
* lines:
* `ctx.sidebarRightTabs` and the `[data-sidebar-right-panel]` marker both exist on
* 0.1.5-rc.2 already, so either one used as a "0.1.6+" test mis-classifies 0.1.5
* as newer. The install the process was composed FROM states the release directly,
* and only the node half can read it.
*
* Three hops, most authoritative first:
*   1. `ctx.profileContext.installAnchor` — the absolute path of the running
*      app's own manifest (`<…>/node_modules/@deepseek-ai/dsh/package.json`; the
*      host passes exactly that file, `new URL('../package.json', import.meta.url)`
*      of its `dsh` package). Whatever process is serving this plugin is what that
*      manifest versioned, so it needs no path guessing. Provided by
*      `dsh-app-boot` only in a dsh-launched profile, hence optional.
*   2. The installed manifest next to the launcher home:
*      `<root>/versions/<ver>/node_modules/@deepseek-ai/dsh/package.json`, reached
*      from `$DSH_HOME`'s `homes/<ver>` layout. For a host that gives no
*      `profileContext`.
*   3. `$DSH_HOME`'s basename, because launcher homes live in a folder named after
*      the release (`.../homes/0.1.6-alpha.2`). A user may point DSH_HOME at a
*      plain `~/.dsh` (no launcher layout at all), whose basename is not a
*      version — hence `looksLikeVersion` gates it.
*
* A release that resolves but matches no verified patch line is clamped to the
* nearest adapter by `classifyRelease()`; only a release that will not parse at
* all degrades to `version: null` / `channel: 'unknown'`, where the client half
* falls back to DOM-shape probing. That fallback is not hypothetical: a plain
* `~/.dsh` install lands here, and a wrong guess would silently restyle the
* user's window.
*
* @module
*/
/** What "the verified lines" are, spelled out for the clamp log below. */
const SUPPORTED_HINT = SUPPORTED_RELEASES.map((row) => row.release).join(" ~ ");
/** Read the `version` field of a package manifest, or null when the file is
*  missing, unreadable, not JSON or does not declare a release-looking version —
*  every one of which just means "this hop has no answer". */
async function manifestVersion(file) {
	try {
		const raw = JSON.parse(await readFile(file, "utf8"));
		if (typeof raw.version === "string" && looksLikeVersion(raw.version.trim())) return raw.version.trim();
	} catch {}
	return null;
}
/** Hop 1: the anchor the host itself hands us. A custom composition may point it
*  at its own manifest, whose `version` is whatever that project calls itself —
*  `looksLikeVersion` inside `manifestVersion` is what keeps a non-release out. */
async function versionFromAnchor(anchor) {
	if (typeof anchor !== "string" || anchor === "") return null;
	if (!/[/\\]package\.json$/.test(anchor)) return null;
	return manifestVersion(anchor);
}
/** Hop 2: the installed manifest two levels up from a launcher home
*  (`<root>/homes/<ver>` → `<root>/versions/<ver>`), or null when the layout does
*  not apply (plain `~/.dsh`, non-launcher hosts). */
async function versionFromLauncher(homeDir) {
	const root = dirname(dirname(homeDir));
	const versionSeg = basename(homeDir);
	if (!looksLikeVersion(versionSeg)) return null;
	return manifestVersion(join(root, "versions", versionSeg, "node_modules", "@deepseek-ai", "dsh", "package.json"));
}
/** Cached verdict: the probe touches the filesystem, and the host release never
*  changes within a process lifetime. */
let cache;
/** Resolve (and cache) the host release + channel. `installAnchor` is
*  `ctx.profileContext?.installAnchor`, read at plugin mount time.
*
*  A clamped verdict (`nearest`) is logged once: it means the plugin is styling a
*  release it was never verified against, and that is the first thing to know when
*  a new host build reports a broken surface. */
async function resolveHostInfo(installAnchor) {
	if (cache !== void 0) return cache;
	const homeDir = dshHomePath();
	let version = await versionFromAnchor(installAnchor);
	if (version === null) version = await versionFromLauncher(homeDir);
	if (version === null) {
		const seg = basename(homeDir);
		if (looksLikeVersion(seg)) version = seg;
	}
	const verdict = classifyRelease(version);
	if (verdict.match === "nearest") console.log(`dsh-any-background: host release ${version} is outside the verified lines, styling it as ${verdict.channel} (supports ${SUPPORTED_HINT})`);
	cache = {
		version,
		channel: verdict.channel
	};
	return cache;
}
//#endregion
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
const ROTATION_DIR = "rotation";
const VIDEO_ROUTE = "/dsh-any-background/video";
const UPLOAD_ROUTE = "/dsh-any-background/video/upload";
const WALLPAPER_ROUTE = "/dsh-any-background/wallpaper";
const WALLPAPER_UPLOAD_ROUTE = "/dsh-any-background/wallpaper/upload";
const FONT_ROUTE = "/dsh-any-background/font";
const FONT_UPLOAD_ROUTE = "/dsh-any-background/font/upload";
const UPLOAD_TMP = "wallpaper.upload.tmp";
const VIDEO_UPLOAD_TMP = "video.upload.tmp";
const FONT_UPLOAD_TMP = "font.upload.tmp";
const WALLPAPER_UPLOAD_MAX = 104857600;
const VIDEO_UPLOAD_MAX = 2147483648;
const FONT_UPLOAD_MAX = 104857600;
const WALLPAPER_FETCH_MAX = 26214400;
const WALLPAPER_FETCH_TIMEOUT = 2e4;
const VIDEO_FETCH_MAX = 2147483648;
const VIDEO_FETCH_TIMEOUT = 6e4;
const VIDEO_FETCH_IDLE_TIMEOUT = 6e4;
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
/** Font slot: one font owns the slot, named by format like the video slot. */
function fontFileName(mime) {
	switch (mime) {
		case "font/woff2": return "font.woff2";
		case "font/woff": return "font.woff";
		case "font/otf": return "font.otf";
		case "font/ttf": return "font.ttf";
		default: return "font.ttf";
	}
}
const FONT_CANDIDATES = [
	"font.woff2",
	"font.woff",
	"font.otf",
	"font.ttf"
];
/** Sniff a font's container format from its leading magic bytes (null when the
*  bytes are not a recognized font — uploads are rejected rather than stored). */
function sniffFontMime(buf) {
	if (buf.length >= 4 && buf[0] === 119 && buf[1] === 79 && buf[2] === 70 && buf[3] === 50) return "font/woff2";
	if (buf.length >= 4 && buf[0] === 119 && buf[1] === 79 && buf[2] === 70 && buf[3] === 70) return "font/woff";
	if (buf.length >= 4 && buf[0] === 79 && buf[1] === 84 && buf[2] === 84 && buf[3] === 79) return "font/otf";
	if (buf.length >= 4 && buf[0] === 0 && buf[1] === 1 && buf[2] === 0 && buf[3] === 0) return "font/ttf";
	return null;
}
const DEFAULT_CONFIG = {
	color: null,
	opacities: {
		bg: 0,
		sidebar: .5,
		card: .5,
		input: .5
	},
	blurs: {
		bg: 0,
		sidebar: 30,
		card: 30,
		settings: 30,
		chat: 30,
		trajectory: 30,
		input: 30,
		panel: 30,
		produced: 30,
		header: 30
	},
	strokes: {
		bg: {
			width: 0,
			color: "auto",
			customColor: "#808080"
		},
		sidebar: {
			width: 0,
			color: "auto",
			customColor: "#808080"
		},
		card: {
			width: 0,
			color: "auto",
			customColor: "#808080"
		},
		settings: {
			width: 0,
			color: "auto",
			customColor: "#808080"
		},
		chat: {
			width: 0,
			color: "auto",
			customColor: "#808080"
		},
		trajectory: {
			width: 0,
			color: "auto",
			customColor: "#808080"
		},
		input: {
			width: 0,
			color: "auto",
			customColor: "#808080"
		},
		panel: {
			width: 0,
			color: "auto",
			customColor: "#808080"
		},
		produced: {
			width: 0,
			color: "auto",
			customColor: "#808080"
		},
		header: {
			width: 0,
			color: "auto",
			customColor: "#808080"
		}
	},
	settingsOpacity: .5,
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
	fontMime: null,
	fontEnabled: true,
	generatedBg: null,
	regenerateOnReload: false,
	chatTextOpacity: .5,
	trajectoryOpacity: .5,
	panelOpacity: .5,
	producedOpacity: .5,
	headerOpacity: .5,
	profiles: [],
	rotation: {
		enabled: false,
		mode: "shuffle",
		interval: "daily",
		current: 0,
		items: [],
		lastRotate: null
	},
	schedule: {
		enabled: false,
		mode: "time",
		dayProfile: null,
		nightProfile: null,
		dayStart: "07:00",
		nightStart: "19:00"
	},
	schemeOverride: "auto",
	activeProfile: null
};
const dataDir = () => dshHomePath(DATA_DIR);
const configPath = () => dshHomePath(DATA_DIR, CONFIG_FILE);
const wallpaperPath = () => dshHomePath(DATA_DIR, WALLPAPER_FILE);
const videoPathFor = (mime) => dshHomePath(DATA_DIR, videoFileName(mime));
const fontPathFor = (mime) => dshHomePath(DATA_DIR, fontFileName(mime));
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
/** Locate the stored font: the recorded MIME decides the expected name; stray
*  files from a lost config write are adopted via rename (mirrors the video
*  slot's recovery). */
async function findFontFile() {
	const mime = (await readConfig()).fontMime ?? "font/ttf";
	const expected = fontPathFor(mime);
	if (await exists(expected)) return {
		path: expected,
		mime
	};
	for (const name of FONT_CANDIDATES) {
		const p = dshHomePath(DATA_DIR, name);
		if (!await exists(p)) continue;
		const foundMime = mimeForFontFile(name);
		try {
			await rename(p, expected);
			return {
				path: expected,
				mime: foundMime
			};
		} catch {
			return null;
		}
	}
	return null;
}
function mimeForFontFile(name) {
	switch (name) {
		case "font.woff2": return "font/woff2";
		case "font.woff": return "font/woff";
		case "font.otf": return "font/otf";
		default: return "font/ttf";
	}
}
async function fontUrl() {
	return await findFontFile() ? FONT_ROUTE : null;
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
const STROKE_GROUPS = [
	"bg",
	"sidebar",
	"card",
	"settings",
	"chat",
	"trajectory",
	"input",
	"panel",
	"produced",
	"header"
];
const STROKE_COLOR_KEYS = [
	"auto",
	"gray",
	"black",
	"white",
	"theme",
	"custom"
];
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
function normalizeStroke(raw) {
	const s = raw ?? {};
	return {
		width: clamp(s.width, 0, 4, 0),
		color: STROKE_COLOR_KEYS.includes(s.color) ? s.color : "auto",
		customColor: typeof s.customColor === "string" && HEX_RE.test(s.customColor) ? s.customColor : "#808080"
	};
}
function normalizeStrokes(raw) {
	const s = raw ?? {};
	const out = {};
	for (const k of STROKE_GROUPS) out[k] = normalizeStroke(s[k]);
	return out;
}
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
		"input",
		"panel",
		"produced",
		"header"
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
		strokes: normalizeStrokes(r.strokes),
		settingsOpacity: clamp(r.settingsOpacity, 0, 1, DEFAULT_CONFIG.settingsOpacity),
		wallpaperOpacity: clamp(r.wallpaperOpacity, 0, 1, DEFAULT_CONFIG.wallpaperOpacity),
		blur: clamp(r.blur, 0, 60, DEFAULT_CONFIG.blur),
		bgState: normalizeBgState(r.bgState ?? {}),
		videoBgState: normalizeBgState(r.videoBgState ?? {}),
		backgroundType: bgType,
		bgMode,
		videoMime: typeof r.videoMime === "string" ? r.videoMime : null,
		fontMime: typeof r.fontMime === "string" ? r.fontMime : null,
		fontEnabled: typeof r.fontEnabled === "boolean" ? r.fontEnabled : DEFAULT_CONFIG.fontEnabled,
		generatedBg,
		regenerateOnReload: typeof r.regenerateOnReload === "boolean" ? r.regenerateOnReload : DEFAULT_CONFIG.regenerateOnReload,
		chatTextOpacity: clamp(r.chatTextOpacity, 0, 1, DEFAULT_CONFIG.chatTextOpacity),
		trajectoryOpacity: clamp(r.trajectoryOpacity, 0, 1, DEFAULT_CONFIG.trajectoryOpacity),
		panelOpacity: clamp(r.panelOpacity, 0, 1, DEFAULT_CONFIG.panelOpacity),
		producedOpacity: clamp(r.producedOpacity, 0, 1, DEFAULT_CONFIG.producedOpacity),
		headerOpacity: clamp(r.headerOpacity, 0, 1, DEFAULT_CONFIG.headerOpacity),
		profiles: normalizeProfiles(r.profiles),
		rotation: normalizeRotation(r.rotation),
		schedule: normalizeSchedule(r.schedule),
		schemeOverride: r.schemeOverride === "light" || r.schemeOverride === "dark" ? r.schemeOverride : "auto",
		activeProfile: typeof r.activeProfile === "string" ? r.activeProfile : null
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
			"noise",
			"starfield"
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
			"poly",
			"rain",
			"contour",
			"meta"
		].includes(p.preset) ? p.preset : "dots",
		density: clamp(p.density, 0, 1, .5),
		scale: clamp(p.scale, .3, 3, 1),
		seed: typeof p.seed === "number" ? Math.floor(p.seed) : 0
	};
	return null;
}
const MAX_PROFILES = 20;
const MAX_ROTATION_ITEMS = 30;
const MAX_THUMB_BYTES = 65536;
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
/** Coerce an unknown value into a ProfileAppearance (appearance subset only). */
function normalizeProfileAppearance(raw) {
	const a = raw ?? {};
	const c = a.color;
	const ops = a.opacities ?? {};
	const bl = a.blurs ?? {};
	const blurs = {};
	for (const k of [
		"bg",
		"sidebar",
		"card",
		"settings",
		"chat",
		"trajectory",
		"input",
		"panel",
		"produced"
	]) blurs[k] = clamp(bl[k], 0, 60, DEFAULT_CONFIG.blurs[k]);
	return {
		color: Array.isArray(c) && c.length === 3 && c.every((x) => typeof x === "number" && isFinite(x)) ? [
			clamp(c[0], 0, 360, 220),
			clamp(c[1], 0, 1, .55),
			clamp(c[2], 0, 1, .25)
		] : null,
		opacities: {
			bg: clamp(ops.bg, 0, 1, DEFAULT_CONFIG.opacities.bg),
			sidebar: clamp(ops.sidebar, 0, 1, DEFAULT_CONFIG.opacities.sidebar),
			card: clamp(ops.card, 0, 1, DEFAULT_CONFIG.opacities.card),
			input: clamp(ops.input, 0, 1, DEFAULT_CONFIG.opacities.input)
		},
		blurs,
		strokes: normalizeStrokes(a.strokes),
		settingsOpacity: clamp(a.settingsOpacity, 0, 1, DEFAULT_CONFIG.settingsOpacity),
		wallpaperOpacity: clamp(a.wallpaperOpacity, 0, 1, DEFAULT_CONFIG.wallpaperOpacity),
		blur: clamp(a.blur, 0, 60, DEFAULT_CONFIG.blur),
		chatTextOpacity: clamp(a.chatTextOpacity, 0, 1, DEFAULT_CONFIG.chatTextOpacity),
		trajectoryOpacity: clamp(a.trajectoryOpacity, 0, 1, DEFAULT_CONFIG.trajectoryOpacity),
		panelOpacity: clamp(a.panelOpacity, 0, 1, DEFAULT_CONFIG.panelOpacity),
		producedOpacity: clamp(a.producedOpacity, 0, 1, DEFAULT_CONFIG.producedOpacity),
		headerOpacity: clamp(a.headerOpacity, 0, 1, DEFAULT_CONFIG.headerOpacity)
	};
}
function normalizeProfiles(raw) {
	if (!Array.isArray(raw)) return [];
	const out = [];
	for (const item of raw.slice(0, MAX_PROFILES)) {
		const p = item ?? {};
		if (typeof p.id !== "string" || p.id.length === 0 || p.id.length > 64) continue;
		if (out.some((e) => e.id === p.id)) continue;
		out.push({
			id: p.id,
			name: typeof p.name === "string" && p.name.trim() ? p.name.slice(0, 60) : "Profile",
			createdAt: typeof p.createdAt === "string" ? p.createdAt : "",
			config: normalizeProfileAppearance(p.config)
		});
	}
	return out;
}
/** Rotation items live as files under the rotation dir; only the server
*  creates those names, so a stored `file` is accepted only when it is a bare
*  filename with a known image extension (no path traversal). */
function safeRotationFile(name) {
	if (typeof name !== "string" || !/^[\w-]+\.(jpg|jpeg|png|gif|webp)$/i.test(name)) return null;
	return name;
}
function normalizeRotation(raw) {
	const r = raw ?? {};
	const items = [];
	if (Array.isArray(r.items)) for (const item of r.items.slice(0, MAX_ROTATION_ITEMS)) {
		const it = item ?? {};
		const file = safeRotationFile(it.file);
		if (file === null) continue;
		items.push({
			file,
			thumb: typeof it.thumb === "string" && it.thumb.startsWith("data:image/") && it.thumb.length <= MAX_THUMB_BYTES ? it.thumb : ""
		});
	}
	return {
		enabled: r.enabled === true,
		mode: r.mode === "order" ? "order" : "shuffle",
		interval: r.interval === "reload" || r.interval === "weekly" ? r.interval : "daily",
		current: typeof r.current === "number" && isFinite(r.current) && r.current >= 0 ? Math.floor(r.current) : 0,
		items,
		lastRotate: typeof r.lastRotate === "string" ? r.lastRotate : null
	};
}
function normalizeSchedule(raw) {
	const r = raw ?? {};
	return {
		enabled: r.enabled === true,
		mode: r.mode === "system" ? "system" : "time",
		dayProfile: typeof r.dayProfile === "string" ? r.dayProfile : null,
		nightProfile: typeof r.nightProfile === "string" ? r.nightProfile : null,
		dayStart: typeof r.dayStart === "string" && HHMM_RE.test(r.dayStart) ? r.dayStart : DEFAULT_CONFIG.schedule.dayStart,
		nightStart: typeof r.nightStart === "string" && HHMM_RE.test(r.nightStart) ? r.nightStart : DEFAULT_CONFIG.schedule.nightStart
	};
}
async function ensureDir() {
	try {
		await mkdir(dataDir(), { recursive: true });
	} catch (e) {
		console.warn(`dsh-any-background: cannot create data dir "${dataDir()}"`, e);
	}
}
let configCacheKey = null;
let configCacheValue = null;
function dropConfigCache() {
	configCacheKey = null;
	configCacheValue = null;
}
async function readConfig() {
	await ensureDir();
	const file = configPath();
	let text;
	let key;
	try {
		const st = await stat(file);
		key = {
			mtimeMs: st.mtimeMs,
			size: st.size
		};
		if (configCacheKey !== null && configCacheValue !== null && configCacheKey.mtimeMs === key.mtimeMs && configCacheKey.size === key.size) return configCacheValue;
		text = await readFile(file, "utf8");
	} catch {
		dropConfigCache();
		return { ...DEFAULT_CONFIG };
	}
	try {
		const parsed = normalizeConfig(JSON.parse(text));
		configCacheKey = key;
		configCacheValue = parsed;
		return parsed;
	} catch (e) {
		try {
			const into = `${file}.corrupt-${Date.now()}`;
			await rename(file, into);
			console.warn(`dsh-any-background: theme-config.json was corrupt, archived to "${into}" and reset to defaults`, e);
		} catch {}
		dropConfigCache();
		return { ...DEFAULT_CONFIG };
	}
}
const LEGACY_CONFIG_KEYS = /* @__PURE__ */ new Set(["opacity"]);
const warnedConfigKeys = /* @__PURE__ */ new Set();
function warnUnknownConfigKeys(raw, normalized) {
	if (raw === null || typeof raw !== "object") return;
	const r = raw;
	const warn = (id) => {
		if (warnedConfigKeys.has(id)) return;
		warnedConfigKeys.add(id);
		console.warn(`dsh-any-background: ignoring unknown config field "${id}" (declared in one half only?)`);
	};
	const known = new Set(Object.keys(normalized));
	for (const key of Object.keys(r)) {
		if (known.has(key) || LEGACY_CONFIG_KEYS.has(key)) continue;
		warn(key);
	}
	for (const group of [
		"blurs",
		"opacities",
		"strokes"
	]) {
		const got = r[group];
		if (got === null || typeof got !== "object") continue;
		const have = new Set(Object.keys(normalized[group]));
		for (const key of Object.keys(got)) if (!have.has(key)) warn(`${group}.${key}`);
	}
}
async function writeConfig(config) {
	await ensureDir();
	const tmp = `${configPath()}.tmp`;
	try {
		const normalized = normalizeConfig(config);
		warnUnknownConfigKeys(config, normalized);
		await writeFile(tmp, JSON.stringify(normalized, null, 2), "utf8");
		await rename(tmp, configPath());
		dropConfigCache();
		return true;
	} catch (e) {
		console.error(`dsh-any-background: failed to write "${CONFIG_FILE}"`, e);
		try {
			await rm(tmp, { force: true });
		} catch {}
		return false;
	}
}
/** The wallpaper slot is served over HTTP (never shipped as base64 inside the
*  read RPC): the browser decodes it natively through the same pipeline as any
*  <img>, so boot only transfers a tiny URL instead of the whole image. */
async function wallpaperServeUrl() {
	try {
		return (await stat(wallpaperPath())).size > 0 ? WALLPAPER_ROUTE : null;
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
/** Sniff an image's MIME from its leading magic bytes (defaults to JPEG). */
function sniffImageMime(buf) {
	if (buf.length >= 4 && buf[0] === 137 && buf[1] === 80 && buf[2] === 78 && buf[3] === 71) return "image/png";
	if (buf.length >= 3 && buf[0] === 255 && buf[1] === 216 && buf[2] === 255) return "image/jpeg";
	if (buf.length >= 6 && buf[0] === 71 && buf[1] === 73 && buf[2] === 70) return "image/gif";
	if (buf.length >= 12 && buf[0] === 82 && buf[1] === 73 && buf[2] === 70 && buf[3] === 70 && buf[8] === 87 && buf[9] === 69 && buf[10] === 66 && buf[11] === 80) return "image/webp";
	return "image/jpeg";
}
/** True when the leading bytes are a container the serve route knows how to
*  sniff. The Content-Type only reflects what the server claims; validating the
*  bytes themselves rejects a mislabeled or hostile payload with a clear error
*  instead of persisting a file that renders as a broken image. */
function isImageBytes(buf) {
	if (buf.length >= 4 && buf[0] === 137 && buf[1] === 80 && buf[2] === 78 && buf[3] === 71) return true;
	if (buf.length >= 3 && buf[0] === 255 && buf[1] === 216 && buf[2] === 255) return true;
	if (buf.length >= 6 && buf[0] === 71 && buf[1] === 73 && buf[2] === 70) return true;
	if (buf.length >= 12 && buf[0] === 82 && buf[1] === 73 && buf[2] === 70 && buf[3] === 70 && buf[8] === 87 && buf[9] === 69 && buf[10] === 66 && buf[11] === 80) return true;
	return false;
}
/** Download a wallpaper from a network URL and persist it into the local
*  wallpaper.jpg slot (replacing whatever was stored), so type switches and
*  rotation keep working through the single active slot. The response carries
*  the serve URL, never the bytes. null removes the wallpaper.
*  Returns { ok, wallpaperUrl?, error? }. */
async function writeWallpaperFromUrl(url) {
	if (url === null) {
		const ok = await writeWallpaper(null);
		return {
			ok,
			wallpaperUrl: null,
			error: ok ? void 0 : "remove failed"
		};
	}
	let u;
	try {
		u = new URL(url);
	} catch {
		return {
			ok: false,
			error: "invalid url"
		};
	}
	if (u.protocol !== "http:" && u.protocol !== "https:") return {
		ok: false,
		error: "unsupported scheme"
	};
	let res;
	try {
		const ctl = new AbortController();
		const timer = setTimeout(() => ctl.abort(), WALLPAPER_FETCH_TIMEOUT);
		try {
			res = await fetch(url, {
				redirect: "follow",
				signal: ctl.signal
			});
		} finally {
			clearTimeout(timer);
		}
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error && e.name === "AbortError" ? "timeout" : "network error"
		};
	}
	if (!res.ok) return {
		ok: false,
		error: `http ${res.status}`
	};
	const ct = res.headers.get("content-type") ?? "";
	if (ct && !/^image\//.test(ct)) return {
		ok: false,
		error: "not an image"
	};
	let buf;
	try {
		const arr = await res.arrayBuffer();
		if (arr.byteLength === 0) return {
			ok: false,
			error: "empty response"
		};
		if (arr.byteLength > WALLPAPER_FETCH_MAX) return {
			ok: false,
			error: "too large"
		};
		buf = Buffer.from(arr);
	} catch {
		return {
			ok: false,
			error: "read failed"
		};
	}
	if (!isImageBytes(buf)) return {
		ok: false,
		error: "not an image"
	};
	await ensureDir();
	try {
		await writeFile(wallpaperPath(), buf);
	} catch (e) {
		console.error("dsh-any-background: failed to write the downloaded wallpaper", e);
		return {
			ok: false,
			error: "write failed"
		};
	}
	return {
		ok: true,
		wallpaperUrl: WALLPAPER_ROUTE
	};
}
const rotationDir = () => dshHomePath(DATA_DIR, ROTATION_DIR);
async function ensureRotationDir() {
	try {
		await mkdir(rotationDir(), { recursive: true });
	} catch {}
}
function imageExtFor(mime) {
	if (mime === "image/png") return "png";
	if (mime === "image/gif") return "gif";
	if (mime === "image/webp") return "webp";
	return "jpg";
}
/** Accept only an inline base64 image data URL (same fence as writeWallpaper). */
function decodeImageDataUrl(dataUrl) {
	if (typeof dataUrl !== "string") return null;
	const m = /^data:image\/[a-zA-Z0-9.+-]+;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
	if (!m) return null;
	const buf = Buffer.from(m[1], "base64");
	return buf.length > 0 ? buf : null;
}
/** Persist a thumbnail string only when it is a small inline image data URL. */
function sanitizeThumb(thumb) {
	return typeof thumb === "string" && thumb.startsWith("data:image/") && thumb.length <= MAX_THUMB_BYTES ? thumb : "";
}
async function handleRotationAdd(payload) {
	const buf = decodeImageDataUrl(payload?.dataUrl);
	if (buf === null) return {
		ok: false,
		error: "invalid image"
	};
	const thumb = sanitizeThumb(payload?.thumb);
	await ensureDir();
	await ensureRotationDir();
	if ((await readConfig()).rotation.items.length >= MAX_ROTATION_ITEMS) return {
		ok: false,
		error: "too many items"
	};
	const file = `wp-${Date.now().toString(36)}.${imageExtFor(sniffImageMime(buf))}`;
	try {
		await writeFile(dshHomePath(DATA_DIR, ROTATION_DIR, file), buf);
	} catch (e) {
		console.error("dsh-any-background: failed to write a rotation wallpaper", e);
		return {
			ok: false,
			error: "write failed"
		};
	}
	const fresh = await readConfig();
	fresh.rotation.items.push({
		file,
		thumb
	});
	if (!await writeConfig(fresh)) return {
		ok: false,
		error: "config write failed"
	};
	return {
		ok: true,
		index: fresh.rotation.items.length - 1,
		items: fresh.rotation.items
	};
}
async function handleRotationRemove(payload) {
	const idx = payload?.index;
	if (typeof idx !== "number" || !isFinite(idx)) return {
		ok: false,
		error: "invalid index"
	};
	const cfg = await readConfig();
	const i = Math.floor(idx);
	if (i < 0 || i >= cfg.rotation.items.length) return {
		ok: false,
		error: "not found"
	};
	const [removed] = cfg.rotation.items.splice(i, 1);
	cfg.rotation.current = Math.max(0, Math.min(cfg.rotation.current >= i ? cfg.rotation.current - 1 : cfg.rotation.current, Math.max(0, cfg.rotation.items.length - 1)));
	if (removed !== void 0) try {
		await rm(dshHomePath(DATA_DIR, ROTATION_DIR, removed.file), { force: true });
	} catch {}
	if (!await writeConfig(cfg)) return {
		ok: false,
		error: "config write failed"
	};
	return {
		ok: true,
		items: cfg.rotation.items
	};
}
/** Activate a rotation item: copy its bytes over the active wallpaper slot and
*  return the serve URL so the client applies it live (bytes never round-trip
*  through the RPC response). */
async function handleRotationSet(payload) {
	const idx = payload?.index;
	if (typeof idx !== "number" || !isFinite(idx)) return {
		ok: false,
		error: "invalid index"
	};
	const cfg = await readConfig();
	const i = Math.floor(idx);
	const item = cfg.rotation.items[i];
	if (item === void 0) return {
		ok: false,
		error: "not found"
	};
	let buf;
	try {
		buf = await readFile(dshHomePath(DATA_DIR, ROTATION_DIR, item.file));
	} catch {
		return {
			ok: false,
			error: "file missing"
		};
	}
	try {
		await writeFile(wallpaperPath(), buf);
	} catch (e) {
		console.error("dsh-any-background: failed to activate a rotation wallpaper", e);
		return {
			ok: false,
			error: "write failed"
		};
	}
	return {
		ok: true,
		wallpaperUrl: WALLPAPER_ROUTE
	};
}
async function videoUrl() {
	return await findVideoFile() ? VIDEO_ROUTE : null;
}
/** Guess a video MIME from the URL's path extension (fallback for servers that
*  send no precise Content-Type). */
function videoMimeFromUrl(u) {
	const p = u.pathname.toLowerCase();
	if (/\.(mp4|m4v)$/.test(p)) return "video/mp4";
	if (/\.webm$/.test(p)) return "video/webm";
	if (/\.(ogg|ogv)$/.test(p)) return "video/ogg";
	if (/\.(mov|qt)$/.test(p)) return "video/quicktime";
	if (/\.(mkv|mk3d|mka)$/.test(p)) return "video/x-matroska";
	return null;
}
/** Download a background video from a network URL and store it in the video
*  slot (streamed to a temp file — never buffered whole), then record the MIME
*  in the config so findVideoFile/serve resolve immediately. */
async function writeVideoFromUrl(url) {
	if (url === null) return {
		ok: false,
		error: "invalid url"
	};
	let u;
	try {
		u = new URL(url);
	} catch {
		return {
			ok: false,
			error: "invalid url"
		};
	}
	if (u.protocol !== "http:" && u.protocol !== "https:") return {
		ok: false,
		error: "unsupported scheme"
	};
	let res;
	try {
		const ctl = new AbortController();
		const timer = setTimeout(() => ctl.abort(), VIDEO_FETCH_TIMEOUT);
		try {
			res = await fetch(url, {
				redirect: "follow",
				signal: ctl.signal
			});
		} finally {
			clearTimeout(timer);
		}
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error && e.name === "AbortError" ? "timeout" : "network error"
		};
	}
	if (!res.ok) return {
		ok: false,
		error: `http ${res.status}`
	};
	let mime = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
	if (mime === "" || mime === "application/octet-stream" || mime === "binary/octet-stream") mime = videoMimeFromUrl(u) ?? "video/mp4";
	if (!mime.startsWith("video/")) return {
		ok: false,
		error: "not a video"
	};
	const declared = Number(res.headers.get("content-length") ?? "");
	if (Number.isFinite(declared) && declared > VIDEO_FETCH_MAX) return {
		ok: false,
		error: "too large"
	};
	await ensureDir();
	const tmp = dshHomePath(DATA_DIR, "video.download.tmp");
	const target = videoPathFor(mime);
	try {
		if (res.body === null) return {
			ok: false,
			error: "empty response"
		};
		const out = createWriteStream(tmp);
		let received = 0;
		let failed = false;
		const nodeStream = Readable.fromWeb(res.body);
		let idle = null;
		const clearIdle = () => {
			if (idle !== null) {
				clearTimeout(idle);
				idle = null;
			}
		};
		const pokeIdle = () => {
			clearIdle();
			idle = setTimeout(() => {
				nodeStream.destroy();
				fail();
			}, VIDEO_FETCH_IDLE_TIMEOUT);
		};
		const fail = () => {
			if (failed) return;
			failed = true;
			clearIdle();
			out.destroy();
			rmWhenClosed(out, tmp);
		};
		nodeStream.on("data", (chunk) => {
			pokeIdle();
			received += chunk.byteLength;
			if (received > VIDEO_FETCH_MAX) {
				nodeStream.destroy();
				fail();
			}
		});
		nodeStream.on("end", clearIdle);
		nodeStream.on("aborted", fail);
		nodeStream.on("error", fail);
		out.on("error", fail);
		pokeIdle();
		await new Promise((resolve, reject) => {
			nodeStream.pipe(out);
			out.on("finish", () => resolve());
			out.on("close", () => {
				if (failed) reject(/* @__PURE__ */ new Error("download failed"));
			});
			nodeStream.on("error", () => reject(/* @__PURE__ */ new Error("download failed")));
		});
		if (failed) return {
			ok: false,
			error: "read failed"
		};
		for (const name of VIDEO_CANDIDATES) {
			const p = dshHomePath(DATA_DIR, name);
			if (p !== target) await rm(p, { force: true });
		}
		await rm(target, { force: true });
		await rename(tmp, target);
		const cfg = await readConfig();
		if (cfg.videoMime !== mime) {
			cfg.videoMime = mime;
			await writeConfig(cfg);
		}
		return {
			ok: true,
			mime
		};
	} catch (e) {
		console.error("dsh-any-background: failed to download the background video", e);
		rm(tmp, { force: true });
		return {
			ok: false,
			error: e instanceof Error && e.message === "download failed" ? "read failed" : "write failed"
		};
	}
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
/** Drop a partial upload's temp file once its sink is really closed. Windows
*  refuses to unlink a file that still has an open handle, so removing it in the
*  same tick as `out.destroy()` silently fails and leaves the aborted transfer
*  on disk (up to the full limit) until some later upload overwrites it. */
function rmWhenClosed(out, tmp) {
	const drop = () => {
		rm(tmp, { force: true });
	};
	if (out.closed === true) drop();
	else out.once("close", drop);
}
/** Reject an oversized upload with a real status and tear the transfer down.
*  The bare req.destroy()+fail() path left the client holding a network error
*  with no way to tell "too large" from "connection died". The body is machine
*  readable (`error` + the enforced `limit`) so the panel can phrase the
*  refusal in the user's own language, with `message` kept for logs. */
function rejectOversizedUpload(req, res, fail, limit) {
	try {
		res.writeHead(413, { "Content-Type": "application/json" });
		res.end(JSON.stringify({
			ok: false,
			error: "too large",
			limit,
			message: `too large (limit ${limit})`
		}));
	} catch {}
	fail();
	try {
		req.destroy();
	} catch {}
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
		const tmp = dshHomePath(DATA_DIR, VIDEO_UPLOAD_TMP);
		const target = videoPathFor(mime);
		const out = createWriteStream(tmp);
		let received = 0;
		let failed = false;
		const fail = () => {
			if (failed) return;
			failed = true;
			out.destroy();
			rmWhenClosed(out, tmp);
		};
		req.on("aborted", fail);
		req.on("error", fail);
		req.on("data", (chunk) => {
			if (failed) return;
			received += chunk.byteLength;
			if (received > VIDEO_UPLOAD_MAX) rejectOversizedUpload(req, res, fail, "2 GB");
		});
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
				const cfg = await readConfig();
				if (cfg.videoMime !== mime) {
					cfg.videoMime = mime;
					await writeConfig(cfg);
				}
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
/** Stream the stored wallpaper: sniffed MIME, no caching (uploads and rotation
*  replace the file in place). */
async function serveWallpaper(req, res) {
	if (req.method !== "GET" && req.method !== "HEAD") {
		res.writeHead(405, { "Content-Type": "application/json" });
		res.end(JSON.stringify({
			ok: false,
			error: "wallpaper route only serves GET/HEAD"
		}));
		return;
	}
	try {
		const st = await stat(wallpaperPath());
		if (st.size === 0) {
			res.writeHead(404);
			res.end();
			return;
		}
		const mime = sniffImageMime(await new Promise((resolve, reject) => {
			const chunks = [];
			const s = createReadStream(wallpaperPath(), {
				start: 0,
				end: 15
			});
			s.on("data", (c) => chunks.push(c));
			s.on("end", () => resolve(Buffer.concat(chunks)));
			s.on("error", reject);
		}));
		res.writeHead(200, {
			"Content-Type": mime,
			"Content-Length": st.size,
			"Cache-Control": "no-store"
		});
		if (req.method === "HEAD") {
			res.end();
			return;
		}
		createReadStream(wallpaperPath()).pipe(res);
	} catch {
		res.writeHead(404);
		res.end("no wallpaper stored");
	}
}
/** Accept a raw wallpaper upload (POST): pipe the body straight into the
*  wallpaper slot — no base64 inflation, original pixels preserved. */
async function handleWallpaperUpload(req, res) {
	if (req.method !== "POST") {
		res.writeHead(405);
		res.end();
		return;
	}
	if (!(typeof req.headers["content-type"] === "string" ? req.headers["content-type"] : "").split(";")[0].trim().startsWith("image/")) {
		req.resume();
		res.writeHead(415, { "Content-Type": "application/json" });
		res.end(JSON.stringify({
			ok: false,
			error: "unsupported media type, expected image/*"
		}));
		return;
	}
	try {
		await ensureDir();
		const tmp = dshHomePath(DATA_DIR, UPLOAD_TMP);
		const out = createWriteStream(tmp);
		let received = 0;
		let failed = false;
		const fail = () => {
			if (failed) return;
			failed = true;
			out.destroy();
			rmWhenClosed(out, tmp);
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
		req.on("data", (chunk) => {
			if (failed) return;
			received += chunk.byteLength;
			if (received > WALLPAPER_UPLOAD_MAX) rejectOversizedUpload(req, res, fail, "100 MB");
		});
		req.pipe(out);
		out.on("finish", async () => {
			if (failed) return;
			try {
				if (received === 0) {
					fail();
					res.writeHead(400, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						ok: false,
						error: "empty upload"
					}));
					return;
				}
				await rm(wallpaperPath(), { force: true });
				await rename(tmp, wallpaperPath());
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({
					ok: true,
					wallpaperUrl: WALLPAPER_ROUTE
				}));
			} catch (e) {
				console.error("dsh-any-background: failed to finalize the wallpaper upload", e);
				rm(tmp, { force: true });
				try {
					res.writeHead(500);
					res.end();
				} catch {}
			}
		});
	} catch (e) {
		console.error("dsh-any-background: failed to accept the wallpaper upload", e);
		try {
			res.writeHead(500);
			res.end();
		} catch {}
	}
}
/** Stream the stored custom font: sniffed MIME, no caching (uploads replace
*  the file in place). Fonts need no Range support — the browser fetches once. */
async function serveFont(req, res) {
	if (req.method !== "GET" && req.method !== "HEAD") {
		res.writeHead(405, { "Content-Type": "application/json" });
		res.end(JSON.stringify({
			ok: false,
			error: "font route only serves GET/HEAD"
		}));
		return;
	}
	try {
		const found = await findFontFile();
		if (found === null) {
			res.writeHead(404);
			res.end("no custom font stored");
			return;
		}
		const st = await stat(found.path);
		res.writeHead(200, {
			"Content-Type": found.mime,
			"Content-Length": st.size,
			"Cache-Control": "no-store"
		});
		if (req.method === "HEAD") {
			res.end();
			return;
		}
		createReadStream(found.path).pipe(res);
	} catch (e) {
		console.error("dsh-any-background: failed to serve the custom font", e);
		try {
			res.writeHead(500);
			res.end();
		} catch {}
	}
}
/** Accept a raw font upload (POST): pipe the body into a temp file, sniff the
*  container format from its magic bytes (rejecting anything that is not a
*  recognizable font), then rename it into the format-derived slot and record
*  the MIME in the config so serve/find resolve immediately. */
async function handleFontUpload(req, res) {
	if (req.method !== "POST") {
		res.writeHead(405);
		res.end();
		return;
	}
	try {
		await ensureDir();
		const tmp = dshHomePath(DATA_DIR, FONT_UPLOAD_TMP);
		const out = createWriteStream(tmp);
		let received = 0;
		let failed = false;
		const fail = () => {
			if (failed) return;
			failed = true;
			out.destroy();
			rmWhenClosed(out, tmp);
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
		req.on("data", (chunk) => {
			if (failed) return;
			received += chunk.byteLength;
			if (received > FONT_UPLOAD_MAX) rejectOversizedUpload(req, res, fail, "100 MB");
		});
		req.pipe(out);
		out.on("finish", async () => {
			if (failed) return;
			try {
				if (received === 0) {
					fail();
					res.writeHead(400, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						ok: false,
						error: "empty upload"
					}));
					return;
				}
				const mime = sniffFontMime(await new Promise((resolve, reject) => {
					const chunks = [];
					const s = createReadStream(tmp, {
						start: 0,
						end: 15
					});
					s.on("data", (c) => chunks.push(c));
					s.on("end", () => resolve(Buffer.concat(chunks)));
					s.on("error", reject);
				}));
				if (mime === null) {
					fail();
					res.writeHead(415, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						ok: false,
						error: "not a font (expected ttf/otf/woff/woff2)"
					}));
					return;
				}
				const target = fontPathFor(mime);
				for (const name of FONT_CANDIDATES) {
					const p = dshHomePath(DATA_DIR, name);
					if (p !== target) await rm(p, { force: true });
				}
				await rm(target, { force: true });
				await rename(tmp, target);
				const cfg = await readConfig();
				if (cfg.fontMime !== mime) {
					cfg.fontMime = mime;
					await writeConfig(cfg);
				}
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({
					ok: true,
					fontUrl: FONT_ROUTE,
					mime
				}));
			} catch (e) {
				console.error("dsh-any-background: failed to finalize the font upload", e);
				rm(tmp, { force: true });
				try {
					res.writeHead(500);
					res.end();
				} catch {}
			}
		});
	} catch (e) {
		console.error("dsh-any-background: failed to accept the font upload", e);
		try {
			res.writeHead(500);
			res.end();
		} catch {}
	}
}
/** Remove every stored font variant and clear the recorded MIME. */
async function removeFontFile() {
	try {
		for (const name of FONT_CANDIDATES) await rm(dshHomePath(DATA_DIR, name), { force: true });
		await rm(dshHomePath(DATA_DIR, FONT_UPLOAD_TMP), { force: true });
		const cfg = await readConfig();
		if (cfg.fontMime !== null) {
			cfg.fontMime = null;
			await writeConfig(cfg);
		}
		return true;
	} catch (e) {
		console.error("dsh-any-background: failed to remove the custom font", e);
		return false;
	}
}
const NS = "dshAnyBackground";
const RPC_CHANNEL = "/dsh-any-background";
const RPC_BODY_MAX = 314572800;
/** ISO week key — mirrors the client's rotationDue so daily/weekly cadence
*  decisions agree across both halves. */
function isoWeekKey(d) {
	const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
	const day = t.getUTCDay() || 7;
	t.setUTCDate(t.getUTCDate() + 4 - day);
	const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
	const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
	return `${t.getUTCFullYear()}-W${week}`;
}
/** Advance the rotation pool when its cadence is due: pick the next item,
*  copy it over the active wallpaper slot, and persist the rotation state.
*  Runs inside `read` so a reload restores the NEW wallpaper directly — the
*  old one never reaches the screen. The client's maybeRotate stays as a
*  fallback and skips when this already advanced (the `rotated` flag). */
async function advanceRotationIfDue() {
	const rot = (await readConfig()).rotation;
	if (!rot.enabled || rot.items.length === 0) return false;
	const now = /* @__PURE__ */ new Date();
	const last = rot.lastRotate !== null ? new Date(rot.lastRotate) : null;
	if (!(rot.interval === "reload" || last === null || isNaN(last.getTime()) || (rot.interval === "daily" ? last.toDateString() !== now.toDateString() : isoWeekKey(last) !== isoWeekKey(now)))) return false;
	const n = rot.items.length;
	let idx = rot.current;
	if (rot.mode === "shuffle" && n > 1) while (idx === rot.current) idx = Math.floor(Math.random() * n);
	else idx = (rot.current + 1) % n;
	const item = rot.items[idx];
	if (item === void 0) return false;
	try {
		const buf = await readFile(dshHomePath(DATA_DIR, ROTATION_DIR, item.file));
		await writeFile(wallpaperPath(), buf);
	} catch (e) {
		console.error("dsh-any-background: failed to advance the rotation pool", e);
		return false;
	}
	if (!await writeConfig({
		...await readConfig(),
		rotation: {
			...rot,
			current: idx,
			lastRotate: now.toISOString()
		}
	})) return false;
	return true;
}
/** Dispatch one decoded RPC method to the matching persistence routine and
*  return the wire `result` half of the server-response envelope. */
async function handleRpcMethod(endpoint, payload, hostInfo) {
	const method = endpoint.slice(`${NS}/`.length);
	try {
		switch (method) {
			case "read": {
				const rotated = await advanceRotationIfDue();
				const config = await readConfig();
				const firstRun = !await exists(configPath());
				if (firstRun) await writeConfig(config);
				return {
					ok: true,
					value: {
						config,
						wallpaperUrl: await wallpaperServeUrl(),
						videoUrl: await videoUrl(),
						fontUrl: await fontUrl(),
						rotated,
						firstRun,
						host: await hostInfo
					}
				};
			}
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
			case "setWallpaperUrl": return {
				ok: true,
				value: await writeWallpaperFromUrl(payload?.url ?? null)
			};
			case "setVideoUrl": return {
				ok: true,
				value: await writeVideoFromUrl(payload?.url ?? null)
			};
			case "rotationAdd": return {
				ok: true,
				value: await handleRotationAdd(payload)
			};
			case "rotationRemove": return {
				ok: true,
				value: await handleRotationRemove(payload)
			};
			case "rotationSet": return {
				ok: true,
				value: await handleRotationSet(payload)
			};
			case "removeFont": return {
				ok: true,
				value: await removeFontFile()
			};
			default: return {
				ok: false,
				error: {
					code: "dsh-any-background/bad-request",
					message: `unknown endpoint ${endpoint}`,
					details: { issues: [] }
				}
			};
		}
	} catch (e) {
		return {
			ok: false,
			error: {
				code: "dsh-any-background/internal",
				message: e instanceof Error ? e.message : String(e),
				details: {}
			}
		};
	}
}
function apply(ctx) {
	const hostInfo = resolveHostInfo(ctx.profileContext?.installAnchor).catch((e) => {
		console.warn("dsh-any-background: host release detection failed, falling back to DOM probing", e);
		return UNKNOWN_HOST_INFO;
	});
	ctx.inject(["connection", "webServer"], (webCtx) => {
		webCtx.effect(() => webCtx.webServer.register({
			kind: "prefix",
			path: RPC_CHANNEL,
			handler: async (req, res) => {
				const rejection = webCtx.connection.requestRejection(req);
				if (rejection !== void 0) {
					res.writeHead(rejection);
					res.end(rejection === 401 ? "unauthorized" : "forbidden");
					return;
				}
				if (req.method !== "POST") {
					res.writeHead(405, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						ok: false,
						error: {
							code: "dsh-any-background/bad-request",
							message: "expected POST",
							details: {}
						}
					}));
					return;
				}
				const declaredLen = Number(req.headers["content-length"] ?? "");
				if (Number.isFinite(declaredLen) && declaredLen > RPC_BODY_MAX) {
					res.writeHead(413, {
						"Content-Type": "application/json",
						connection: "close"
					});
					res.end(JSON.stringify({
						ok: false,
						error: {
							code: "dsh-any-background/too-large",
							message: `body exceeds ${RPC_BODY_MAX} bytes; uploads must use the binary routes`,
							details: {}
						}
					}));
					return;
				}
				const pathname = new URL(req.url ?? "/", "http://dsh.internal").pathname;
				const endpoint = pathname.startsWith(`${RPC_CHANNEL}/`) ? pathname.slice(20) : void 0;
				if (endpoint === void 0 || endpoint.length === 0) {
					res.writeHead(404);
					res.end();
					return;
				}
				const chunks = [];
				let received = 0;
				for await (const chunk of req) {
					const buf = chunk;
					received += buf.byteLength;
					if (received > RPC_BODY_MAX) {
						res.writeHead(413, { connection: "close" });
						res.end();
						req.destroy();
						return;
					}
					chunks.push(buf);
				}
				let env;
				try {
					env = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
				} catch {
					res.writeHead(400, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						ok: false,
						error: {
							code: "dsh-any-background/bad-request",
							message: "body is not JSON",
							details: {}
						}
					}));
					return;
				}
				if (env === null || typeof env !== "object" || env.type !== "client-request" || typeof env.rpcId !== "string" || typeof env.method !== "string") {
					res.writeHead(400, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						ok: false,
						error: {
							code: "dsh-any-background/bad-request",
							message: "invalid client-request envelope",
							details: {}
						}
					}));
					return;
				}
				if (env.method !== endpoint) {
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({
						type: "server-response",
						rpcId: env.rpcId,
						result: {
							ok: false,
							error: {
								code: "dsh-any-background/bad-request",
								message: `method ${env.method} does not match endpoint ${endpoint}`,
								details: { issues: [] }
							}
						}
					}));
					return;
				}
				const result = await handleRpcMethod(endpoint, env.payload, hostInfo);
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({
					type: "server-response",
					rpcId: env.rpcId,
					result
				}));
			}
		}), "dsh-any-background: rpc channel");
		const fenceUpload = (handler) => (req, res) => {
			const rejection = webCtx.connection.requestRejection(req);
			if (rejection !== void 0) {
				res.writeHead(rejection);
				res.end(rejection === 401 ? "unauthorized" : "forbidden");
				return;
			}
			handler(req, res);
		};
		webCtx.effect(() => webCtx.webServer.register({
			kind: "prefix",
			path: VIDEO_ROUTE,
			handler: serveVideo
		}), "dsh-any-background: video route");
		webCtx.effect(() => webCtx.webServer.register({
			kind: "exact",
			path: UPLOAD_ROUTE,
			handler: fenceUpload(handleVideoUpload)
		}), "dsh-any-background: upload route");
		webCtx.effect(() => webCtx.webServer.register({
			kind: "prefix",
			path: WALLPAPER_ROUTE,
			handler: serveWallpaper
		}), "dsh-any-background: wallpaper route");
		webCtx.effect(() => webCtx.webServer.register({
			kind: "exact",
			path: WALLPAPER_UPLOAD_ROUTE,
			handler: fenceUpload(handleWallpaperUpload)
		}), "dsh-any-background: wallpaper upload route");
		webCtx.effect(() => webCtx.webServer.register({
			kind: "prefix",
			path: FONT_ROUTE,
			handler: serveFont
		}), "dsh-any-background: font route");
		webCtx.effect(() => webCtx.webServer.register({
			kind: "exact",
			path: FONT_UPLOAD_ROUTE,
			handler: fenceUpload(handleFontUpload)
		}), "dsh-any-background: font upload route");
	});
}
//#endregion
export { DEFAULT_CONFIG, apply, inject, name };
