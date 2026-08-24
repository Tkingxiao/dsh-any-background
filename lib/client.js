window.__ModuleLoader__.load({
	id: "dsh-any-background",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		let react_dom = require("react-dom");
		//#region src/client/i18n.ts
		const NS = "settings.anyBg";
		const zh = {
			nav: "主题",
			brandTag: "外观定制",
			close: "关闭",
			pageColor: "色彩",
			pageInterface: "界面",
			pageBackground: "背景",
			pageProfile: "配置",
			descColor: "拖动色轮或输入精确数值，整个界面的配色将实时跟随变化",
			descInterface: "为主界面的各个区域单独调节透明度与模糊，营造空间层次感",
			descBackground: "上传一张图片或一段视频作为壁纸并自由摆放，或让算法为你实时生成动态背景",
			descProfile: "将当前主题导出为文件备份，或从文件一键恢复完整配置",
			colorTitle: "主题色",
			colorHint: "在色轮外圈选择色相，在内部方形中调整饱和度和明度；双击滑块可恢复默认值",
			swatchTitle: "灵感色板",
			hexCaption: "当前主题色",
			uiTitle: "主界面",
			uiOpacity: "透明度",
			uiBlur: "模糊度",
			uiOpacityBg: "主背景",
			uiOpacitySide: "侧边栏",
			uiOpacityCard: "对话框中选项面板",
			uiOpacityInput: "输入框与控件",
			uiSop: "设置界面透明度",
			uiChatRegion: "对话文本框",
			uiTrajectory: "轨迹页",
			bgTitle: "背景",
			bgChoose: "选择图片或视频",
			bgRemove: "移除背景",
			bgEdit: "编辑位置",
			bgEditLocked: "仅「适应」模式可编辑位置",
			wpOpacity: "背景透明度",
			bgBlur: "背景模糊",
			bgModeTitle: "布局模式",
			bgModeFit: "适应",
			bgModeFill: "填充",
			bgModeStretch: "拉伸",
			bgModeTile: "平铺",
			bgModeCenter: "居中",
			bgVideoBadge: "视频",
			bgSourceImage: "图片 / 视频",
			bgSourceGenerated: "动态生成",
			dropHint: "点击选择图片或视频，或将文件拖到这里",
			liveBadge: "动态壁纸",
			bgHint: "「适应」布局模式下悬停预览可编辑图片/视频的位置与缩放（其余布局模式按模式自动排布）；动态生成模式下可选择类型、预设与参数。绑定种子后刷新页面壁纸保持不变，取消绑定则每次刷新随机换新",
			editorTitle: "背景编辑器",
			editorHint: "拖动移动画面，滚轮缩放大小",
			editorCommit: "确认",
			editorCancel: "取消",
			editorReset: "重置",
			extractColor: "从背景提取主题色",
			extracting: "取色中…",
			extractNoWp: "请先设置背景图片",
			extractDone: "已应用背景主色调",
			extractFail: "未在背景中找到鲜明的颜色，请换一张背景",
			crashTitle: "界面渲染出错",
			crashDesc: "主题设置面板遇到问题，点击下方按钮重置后重试",
			crashReset: "重置面板",
			exportTheme: "导出配置",
			importTheme: "导入配置",
			exportCardTitle: "导出配置",
			exportCardDesc: "将主题色、透明度、模糊与壁纸打包为 dsh-any-theme.json 文件",
			importCardTitle: "导入配置",
			importCardDesc: "从之前导出的 JSON 文件一键恢复完整主题",
			toastExportDone: "配置文件已开始下载",
			importDone: "已导入主题配置",
			importFail: "导入失败，文件格式不正确",
			footerTag: "外观插件",
			eyedropper: "从背景取色",
			pickerTitle: "从背景取色",
			pickerHint: "移动鼠标预览颜色，点击背景选取为主题色",
			pickerClose: "关闭",
			bgTypeImage: "图片",
			bgTypeMesh: "网格渐变",
			bgTypeShader: "Shader",
			bgTypePattern: "几何图案",
			bgMeshDesc: "柔和的多点渐变色块",
			bgShaderDesc: "持续流动的光影动画",
			bgPatternDesc: "规律的几何纹理",
			bgRegenerate: "重新生成",
			bgSeedLocked: "已绑定 · 刷新不变",
			bgSeedUnlocked: "未绑定 · 刷新换新",
			seedLock: "锁定种子",
			bgMeshScale: "扩散范围",
			bgMeshIntensity: "色彩强度",
			bgShaderPreset: "预设",
			bgShaderSpeed: "流动速度",
			bgShaderScale: "纹理尺度",
			bgPatternPreset: "图案",
			bgPatternDensity: "密度",
			bgPatternScale: "尺度",
			presetAurora: "极光",
			presetNebula: "星云",
			presetNoise: "流动噪声",
			presetDots: "点阵",
			presetWaves: "波浪",
			presetPoly: "低多边形"
		};
		const en = {
			nav: "Theme",
			brandTag: "Appearance",
			close: "Close",
			pageColor: "Color",
			pageInterface: "Interface",
			pageBackground: "Background",
			pageProfile: "Profile",
			descColor: "Drag the wheel or type exact values — the whole UI follows live",
			descInterface: "Tune opacity and blur per surface to build depth",
			descBackground: "Upload an image or a video as wallpaper and place it freely, or let the algorithm paint a live background",
			descProfile: "Export the current theme as a file, or restore it from one",
			colorTitle: "Theme color",
			colorHint: "Pick hue on the outer ring, adjust saturation & lightness in the square; double-click a slider to reset",
			swatchTitle: "Quick swatches",
			hexCaption: "Current accent",
			uiTitle: "Interface",
			uiOpacity: "Opacity",
			uiBlur: "Blur",
			uiOpacityBg: "Main background",
			uiOpacitySide: "Sidebar",
			uiOpacityCard: "Cards & panels",
			uiOpacityInput: "Input & controls",
			uiSop: "Settings interface opacity",
			uiChatRegion: "Conversation text frame",
			uiTrajectory: "Trajectory view",
			bgTitle: "Background",
			bgChoose: "Choose image or video",
			bgRemove: "Remove background",
			bgEdit: "Edit position",
			bgEditLocked: "Position editing is only available in Fit mode",
			wpOpacity: "Background opacity",
			bgBlur: "Background blur",
			bgModeTitle: "Layout mode",
			bgModeFit: "Fit",
			bgModeFill: "Fill",
			bgModeStretch: "Stretch",
			bgModeTile: "Tile",
			bgModeCenter: "Center",
			bgVideoBadge: "Video",
			bgSourceImage: "Image / Video",
			bgSourceGenerated: "Generated",
			dropHint: "Click to choose an image or video, or drop one here",
			liveBadge: "Live wallpaper",
			bgHint: "In Fit layout mode hover the preview to reposition and zoom the image/video (other modes arrange it automatically); in generated mode pick a type, preset and parameters. With the seed locked the wallpaper stays the same across refreshes; unlocked, every refresh randomizes it",
			editorTitle: "Background editor",
			editorHint: "Drag to move, scroll to zoom",
			editorCommit: "Confirm",
			editorCancel: "Cancel",
			editorReset: "Reset",
			extractColor: "Extract from background",
			extracting: "Extracting…",
			extractNoWp: "Set a background first",
			extractDone: "Background color applied",
			extractFail: "No vivid color found in this background, try another",
			crashTitle: "Section crashed",
			crashDesc: "The theme panel hit an error. Reset below to recover.",
			crashReset: "Reset panel",
			exportTheme: "Export",
			importTheme: "Import",
			exportCardTitle: "Export profile",
			exportCardDesc: "Bundle color, opacity, blur and wallpaper into dsh-any-theme.json",
			importCardTitle: "Import profile",
			importCardDesc: "Restore a full theme from a previously exported JSON file",
			toastExportDone: "Export started",
			importDone: "Theme imported",
			importFail: "Import failed — invalid file",
			footerTag: "Appearance plugin",
			eyedropper: "Eyedropper",
			pickerTitle: "Pick from background",
			pickerHint: "Hover to preview, click to pick as theme color",
			pickerClose: "Close",
			bgTypeImage: "Image",
			bgTypeMesh: "Mesh gradient",
			bgTypeShader: "Shader",
			bgTypePattern: "Pattern",
			bgMeshDesc: "Soft multi-blob gradients",
			bgShaderDesc: "Flowing light animation",
			bgPatternDesc: "Regular geometric texture",
			bgRegenerate: "Regenerate",
			bgSeedLocked: "Seeded · stable on refresh",
			bgSeedUnlocked: "Unseeded · new on refresh",
			seedLock: "Lock seed",
			bgMeshScale: "Spread",
			bgMeshIntensity: "Intensity",
			bgShaderPreset: "Preset",
			bgShaderSpeed: "Flow speed",
			bgShaderScale: "Texture scale",
			bgPatternPreset: "Pattern",
			bgPatternDensity: "Density",
			bgPatternScale: "Scale",
			presetAurora: "Aurora",
			presetNebula: "Nebula",
			presetNoise: "Flowing noise",
			presetDots: "Dots",
			presetWaves: "Waves",
			presetPoly: "Low poly"
		};
		//#endregion
		//#region src/client/state.ts
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
		const clamp01 = (n, def) => typeof n === "number" ? Math.min(1, Math.max(0, n)) : def;
		let cfg = {
			...DEFAULT_CONFIG,
			opacities: { ...DEFAULT_CONFIG.opacities },
			blurs: { ...DEFAULT_CONFIG.blurs },
			bgState: { ...DEFAULT_CONFIG.bgState },
			videoBgState: { ...DEFAULT_CONFIG.videoBgState }
		};
		let wpImageUrl = null;
		let wpUrl = null;
		let wpVideoUrl = null;
		/** Captured video frame standing in for previews/color extraction (still-image APIs). */
		let wpVideoSnapshot = null;
		/** Local blob URL backing an in-session video; revoked when replaced or cleared. */
		let wpVideoObjectUrl = null;
		function setWpImageUrl(url) {
			wpImageUrl = url;
		}
		function setWpUrl(url) {
			wpUrl = url;
		}
		let videoRev = 0;
		function setWpVideoUrl(url, mime) {
			if (url === null) {
				wpVideoUrl = null;
				wpVideoSnapshot = null;
			} else {
				videoRev++;
				wpVideoUrl = url.startsWith("blob:") ? url : `${url}${url.includes("?") ? "&" : "?"}r=${videoRev}`;
			}
			if (wpVideoObjectUrl !== null && wpVideoObjectUrl !== url) {
				URL.revokeObjectURL(wpVideoObjectUrl);
				wpVideoObjectUrl = null;
			}
			if (url !== null && url.startsWith("blob:")) wpVideoObjectUrl = url;
			cfg.videoMime = url ? mime : null;
		}
		function setWpVideoSnapshot(url) {
			wpVideoSnapshot = url;
		}
		/** Release the in-session video object URL (plugin teardown). */
		function disposeVideoObjectUrl() {
			if (wpVideoObjectUrl !== null) {
				URL.revokeObjectURL(wpVideoObjectUrl);
				wpVideoObjectUrl = null;
			}
		}
		function setBgState(s) {
			cfg.bgState = s;
		}
		let bgDark = null;
		function setBgDark(v) {
			bgDark = v;
		}
		function rBgDark() {
			return bgDark;
		}
		function rHasColor() {
			return cfg.color !== null;
		}
		function rColor() {
			return cfg.color ?? [
				220,
				.55,
				.25
			];
		}
		function rWpImage() {
			return wpImageUrl;
		}
		function rWpVideo() {
			return wpVideoUrl;
		}
		function rBgMode() {
			return cfg.bgMode ?? DEFAULT_CONFIG.bgMode;
		}
		function rChatTextOpacity() {
			return clamp01(cfg.chatTextOpacity, DEFAULT_CONFIG.chatTextOpacity);
		}
		function rTrajectoryOpacity() {
			return clamp01(cfg.trajectoryOpacity, DEFAULT_CONFIG.trajectoryOpacity);
		}
		/** Display URL: the uploaded image/video snapshot per active type, else the generated snapshot. */
		function rWp() {
			if (cfg.backgroundType === "image") return wpImageUrl;
			if (cfg.backgroundType === "video") return wpVideoSnapshot;
			return wpUrl;
		}
		function rOps() {
			const o = cfg.opacities ?? {};
			const out = {};
			for (const k of [
				"bg",
				"sidebar",
				"card",
				"input"
			]) out[k] = clamp01(o[k], DEFAULT_CONFIG.opacities[k]);
			return out;
		}
		function rBlurs() {
			const b = cfg.blurs ?? {};
			const out = {};
			for (const k of [
				"bg",
				"sidebar",
				"card",
				"settings",
				"chat",
				"trajectory",
				"input"
			]) {
				const v = b[k];
				out[k] = typeof v === "number" ? Math.min(60, Math.max(0, v)) : DEFAULT_CONFIG.blurs[k];
			}
			return out;
		}
		function rWop() {
			return clamp01(cfg.wallpaperOpacity, DEFAULT_CONFIG.wallpaperOpacity);
		}
		function rBl() {
			return typeof cfg.blur === "number" ? Math.min(60, Math.max(0, cfg.blur)) : DEFAULT_CONFIG.blur;
		}
		function rSop() {
			return clamp01(cfg.settingsOpacity, DEFAULT_CONFIG.settingsOpacity);
		}
		function rBgState() {
			return cfg.bgState;
		}
		function rVideoBgState() {
			return cfg.videoBgState;
		}
		const num = (n, def) => typeof n === "number" ? n : def;
		const cl = (n, lo, hi, def) => typeof n === "number" ? Math.min(hi, Math.max(lo, n)) : def;
		function adoptBgState(s) {
			return {
				zoom: num(s.zoom, 1),
				x: num(s.x, 0),
				y: num(s.y, 0),
				iw: typeof s.iw === "number" && s.iw > 0 ? s.iw : 0,
				ih: typeof s.ih === "number" && s.ih > 0 ? s.ih : 0
			};
		}
		/** Move a possibly-absent partial config into the shape the UI reads. */
		function adoptConfig(raw) {
			const c = raw ?? {};
			const color = Array.isArray(c.color) && c.color.length === 3 ? [
				c.color[0],
				c.color[1],
				c.color[2]
			] : null;
			const legacy = typeof c.opacity === "number" ? c.opacity : null;
			const ops = c.opacities ?? {};
			const bl = c.blurs ?? {};
			const blurs = {};
			for (const k of [
				"bg",
				"sidebar",
				"card",
				"settings",
				"chat",
				"trajectory",
				"input"
			]) blurs[k] = num(bl[k], DEFAULT_CONFIG.blurs[k]);
			const bgType = [
				"video",
				"mesh",
				"shader",
				"pattern"
			].includes(c.backgroundType) ? c.backgroundType : DEFAULT_CONFIG.backgroundType;
			const bgMode = [
				"fit",
				"fill",
				"stretch",
				"tile",
				"center"
			].includes(c.bgMode) ? c.bgMode : DEFAULT_CONFIG.bgMode;
			const gen = c.generatedBg && typeof c.generatedBg === "object" ? c.generatedBg : null;
			const generatedBg = gen && gen.type === bgType ? c.generatedBg : null;
			cfg = {
				color,
				opacities: {
					bg: num(ops.bg, legacy ?? DEFAULT_CONFIG.opacities.bg),
					sidebar: num(ops.sidebar, legacy !== null ? Math.min(1, legacy + .08) : DEFAULT_CONFIG.opacities.sidebar),
					card: num(ops.card, DEFAULT_CONFIG.opacities.card),
					input: num(ops.input, DEFAULT_CONFIG.opacities.input)
				},
				blurs,
				settingsOpacity: num(c.settingsOpacity, DEFAULT_CONFIG.settingsOpacity),
				wallpaperOpacity: num(c.wallpaperOpacity, DEFAULT_CONFIG.wallpaperOpacity),
				blur: num(c.blur, DEFAULT_CONFIG.blur),
				bgState: adoptBgState(c.bgState ?? {}),
				videoBgState: adoptBgState(c.videoBgState ?? {}),
				backgroundType: bgType,
				bgMode,
				videoMime: typeof c.videoMime === "string" ? c.videoMime : null,
				generatedBg: generatedBg ? normalizeGeneratedBg(generatedBg) : null,
				regenerateOnReload: typeof c.regenerateOnReload === "boolean" ? c.regenerateOnReload : DEFAULT_CONFIG.regenerateOnReload,
				chatTextOpacity: clamp01(c.chatTextOpacity, DEFAULT_CONFIG.chatTextOpacity),
				trajectoryOpacity: clamp01(c.trajectoryOpacity, DEFAULT_CONFIG.trajectoryOpacity)
			};
		}
		function normalizeGeneratedBg(p) {
			if (!p) return null;
			if (p.type === "mesh") return {
				type: "mesh",
				seed: num(p.seed, 0),
				scale: cl(p.scale, .3, 3, 1),
				intensity: cl(p.intensity, 0, 1, .6)
			};
			if (p.type === "shader") return {
				type: "shader",
				preset: [
					"aurora",
					"nebula",
					"noise"
				].includes(p.preset) ? p.preset : "aurora",
				speed: cl(p.speed, 0, 2, .3),
				scale: cl(p.scale, .3, 3, 1),
				seed: typeof p.seed === "number" ? Math.floor(p.seed) : 0
			};
			return {
				type: "pattern",
				preset: [
					"dots",
					"waves",
					"poly"
				].includes(p.preset) ? p.preset : "dots",
				density: cl(p.density, 0, 1, .5),
				scale: cl(p.scale, .3, 3, 1),
				seed: typeof p.seed === "number" ? Math.floor(p.seed) : 0
			};
		}
		//#endregion
		//#region src/client/rpc.ts
		const RPC_CHANNEL = "/dsh-any-background";
		/** Same-origin serve URL of the persisted video (enough for <video src>/fetch). */
		const VIDEO_SERVE_URL = "/dsh-any-background/video";
		/** HTTP route new videos are POSTed to as raw bytes (see uploadVideo). */
		const VIDEO_UPLOAD_URL = "/dsh-any-background/video/upload";
		const RPC_NS = "dshAnyBackground";
		const rpcEndpoint = (method) => `${RPC_NS}/${method}`;
		let rpcCallFn = null;
		function initRpc(call) {
			rpcCallFn = call;
		}
		async function rpcCall(method, payload) {
			if (!rpcCallFn) return void 0;
			try {
				const res = await rpcCallFn(rpcEndpoint(method), payload);
				if (res && res.ok === true) return res.value;
				console.warn(`dsh-any-background: rpc "${method}" failed`, res?.error);
				return;
			} catch (e) {
				console.warn(`dsh-any-background: rpc "${method}" threw`, e);
				return;
			}
		}
		const SAVE_DEBOUNCE_MS = 250;
		let saveTimer;
		function saveConfig() {
			if (saveTimer !== void 0) window.clearTimeout(saveTimer);
			saveTimer = window.setTimeout(() => {
				saveTimer = void 0;
				rpcCall("writeConfig", { config: cfg });
			}, SAVE_DEBOUNCE_MS);
		}
		function flushSave() {
			if (saveTimer === void 0) return;
			window.clearTimeout(saveTimer);
			saveTimer = void 0;
			rpcCall("writeConfig", { config: cfg });
		}
		/** Persist the current config immediately (import path — no debounce). */
		function persistConfig() {
			rpcCall("writeConfig", { config: cfg });
		}
		/** Load the persisted theme (config + wallpaper + video URL) from the node half. */
		async function loadPersisted() {
			const data = await rpcCall("read", {});
			if (data && typeof data === "object") {
				const d = data;
				if (d.config) adoptConfig(d.config);
				if (typeof d.wallpaper === "string") setWpImageUrl(d.wallpaper);
				else if (d.wallpaper === null) setWpImageUrl(null);
				if (typeof d.videoUrl === "string") setWpVideoUrl(d.videoUrl, cfg.videoMime);
				else if (d.videoUrl === null) setWpVideoUrl(null, null);
				if (cfg.backgroundType === "image") setWpUrl(d.wallpaper === null ? null : d.wallpaper);
			}
		}
		/** Persist a wallpaper (null removes it); one-shot, no debounce. */
		function persistWallpaper(dataUrl) {
			rpcCall("setWallpaper", { dataUrl });
		}
		/** Persist a background video (null removes it); resolves true once on disk,
		*  so callers only switch playback to the serve URL after acceptance. */
		async function persistVideo(dataUrl) {
			return await rpcCall("setVideo", { dataUrl }) === true;
		}
		/** Upload a video's raw bytes over HTTP (MIME in Content-Type, body untouched
		*  — no base64 inflation that would blow the RPC body limit on large clips). */
		async function uploadVideo(blob, mime) {
			try {
				return (await fetch(VIDEO_UPLOAD_URL, {
					method: "POST",
					headers: { "Content-Type": mime || "application/octet-stream" },
					body: blob
				})).ok;
			} catch (e) {
				console.warn("dsh-any-background: video upload failed", e);
				return false;
			}
		}
		//#endregion
		//#region src/client/utils/color.ts
		function hsvToHsl(h, s, v) {
			const l = v * (1 - s / 2);
			return [
				h,
				l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l),
				l
			];
		}
		function hslToHsv(h, s, l) {
			const v = l + s * Math.min(l, 1 - l);
			return [
				h,
				v === 0 ? 0 : 2 * (1 - l / v),
				v
			];
		}
		let tokensCacheKey = "";
		let tokensCache = null;
		/**
		* Memoized token generation: the same (hue, sat, lit) input always yields the
		* same token set, and applyWp / applyCustomTokens / applySettingsOverrides call
		* this repeatedly (slider drags, viewport re-applies), so cache the last result
		* and skip the 30+ hsl() string builds when nothing changed.
		*/
		function genTokens(hue, sat, lit) {
			const key = `${hue}|${sat}|${lit}`;
			if (tokensCacheKey === key && tokensCache) return tokensCache;
			tokensCacheKey = key;
			tokensCache = buildTokens(hue, sat, lit);
			return tokensCache;
		}
		function buildTokens(hue, sat, lit) {
			const dark = lit < .55;
			const h = (d) => ((hue + d) % 360 + 360) % 360;
			const s = (d) => Math.max(0, Math.min(1, sat + d));
			const l = (d) => Math.max(0, Math.min(1, lit + d));
			const hsl = (hh, ss, ll) => `hsl(${Math.round(hh)},${Math.round(ss * 100)}%,${Math.round(ll * 100)}%)`;
			const rgba = (hh, ss, ll, a) => `hsla(${Math.round(hh)},${Math.round(ss * 100)}%,${Math.round(ll * 100)}%,${a})`;
			if (dark) return {
				colorScheme: "dark",
				tokens: {
					"--dsw-alias-bg-base": hsl(h(0), s(0), l(-.04)),
					"--dsw-alias-bg-layer-1": hsl(h(0), s(0), l(.02)),
					"--dsw-alias-bg-layer-2": hsl(h(0), s(0), l(.07)),
					"--dsw-alias-bg-layer-3": hsl(h(0), s(-.05), l(.12)),
					"--dsw-alias-bg-overlay": hsl(h(0), s(-.05), l(.12)),
					"--dsw-alias-border-l1": rgba(h(0), s(-.1), l(.18), .12),
					"--dsw-alias-border-l2": rgba(h(0), s(-.1), l(.22), .22),
					"--dsw-alias-label-primary": hsl(0, 0, 1),
					"--dsw-alias-label-secondary": hsl(0, 0, 1),
					"--dsw-alias-label-tertiary": hsl(0, 0, 1),
					"--dsw-alias-label-caption": hsl(0, 0, 1),
					"--dsw-alias-label-dimmed": hsl(0, 0, 1),
					"--dsw-alias-label-quaternary": hsl(0, 0, 1),
					"--dsw-alias-brand-primary": hsl(h(0), s(.1), Math.max(l(.2), .5)),
					"--dsw-alias-brand-text": l(.2) > .6 ? "#000" : "#fff",
					"--dsw-alias-button-primary-hover": hsl(h(0), s(.1), Math.max(l(.28), .58)),
					"--dsw-alias-button-primary-dimmed": hsl(h(0), s(0), l(.07)),
					"--dsw-alias-button-elevated-fill": hsl(h(0), s(0), l(.04)),
					"--dsw-alias-button-floating-hover": hsl(h(0), s(0), l(.1)),
					"--dsw-alias-interactive-bg-hover": rgba(h(0), s(0), Math.max(l(.15), .4), .12),
					"--dsw-alias-interactive-bg-active": rgba(h(0), s(0), Math.max(l(.15), .4), .2),
					"--dsw-alias-markdown-code-block": hsl(h(0), s(0), l(-.06)),
					"--dsw-alias-markdown-inline-code": hsl(h(0), s(0), l(.04)),
					"--dsw-alias-state-error-primary": "#ff5c72",
					"--dsw-alias-state-success-primary": "#3ddc84",
					"--dsw-alias-state-warn-primary": "#ffb347",
					"--dsw-specific-sidebar-fill": hsl(h(0), s(0), l(-.06)),
					"--dsw-specific-sidebar-nav-item-active": hsl(h(0), s(0), l(.04)),
					"--dsw-specific-sidebar-nav-item-hover": hsl(h(0), s(0), l(0)),
					"--dsw-specific-input-major": hsl(h(0), s(0), l(.02)),
					"--dsw-specific-menu": hsl(h(0), s(0), l(.08)),
					"--dsw-alias-scrollbar-bg-l1": hsl(h(0), s(-.05), l(.12)),
					"--dsw-alias-scrollbar-bg-l2": hsl(h(0), s(-.05), l(.16)),
					"--dsw-alias-scrollbar-hover-l1": hsl(h(0), s(-.05), l(.22)),
					"--dsw-alias-scrollbar-hover-l2": hsl(h(0), s(-.05), l(.22))
				}
			};
			return {
				colorScheme: "light",
				tokens: {
					"--dsw-alias-bg-base": hsl(h(0), s(-.08), l(.03)),
					"--dsw-alias-bg-layer-1": hsl(h(0), s(-.12), l(.07)),
					"--dsw-alias-bg-layer-2": hsl(h(0), s(-.1), l(-.03)),
					"--dsw-alias-bg-layer-3": hsl(h(0), s(-.08), l(-.09)),
					"--dsw-alias-bg-overlay": hsl(h(0), s(-.12), l(.08)),
					"--dsw-alias-border-l1": rgba(h(0), s(-.15), l(-.35), .18),
					"--dsw-alias-border-l2": rgba(h(0), s(-.15), l(-.35), .3),
					"--dsw-alias-label-primary": hsl(0, 0, 0),
					"--dsw-alias-label-secondary": hsl(0, 0, 0),
					"--dsw-alias-label-tertiary": hsl(0, 0, 0),
					"--dsw-alias-label-caption": hsl(0, 0, 0),
					"--dsw-alias-label-dimmed": hsl(0, 0, 0),
					"--dsw-alias-label-quaternary": hsl(0, 0, 0),
					"--dsw-alias-brand-primary": hsl(h(0), s(.05), Math.min(l(-.18), .45)),
					"--dsw-alias-brand-text": "#fff",
					"--dsw-alias-button-primary-hover": hsl(h(0), s(.05), Math.min(l(-.12), .5)),
					"--dsw-alias-button-primary-dimmed": hsl(h(0), s(-.1), l(-.03)),
					"--dsw-alias-button-elevated-fill": hsl(h(0), s(-.1), l(.1)),
					"--dsw-alias-button-floating-hover": hsl(h(0), s(-.1), l(.16)),
					"--dsw-alias-interactive-bg-hover": rgba(h(0), s(0), l(-.3), .08),
					"--dsw-alias-interactive-bg-active": rgba(h(0), s(0), l(-.3), .14),
					"--dsw-alias-markdown-code-block": hsl(h(0), s(-.1), l(-.03)),
					"--dsw-alias-markdown-inline-code": hsl(h(0), s(-.08), l(.04)),
					"--dsw-specific-sidebar-fill": hsl(h(0), s(-.1), l(-.03)),
					"--dsw-specific-sidebar-nav-item-active": hsl(h(0), s(-.08), l(.05)),
					"--dsw-specific-sidebar-nav-item-hover": hsl(h(0), s(-.12), l(0)),
					"--dsw-specific-input-major": hsl(h(0), s(-.12), l(.1)),
					"--dsw-specific-menu": hsl(h(0), s(-.12), l(.15)),
					"--dsw-alias-scrollbar-bg-l1": hsl(h(0), s(-.1), l(-.08)),
					"--dsw-alias-scrollbar-bg-l2": hsl(h(0), s(-.08), l(-.12)),
					"--dsw-alias-scrollbar-hover-l1": hsl(h(0), s(-.08), l(-.16)),
					"--dsw-alias-scrollbar-hover-l2": hsl(h(0), s(-.08), l(-.16))
				}
			};
		}
		function toRgba(c, a) {
			const hx = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c.trim());
			if (hx) {
				let d = hx[1];
				if (d.length === 3) d = d.split("").map((x) => x + x).join("");
				const n = parseInt(d, 16);
				return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
			}
			const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(c.trim());
			if (rgb) return `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${a})`;
			const hsl = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i.exec(c.trim());
			if (hsl) return `hsla(${hsl[1]},${hsl[2]}%,${hsl[3]}%,${a})`;
			return c.trim();
		}
		function rgbToHsl(r, g, b) {
			const rn = r / 255, gn = g / 255, bn = b / 255;
			const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
			const l = (max + min) / 2;
			if (max === min) return [
				0,
				0,
				l
			];
			const d = max - min;
			const s = l > .5 ? d / (2 - max - min) : d / (max + min);
			let h;
			if (max === rn) h = (gn - bn) / d % 6;
			else if (max === gn) h = (bn - rn) / d + 2;
			else h = (rn - gn) / d + 4;
			h *= 60;
			if (h < 0) h += 360;
			return [
				h,
				s,
				l
			];
		}
		const EXTRACT_SIDE = 64;
		function bucketsToHsl(b) {
			return rgbToHsl(b.r / b.count, b.g / b.count, b.b / b.count);
		}
		function extractWallpaperPalette(dataUrl, bgState) {
			return new Promise((resolve) => {
				const img = new Image();
				img.onerror = () => resolve(null);
				img.onload = () => {
					try {
						const iw = img.naturalWidth || img.width;
						const ih = img.naturalHeight || img.height;
						const bg = bgState;
						let sx = 0, sy = 0, sw = iw, sh = ih;
						if (bg.iw === iw && bg.ih === ih && bg.iw > 0) {
							const fit = Math.min(window.innerWidth / iw, window.innerHeight / ih);
							const w = iw * fit * bg.zoom;
							const h = ih * fit * bg.zoom;
							sx = Math.max(0, bg.x * window.innerWidth - w / 2);
							sy = Math.max(0, bg.y * window.innerHeight - h / 2);
							sw = Math.min(iw - sx, w);
							sh = Math.min(ih - sy, h);
							if (sw <= 0 || sh <= 0) {
								sx = 0;
								sy = 0;
								sw = iw;
								sh = ih;
							}
						}
						const c = document.createElement("canvas");
						c.width = EXTRACT_SIDE;
						c.height = EXTRACT_SIDE;
						const g = c.getContext("2d", { willReadFrequently: true });
						g.drawImage(img, sx, sy, sw, sh, 0, 0, EXTRACT_SIDE, EXTRACT_SIDE);
						const px = g.getImageData(0, 0, EXTRACT_SIDE, EXTRACT_SIDE).data;
						const counts = /* @__PURE__ */ new Uint32Array(4096);
						const sums = /* @__PURE__ */ new Float64Array(12288);
						let totalLum = 0;
						let sampled = 0;
						for (let i = 0; i < px.length; i += 4) {
							const r = px[i], gg = px[i + 1], b = px[i + 2];
							const max = Math.max(r, gg, b), min = Math.min(r, gg, b);
							const v = max / 255;
							const s = max === 0 ? 0 : (max - min) / max;
							totalLum += v;
							sampled++;
							if (s < .08 || v < .12 || v > .97) continue;
							const key = r >> 4 << 8 | gg >> 4 << 4 | b >> 4;
							counts[key]++;
							sums[key * 3] += r;
							sums[key * 3 + 1] += gg;
							sums[key * 3 + 2] += b;
						}
						const buckets = [];
						for (let k = 0; k < 4096; k++) {
							if (counts[k] === 0) continue;
							buckets.push({
								count: counts[k],
								r: sums[k * 3],
								g: sums[k * 3 + 1],
								b: sums[k * 3 + 2],
								s: (Math.max(sums[k * 3], sums[k * 3 + 1], sums[k * 3 + 2]) - Math.min(sums[k * 3], sums[k * 3 + 1], sums[k * 3 + 2])) / Math.max(sums[k * 3], sums[k * 3 + 1], sums[k * 3 + 2]) || 0
							});
						}
						if (buckets.length === 0) {
							resolve(null);
							return;
						}
						buckets.sort((a, b) => b.count * (.5 + b.s) - a.count * (.5 + a.s));
						const primary = bucketsToHsl(buckets[0]);
						const primaryHue = primary[0];
						let secondary = primary;
						for (const b of buckets.slice(1)) {
							const [h] = bucketsToHsl(b);
							if (Math.abs((h - primaryHue + 540) % 360 - 180) > 30) {
								secondary = bucketsToHsl(b);
								break;
							}
						}
						let tertiary = [
							(primaryHue + 180) % 360,
							Math.min(.7, primary[1]),
							Math.min(.7, primary[2])
						];
						for (const b of buckets.slice(1)) {
							const [h] = bucketsToHsl(b);
							const sep = Math.abs((h - primaryHue + 540) % 360 - 180);
							if (sep > 90 && sep < 150) {
								tertiary = bucketsToHsl(b);
								break;
							}
						}
						const surface = [
							primaryHue,
							Math.min(.06, primary[1] * .3),
							primary[2]
						];
						const luminance = sampled > 0 ? totalLum / sampled : primary[2];
						primary[2] = luminance < .5 ? Math.min(.44, Math.max(.2, primary[2])) : Math.max(.6, Math.min(.82, primary[2]));
						resolve({
							primary: [
								primary[0],
								Math.min(.9, Math.max(.15, primary[1])),
								primary[2]
							],
							secondary: [
								secondary[0],
								Math.min(.85, Math.max(.2, secondary[1])),
								Math.min(.75, Math.max(.35, secondary[2]))
							],
							tertiary: [
								tertiary[0],
								Math.min(.8, Math.max(.2, tertiary[1])),
								Math.min(.7, Math.max(.35, tertiary[2]))
							],
							surface,
							luminance
						});
					} catch {
						resolve(null);
					}
				};
				img.src = dataUrl;
			});
		}
		/** Backward-compatible single-color extraction: returns the primary HSL. */
		async function extractWallpaperColor(dataUrl, bgState) {
			const palette = await extractWallpaperPalette(dataUrl, bgState);
			return palette ? palette.primary : null;
		}
		const ANALYZE_SIDE = 32;
		/** Analyze a captured frame's average luminance. Resolves true when the frame
		*  reads dark (use white fonts), false when light (use black fonts), or null
		*  when the frame cannot be decoded. */
		function analyzeFrameDark(dataUrl) {
			return new Promise((resolve) => {
				const img = new Image();
				img.onerror = () => resolve(null);
				img.onload = () => {
					try {
						const c = document.createElement("canvas");
						c.width = ANALYZE_SIDE;
						c.height = ANALYZE_SIDE;
						const g = c.getContext("2d", { willReadFrequently: true });
						g.drawImage(img, 0, 0, ANALYZE_SIDE, ANALYZE_SIDE);
						const px = g.getImageData(0, 0, ANALYZE_SIDE, ANALYZE_SIDE).data;
						let lum = 0;
						const count = px.length / 4;
						for (let i = 0; i < px.length; i += 4) lum += .2126 * px[i] + .7152 * px[i + 1] + .0722 * px[i + 2];
						resolve(lum / count / 255 < .5);
					} catch {
						resolve(null);
					}
				};
				img.src = dataUrl;
			});
		}
		/** HSL (h 0-360, s/l 0-1) → RGB (0-255 integers). */
		function hslToRgb(h, s, l) {
			const c = (1 - Math.abs(2 * l - 1)) * s;
			const hp = h / 60;
			const x = c * (1 - Math.abs(hp % 2 - 1));
			let r = 0, g = 0, b = 0;
			if (hp < 1) {
				r = c;
				g = x;
			} else if (hp < 2) {
				r = x;
				g = c;
			} else if (hp < 3) {
				g = c;
				b = x;
			} else if (hp < 4) {
				g = x;
				b = c;
			} else if (hp < 5) {
				r = x;
				b = c;
			} else {
				r = c;
				b = x;
			}
			const m = l - c / 2;
			return [
				Math.round((r + m) * 255),
				Math.round((g + m) * 255),
				Math.round((b + m) * 255)
			];
		}
		//#endregion
		//#region src/client/utils/bg-generators.ts
		const RENDER_SCALE = .55;
		const FRAME_MS = 1e3 / 30;
		function newRaf(canvas, draw) {
			canvas.dataset.dshAnyCanvas = "1";
			let running = true;
			let last = 0;
			draw();
			const loop = (ts) => {
				if (!running) return;
				if (ts - last >= FRAME_MS) {
					last = ts;
					draw();
				}
				requestAnimationFrame(loop);
			};
			requestAnimationFrame(loop);
			return { stop: () => {
				running = false;
			} };
		}
		function createCanvas() {
			const c = document.createElement("canvas");
			c.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;";
			return c;
		}
		function liveSize() {
			const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
			return {
				w: Math.max(320, Math.ceil(window.innerWidth * dpr * RENDER_SCALE)),
				h: Math.max(180, Math.ceil(window.innerHeight * dpr * RENDER_SCALE))
			};
		}
		function fitLiveCanvas(c) {
			if (c.dataset.dshAnyStatic === "1") return;
			const { w, h } = liveSize();
			if (c.width !== w || c.height !== h) {
				c.width = w;
				c.height = h;
			}
		}
		function createRng(seed) {
			let s = seed > 0 ? seed : 1;
			return () => {
				s ^= s << 13;
				s ^= s >>> 17;
				s ^= s << 5;
				return (s >>> 0) / 4294967295;
			};
		}
		function createNoise(seed) {
			const rng = createRng(seed);
			const perm = [];
			for (let i = 0; i < 256; i++) perm[i] = i;
			for (let i = 255; i > 0; i--) {
				const j = Math.floor(rng() * (i + 1));
				const t = perm[i];
				perm[i] = perm[j];
				perm[j] = t;
			}
			for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
			function fade(t) {
				return t * t * t * (t * (t * 6 - 15) + 10);
			}
			function lerp(a, b, t) {
				return a + (b - a) * t;
			}
			function grad(hash, x, y) {
				const h = hash & 15;
				const u = h < 8 ? x : y;
				const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
				return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
			}
			return (x, y) => {
				const X = Math.floor(x) & 255;
				const Y = Math.floor(y) & 255;
				x -= Math.floor(x);
				y -= Math.floor(y);
				const u = fade(x);
				const v = fade(y);
				const A = perm[X] + Y;
				return lerp(lerp(grad(perm[A], x, y), grad(perm[A + 1], x - 1, y), u), lerp(grad(perm[A + 256], x, y - 1), grad(perm[A + 257], x - 1, y - 1), u), v);
			};
		}
		function createMeshGradient(params, canvas) {
			const c = canvas ?? createCanvas();
			fitLiveCanvas(c);
			const g = c.getContext("2d", { alpha: false });
			const rng = createRng(params.seed);
			const noise = createNoise(params.seed);
			const dark = rng() < .5;
			const baseHue = Math.round(rng() * 360);
			const count = Math.round(7 + 9 * params.scale * params.intensity);
			const blobs = [];
			for (let i = 0; i < count; i++) blobs.push({
				x: rng(),
				y: rng(),
				r: (.22 + rng() * .6) * params.scale,
				hx: rng() * 4 - 2,
				hy: rng() * 4 - 2,
				speed: .05 + rng() * .1,
				hue: (baseHue + (rng() < .5 ? 30 : 180) + rng() * 60) % 360,
				sat: Math.round(45 + rng() * 50 * params.intensity),
				lit: dark ? Math.round(18 + rng() * 35 * params.intensity) : Math.round(60 + rng() * 25 * params.intensity)
			});
			let t = 0;
			const alpha = (.22 + .3 * params.intensity).toFixed(3);
			const innerAlpha = (+alpha * .35).toFixed(3);
			const draw = () => {
				fitLiveCanvas(c);
				const w = c.width, h = c.height;
				g.fillStyle = dark ? "#0a0b0e" : "#f5f7fa";
				g.fillRect(0, 0, w, h);
				for (const b of blobs) {
					const phase = t * b.speed;
					const cx = ((b.x + noise(b.hx + phase * .3, b.hy) * .25 + phase * .03) % 1 + 1) % 1 * w;
					const cy = ((b.y + noise(b.hx, b.hy + phase * .3) * .25 + phase * .012) % 1 + 1) % 1 * h;
					const r = b.r * Math.min(w, h) * (.8 + .4 * Math.sin(phase + b.hx));
					const rad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
					rad.addColorStop(0, `hsla(${b.hue},${b.sat}%,${b.lit}%,${alpha})`);
					rad.addColorStop(.55, `hsla(${b.hue},${Math.round(b.sat * .6)}%,${b.lit}%,${innerAlpha})`);
					rad.addColorStop(1, "hsla(0,0%,0%,0)");
					g.fillStyle = rad;
					g.fillRect(0, 0, w, h);
				}
				t += .028;
			};
			return {
				canvas: c,
				...newRaf(c, draw),
				snapshot: () => c.toDataURL("image/jpeg", .92)
			};
		}
		function createShaderBg(params, canvas) {
			const c = canvas ?? createCanvas();
			fitLiveCanvas(c);
			const gl = c.getContext("webgl", { alpha: false }) || c.getContext("experimental-webgl", { alpha: false });
			if (!gl) return createMeshGradient({
				type: "mesh",
				seed: params.speed * 1e3,
				scale: params.scale,
				intensity: .6
			}, c);
			const program = createProgram(gl, `
    attribute vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `, shaderFragment(params.preset));
			if (!program) return createMeshGradient({
				type: "mesh",
				seed: params.speed * 1e3,
				scale: params.scale,
				intensity: .6
			}, c);
			const posLoc = gl.getAttribLocation(program, "a_position");
			const buf = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, buf);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
				-1,
				-1,
				1,
				-1,
				-1,
				1,
				-1,
				1,
				1,
				-1,
				1,
				1
			]), gl.STATIC_DRAW);
			gl.enableVertexAttribArray(posLoc);
			gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
			gl.useProgram(program);
			const uRes = gl.getUniformLocation(program, "u_resolution");
			const uTime = gl.getUniformLocation(program, "u_time");
			const uScale = gl.getUniformLocation(program, "u_scale");
			const uSeed = gl.getUniformLocation(program, "u_seed");
			const seed01 = (params.seed >>> 0) / 4294967295;
			let t = 0;
			const draw = () => {
				fitLiveCanvas(c);
				gl.viewport(0, 0, c.width, c.height);
				gl.uniform2f(uRes, c.width, c.height);
				gl.uniform1f(uTime, t);
				gl.uniform1f(uScale, params.scale);
				gl.uniform1f(uSeed, seed01);
				gl.drawArrays(gl.TRIANGLES, 0, 6);
				t += .32 * params.speed;
			};
			return {
				canvas: c,
				...newRaf(c, draw),
				snapshot: () => c.toDataURL("image/jpeg", .95)
			};
		}
		function createProgram(gl, vs, fs) {
			const v = gl.createShader(gl.VERTEX_SHADER);
			const f = gl.createShader(gl.FRAGMENT_SHADER);
			if (!v || !f) return null;
			gl.shaderSource(v, vs);
			gl.compileShader(v);
			gl.shaderSource(f, fs);
			gl.compileShader(f);
			if (!gl.getShaderParameter(v, gl.COMPILE_STATUS) || !gl.getShaderParameter(f, gl.COMPILE_STATUS)) {
				gl.deleteShader(v);
				gl.deleteShader(f);
				return null;
			}
			const p = gl.createProgram();
			if (!p) return null;
			gl.attachShader(p, v);
			gl.attachShader(p, f);
			gl.linkProgram(p);
			if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
				gl.deleteProgram(p);
				return null;
			}
			return p;
		}
		function shaderFragment(preset) {
			const common = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_scale;
    uniform float u_seed;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    vec3 hueRotate(vec3 rgb, float angle) {
      float c = cos(angle), s = sin(angle);
      mat3 m = mat3(
        0.299 + 0.701*c + 0.168*s, 0.587 - 0.587*c + 0.330*s, 0.114 - 0.114*c - 0.497*s,
        0.299 - 0.299*c - 0.328*s, 0.587 + 0.413*c + 0.035*s, 0.114 - 0.114*c + 0.292*s,
        0.299 - 0.300*c + 1.250*s, 0.587 - 0.588*c - 1.050*s, 0.114 + 0.886*c - 0.203*s
      );
      return rgb * m;
    }
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    float fbm(vec3 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * snoise(p);
        p *= 2.0; a *= 0.5;
      }
      return v;
    }
  `;
			if (preset === "aurora") return common + `
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float t = u_time;
        float n1 = fbm(vec3(uv * 2.5 * u_scale, t));
        float n2 = fbm(vec3(uv * 4.0 * u_scale + 7.0, t * 1.4));
        float n3 = fbm(vec3(uv * 1.2 * u_scale - 3.0, t * 0.7));
        float bands = smoothstep(0.15, 0.85, 0.5 + 0.5 * sin((uv.y + n3 * 0.08) * 8.0 + n1 * 1.5));
        vec3 c1 = vec3(0.03, 0.08, 0.14);
        vec3 c2 = vec3(0.05, 0.28, 0.32);
        vec3 c3 = vec3(0.18, 0.62, 0.42);
        vec3 c4 = vec3(0.55, 0.22, 0.52);
        vec3 c5 = vec3(0.85, 0.35, 0.25);
        vec3 col = mix(c1, c2, bands);
        col = mix(col, c3, smoothstep(0.25, 0.75, n1));
        col = mix(col, c4, smoothstep(0.45, 0.85, n2) * 0.75);
        col = mix(col, c5, smoothstep(0.7, 0.95, n2 + n1 * 0.3) * 0.45);
        col = hueRotate(col, u_seed * 6.28318530718);
        gl_FragColor = vec4(col, 1.0);
      }
    `;
			if (preset === "nebula") return common + `
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float t = u_time * 0.8;
        float n = fbm(vec3(uv * 2.2 * u_scale, t));
        float n2 = fbm(vec3(uv * 5.0 * u_scale - 4.0, t * 0.65));
        float n3 = fbm(vec3(uv * 0.9 * u_scale + 2.0, t * 0.4));
        vec3 c1 = vec3(0.02, 0.02, 0.08);
        vec3 c2 = vec3(0.12, 0.04, 0.22);
        vec3 c3 = vec3(0.32, 0.10, 0.35);
        vec3 c4 = vec3(0.10, 0.18, 0.42);
        vec3 c5 = vec3(0.55, 0.30, 0.55);
        vec3 col = mix(c1, c2, smoothstep(-0.5, 0.6, n));
        col = mix(col, c3, smoothstep(0.15, 0.8, n2) * 0.75);
        col = mix(col, c4, smoothstep(0.35, 0.85, n + n3 * 0.3) * 0.55);
        col = mix(col, c5, smoothstep(0.6, 0.95, n2) * 0.35);
        col = hueRotate(col, u_seed * 6.28318530718);
        gl_FragColor = vec4(col, 1.0);
      }
    `;
			return common + `
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float t = u_time;
      float n = fbm(vec3(uv * 3.5 * u_scale, t));
      float n2 = fbm(vec3(uv * 9.0 * u_scale + 15.0, t * 1.6));
      float n3 = fbm(vec3(uv * 1.5 * u_scale - 5.0, t * 0.5));
      vec3 c1 = vec3(0.06, 0.06, 0.08);
      vec3 c2 = vec3(0.16, 0.18, 0.22);
      vec3 c3 = vec3(0.30, 0.32, 0.36);
      vec3 c4 = vec3(0.46, 0.48, 0.52);
      vec3 col = mix(c1, c2, 0.5 + 0.5 * n + n3 * 0.15);
      col = mix(col, c3, smoothstep(0.3, 0.8, n2) * 0.45);
      col = mix(col, c4, smoothstep(0.6, 0.95, n2) * 0.25);
      col = hueRotate(col, u_seed * 6.28318530718);
      gl_FragColor = vec4(col, 1.0);
    }
  `;
		}
		function createPatternBg(params, canvas) {
			if (params.preset === "waves") return createWaves(params, canvas);
			if (params.preset === "poly") return createLowPoly(params, canvas);
			return createDots(params, canvas);
		}
		function createDots(params, canvas) {
			const c = canvas ?? createCanvas();
			fitLiveCanvas(c);
			const g = c.getContext("2d", { alpha: false });
			const rng = createRng(params.seed);
			const dark = rng() < .5;
			const baseHue = Math.round(rng() * 360);
			const spacing = Math.max(26, 150 * params.scale / (.25 + params.density));
			const dots = [];
			for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) dots.push({
				cx: x / 7,
				cy: y / 7,
				r: spacing * .16 * params.scale * (.6 + rng() * .7),
				hue: (baseHue + rng() * 80) % 360,
				sat: Math.round(35 + rng() * 55),
				lit: dark ? Math.round(30 + rng() * 35) : Math.round(55 + rng() * 30),
				phase: rng() * Math.PI * 2,
				speed: .5 + rng() * 1.2
			});
			let t = 0;
			const draw = () => {
				fitLiveCanvas(c);
				const w = c.width, h = c.height;
				g.fillStyle = dark ? "#0a0b0d" : "#f6f7f9";
				g.fillRect(0, 0, w, h);
				for (const d of dots) {
					const pulse = .75 + .35 * Math.sin(t * d.speed + d.phase);
					const r = Math.max(1, d.r * pulse);
					const x = d.cx * w + d.r * .3 * Math.sin(t * d.speed * .5 + d.phase);
					const y = d.cy * h + d.r * .3 * Math.cos(t * d.speed * .7 + d.phase);
					g.beginPath();
					g.arc(x, y, r, 0, Math.PI * 2);
					g.fillStyle = `hsla(${d.hue},${d.sat}%,${d.lit}%,${(.18 + .25 * pulse).toFixed(2)})`;
					g.fill();
				}
				t += .032;
			};
			return {
				canvas: c,
				...newRaf(c, draw),
				snapshot: () => c.toDataURL("image/jpeg", .94)
			};
		}
		function createWaves(params, canvas) {
			const c = canvas ?? createCanvas();
			fitLiveCanvas(c);
			const g = c.getContext("2d", { alpha: false });
			const rng = createRng(params.seed);
			const dark = rng() < .5;
			const hue = Math.round(rng() * 360);
			const layers = Math.round(5 + params.density * 8);
			const waves = [];
			for (let i = 0; i < layers; i++) waves.push({
				yBase: .25 + i / layers * .55,
				amp: (25 + rng() * 45) * params.scale,
				freq: (.006 + rng() * .01) / params.scale,
				phase: rng() * Math.PI * 2,
				speed: (.3 + rng() * .7) * (rng() < .5 ? 1 : -1),
				hue: (hue + i * 12) % 360,
				sat: Math.round(40 + rng() * 45),
				lit: dark ? Math.round(14 + i / layers * 32) : Math.round(72 - i / layers * 28),
				alpha: .22 + rng() * .32
			});
			let t = 0;
			const draw = () => {
				fitLiveCanvas(c);
				const w = c.width, h = c.height;
				g.fillStyle = dark ? "#07080a" : "#f8f9fb";
				g.fillRect(0, 0, w, h);
				for (const wave of waves) {
					g.beginPath();
					g.moveTo(0, h);
					for (let x = 0; x <= w; x += Math.max(6, Math.floor(w / 180))) {
						const y = h * wave.yBase + Math.sin(x * wave.freq + wave.phase + t * wave.speed) * wave.amp + Math.sin(x * wave.freq * 2.1 + wave.phase * 1.3 - t * wave.speed * 1.5) * wave.amp * .5;
						g.lineTo(x, y);
					}
					g.lineTo(w, h);
					g.closePath();
					g.fillStyle = `hsla(${wave.hue},${wave.sat}%,${wave.lit}%,${wave.alpha.toFixed(2)})`;
					g.fill();
				}
				t += .032;
			};
			return {
				canvas: c,
				...newRaf(c, draw),
				snapshot: () => c.toDataURL("image/jpeg", .94)
			};
		}
		function createLowPoly(params, canvas) {
			const c = canvas ?? createCanvas();
			fitLiveCanvas(c);
			const g = c.getContext("2d", { alpha: false });
			const rng = createRng(params.seed);
			const dark = rng() < .5;
			const hue = Math.round(rng() * 360);
			const cols = Math.round(10 + params.density * 20);
			const rows = Math.max(6, Math.round(cols * .65));
			const points = [];
			for (let y = 0; y <= rows; y++) {
				const row = [];
				for (let x = 0; x <= cols; x++) row.push({
					x: x / cols,
					y: y / rows,
					dx: (rng() - .5) * .02,
					dy: (rng() - .5) * .02,
					speed: .3 + rng() * .5
				});
				points.push(row);
			}
			const cells = [];
			for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) cells.push({
				y,
				x,
				hue: (hue + rng() * 60) % 360,
				sat: Math.round(35 + rng() * 40),
				lit: dark ? Math.round(12 + rng() * 35) : Math.round(65 - rng() * 10),
				phase: rng() * Math.PI * 2
			});
			let t = 0;
			const px = points.map((row) => row.map(() => ({
				x: 0,
				y: 0
			})));
			const draw = () => {
				fitLiveCanvas(c);
				const w = c.width, h = c.height;
				g.fillStyle = dark ? "#08090c" : "#f5f6f8";
				g.fillRect(0, 0, w, h);
				for (let y = 0; y <= rows; y++) {
					const row = points[y];
					const out = px[y];
					for (let x = 0; x <= cols; x++) {
						const p = row[x];
						out[x].x = (p.x + Math.sin(t * p.speed + p.dx * 100) * p.dx) * w;
						out[x].y = (p.y + Math.cos(t * p.speed + p.dy * 100) * p.dy) * h;
					}
				}
				for (const cell of cells) {
					const p1 = px[cell.y][cell.x], p2 = px[cell.y][cell.x + 1], p3 = px[cell.y + 1][cell.x], p4 = px[cell.y + 1][cell.x + 1];
					const cx = (p1.x + p2.x + p3.x) / 3 / w;
					const lit = Math.max(0, Math.min(100, cell.lit + Math.sin(t * .6 + cell.phase) * 6));
					g.beginPath();
					g.moveTo(p1.x, p1.y);
					g.lineTo(p2.x, p2.y);
					g.lineTo(p3.x, p3.y);
					g.closePath();
					g.fillStyle = `hsla(${cell.hue + cx * 40},${cell.sat}%,${lit}%,0.92)`;
					g.fill();
					g.beginPath();
					g.moveTo(p2.x, p2.y);
					g.lineTo(p4.x, p4.y);
					g.lineTo(p3.x, p3.y);
					g.closePath();
					g.fillStyle = `hsla(${(cell.hue + cx * 40 + 12) % 360},${cell.sat}%,${Math.max(0, lit - 4)}%,0.92)`;
					g.fill();
				}
				t += .03;
			};
			return {
				canvas: c,
				...newRaf(c, draw),
				snapshot: () => c.toDataURL("image/jpeg", .94)
			};
		}
		function createDynamicBackground(params, canvas) {
			if (params.type === "mesh") return createMeshGradient(params, canvas);
			if (params.type === "shader") return createShaderBg(params, canvas);
			return createPatternBg(params, canvas);
		}
		function randomSeed$1() {
			return Math.floor(Math.random() * 2147483647);
		}
		/** Build default params for a newly selected background type. */
		function defaultParamsFor(type) {
			if (type === "mesh") return {
				type: "mesh",
				seed: randomSeed$1(),
				scale: 1.1,
				intensity: .65
			};
			if (type === "shader") return {
				type: "shader",
				preset: "aurora",
				speed: .35,
				scale: 1,
				seed: randomSeed$1()
			};
			return {
				type: "pattern",
				preset: "dots",
				density: .5,
				scale: 1,
				seed: randomSeed$1()
			};
		}
		//#endregion
		//#region src/client/wallpaper.ts
		let wpEl = null;
		let videoEl = null;
		let appliedTokenNames = [];
		let wpController = null;
		let snapshotListener = null;
		let tokenStyleEl = null;
		function clearDynamicBg() {
			wpController?.stop();
			wpController?.canvas.remove();
			wpController = null;
		}
		/** Register a callback fired once a generated snapshot is ready (so the caller
		*  can re-sync the settings preview / store). */
		function onGeneratedSnapshot(cb) {
			snapshotListener = cb;
		}
		function ensureTokenStyle() {
			if (tokenStyleEl?.isConnected) return tokenStyleEl;
			tokenStyleEl = document.createElement("style");
			tokenStyleEl.dataset.plugin = "dsh-any-background-tokens";
			document.head.appendChild(tokenStyleEl);
			return tokenStyleEl;
		}
		function clearCustomTokens() {
			if (tokenStyleEl) tokenStyleEl.textContent = "";
			for (const name of appliedTokenNames) document.body.style.removeProperty(name);
			appliedTokenNames = [];
		}
		/** Label tokens flipped by the generated-background brightness verdict. */
		const LABEL_TOKENS = [
			"--dsw-alias-label-primary",
			"--dsw-alias-label-secondary",
			"--dsw-alias-label-tertiary",
			"--dsw-alias-label-caption",
			"--dsw-alias-label-dimmed",
			"--dsw-alias-label-quaternary"
		];
		const OPACITY_TOKEN_GROUPS = [
			{
				part: "bg",
				names: ["--dsw-alias-bg-base"]
			},
			{
				part: "sidebar",
				names: ["--dsw-specific-sidebar-fill"]
			},
			{
				part: "card",
				names: [
					"--dsw-alias-bg-layer-1",
					"--dsw-alias-bg-layer-2",
					"--dsw-alias-bg-layer-3",
					"--dsw-specific-menu"
				]
			},
			{
				part: "input",
				names: ["--dsw-specific-input-major"]
			}
		];
		const OPACITY_VARS = {
			"--dsw-alias-bg-base": "--dsh-any-op-bg",
			"--dsw-specific-sidebar-fill": "--dsh-any-op-sidebar",
			"--dsw-alias-bg-layer-1": "--dsh-any-op-card-1",
			"--dsw-alias-bg-layer-2": "--dsh-any-op-card-2",
			"--dsw-alias-bg-layer-3": "--dsh-any-op-card-3",
			"--dsw-specific-input-major": "--dsh-any-op-input",
			"--dsw-specific-menu": "--dsh-any-op-menu"
		};
		let baseTokenKey = "";
		let pendingOps = null;
		let tokensRaf = null;
		function applyCustomTokens(ops) {
			pendingOps = ops;
			if (tokensRaf !== null) return;
			tokensRaf = requestAnimationFrame(() => {
				tokensRaf = null;
				if (pendingOps === null) return;
				const o = pendingOps;
				pendingOps = null;
				applyCustomTokensNow(o);
			});
		}
		let lastBgKey = "";
		function applyCustomTokensNow(ops) {
			const [h, s, l] = rColor();
			let { tokens } = genTokens(h, s, l);
			try {
				const dark = rBgDark();
				if (dark !== null) {
					tokens = { ...tokens };
					const font = dark ? "#fff" : "#000";
					for (const name of LABEL_TOKENS) tokens[name] = font;
				}
				const forceDark = dark ?? l < .55;
				if (`${h}|${s}|${l}|${dark}` !== baseTokenKey) {
					baseTokenKey = `${h}|${s}|${l}|${dark}`;
					if (forceDark) document.body.setAttribute("data-ds-dark-theme", "dsh-any-background");
					else document.body.removeAttribute("data-ds-dark-theme");
					const decls = [`color-scheme:${forceDark ? "dark" : "light"}`];
					for (const [name, value] of Object.entries(tokens)) {
						const opVar = OPACITY_VARS[name];
						decls.push(`${name}:${opVar !== void 0 ? `var(${opVar})` : value}!important`);
					}
					ensureTokenStyle().textContent = `body{${decls.join(";")}}`;
					for (const name of appliedTokenNames) document.body.style.removeProperty(name);
					appliedTokenNames = Object.keys(tokens);
				}
				const root = document.documentElement;
				for (const g of OPACITY_TOKEN_GROUPS) for (const name of g.names) root.style.setProperty(OPACITY_VARS[name], toRgba(tokens[name] ?? "#000", ops[g.part]));
				root.style.setProperty("--dsh-any-op-menu-cordis", toRgba(tokens["--dsw-specific-menu"] ?? "#000", ops.input));
				const bgKey = `${baseTokenKey}|${ops.bg}`;
				if (bgKey !== lastBgKey) {
					lastBgKey = bgKey;
					applyPartOpacities(ops);
				}
			} catch {}
		}
		const SETTINGS_PANEL_SEL = "[role=\"dialog\"][aria-modal=\"true\"][aria-labelledby]";
		const SETTINGS_STYLE_RULE = `${SETTINGS_PANEL_SEL}{background:var(--dsh-any-bg-settings-surface,var(--dsw-alias-bg-layer-2));backdrop-filter:var(--dsh-any-blur-settings,none);--dsw-alias-bg-layer-1:var(--dsh-any-bg-settings-layer-1);--dsw-alias-bg-layer-2:var(--dsh-any-bg-settings-layer-2);--dsw-alias-bg-layer-3:var(--dsh-any-bg-settings-layer-3)}${SETTINGS_PANEL_SEL} .dab-card{backdrop-filter:var(--dsh-any-blur-card-panels,none);-webkit-backdrop-filter:var(--dsh-any-blur-card-panels,none)}`;
		const INPUT_BLUR_RULE = "[data-composer-card],[data-cordis-panel]{-webkit-backdrop-filter:var(--dsh-any-input-blur,none);backdrop-filter:var(--dsh-any-input-blur,none)}[data-cordis-panel]{--dsw-specific-menu:var(--dsh-any-op-menu-cordis)!important}";
		function applyInputBlur(px) {
			if (px > 0) document.documentElement.style.setProperty("--dsh-any-input-blur", `blur(${px}px)`);
			else document.documentElement.style.removeProperty("--dsh-any-input-blur");
		}
		function applySettingsOverrides(op) {
			const [h, s, l] = rColor();
			const tokens = genTokens(h, s, l).tokens;
			const layer1 = tokens["--dsw-alias-bg-layer-1"];
			const layer2 = tokens["--dsw-alias-bg-layer-2"];
			const layer3 = tokens["--dsw-alias-bg-layer-3"];
			if (layer2 !== void 0) document.documentElement.style.setProperty("--dsh-any-bg-settings-surface", toRgba(layer2, op));
			if (layer1 !== void 0) document.documentElement.style.setProperty("--dsh-any-bg-settings-layer-1", toRgba(layer1, op));
			if (layer2 !== void 0) document.documentElement.style.setProperty("--dsh-any-bg-settings-layer-2", toRgba(layer2, op));
			if (layer3 !== void 0) document.documentElement.style.setProperty("--dsh-any-bg-settings-layer-3", toRgba(layer3, op));
		}
		const TRAJECTORY_STYLE_RULE = "[data-conversation-composer-overlay]{--dsw-alias-bg-layer-1:var(--dsh-any-traj-layer-1);--dsw-alias-bg-layer-2:var(--dsh-any-traj-layer-2);--dsw-alias-bg-layer-3:var(--dsh-any-traj-layer-3)}";
		function applyTrajectoryOverrides(op) {
			const [h, s, l] = rColor();
			const tokens = genTokens(h, s, l).tokens;
			const layer1 = tokens["--dsw-alias-bg-layer-1"];
			const layer2 = tokens["--dsw-alias-bg-layer-2"];
			const layer3 = tokens["--dsw-alias-bg-layer-3"];
			if (layer1 !== void 0) document.documentElement.style.setProperty("--dsh-any-traj-layer-1", toRgba(layer1, op));
			if (layer2 !== void 0) document.documentElement.style.setProperty("--dsh-any-traj-layer-2", toRgba(layer2, op));
			if (layer3 !== void 0) document.documentElement.style.setProperty("--dsh-any-traj-layer-3", toRgba(layer3, op));
		}
		/** Apply the theme color: use the saved pick directly, or fall back to
		*  extracting a dominant color from the current wallpaper. */
		function applyThemeColor() {
			if (rHasColor()) {
				applyWp();
				return;
			}
			const url = rWp();
			if (url) extractWallpaperColor(url, cfg.backgroundType === "video" ? rVideoBgState() : rBgState()).then((hsl) => {
				if (hsl) cfg.color = hsl;
				applyWp();
			});
			else applyWp();
		}
		/** Switch the background source type. For generated types a new live canvas is
		*  attached to the wallpaper layer and a snapshot is kept for the store/preview. */
		function setBackgroundType(type) {
			cfg.backgroundType = type;
			if (type === "image") {
				clearDynamicBg();
				setBgDark(null);
				setWpUrl(rWpImage());
				applyThemeColor();
				return;
			}
			if (type === "video") {
				clearDynamicBg();
				setBgDark(null);
				setWpUrl(null);
				applyThemeColor();
				return;
			}
			if (!cfg.generatedBg || cfg.generatedBg.type !== type) cfg.generatedBg = defaultParamsFor(type);
			applyGeneratedBg(cfg.generatedBg);
		}
		function randomSeed() {
			return Math.floor(Math.random() * 2147483647);
		}
		/** Regenerate the current generated background with a new visual seed while
		*  preserving the user's scale/intensity/speed/density/preset choices. */
		function regenerateGeneratedBg() {
			const params = cfg.generatedBg;
			if (!params || cfg.backgroundType === "image") return;
			cfg.generatedBg = {
				...params,
				seed: randomSeed()
			};
			applyGeneratedBg(cfg.generatedBg);
		}
		/** Update a generated background's parameters and re-render. */
		function updateGeneratedBg(params) {
			cfg.backgroundType = params.type;
			cfg.generatedBg = params;
			applyGeneratedBg(params);
		}
		function applyGeneratedBg(params) {
			clearDynamicBg();
			clearVideoEl();
			ensureWpContainer();
			wpController = createDynamicBackground(params);
			if (wpEl) {
				wpEl.style.backgroundImage = "none";
				wpEl.appendChild(wpController.canvas);
			}
			requestAnimationFrame(() => {
				if (!wpController) return;
				const controller = wpController;
				const frame = controller.snapshot();
				setWpUrl(frame);
				applyWp();
				snapshotListener?.();
				setBgDark(null);
				analyzeFrameDark(frame).then((dark) => {
					if (dark === null || wpController !== controller) return;
					setBgDark(dark);
					applyCustomTokens(rOps());
				});
			});
		}
		let frameEl = null;
		let sidebarEl = null;
		let centerEl = null;
		let detailsEl = null;
		const PART_BLUR_CLASS = "dab-part-blur";
		const PART_UNDERLAY_CLASS = "dab-part-underlay";
		const PART_BLUR_RULE = `${PART_BLUR_CLASS}{isolation:isolate}.${PART_UNDERLAY_CLASS}{position:absolute;inset:0;z-index:-1;pointer-events:none;border-radius:inherit;backdrop-filter:var(--dsh-any-part-blur,none);-webkit-backdrop-filter:var(--dsh-any-part-blur,none)}`;
		let partBlurStyleEl = null;
		function ensurePartBlurStyle() {
			if (partBlurStyleEl?.isConnected) return;
			partBlurStyleEl = document.createElement("style");
			partBlurStyleEl.dataset.plugin = "dsh-any-background-parts";
			partBlurStyleEl.textContent = PART_BLUR_RULE;
			document.head.appendChild(partBlurStyleEl);
		}
		function discoverParts() {
			const overlay = document.querySelector("[data-shell-overlay]");
			if (overlay === null) return;
			const frame = overlay.parentElement;
			if (frame === null) return;
			frameEl = frame;
			const idx = Array.from(frame.children).indexOf(overlay);
			sidebarEl = frame.children[idx - 3] ?? null;
			centerEl = frame.children[idx - 2] ?? null;
			detailsEl = frame.children[idx - 1] ?? null;
		}
		function setBlur(el, px) {
			if (el === null) return;
			const underlay = el.querySelector(`:scope > .${PART_UNDERLAY_CLASS}`);
			if (px > 0) {
				ensurePartBlurStyle();
				if (!el.classList.contains(PART_BLUR_CLASS) && getComputedStyle(el).position === "static") {
					el.style.position = "relative";
					el.setAttribute("data-dab-pos-patched", "1");
				}
				el.classList.add(PART_BLUR_CLASS);
				if (underlay === null) {
					const node = document.createElement("div");
					node.className = PART_UNDERLAY_CLASS;
					el.prepend(node);
				}
				el.style.setProperty("--dsh-any-part-blur", `blur(${px}px)`);
			} else {
				el.classList.remove(PART_BLUR_CLASS);
				el.style.removeProperty("--dsh-any-part-blur");
				underlay?.remove();
				if (el.getAttribute("data-dab-pos-patched") === "1") {
					el.style.removeProperty("position");
					el.removeAttribute("data-dab-pos-patched");
				}
			}
		}
		function applySettingsBlur(px) {
			if (px > 0) document.documentElement.style.setProperty("--dsh-any-blur-settings", `blur(${px}px)`);
			else document.documentElement.style.removeProperty("--dsh-any-blur-settings");
		}
		/** Apply the main-background opacity to the center/details columns instead of
		*  the frame. The frame's translucent bg-base sits UNDER the sidebar, so
		*  reducing the main-bg opacity stacked a second alpha onto the sidebar; moving
		*  the alpha onto the columns keeps the sidebar owned by its own slider. */
		function applyPartOpacities(ops) {
			if (!(rHasColor() || rBgDark() !== null)) return;
			discoverParts();
			if (frameEl === null) return;
			const [h, s, l] = rColor();
			const base = genTokens(h, s, l).tokens["--dsw-alias-bg-base"];
			frameEl.style.background = "transparent";
			if (centerEl !== null) centerEl.style.background = base !== void 0 ? toRgba(base, ops.bg) : "transparent";
			if (detailsEl !== null) detailsEl.style.background = base !== void 0 ? toRgba(base, ops.bg) : "transparent";
		}
		/** Blur of the option panels inside the settings dialog (.dab-card), owned by
		*  the "dialog option panel" (card) blur slider. Written as a plugin-owned
		*  variable consumed by SETTINGS_STYLE_RULE — deliberately NOT applied to the
		*  homepage center/details columns, which this slider must never touch. */
		function applyCardPanelsBlur(px) {
			if (px > 0) document.documentElement.style.setProperty("--dsh-any-blur-card-panels", `blur(${px}px)`);
			else document.documentElement.style.removeProperty("--dsh-any-blur-card-panels");
		}
		/** Apply per-part interface blur to the AppFrame columns + settings panel. */
		function applyPartBlurs(blurs) {
			discoverParts();
			setBlur(frameEl, 0);
			setBlur(sidebarEl, blurs.sidebar);
			setBlur(centerEl, blurs.bg);
			setBlur(detailsEl, blurs.bg);
			applyCardPanelsBlur(blurs.card);
			applySettingsBlur(blurs.settings);
			applyInputBlur(blurs.input);
			applyViewCards();
		}
		/** Live per-part blur update during slider drag (no full re-apply). */
		function setPartBlur(part, v) {
			if (part === "settings") {
				applySettingsBlur(v);
				return;
			}
			if (part === "card") {
				applyCardPanelsBlur(v);
				return;
			}
			if (part === "input") {
				applyInputBlur(v);
				return;
			}
			if (part === "chat" || part === "trajectory") {
				applyViewCards();
				return;
			}
			discoverParts();
			if (part === "bg") {
				setBlur(centerEl, v);
				setBlur(detailsEl, v);
			} else setBlur(sidebarEl, v);
		}
		const VIEW_CARDS = [{
			sel: "[data-chat-flow]",
			mark: "data-dab-chat-card",
			prev: "dabChatPrev",
			opacity: rChatTextOpacity,
			blur: () => rBlurs().chat,
			fallback: true
		}, {
			sel: "[data-conversation-composer-overlay]",
			mark: "data-dab-traj-card",
			prev: "dabTrajPrev",
			opacity: rTrajectoryOpacity,
			blur: () => rBlurs().trajectory,
			plain: true
		}];
		const viewTargets = VIEW_CARDS.map(() => null);
		function isScrollableY(el) {
			const oy = getComputedStyle(el).overflowY;
			return oy === "auto" || oy === "scroll" || oy === "overlay";
		}
		/** Whether the subtree hosts the chat input (textarea / contenteditable /
		*  textbox role) — used to keep the card off the input row. */
		function containsChatEditor(el) {
			return el.querySelector("textarea,[contenteditable=\"true\"],[contenteditable=\"\"],[contenteditable=\"plaintext-only\"],[role=\"textbox\"]") !== null;
		}
		/** Walk down from a coarse candidate toward the actual message column: stop
		*  at a scroll container (the card surface must stay pinned to the scroll
		*  port); while the chat input lives inside, descend into the tallest child that
		*  does NOT contain it (the header row is short, the input row holds the
		*  editor); otherwise peel wrappers dominated (>= 85%) by a single child so
		*  tab bars / titles stay outside the card. */
		function refineMessageColumn(start) {
			let cur = start;
			for (let depth = 0; depth < 10; depth++) {
				if (isScrollableY(cur)) break;
				const kids = Array.from(cur.children).filter((k) => k instanceof HTMLElement);
				if (kids.length === 0) break;
				const tallest = kids.reduce((a, b) => b.clientHeight > a.clientHeight ? b : a);
				if (containsChatEditor(cur)) {
					const candidates = kids.filter((k) => !containsChatEditor(k) && k.clientHeight >= cur.clientHeight * .4);
					if (candidates.length === 0) break;
					cur = candidates.reduce((a, b) => b.clientHeight > a.clientHeight ? b : a);
					continue;
				}
				if (kids.length > 1 && tallest.clientHeight >= cur.clientHeight * .85) {
					cur = tallest;
					continue;
				}
				break;
			}
			return cur;
		}
		function discoverViewTarget(idx, spec) {
			if (centerEl === null || !document.body.contains(centerEl)) {
				viewTargets[idx] = null;
				return null;
			}
			const marked = centerEl.querySelector(spec.sel);
			const cached = viewTargets[idx];
			if (marked !== null) {
				if (cached !== null && cached !== marked) {
					setBlur(cached, 0);
					restoreCardHost(cached, spec.mark, spec.prev, spec.plain === true);
				}
				viewTargets[idx] = marked;
				return marked;
			}
			if (cached !== null && centerEl.contains(cached)) return cached;
			viewTargets[idx] = null;
			if (spec.fallback !== true) return null;
			if (centerEl.querySelector("[data-conversation-scroll]") !== null) return null;
			if (spec.opacity() <= 0 && spec.blur() <= 0) return null;
			let best = null;
			let bestArea = 0;
			for (const el of Array.from(centerEl.querySelectorAll("*"))) {
				if (!isScrollableY(el)) continue;
				if (el.clientHeight < centerEl.clientHeight * .35) continue;
				const area = el.clientWidth * el.clientHeight;
				if (area > bestArea) {
					bestArea = area;
					best = el;
				}
			}
			if (best === null) for (const el of Array.from(centerEl.children)) {
				if (!(el instanceof HTMLElement)) continue;
				if (el.clientHeight < centerEl.clientHeight * .5) continue;
				if (el.clientHeight > (best?.clientHeight ?? 0)) best = el;
			}
			const refined = best !== null ? refineMessageColumn(best) : null;
			viewTargets[idx] = refined;
			return refined;
		}
		/** Stash the host's own inline values so teardown restores them exactly.
		*  Plain views only get a background override, so only that is stashed. */
		function stashCardPrev(el, prev, plain) {
			const ds = el.dataset;
			ds[prev + "Bg"] = el.style.getPropertyValue("background");
			if (plain) return;
			ds[prev + "Border"] = el.style.getPropertyValue("border");
			ds[prev + "Radius"] = el.style.getPropertyValue("border-radius");
			ds[prev + "Padding"] = el.style.getPropertyValue("padding");
		}
		/** Undo the inline styling, restoring the host's previous inline values. */
		function restoreCardHost(el, mark, prev, plain) {
			if (!el.hasAttribute(mark)) return;
			const ds = el.dataset;
			const restore = (prop, v) => {
				if (v !== void 0 && v !== "") el.style.setProperty(prop, v);
				else el.style.removeProperty(prop);
			};
			restore("background", ds[prev + "Bg"]);
			if (!plain) {
				restore("border", ds[prev + "Border"]);
				restore("border-radius", ds[prev + "Radius"]);
				restore("padding", ds[prev + "Padding"]);
				delete ds[prev + "Border"];
				delete ds[prev + "Radius"];
				delete ds[prev + "Padding"];
			}
			delete ds[prev + "Bg"];
			el.removeAttribute(mark);
		}
		/** Teardown only: strip every view treatment and hand the hosts back untouched. */
		function removeViewCards() {
			VIEW_CARDS.forEach((spec, i) => {
				const el = viewTargets[i];
				if (el !== null) {
					setBlur(el, 0);
					restoreCardHost(el, spec.mark, spec.prev, spec.plain === true);
				}
				viewTargets[i] = null;
			});
		}
		/** Re-derive the conversation view cards from the current config. Cheap
		*  enough for live slider drags; the card structure is applied unconditionally
		*  once the host exists so the layout never reflows when a slider leaves zero. */
		function applyViewCards() {
			discoverParts();
			if (centerEl === null) return;
			const [h, s, l] = rColor();
			const surface = genTokens(h, s, l).tokens["--dsw-alias-bg-layer-1"];
			VIEW_CARDS.forEach((spec, i) => {
				const target = discoverViewTarget(i, spec);
				if (target === null) return;
				const plain = spec.plain === true;
				const opacity = spec.opacity();
				const blurPx = spec.blur();
				if (!plain) {
					if (!target.hasAttribute(spec.mark)) stashCardPrev(target, spec.prev, false);
					const borderAlpha = opacity > 0 ? Math.min(1, opacity * 1.5) : blurPx > 0 ? .35 : 0;
					target.style.background = surface !== void 0 ? toRgba(surface, opacity) : "transparent";
					target.style.border = surface !== void 0 ? `1px solid ${toRgba(surface, borderAlpha)}` : "1px solid transparent";
					target.style.borderRadius = "16px";
					target.style.padding = "18px";
				}
				target.setAttribute(spec.mark, "1");
				setBlur(target, blurPx);
			});
		}
		let partsObserver = null;
		/** Watch for the AppFrame mounting so persisted blurs land even when the shell
		*  renders after this plugin's apply. Cheap: once all parts are found, the
		*  callback returns. */
		function watchParts() {
			if (partsObserver !== null || typeof MutationObserver === "undefined") return;
			partsObserver = new MutationObserver(() => {
				if (frameEl !== null && sidebarEl !== null && centerEl !== null && detailsEl !== null && document.body.contains(frameEl) && viewTargets.every((el) => el !== null && document.body.contains(el))) return;
				applyPartBlurs(rBlurs());
				applyPartOpacities(rOps());
			});
			partsObserver.observe(document.body, {
				childList: true,
				subtree: true
			});
		}
		function stopWatchingParts() {
			partsObserver?.disconnect();
			partsObserver = null;
		}
		function ensureWpContainer() {
			if (!wpEl || !document.body.contains(wpEl)) {
				wpEl = document.createElement("div");
				wpEl.style.cssText = "position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;";
				document.body.prepend(wpEl);
			}
		}
		function clearVideoEl() {
			if (videoEl === null) return;
			videoEl.pause();
			videoEl.removeAttribute("src");
			videoEl.load();
			videoEl.remove();
			videoEl = null;
		}
		/** Intrinsic-size cache for the center mode (native pixels of the current image). */
		let imgNat = null;
		function imageNatSize(url, cb) {
			if (imgNat !== null && imgNat.url === url) {
				cb(imgNat.w, imgNat.h);
				return;
			}
			const img = new Image();
			img.onload = () => {
				imgNat = {
					url,
					w: img.naturalWidth,
					h: img.naturalHeight
				};
				cb(img.naturalWidth, img.naturalHeight);
			};
			img.onerror = () => cb(0, 0);
			img.src = url;
		}
		const DRAG_MAX_SIDE = 720;
		let lowResUrl = null;
		let lowResFor = "";
		let dragLow = false;
		function captureLowRes(url, cb) {
			if (lowResFor === url) {
				cb(lowResUrl);
				return;
			}
			const img = new Image();
			img.onload = () => {
				const k = Math.min(1, DRAG_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
				if (k >= 1) {
					lowResFor = url;
					lowResUrl = null;
					cb(null);
					return;
				}
				const c = document.createElement("canvas");
				c.width = Math.max(1, Math.round(img.naturalWidth * k));
				c.height = Math.max(1, Math.round(img.naturalHeight * k));
				const g = c.getContext("2d");
				if (!g) {
					lowResFor = url;
					lowResUrl = null;
					cb(null);
					return;
				}
				g.drawImage(img, 0, 0, c.width, c.height);
				const low = c.toDataURL("image/jpeg", .85);
				lowResFor = url;
				lowResUrl = low;
				cb(low);
			};
			img.onerror = () => cb(null);
			img.src = url;
		}
		function setDragLow(on) {
			if (cfg.backgroundType !== "image" || on === dragLow || !wpEl) return;
			const full = rWpImage();
			if (!full) return;
			if (on) {
				dragLow = true;
				captureLowRes(full, (low) => {
					if (!dragLow || !wpEl || low === null) return;
					if (wpEl.style.backgroundImage !== `url("${low}")`) wpEl.style.backgroundImage = `url("${low}")`;
				});
			} else {
				dragLow = false;
				if (wpEl.style.backgroundImage !== `url("${full}")`) wpEl.style.backgroundImage = `url("${full}")`;
			}
		}
		/** While any range slider in the app is being dragged, run the wallpaper at
		*  reduced resolution; restore on release. Returns a disposer for teardown. */
		function watchWallpaperDragQuality() {
			const isRange = (t) => t instanceof HTMLInputElement && t.type === "range";
			const down = (e) => {
				if (isRange(e.target)) setDragLow(true);
			};
			const up = () => {
				if (dragLow) setDragLow(false);
			};
			window.addEventListener("pointerdown", down, true);
			window.addEventListener("pointerup", up, true);
			window.addEventListener("pointercancel", up, true);
			return () => {
				window.removeEventListener("pointerdown", down, true);
				window.removeEventListener("pointerup", up, true);
				window.removeEventListener("pointercancel", up, true);
				if (dragLow) setDragLow(false);
			};
		}
		function applyImageWp(url) {
			clearDynamicBg();
			clearVideoEl();
			ensureWpContainer();
			const bg = rBgState();
			const mode = rBgMode();
			const next = `url("${url}")`;
			if (wpEl.style.backgroundImage !== next) wpEl.style.backgroundImage = next;
			if (mode === "fit") {
				wpEl.style.backgroundRepeat = "no-repeat";
				if (bg.iw > 0) {
					const fit = Math.min(window.innerWidth / bg.iw, window.innerHeight / bg.ih);
					const w = bg.iw * fit * bg.zoom;
					const h = bg.ih * fit * bg.zoom;
					wpEl.style.backgroundSize = `${w}px ${h}px`;
					wpEl.style.backgroundPosition = `${bg.x * window.innerWidth - w / 2}px ${bg.y * window.innerHeight - h / 2}px`;
				} else {
					wpEl.style.backgroundSize = "contain";
					wpEl.style.backgroundPosition = "center";
				}
			} else if (mode === "fill") {
				wpEl.style.backgroundRepeat = "no-repeat";
				wpEl.style.backgroundSize = "cover";
				wpEl.style.backgroundPosition = "center";
			} else if (mode === "stretch") {
				wpEl.style.backgroundRepeat = "no-repeat";
				wpEl.style.backgroundSize = "100% 100%";
				wpEl.style.backgroundPosition = "center";
			} else if (mode === "tile") {
				wpEl.style.backgroundRepeat = "repeat";
				wpEl.style.backgroundSize = "auto";
				wpEl.style.backgroundPosition = "0px 0px";
			} else {
				wpEl.style.backgroundRepeat = "no-repeat";
				wpEl.style.backgroundSize = "contain";
				wpEl.style.backgroundPosition = "center";
				imageNatSize(url, (w, h) => {
					if (!wpEl || wpEl.style.backgroundImage !== next || rBgMode() !== "center") return;
					if (w > 0 && h > 0) {
						wpEl.style.backgroundSize = `${w}px ${h}px`;
						wpEl.style.backgroundPosition = "center";
					}
				});
			}
			captureLowRes(url, () => void 0);
			applyWpEffects();
		}
		/** Video wallpaper: a muted looping <video> inside the wallpaper layer.
		*  Placement modes map onto object-fit (tile has no video equivalent and
		*  falls back to cover). */
		function applyVideoWp(url) {
			clearDynamicBg();
			ensureWpContainer();
			if (wpEl.style.backgroundImage !== "none") wpEl.style.backgroundImage = "none";
			if (videoEl === null || !videoEl.isConnected) {
				videoEl = document.createElement("video");
				videoEl.muted = true;
				videoEl.loop = true;
				videoEl.autoplay = true;
				videoEl.playsInline = true;
				videoEl.preload = "auto";
				videoEl.setAttribute("playsinline", "");
				videoEl.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-position:center;";
				wpEl.appendChild(videoEl);
				videoEl.setAttribute("src", url);
				videoEl.play().catch(() => void 0);
			} else if (videoEl.getAttribute("src") !== url) {
				videoEl.setAttribute("src", url);
				videoEl.play().catch(() => void 0);
			}
			const mode = rBgMode();
			const bg = rVideoBgState();
			if (mode === "fit" && bg.iw > 0) {
				const fit = Math.min(window.innerWidth / bg.iw, window.innerHeight / bg.ih);
				const w = bg.iw * fit * bg.zoom;
				const h = bg.ih * fit * bg.zoom;
				videoEl.style.cssText = `position:absolute;left:${bg.x * window.innerWidth - w / 2}px;top:${bg.y * window.innerHeight - h / 2}px;width:${w}px;height:${h}px;object-fit:fill;`;
			} else {
				videoEl.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-position:center;";
				videoEl.style.objectFit = mode === "stretch" ? "fill" : mode === "fill" || mode === "tile" ? "cover" : "contain";
			}
			applyWpEffects();
		}
		function applyWpEffects() {
			if (!wpEl) return;
			const blur = rBl();
			wpEl.style.filter = blur > 0 ? `blur(${blur}px)` : "none";
			wpEl.style.opacity = String(rWop());
		}
		function applyWp() {
			const url = rWp();
			if (cfg.backgroundType === "video") {
				const vurl = rWpVideo();
				if (vurl) applyVideoWp(vurl);
				else {
					clearDynamicBg();
					clearVideoEl();
					wpEl?.remove();
					wpEl = null;
				}
			} else if (cfg.backgroundType !== "image" && cfg.generatedBg) {
				clearVideoEl();
				if (!wpController) {
					applyGeneratedBg(cfg.generatedBg);
					return;
				}
				ensureWpContainer();
				if (wpController.canvas.parentElement !== wpEl) wpEl.appendChild(wpController.canvas);
				applyWpEffects();
			} else if (url) applyImageWp(url);
			else {
				clearDynamicBg();
				clearVideoEl();
				wpEl?.remove();
				wpEl = null;
			}
			if (rHasColor() || rBgDark() !== null) applyCustomTokens(rOps());
			if (rHasColor()) {
				applySettingsOverrides(rSop());
				applyTrajectoryOverrides(rTrajectoryOpacity());
			}
			applyPartBlurs(rBlurs());
		}
		function teardownWp() {
			clearDynamicBg();
			clearVideoEl();
			disposeVideoObjectUrl();
			setBgDark(null);
			wpEl?.remove();
			wpEl = null;
			clearCustomTokens();
			tokenStyleEl?.remove();
			tokenStyleEl = null;
			removeViewCards();
			document.body.removeAttribute("data-ds-dark-theme");
			document.body.style.removeProperty("color-scheme");
			document.documentElement.style.removeProperty("--dsh-any-bg-settings-surface");
			document.documentElement.style.removeProperty("--dsh-any-bg-settings-layer-1");
			document.documentElement.style.removeProperty("--dsh-any-bg-settings-layer-2");
			document.documentElement.style.removeProperty("--dsh-any-bg-settings-layer-3");
			document.documentElement.style.removeProperty("--dsh-any-traj-layer-1");
			document.documentElement.style.removeProperty("--dsh-any-traj-layer-2");
			document.documentElement.style.removeProperty("--dsh-any-traj-layer-3");
			document.documentElement.style.removeProperty("--dsh-any-bg-settings-card-surface");
			document.documentElement.style.removeProperty("--dsh-any-blur-settings");
			document.documentElement.style.removeProperty("--dsh-any-blur-card-panels");
			document.documentElement.style.removeProperty("--dsh-any-input-blur");
			for (const v of Object.values(OPACITY_VARS)) document.documentElement.style.removeProperty(v);
			baseTokenKey = "";
			lastBgKey = "";
			if (tokensRaf !== null) {
				cancelAnimationFrame(tokensRaf);
				tokensRaf = null;
			}
			pendingOps = null;
			setBlur(frameEl, 0);
			setBlur(sidebarEl, 0);
			setBlur(centerEl, 0);
			setBlur(detailsEl, 0);
			if (frameEl !== null) frameEl.style.removeProperty("background");
			if (centerEl !== null) centerEl.style.removeProperty("background");
			if (detailsEl !== null) detailsEl.style.removeProperty("background");
			stopWatchingParts();
		}
		/** Live wallpaper-opacity updates during slider drag (no full re-apply). */
		function setWpOpacity(v) {
			if (wpEl) wpEl.style.opacity = String(v);
		}
		/** Live wallpaper-blur updates during slider drag (no full re-apply). */
		function setWpBlur(v) {
			if (wpEl) wpEl.style.filter = v > 0 ? `blur(${v}px)` : "none";
		}
		//#endregion
		//#region src/client/utils/video.ts
		/**
		* Video-background helpers: capturing a single frame as a JPEG snapshot.
		* The snapshot stands in for everything that only understands still images:
		* the settings preview, theme-color extraction and the eyedropper. Uploads
		* stream the raw file over the binary upload route (see rpc.uploadVideo) —
		* a data-URL detour would inflate the bytes and trip the RPC body limit.
		*/
		function grabFrame(v) {
			const w = v.videoWidth, h = v.videoHeight;
			if (w <= 0 || h <= 0) return null;
			const canvas = document.createElement("canvas");
			canvas.width = w;
			canvas.height = h;
			const ctx = canvas.getContext("2d");
			if (!ctx) return null;
			ctx.drawImage(v, 0, 0, w, h);
			try {
				return canvas.toDataURL("image/jpeg", .85);
			} catch {
				return null;
			}
		}
		/**
		* Capture one representative frame from a video data URL as a JPEG data URL.
		* Seeks to ~10% of the duration (first frame is often black) and waits for
		* the seek to land; resolves null when the video cannot be decoded. A timeout
		* keeps a broken file from hanging the upload flow.
		*/
		function captureVideoSnapshot(url) {
			return new Promise((resolve) => {
				const v = document.createElement("video");
				let settled = false;
				const done = (r) => {
					if (settled) return;
					settled = true;
					window.clearTimeout(timer);
					v.removeAttribute("src");
					v.load();
					resolve(r);
				};
				const timer = window.setTimeout(() => done(grabFrame(v)), 6e3);
				v.muted = true;
				v.preload = "auto";
				v.playsInline = true;
				v.onerror = () => done(null);
				v.onloadeddata = () => {
					const target = isFinite(v.duration) && v.duration > .6 ? Math.min(v.duration * .1, 2) : 0;
					if (target <= 0) {
						done(grabFrame(v));
						return;
					}
					v.onseeked = () => done(grabFrame(v));
					try {
						v.currentTime = target;
					} catch {
						done(grabFrame(v));
					}
				};
				v.src = url;
			});
		}
		const UI_CSS = `
/* The section is rendered INLINE inside the host settings dialog's content
 * column: the host provides the modal chrome (backdrop, centering, closing).
 * These classes style only the embedded shell; transient fixed layers (toast,
 * color picker, background editor) escape through Portals on <html>. */
.dab-root{position:relative;color:var(--dsw-alias-label-primary);animation:dab-fade-in .35s ease both;container-type:inline-size;display:flex;flex-direction:column;align-items:center;width:100%;min-width:0;--dab-mono:ui-monospace,"Cascadia Mono","SF Mono",Consolas,"Courier New",monospace}
.dab-root *,.dab-root *::before,.dab-root *::after{box-sizing:border-box}
.dab-root button{font-family:inherit}

/* ── shell: nav rail + page body ─────────────────────────────────────────── */
.dab-shell{display:grid;grid-template-columns:158px minmax(0,1fr);gap:26px;align-items:start;padding-bottom:8px;width:100%;max-width:980px;margin:0 auto}
.dab-nav{position:sticky;top:0;display:flex;flex-direction:column;gap:18px}
.dab-brand{display:flex;align-items:center;gap:10px;padding:2px 6px}
.dab-brand-tile{width:30px;height:30px;flex:none;border-radius:9px;display:grid;place-items:center;color:var(--dsw-alias-brand-text);background:var(--dsw-alias-brand-primary);box-shadow:0 4px 14px -4px var(--dsw-alias-brand-primary)}
.dab-brand-name{font-size:13px;font-weight:650;letter-spacing:.01em;line-height:1.25}
.dab-brand-tag{font-size:9px;letter-spacing:.16em;font-weight:600;color:var(--dsw-alias-label-quaternary,var(--dsw-alias-label-tertiary));text-transform:uppercase}
.dab-nav-list{position:relative;display:flex;flex-direction:column;gap:4px}
.dab-nav-ind{position:absolute;left:0;right:0;top:0;height:38px;border-radius:11px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 13%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 25%,transparent);transition:transform .38s cubic-bezier(.22,1,.36,1)}
.dab-nav-item{position:relative;z-index:1;display:flex;align-items:center;gap:10px;height:38px;padding:0 12px;border:0;background:none;border-radius:11px;color:var(--dsw-alias-label-tertiary);font-size:13px;cursor:pointer;text-align:left;transition:color .22s ease}
.dab-nav-item:hover{color:var(--dsw-alias-label-primary)}
.dab-nav-item.is-active{color:var(--dsw-alias-brand-primary);font-weight:600}
.dab-nav-item svg{flex:none;transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
.dab-nav-item:hover svg{transform:scale(1.14) rotate(-5deg)}

/* ── page chrome ─────────────────────────────────────────────────────────── */
.dab-page{animation:dab-page-in .4s cubic-bezier(.22,1,.36,1) both;min-width:0;display:flex;flex-direction:column;gap:13px}
.dab-head{margin:2px 0 5px}
.dab-overline{font-size:10.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--dsw-alias-brand-primary);opacity:.9}
.dab-h1{margin:4px 0 0;font-size:21px;font-weight:700;letter-spacing:-.01em}
.dab-desc{margin:6px 0 0;font-size:12.5px;line-height:1.55;color:var(--dsw-alias-label-tertiary);max-width:56ch}
.dab-card{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:16px;padding:18px}
.dab-card-hover{transition:transform .28s ease,box-shadow .28s ease,border-color .28s ease}
.dab-card-hover:hover{transform:translateY(-2px);box-shadow:0 10px 28px -12px rgba(0,0,0,.28)}
.dab-rise{animation:dab-rise-in .55s cubic-bezier(.22,1,.36,1) both;animation-delay:calc(var(--d,0) * 62ms)}

/* ── accent hero (color orb) ─────────────────────────────────────────────── */
.dab-hero-accent{display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.dab-orb-wrap{position:relative;width:118px;height:118px;flex:none}
.dab-orb{position:absolute;inset:11px;border-radius:50%;background:radial-gradient(circle at 32% 28%,rgba(255,255,255,.5),rgba(255,255,255,0) 44%),var(--c,#888);box-shadow:0 16px 36px -10px var(--c-soft,transparent),inset 0 -10px 20px rgba(0,0,0,.16);animation:dab-orb-in .7s cubic-bezier(.22,1,.36,1) both}
.dab-orb-ring{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,transparent 0 30%,var(--c,#888) 46%,transparent 62%,transparent 76%,var(--c,#888) 90%,transparent 100%);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3.5px),#000 calc(100% - 2.5px));mask:radial-gradient(farthest-side,transparent calc(100% - 3.5px),#000 calc(100% - 2.5px));animation:dab-spin 7s linear infinite;opacity:.9}
.dab-hex-caption{font-size:11px;color:var(--dsw-alias-label-tertiary);letter-spacing:.04em}
.dab-hex{font-family:var(--dab-mono);font-size:24px;font-weight:600;letter-spacing:.02em;line-height:1.2;margin-top:2px}
.dab-hsl-row{display:flex;gap:16px;margin-top:7px;font-family:var(--dab-mono);font-size:11px;color:var(--dsw-alias-label-tertiary)}
.dab-hsl-row b{font-weight:600;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-tertiary))}

/* ── swatches ────────────────────────────────────────────────────────────── */
.dab-swatch-title{font-size:12px;font-weight:600;margin-bottom:10px;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-tertiary))}
.dab-swatches{display:flex;flex-wrap:wrap;gap:9px}
.dab-swatch{width:25px;height:25px;border-radius:50%;border:0;padding:0;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(0,0,0,.1);transition:transform .22s cubic-bezier(.34,1.56,.64,1),box-shadow .22s ease}
.dab-swatch:hover{transform:scale(1.2)}
.dab-swatch.is-on{box-shadow:0 0 0 2px var(--dsw-alias-bg-layer-1),0 0 0 4px var(--dsw-alias-brand-primary)}

/* ── wheel card ──────────────────────────────────────────────────────────── */
.dab-wheel-card{position:relative;display:flex;align-items:center;justify-content:center;gap:28px;flex-wrap:wrap;padding:24px 18px}
.dab-wheel-glow{position:absolute;width:230px;height:230px;border-radius:50%;filter:blur(48px);opacity:.2;background:var(--c,#888);pointer-events:none;transition:background .4s ease}
.dab-wheel{position:relative;cursor:crosshair;border-radius:50%;box-shadow:0 12px 32px -14px rgba(0,0,0,.4)}
.dab-hint{font-size:11.5px;line-height:1.55;color:var(--dsw-alias-label-tertiary);padding:0 4px}

/* ── precise color inputs ────────────────────────────────────────────────── */
.dab-inputs{display:flex;flex-direction:column;gap:10px;min-width:172px}
.dab-field{display:flex;align-items:center;gap:8px}
.dab-field-label{width:14px;text-align:center;font-family:var(--dab-mono);font-size:11px;font-weight:600;color:var(--dsw-alias-label-tertiary)}
.dab-num{flex:1;min-width:0;height:30px;padding:0 10px;border-radius:9px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-family:var(--dab-mono);font-size:12px;outline:none;transition:border-color .2s,box-shadow .2s}
.dab-num:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 18%,transparent)}
.dab-num::-webkit-outer-spin-button,.dab-num::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.dab-num{-moz-appearance:textfield;appearance:textfield}
.dab-swatch-lg{height:38px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);box-shadow:inset 0 0 14px rgba(0,0,0,.1);transition:transform .3s ease}
.dab-swatch-lg:hover{transform:scale(1.02)}

/* ── buttons & chips ─────────────────────────────────────────────────────── */
.dab-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;height:34px;padding:0 14px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);color:var(--dsw-alias-label-primary);font-size:12.5px;font-weight:550;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,opacity .18s ease,background .18s ease}
.dab-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 5px 14px -6px rgba(0,0,0,.32)}
.dab-btn:active:not(:disabled){transform:translateY(0) scale(.97);box-shadow:none}
.dab-btn:disabled{opacity:.5;cursor:not-allowed}
.dab-btn-primary{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-text);border-color:transparent}
.dab-btn-danger{color:var(--dsw-alias-state-error-primary)}
.dab-btn-ghost{background:transparent;border-color:transparent;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-tertiary))}
.dab-btn-ghost:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);box-shadow:none}
.dab-btn:focus-visible,.dab-nav-item:focus-visible,.dab-seg-item:focus-visible,.dab-swatch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.dab-chip-row{display:flex;flex-wrap:wrap;gap:8px}
.dab-chip{height:30px;padding:0 14px;border-radius:99px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-tertiary));font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all .22s ease}
.dab-chip:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary)}
.dab-chip.is-active{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-text);border-color:transparent}

/* ── sliders ─────────────────────────────────────────────────────────────── */
.dab-slider-block{display:flex;flex-direction:column;gap:6px}
.dab-slider-block + .dab-slider-block{margin-top:13px}
.dab-slider-label{font-size:12px;font-weight:550;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-tertiary))}
.dab-slider-val{font-family:var(--dab-mono);font-size:11px;color:var(--dsw-alias-label-tertiary);min-width:44px;text-align:right}
.dab-slider{-webkit-appearance:none;appearance:none;flex:1;min-width:0;height:4px;border-radius:99px;outline:none;cursor:pointer;margin:5px 0;background:linear-gradient(to right,var(--dsw-alias-brand-primary) calc(var(--pct,50) * 1%),var(--dsw-alias-border-l2) calc(var(--pct,50) * 1%));transition:height .15s ease}
.dab-slider:hover{height:5px}
.dab-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:15px;height:15px;border-radius:50%;background:var(--dsw-alias-button-elevated-fill,#fff);border:2px solid var(--dsw-alias-brand-primary);box-shadow:0 1px 5px rgba(0,0,0,.28);transition:transform .16s cubic-bezier(.34,1.56,.64,1)}
.dab-slider:hover::-webkit-slider-thumb,.dab-slider:focus-visible::-webkit-slider-thumb{transform:scale(1.22)}
.dab-slider:active::-webkit-slider-thumb{transform:scale(1.34)}
.dab-slider::-moz-range-thumb{width:13px;height:13px;border-radius:50%;background:var(--dsw-alias-button-elevated-fill,#fff);border:2px solid var(--dsw-alias-brand-primary)}

/* ── interface part cards ────────────────────────────────────────────────── */
.dab-grid-parts{display:grid;grid-template-columns:repeat(auto-fill,minmax(256px,1fr));gap:13px}
.dab-part-head{display:flex;align-items:center;gap:11px;margin-bottom:14px}
.dab-part-ico{width:32px;height:32px;flex:none;border-radius:10px;display:grid;place-items:center;color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent)}
.dab-part-name{font-size:13.5px;font-weight:600}
.dab-part-badge{margin-left:auto;font-family:var(--dab-mono);font-size:11px;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-layer-2);border-radius:99px;padding:3px 9px}

/* ── segmented control ───────────────────────────────────────────────────── */
.dab-seg{position:relative;display:inline-flex;padding:3px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:11px}
.dab-seg-thumb{position:absolute;top:3px;bottom:3px;left:3px;width:var(--w,96px);border-radius:8px;background:var(--dsw-alias-button-elevated-fill);box-shadow:0 2px 8px -2px rgba(0,0,0,.28);transition:transform .32s cubic-bezier(.22,1,.36,1)}
.dab-seg-item{position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;width:var(--w,96px);height:30px;border:0;background:none;border-radius:8px;color:var(--dsw-alias-label-tertiary);font-size:12.5px;cursor:pointer;transition:color .25s ease}
.dab-seg-item.is-active{color:var(--dsw-alias-label-primary);font-weight:600}

/* ── toggle switch ───────────────────────────────────────────────────────── */
.dab-toggle{position:relative;width:42px;height:24px;flex:none;border-radius:99px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);cursor:pointer;padding:0;transition:background .28s ease,border-color .28s ease}
.dab-toggle-knob{position:absolute;top:2.5px;left:2.5px;width:17px;height:17px;border-radius:50%;background:var(--dsw-alias-label-secondary,#999);box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .28s cubic-bezier(.22,1,.36,1),background .28s ease}
.dab-toggle.is-on{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}
.dab-toggle.is-on .dab-toggle-knob{transform:translateX(18px);background:#fff}

/* ── background preview hero ─────────────────────────────────────────────── */
.dab-hero{position:relative;border-radius:16px;overflow:hidden;aspect-ratio:16/9;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2)}
.dab-hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .5s cubic-bezier(.22,1,.36,1)}
.dab-hero:hover .dab-hero-img{transform:scale(1.03)}
.dab-hero-empty{position:absolute;inset:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--dsw-alias-label-tertiary);font-size:12.5px;border:1.5px dashed var(--dsw-alias-border-l2);border-radius:12px;cursor:pointer;background:transparent;transition:border-color .25s,color .25s,background .25s;width:auto;height:auto}
.dab-hero-empty:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.dab-hero-empty.is-over{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 8%,transparent)}
.dab-hero-badge{position:absolute;top:10px;left:10px;display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 11px;border-radius:99px;background:rgba(0,0,0,.45);color:#fff;font-size:11px;backdrop-filter:blur(6px);pointer-events:none}
.dab-hero-veil{position:absolute;left:0;right:0;bottom:0;padding:34px 12px 12px;display:flex;align-items:flex-end;justify-content:flex-end;gap:8px;background:linear-gradient(to top,rgba(0,0,0,.55),rgba(0,0,0,0));opacity:0;transform:translateY(6px);transition:opacity .3s ease,transform .3s ease}
.dab-hero:hover .dab-hero-veil{opacity:1;transform:none}
.dab-hero-veil .dab-btn{background:rgba(255,255,255,.94);color:#14161a;border-color:transparent;height:30px;font-size:12px}
.dab-hero-veil .dab-btn-danger{color:#dc2626}

/* ── generated background type cards ─────────────────────────────────────── */
.dab-types{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.dab-type{position:relative;border:1.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:14px;padding:10px;cursor:pointer;text-align:left;font:inherit;transition:border-color .25s,transform .25s,box-shadow .25s}
.dab-type:hover{transform:translateY(-2px)}
.dab-type.is-active{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 18%,transparent)}
.dab-type-thumb{height:62px;border-radius:9px;overflow:hidden;position:relative}
.dab-type-name{margin-top:9px;font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-primary)}
.dab-type-desc{margin-top:2px;font-size:11px;color:var(--dsw-alias-label-tertiary);line-height:1.4}
.dab-type-check{position:absolute;top:16px;right:16px;width:20px;height:20px;border-radius:50%;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-text);display:grid;place-items:center;opacity:0;transform:scale(.4);transition:opacity .25s,transform .25s cubic-bezier(.34,1.56,.64,1)}
.dab-type.is-active .dab-type-check{opacity:1;transform:none}
.dab-thumb-mesh{background:radial-gradient(circle at 22% 30%,#f472b6,transparent 42%),radial-gradient(circle at 80% 22%,#38bdf8,transparent 46%),radial-gradient(circle at 52% 84%,#fbbf24,transparent 52%),#1e293b}
.dab-thumb-shader{background:linear-gradient(120deg,#0ea5e9,#8b5cf6,#d946ef,#0ea5e9);background-size:300% 300%;animation:dab-flow 6s linear infinite}
.dab-thumb-pattern{background-image:radial-gradient(circle,rgba(255,255,255,.92) 1.2px,transparent 1.4px);background-size:10px 10px;background-color:#334155}

/* ── seed row ────────────────────────────────────────────────────────────── */
.dab-seed{display:flex;align-items:center;gap:13px;padding:12px 14px;border-radius:12px;background:var(--dsw-alias-bg-layer-2);margin-top:14px}
.dab-seed-ico{color:var(--dsw-alias-brand-primary);display:grid;place-items:center}
.dab-seed-txt{flex:1;min-width:0}
.dab-seed-title{font-size:12.5px;font-weight:600;display:flex;align-items:center;gap:6px}
.dab-seed-desc{font-size:11px;color:var(--dsw-alias-label-tertiary);margin-top:2px}
.dab-spin{animation:dab-rotate .7s cubic-bezier(.3,.7,.3,1) 1}

/* ── profile page ────────────────────────────────────────────────────────── */
.dab-profile-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(238px,1fr));gap:13px}
.dab-profile-ico{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;margin-bottom:13px;color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent)}
.dab-profile-title{font-size:14px;font-weight:650}
.dab-profile-desc{font-size:12px;color:var(--dsw-alias-label-tertiary);line-height:1.55;margin:5px 0 15px}
.dab-footer{margin-top:6px;padding:14px 4px 0;border-top:1px solid var(--dsw-alias-border-l2);display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.dab-footer-mono{font-family:var(--dab-mono);letter-spacing:.02em}

/* ── toast ───────────────────────────────────────────────────────────────── */
.dab-toast{position:fixed;left:50%;bottom:30px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;height:38px;padding:0 16px;border-radius:99px;background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-layer-2));border:1px solid var(--dsw-alias-border-l2);box-shadow:0 10px 30px -8px rgba(0,0,0,.38);font-size:12.5px;z-index:10001;animation:dab-toast-in .32s cubic-bezier(.22,1,.36,1) both}
.dab-toast-ok{color:var(--dsw-alias-brand-primary);display:grid;place-items:center}
.dab-toast-err{color:var(--dsw-alias-state-error-primary);display:grid;place-items:center}

/* ── modals (editor / eyedropper / crash) ────────────────────────────────── */
/* Pin to the viewport explicitly with vw/vh so ancestor padding/margins on
 * body cannot shift or clip the overlay; keep it above host sidebar chrome.
 * pointer-events:auto re-enables interaction: these overlays render inside a
 * Portal root that is pointer-events:none so it never blocks the page alone. */
.dab-overlay{position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:999999;background:rgba(8,10,14,.62);backdrop-filter:blur(8px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;animation:dab-fade-in .25s ease both;pointer-events:auto}
.dab-overlay-title{color:#fff;font-size:15px;font-weight:600}
.dab-overlay-hint{color:rgba(255,255,255,.62);font-size:12px}
.dab-modal-card{animation:dab-zoom-in .3s cubic-bezier(.22,1,.36,1) both;max-width:calc(100vw - 40px);max-height:calc(100vh - 120px);overflow:auto}
.dab-overlay .dab-btn{background:rgba(255,255,255,.94);color:#14161a;border-color:transparent}
.dab-overlay .dab-btn-primary{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-text)}
.dab-crash{display:flex;flex-direction:column;gap:10px;align-items:center;padding:28px 18px;border:1px solid var(--dsw-alias-border-l2);border-radius:16px}
.dab-crash-title{font-size:15px;font-weight:650}
.dab-crash-desc{font-size:12px;color:var(--dsw-alias-label-tertiary);text-align:center;line-height:1.5}

/* ── keyframes ───────────────────────────────────────────────────────────── */
@keyframes dab-fade-in{from{opacity:0}to{opacity:1}}
@keyframes dab-page-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes dab-rise-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes dab-orb-in{from{opacity:0;transform:scale(.82)}to{opacity:1;transform:none}}
@keyframes dab-spin{to{transform:rotate(360deg)}}
@keyframes dab-rotate{to{transform:rotate(360deg)}}
@keyframes dab-toast-in{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes dab-zoom-in{from{opacity:0;transform:scale(.94) translateY(8px)}to{opacity:1;transform:none}}
@keyframes dab-flow{to{background-position:300% 50%}}

/* ── responsive & motion preferences ─────────────────────────────────────── */
@container (max-width:620px){
  .dab-shell{grid-template-columns:1fr;gap:14px}
  .dab-nav{position:static;flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .dab-nav-list{flex-direction:row;overflow-x:auto;scrollbar-width:none}
  .dab-nav-list::-webkit-scrollbar{display:none}
  .dab-nav-ind{display:none}
  .dab-nav-item{flex:none;padding:0 10px}
  .dab-nav-item.is-active{background:var(--dsw-alias-bg-layer-2)}
  .dab-types{grid-template-columns:1fr}
}
@container (min-width:621px){
  .dab-shell{grid-template-columns:158px minmax(0,1fr);gap:26px}
}
@media (prefers-reduced-motion:reduce){
  .dab-root *,.dab-root *::before,.dab-root *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
`;
		const CSS_ID = "dab-ui-css";
		/** Inject the design-system stylesheet once per document (HMR-safe). */
		function ensureUiCss() {
			if (typeof document === "undefined") return;
			let el = document.getElementById(CSS_ID);
			if (!el) {
				el = document.createElement("style");
				el.id = CSS_ID;
				document.head.appendChild(el);
			}
			if (el.textContent !== UI_CSS) el.textContent = UI_CSS;
		}
		//#endregion
		//#region src/client/components/icons.tsx
		/** Sun glyph, migrated from @deepseek-ai/dsh-client-ui-primitives IconLightOutline16. */
		const SUN_PATHS = "<path d=\"M11.3496 8C11.3496 6.14985 9.85015 4.65039 8 4.65039C6.14985 4.65039 4.65039 6.14985 4.65039 8C4.65039 9.85015 6.14985 11.3496 8 11.3496C9.85015 11.3496 11.3496 9.85015 11.3496 8ZM12.6504 8C12.6504 10.5681 10.5681 12.6504 8 12.6504C5.43188 12.6504 3.34961 10.5681 3.34961 8C3.34961 5.43188 5.43188 3.34961 8 3.34961C10.5681 3.34961 12.6504 5.43188 12.6504 8Z\" fill=\"currentColor\"/><path d=\"M8.65039 0.5V2.5H7.34961V0.5H8.65039Z\" fill=\"currentColor\"/><path d=\"M8.65039 13.5V15.5H7.34961V13.5H8.65039Z\" fill=\"currentColor\"/><path d=\"M3.15808 2.24035L4.57229 3.65456L3.6525 4.57435L2.23829 3.16014L3.15808 2.24035Z\" fill=\"currentColor\"/><path d=\"M12.3505 11.4327L13.7647 12.8469L12.8449 13.7667L11.4307 12.3525L12.3505 11.4327Z\" fill=\"currentColor\"/><path d=\"M2.24537 12.8469L3.65958 11.4327L4.57937 12.3525L3.16516 13.7667L2.24537 12.8469Z\" fill=\"currentColor\"/><path d=\"M11.4377 3.65455L12.852 2.24033L13.7718 3.16012L12.3575 4.57434L11.4377 3.65455Z\" fill=\"currentColor\"/><path d=\"M0.5 7.35461H2.5V8.6554H0.5L0.5 7.35461Z\" fill=\"currentColor\"/><path d=\"M13.5 7.35461H15.5V8.6554H13.5V8.6554Z\" fill=\"currentColor\"/>";
		function SunIcon({ size = 16, className }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				className,
				viewBox: "0 0 16 16",
				fill: "none",
				xmlns: "http://www.w3.org/2000/svg",
				dangerouslySetInnerHTML: { __html: SUN_PATHS }
			});
		}
		function Glyph({ children, size = 16, className }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				className,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.5,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				children
			});
		}
		const DropletIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Glyph, {
			size,
			className,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 1.9c2.4 2.8 4.3 5 4.3 7.1a4.3 4.3 0 1 1-8.6 0C3.7 6.9 5.6 4.7 8 1.9z" })
		});
		const LayersIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Glyph, {
			size,
			className,
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 2.2 13.2 5 8 7.8 2.8 5 8 2.2z" }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M2.8 8.2 8 11l5.2-2.8" }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M2.8 11.2 8 14l5.2-2.8" })
			]
		});
		const PhotoIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Glyph, {
			size,
			className,
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "2",
					y: "3.2",
					width: "12",
					height: "9.6",
					rx: "2"
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: "5.7",
					cy: "6.3",
					r: "0.9"
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M14 10.4l-2.8-2.8-4.8 4.8" })
			]
		});
		const VideoIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Glyph, {
			size,
			className,
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
				x: "1.5",
				y: "4.2",
				width: "8.8",
				height: "7.6",
				rx: "2"
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M10.3 6.9l4.2-2.4v7l-4.2-2.4" })]
		});
		const TextIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Glyph, {
			size,
			className,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 4.2h10M3 8h10M3 11.8h6.5" })
		});
		const TrajectoryIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Glyph, {
			size,
			className,
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M2.5 3.2h11M2.5 6.6h11M2.5 10h11" }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: "4.4",
					cy: "3.2",
					r: "1.1"
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: "8",
					cy: "6.6",
					r: "1.1"
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: "11.4",
					cy: "10",
					r: "1.1"
				})
			]
		});
		const SlidersIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Glyph, {
			size,
			className,
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M2.5 4.5h4.9M11.6 4.5h1.9M2.5 11.5h1.9M8.6 11.5h4.9" }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: "9.5",
					cy: "4.5",
					r: "1.7"
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: "5.5",
					cy: "11.5",
					r: "1.7"
				})
			]
		});
		const SparkleIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Glyph, {
			size,
			className,
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M7.2 1.8l1.2 3.1 3.1 1.2-3.1 1.2-1.2 3.1-1.2-3.1L2.9 6.1 6 4.9l1.2-3.1z" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 10.5l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5.5-1.2z" })]
		});
		const RefreshIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Glyph, {
			size,
			className,
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13.2 8A5.2 5.2 0 1 1 11.5 4.2" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13.4 1.8v2.9h-2.9" })]
		});
		const DownloadIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Glyph, {
			size,
			className,
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 2.2v8" }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4.6 7l3.4 3.4L11.4 7" }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M2.8 13.8h10.4" })
			]
		});
		const UploadIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Glyph, {
			size,
			className,
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 10.4V2.6" }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4.6 5.8L8 2.4l3.4 3.4" }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M2.8 13.8h10.4" })
			]
		});
		const LockIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Glyph, {
			size,
			className,
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
				x: "3.6",
				y: "7.2",
				width: "8.8",
				height: "6",
				rx: "1.4"
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5.6 7.2V5.4a2.4 2.4 0 0 1 4.8 0v1.8" })]
		});
		const TrashIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Glyph, {
			size,
			className,
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M2.8 4.4h10.4" }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M6.4 4.4V2.9h3.2v1.5" }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4.4 4.4l.5 8.6h6.2l.5-8.6" })
			]
		});
		const EditIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Glyph, {
			size,
			className,
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M9.5 4l2.5 2.5" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 13l.8-3L10 3.8 12.2 6 6 12.2 3 13z" })]
		});
		const PipetteIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Glyph, {
			size,
			className,
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
				cx: "8",
				cy: "8",
				r: "4.2"
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 1.6v2.6M8 11.8v2.6M1.6 8h2.6M11.8 8h2.6" })]
		});
		const CheckIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Glyph, {
			size,
			className,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3.2 8.6l3 3L12.8 5" })
		});
		const AlertIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Glyph, {
			size,
			className,
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 2.6l5.4 9.8H2.6L8 2.6z" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 6.8v2.4M8 11.4v.01" })]
		});
		const CanvasIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Glyph, {
			size,
			className,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
				x: "2.2",
				y: "2.2",
				width: "11.6",
				height: "11.6",
				rx: "2"
			})
		});
		const SidebarIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Glyph, {
			size,
			className,
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
				x: "2.2",
				y: "2.2",
				width: "11.6",
				height: "11.6",
				rx: "2"
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M6.6 2.2v11.6" })]
		});
		const ChatIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Glyph, {
			size,
			className,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13.4 4.4v4.4a2 2 0 0 1-2 2H6.2l-3.6 3V4.4a2 2 0 0 1 2-2h6.8a2 2 0 0 1 2 2z" })
		});
		const GearIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Glyph, {
			size,
			className,
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
				cx: "8",
				cy: "8",
				r: "2.1"
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 1.7v1.8M8 12.5v1.8M1.7 8h1.8M12.5 8h1.8M3.6 3.6l1.3 1.3M11.1 11.1l1.3 1.3M12.4 3.6l-1.3 1.3M4.9 11.1l-1.3 1.3" })]
		});
		const InputIcon = ({ size, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Glyph, {
			size,
			className,
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
				x: "2.2",
				y: "4",
				width: "11.6",
				height: "8",
				rx: "2"
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 6.6v2M7 8h2" })]
		});
		//#endregion
		//#region src/client/components/ErrorBoundary.tsx
		/**
		* Catches render errors from the theme section subtree (wheel, sliders, editor)
		* so a single bad state can never take down the whole settings panel. Shows a
		* compact fallback with a reset button; the reset re-renders the section with
		* the current saved config, which is enough to recover from most transient
		* failures (corrupt transient UI state, stale image decode, etc.).
		*/
		var ErrorBoundary = class extends react.Component {
			state = { error: null };
			static getDerivedStateFromError(error) {
				return { error };
			}
			componentDidCatch(error, info) {
				console.error("dsh-any-background: section render crashed", error, info.componentStack);
			}
			reset = () => {
				this.setState({ error: null });
				this.props.onReset?.();
			};
			render() {
				if (this.state.error) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dab-crash",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dab-crash-title",
							children: this.props.t("crashTitle")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dab-crash-desc",
							children: this.props.t("crashDesc")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dab-btn",
							onClick: this.reset,
							children: this.props.t("crashReset")
						})
					]
				});
				return this.props.children;
			}
		};
		//#endregion
		//#region src/client/components/Portal.tsx
		/**
		* Render children into a fixed root attached to document.documentElement.
		*
		* The host's sidebar is often implemented by translating the body or a wrapper
		* (margin-left / transform). A fixed element portaled to body would still be
		* captured by that transformed ancestor and shift with the sidebar. Attaching
		* the portal root directly to <html> escapes body-level transforms so the
		* overlay is always painted relative to the viewport and centered correctly.
		*/
		function Portal({ children }) {
			const [target, setTarget] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				const el = document.createElement("div");
				el.dataset.dabPortal = "1";
				el.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:999999";
				document.documentElement.appendChild(el);
				setTarget(el);
				return () => {
					el.remove();
				};
			}, []);
			return target ? (0, react_dom.createPortal)(children, target) : null;
		}
		//#endregion
		//#region src/client/components/ColorWheel.tsx
		const WHEEL_SIZE = 220;
		const CX = WHEEL_SIZE / 2;
		const RING_OUTER = 106;
		const RING_INNER = 82;
		const SQ_HALF = RING_INNER / Math.SQRT2;
		/** Static hue ring cached once across all wheels. */
		let ringCache = null;
		function getRingCache() {
			if (ringCache) return ringCache;
			const cvs = document.createElement("canvas");
			cvs.width = WHEEL_SIZE;
			cvs.height = WHEEL_SIZE;
			const c = cvs.getContext("2d");
			const g = c.createConicGradient(0, CX, CX);
			for (let i = 0; i <= 360; i++) g.addColorStop(i / 360, `hsl(${i},100%,50%)`);
			c.beginPath();
			c.arc(CX, CX, RING_OUTER, 0, Math.PI * 2);
			c.arc(CX, CX, RING_INNER, 0, Math.PI * 2, true);
			c.fillStyle = g;
			c.fill();
			ringCache = cvs;
			return ringCache;
		}
		function drawMarkers(ctx, hue, sat, lit) {
			const hRad = hue * Math.PI / 180;
			const hR = 94;
			const hmx = CX + Math.cos(hRad) * hR;
			const hmy = CX + Math.sin(hRad) * hR;
			ctx.beginPath();
			ctx.arc(hmx, hmy, 8, 0, Math.PI * 2);
			ctx.fillStyle = "rgba(0,0,0,0.25)";
			ctx.fill();
			ctx.beginPath();
			ctx.arc(hmx, hmy, 6.5, 0, Math.PI * 2);
			ctx.strokeStyle = "#fff";
			ctx.lineWidth = 2;
			ctx.stroke();
			const gx = CX - SQ_HALF, gy = CX - SQ_HALF, sz = SQ_HALF * 2;
			const smx = gx + sat * sz;
			const smy = gy + (1 - lit) * sz;
			ctx.beginPath();
			ctx.arc(smx, smy, 7, 0, Math.PI * 2);
			ctx.fillStyle = "rgba(0,0,0,0.25)";
			ctx.fill();
			ctx.beginPath();
			ctx.arc(smx, smy, 5.5, 0, Math.PI * 2);
			ctx.strokeStyle = "#fff";
			ctx.lineWidth = 2;
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(smx, smy, 3.5, 0, Math.PI * 2);
			ctx.strokeStyle = "#000";
			ctx.lineWidth = 1;
			ctx.stroke();
		}
		function drawSquare(c, hue) {
			const gx = CX - SQ_HALF, gy = CX - SQ_HALF, sz = SQ_HALF * 2;
			c.clearRect(gx - 1, gy - 1, sz + 2, sz + 2);
			c.fillStyle = "#fff";
			c.fillRect(gx, gy, sz, sz);
			const gh = c.createLinearGradient(gx, 0, gx + sz, 0);
			gh.addColorStop(0, "rgba(255,255,255,1)");
			gh.addColorStop(1, `hsl(${hue},100%,50%)`);
			c.fillStyle = gh;
			c.fillRect(gx, gy, sz, sz);
			const gv = c.createLinearGradient(0, gy, 0, gy + sz);
			gv.addColorStop(0, "rgba(0,0,0,0)");
			gv.addColorStop(1, "rgba(0,0,0,1)");
			c.fillStyle = gv;
			c.fillRect(gx, gy, sz, sz);
		}
		function hitTest(x, y) {
			if (Math.abs(x - CX) <= SQ_HALF && Math.abs(y - CX) <= SQ_HALF) return "square";
			const dx = x - CX, dy = y - CX;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist >= 78 && dist <= 110) return "ring";
			return null;
		}
		function pickHue(x, y) {
			let angle = Math.atan2(y - CX, x - CX) * 180 / Math.PI;
			if (angle < 0) angle += 360;
			return angle;
		}
		function pickSL(x, y) {
			const gx = CX - SQ_HALF, gy = CX - SQ_HALF, sz = SQ_HALF * 2;
			return [Math.max(0, Math.min(1, (x - gx) / sz)), Math.max(.02, Math.min(.98, 1 - (y - gy) / sz))];
		}
		const ColorWheel = (0, react.memo)(function ColorWheel({ hue, sat, lit, onChange }) {
			const cvsRef = (0, react.useRef)(null);
			const [col, setCol] = (0, react.useState)({
				hue,
				sat,
				lit
			});
			const colRef = (0, react.useRef)(col);
			colRef.current = col;
			(0, react.useEffect)(() => {
				setCol((c) => c.hue === hue && c.sat === sat && c.lit === lit ? c : {
					hue,
					sat,
					lit
				});
			}, [
				hue,
				sat,
				lit
			]);
			(0, react.useEffect)(() => {
				const cvs = cvsRef.current;
				if (!cvs) return;
				const ctx = cvs.getContext("2d");
				ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);
				drawSquare(ctx, col.hue);
				ctx.drawImage(getRingCache(), 0, 0);
				drawMarkers(ctx, col.hue, col.sat, col.lit);
			}, [col]);
			const pendingRef = (0, react.useRef)(null);
			const rafRef = (0, react.useRef)(null);
			const flushPending = (0, react.useCallback)(() => {
				rafRef.current = null;
				const p = pendingRef.current;
				if (!p) return;
				pendingRef.current = null;
				setCol({
					hue: p.h,
					sat: p.s,
					lit: p.l
				});
				onChange(p.h, p.s, p.l);
			}, [onChange]);
			const schedule = (0, react.useCallback)((h, s, l) => {
				pendingRef.current = {
					h,
					s,
					l
				};
				if (rafRef.current === null) rafRef.current = requestAnimationFrame(flushPending);
			}, [flushPending]);
			const onDown = (0, react.useCallback)((e) => {
				const r = cvsRef.current.getBoundingClientRect();
				const x = e.clientX - r.left, y = e.clientY - r.top;
				const region = hitTest(x, y);
				if (!region) return;
				if (region === "ring") schedule(pickHue(x, y), colRef.current.sat, colRef.current.lit);
				else {
					const [s, l] = pickSL(x, y);
					schedule(colRef.current.hue, s, l);
				}
				const onMove = (ev) => {
					const rr = cvsRef.current.getBoundingClientRect();
					const mx = ev.clientX - rr.left, my = ev.clientY - rr.top;
					if (region === "ring") {
						const d = Math.sqrt((mx - CX) ** 2 + (my - CX) ** 2);
						if (d >= 72 && d <= 116) schedule(pickHue(mx, my), colRef.current.sat, colRef.current.lit);
					} else {
						const [s, l] = pickSL(mx, my);
						schedule(colRef.current.hue, s, l);
					}
				};
				const onUp = () => {
					document.removeEventListener("mousemove", onMove);
					document.removeEventListener("mouseup", onUp);
				};
				document.addEventListener("mousemove", onMove);
				document.addEventListener("mouseup", onUp);
			}, [schedule]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("canvas", {
				ref: cvsRef,
				width: WHEEL_SIZE,
				height: WHEEL_SIZE,
				className: "dab-wheel",
				onMouseDown: onDown
			});
		});
		//#endregion
		//#region src/client/components/ColorInputs.tsx
		const SEG_W$1 = 66;
		function clamp(v, min, max) {
			return Math.min(max, Math.max(min, v));
		}
		/**
		* A single numeric field that edits one color channel. Keeps its own text
		* while focused so typing never gets clobbered by the parent re-rendering the
		* canonical value; commits every valid keystroke live and re-normalizes on
		* blur. The value prop only pushes back in when the field is not focused
		* (wheel drags, wallpaper extraction, mode switches).
		*/
		function NumField({ label, value, min, max, step, onChange }) {
			const [text, setText] = (0, react.useState)(String(value));
			const focused = (0, react.useRef)(false);
			(0, react.useEffect)(() => {
				if (!focused.current) setText(String(value));
			}, [value]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: "dab-field",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dab-field-label",
					children: label
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					type: "number",
					min,
					max,
					step,
					value: text,
					className: "dab-num",
					onFocus: () => {
						focused.current = true;
					},
					onBlur: () => {
						focused.current = false;
						setText(String(value));
					},
					onChange: (e) => {
						setText(e.target.value);
						const v = Number(e.target.value);
						if (Number.isFinite(v)) onChange(clamp(v, min, max));
					}
				})]
			});
		}
		/**
		* Precise color entry next to the wheel: a HSL/RGB segmented toggle plus three
		* numeric channel fields and a live swatch. The wheel is HSV end-to-end, so
		* this panel converts at the boundary — HSL fields map straight onto the
		* stored HSL, RGB fields round-trip through rgbToHsl — and both emit HSV via
		* the same onChange the wheel uses, keeping one canonical color.
		*/
		function ColorInputs({ hue, sat, lit, onChange }) {
			const [mode, setMode] = (0, react.useState)("hsl");
			const [h, s, l] = hsvToHsl(hue, sat, lit);
			const [r, g, b] = hslToRgb(h, s, l);
			const setHsl = (nh, ns, nl) => onChange(...hslToHsv(nh, ns, nl));
			const setRgb = (nr, ng, nb) => {
				const [nh, ns, nl] = rgbToHsl(nr, ng, nb);
				onChange(...hslToHsv(nh, ns, nl));
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dab-inputs",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dab-seg",
						style: { "--w": `${SEG_W$1}px` },
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dab-seg-thumb",
								style: { transform: `translateX(${mode === "hsl" ? 0 : SEG_W$1}px)` }
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: `dab-seg-item${mode === "hsl" ? " is-active" : ""}`,
								onClick: () => setMode("hsl"),
								children: "HSL"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: `dab-seg-item${mode === "rgb" ? " is-active" : ""}`,
								onClick: () => setMode("rgb"),
								children: "RGB"
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							display: "flex",
							flexDirection: "column",
							gap: 7
						},
						children: mode === "hsl" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumField, {
								label: "H",
								value: Math.round(h),
								min: 0,
								max: 360,
								step: 1,
								onChange: (v) => setHsl(v, s, l)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumField, {
								label: "S",
								value: Math.round(s * 100),
								min: 0,
								max: 100,
								step: 1,
								onChange: (v) => setHsl(h, v / 100, l)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumField, {
								label: "L",
								value: Math.round(l * 100),
								min: 0,
								max: 100,
								step: 1,
								onChange: (v) => setHsl(h, s, v / 100)
							})
						] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumField, {
								label: "R",
								value: r,
								min: 0,
								max: 255,
								step: 1,
								onChange: (v) => setRgb(v, g, b)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumField, {
								label: "G",
								value: g,
								min: 0,
								max: 255,
								step: 1,
								onChange: (v) => setRgb(r, v, b)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumField, {
								label: "B",
								value: b,
								min: 0,
								max: 255,
								step: 1,
								onChange: (v) => setRgb(r, g, v)
							})
						] })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dab-swatch-lg",
						style: { background: `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)` }
					})
				]
			});
		}
		//#endregion
		//#region src/client/components/ColorPicker.tsx
		const MAG_SIZE = 96;
		const MAG_ZOOM = 8;
		function toHex$1(rgb) {
			return "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
		}
		/**
		* Eyedropper modal: shows the wallpaper full-bleed (no drag/zoom) and lets the
		* user click any pixel to adopt it as the theme color. A magnifier circle
		* follows the cursor so small details can be picked precisely. The wallpaper
		* is a data URL, so sampling is CORS-free: draw it once to an offscreen-sized
		* canvas and read pixels via getImageData.
		*/
		function ColorPicker({ url, t, onPick, onClose }) {
			const canvasRef = (0, react.useRef)(null);
			const magRef = (0, react.useRef)(null);
			const imgRef = (0, react.useRef)(null);
			const [ready, setReady] = (0, react.useState)(false);
			const [hover, setHover] = (0, react.useState)(null);
			const [mag, setMag] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				const img = new Image();
				img.onload = () => {
					imgRef.current = img;
					setReady(true);
				};
				img.src = url;
			}, [url]);
			(0, react.useEffect)(() => {
				if (!ready || !canvasRef.current || !imgRef.current) return;
				const canvas = canvasRef.current;
				canvas.width = imgRef.current.naturalWidth;
				canvas.height = imgRef.current.naturalHeight;
				const ctx = canvas.getContext("2d");
				if (ctx) ctx.drawImage(imgRef.current, 0, 0);
			}, [ready]);
			const sampleAt = (0, react.useCallback)((clientX, clientY) => {
				const canvas = canvasRef.current;
				if (!canvas) return null;
				const rect = canvas.getBoundingClientRect();
				if (rect.width === 0 || rect.height === 0) return null;
				const ctx = canvas.getContext("2d");
				if (!ctx) return null;
				const sx = Math.round((clientX - rect.left) * (canvas.width / rect.width));
				const sy = Math.round((clientY - rect.top) * (canvas.height / rect.height));
				if (sx < 0 || sy < 0 || sx >= canvas.width || sy >= canvas.height) return null;
				const d = ctx.getImageData(sx, sy, 1, 1).data;
				return {
					sx,
					sy,
					rgb: [
						d[0],
						d[1],
						d[2]
					]
				};
			}, []);
			const drawMagnifier = (0, react.useCallback)((sx, sy) => {
				const mag = magRef.current;
				const src = canvasRef.current;
				if (!mag || !src) return;
				const ctx = mag.getContext("2d");
				if (!ctx) return;
				const half = MAG_SIZE / MAG_ZOOM / 2;
				ctx.clearRect(0, 0, MAG_SIZE, MAG_SIZE);
				ctx.drawImage(src, sx - half, sy - half, 12, 12, 0, 0, MAG_SIZE, MAG_SIZE);
				ctx.strokeStyle = "rgba(255,255,255,0.85)";
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(MAG_SIZE / 2, 0);
				ctx.lineTo(MAG_SIZE / 2, MAG_SIZE);
				ctx.moveTo(0, MAG_SIZE / 2);
				ctx.lineTo(MAG_SIZE, MAG_SIZE / 2);
				ctx.stroke();
			}, []);
			const onMove = (e) => {
				const s = sampleAt(e.clientX, e.clientY);
				if (!s) {
					setHover(null);
					setMag(null);
					return;
				}
				setHover({ rgb: s.rgb });
				drawMagnifier(s.sx, s.sy);
				const off = 28;
				let x = e.clientX + off;
				let y = e.clientY + off;
				if (x + MAG_SIZE > window.innerWidth) x = e.clientX - off - MAG_SIZE;
				if (y + MAG_SIZE > window.innerHeight) y = e.clientY - off - MAG_SIZE;
				setMag({
					x,
					y
				});
			};
			const onClick = (e) => {
				const s = sampleAt(e.clientX, e.clientY);
				if (!s) return;
				const [h, sl, l] = rgbToHsl(s.rgb[0], s.rgb[1], s.rgb[2]);
				onPick(hslToHsv(h, sl, l));
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dab-overlay",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dab-overlay-title",
						children: t("pickerTitle")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dab-overlay-hint",
						children: t("pickerHint")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dab-modal-card",
						style: {
							maxWidth: "min(90vw, 720px)",
							maxHeight: "60vh",
							overflow: "hidden",
							borderRadius: 12,
							border: "2px solid rgba(255,255,255,0.3)",
							background: "#000",
							cursor: "crosshair"
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("canvas", {
							ref: canvasRef,
							style: {
								display: "block",
								maxWidth: "100%",
								maxHeight: "60vh",
								objectFit: "contain"
							},
							onMouseMove: onMove,
							onMouseLeave: () => {
								setHover(null);
								setMag(null);
							},
							onClick
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 10,
							minWidth: 260
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: {
							width: 28,
							height: 28,
							borderRadius: 8,
							border: "1px solid rgba(255,255,255,0.4)",
							background: hover ? toHex$1(hover.rgb) : "transparent"
						} }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								color: "#fff",
								fontSize: 13,
								fontFamily: "var(--dab-mono, monospace)"
							},
							children: hover ? `${toHex$1(hover.rgb)} · rgb(${hover.rgb.join(", ")})` : "—"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							display: "flex",
							gap: 10
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dab-btn",
							onClick: onClose,
							children: t("pickerClose")
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("canvas", {
						ref: magRef,
						width: MAG_SIZE,
						height: MAG_SIZE,
						style: {
							position: "fixed",
							width: MAG_SIZE,
							height: MAG_SIZE,
							borderRadius: "50%",
							border: "2px solid rgba(255,255,255,0.7)",
							boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
							zIndex: 1e4,
							background: "#000",
							pointerEvents: "none",
							transition: "opacity 0.08s",
							left: mag?.x ?? 0,
							top: mag?.y ?? 0,
							opacity: mag ? 1 : 0
						}
					})
				]
			}) });
		}
		//#endregion
		//#region src/client/components/pages/ColorPage.tsx
		/** Curated quick-pick hues (HSL, s .72 l .55). */
		const SWATCHES = [
			[
				356,
				.72,
				.55
			],
			[
				24,
				.78,
				.55
			],
			[
				44,
				.8,
				.55
			],
			[
				152,
				.62,
				.5
			],
			[
				174,
				.68,
				.48
			],
			[
				208,
				.72,
				.55
			],
			[
				252,
				.68,
				.6
			],
			[
				300,
				.64,
				.58
			]
		];
		function toHex(rgb) {
			return "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
		}
		function ColorPage({ p, notify }) {
			const { t, hue, sat, lit, setColor, extractColor, useStore } = p;
			const store = useStore((s) => s);
			const storeUrl = store.url;
			const [pickerOpen, setPickerOpen] = (0, react.useState)(false);
			const [extracting, setExtracting] = (0, react.useState)(false);
			const wheel = store.color ?? [
				hue,
				sat,
				lit
			];
			const [h, s, l] = hsvToHsl(wheel[0], wheel[1], wheel[2]);
			const [r, g, b] = hslToRgb(h, s, l);
			const hex = toHex([
				r,
				g,
				b
			]);
			const orbVars = {
				"--c": hex,
				"--c-soft": `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.5)`
			};
			const onExtract = async () => {
				if (!storeUrl || extracting) return;
				setExtracting(true);
				try {
					const ok = await extractColor();
					notify(ok ? t("extractDone") : t("extractFail"), ok);
				} catch {
					notify(t("extractFail"), false);
				} finally {
					setExtracting(false);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
					className: "dab-head dab-rise",
					style: { "--d": 0 },
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dab-overline",
							children: "Accent"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
							className: "dab-h1",
							children: t("colorTitle")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "dab-desc",
							children: t("descColor")
						})
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: "dab-card dab-card-hover dab-hero-accent dab-rise",
					style: { "--d": 1 },
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dab-orb-wrap",
						style: orbVars,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dab-orb-ring" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dab-orb" })]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							flex: 1,
							minWidth: 200
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dab-hex-caption",
								children: t("hexCaption")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dab-hex",
								children: hex.toUpperCase()
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dab-hsl-row",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["H ", /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("b", { children: [Math.round(h), "°"] })] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["S ", /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("b", { children: [Math.round(s * 100), "%"] })] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["L ", /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("b", { children: [Math.round(l * 100), "%"] })] })
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dab-chip-row",
								style: { marginTop: 14 },
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "dab-btn",
									disabled: !storeUrl || extracting,
									onClick: onExtract,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SparkleIcon, { size: 14 }), extracting ? t("extracting") : t("extractColor")]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "dab-btn",
									disabled: !storeUrl,
									onClick: () => setPickerOpen(true),
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(PipetteIcon, { size: 14 }), t("eyedropper")]
								})]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: "dab-card dab-wheel-card dab-rise",
					style: { "--d": 2 },
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dab-wheel-glow",
							style: { background: hex }
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ColorWheel, {
							hue: wheel[0],
							sat: wheel[1],
							lit: wheel[2],
							onChange: setColor
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ColorInputs, {
							hue: wheel[0],
							sat: wheel[1],
							lit: wheel[2],
							onChange: setColor
						})
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "dab-hint dab-rise",
					style: { "--d": 3 },
					children: t("colorHint")
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: "dab-card dab-card-hover dab-rise",
					style: { "--d": 3 },
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dab-swatch-title",
						children: t("swatchTitle")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dab-swatches",
						children: SWATCHES.map(([sh, ss, sl], i) => {
							const on = Math.abs((wheel[0] - sh + 540) % 360 - 180) < 3 && Math.abs(s - ss) < .05 && Math.abs(l - sl) < .05;
							return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: `dab-swatch${on ? " is-on" : ""}`,
								style: { background: `hsl(${sh} ${Math.round(ss * 100)}% ${Math.round(sl * 100)}%)` },
								title: toHex(hslToRgb(sh, ss, sl)).toUpperCase(),
								onClick: () => setColor(...hslToHsv(sh, ss, sl))
							}, i);
						})
					})]
				}),
				pickerOpen && storeUrl ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ColorPicker, {
					url: storeUrl,
					t,
					onClose: () => setPickerOpen(false),
					onPick: (hsv) => {
						setColor(hsv[0], hsv[1], hsv[2]);
						setPickerOpen(false);
					}
				}) : null
			] });
		}
		//#endregion
		//#region src/client/components/LiveSlider.tsx
		/**
		* Zero-lag slider: the thumb and value label update through DOM refs while
		* dragging (onInput) so the caller can mutate the live UI directly without a
		* React re-render; onChange commits the settled value. Double-click resets to
		* the canonical default. The track fill is a gradient driven by the --pct
		* custom property, updated imperatively alongside the thumb.
		*/
		function LiveSlider({ min, max, step, def, fmt, label, onInput, onChange }) {
			const inputRef = (0, react.useRef)(null);
			const valRef = (0, react.useRef)(null);
			const paint = (el, v) => {
				el.style.setProperty("--pct", String((v - min) / (max - min) * 100));
			};
			(0, react.useEffect)(() => {
				if (inputRef.current) {
					inputRef.current.value = String(def);
					paint(inputRef.current, def);
				}
				if (valRef.current) valRef.current.textContent = fmt(def);
			}, [
				def,
				fmt,
				min,
				max
			]);
			const apply = (v) => {
				if (inputRef.current) {
					inputRef.current.value = String(v);
					paint(inputRef.current, v);
				}
				if (valRef.current) valRef.current.textContent = fmt(v);
				onInput?.(v);
				onChange(v);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dab-slider-block",
				children: [label ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dab-slider-label",
					children: label
				}) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 10
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						ref: inputRef,
						type: "range",
						className: "dab-slider",
						style: { "--pct": (def - min) / (max - min) * 100 },
						min,
						max,
						step,
						defaultValue: def,
						title: label ? `${label} · ${fmt(def)}` : fmt(def),
						onDoubleClick: () => apply(def),
						onInput: (e) => {
							const el = e.target;
							const v = Number(el.value);
							paint(el, v);
							onInput?.(v);
							if (valRef.current) valRef.current.textContent = fmt(v);
						},
						onChange: (e) => onChange(Number(e.target.value))
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						ref: valRef,
						className: "dab-slider-val",
						children: fmt(def)
					})]
				})]
			});
		}
		//#endregion
		//#region src/client/components/pages/InterfacePage.tsx
		const PARTS = [
			{
				opKey: "bg",
				labelKey: "uiOpacityBg",
				Icon: CanvasIcon
			},
			{
				opKey: "sidebar",
				labelKey: "uiOpacitySide",
				Icon: SidebarIcon
			},
			{
				opKey: "card",
				labelKey: "uiOpacityCard",
				Icon: ChatIcon
			},
			{
				opKey: "input",
				labelKey: "uiOpacityInput",
				Icon: InputIcon
			},
			{
				isSettings: true,
				labelKey: "uiSop",
				Icon: GearIcon
			},
			{
				isChat: true,
				labelKey: "uiChatRegion",
				Icon: TextIcon
			},
			{
				isTrajectory: true,
				labelKey: "uiTrajectory",
				Icon: TrajectoryIcon
			}
		];
		function InterfacePage({ p }) {
			const { t, setOps, setBlurs, setSop } = p;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
				className: "dab-head dab-rise",
				style: { "--d": 0 },
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dab-overline",
						children: "Surfaces"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: "dab-h1",
						children: t("uiTitle")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "dab-desc",
						children: t("descInterface")
					})
				]
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dab-grid-parts",
				children: PARTS.map((part, i) => {
					const { labelKey, Icon, isSettings, isChat, isTrajectory } = part;
					const opKey = part.opKey;
					const blurKey = isChat ? "chat" : isTrajectory ? "trajectory" : isSettings ? "settings" : opKey;
					const opacity = isChat ? rChatTextOpacity() : isTrajectory ? rTrajectoryOpacity() : isSettings ? rSop() : rOps()[opKey];
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dab-card dab-card-hover dab-rise",
						style: { "--d": i + 1 },
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dab-part-head",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dab-part-ico",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Icon, { size: 16 })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dab-part-name",
										children: t(labelKey)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "dab-part-badge",
										children: [Math.round(opacity * 100), "%"]
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
								label: t("uiOpacity"),
								min: 0,
								max: 100,
								step: 1,
								def: Math.round(opacity * 100),
								fmt: (v) => `${v}%`,
								onInput: (v) => {
									const op = v / 100;
									if (isChat) {
										cfg.chatTextOpacity = op;
										applyViewCards();
									} else if (isTrajectory) {
										cfg.trajectoryOpacity = op;
										applyTrajectoryOverrides(op);
									} else if (isSettings) {
										cfg.settingsOpacity = op;
										applySettingsOverrides(op);
									} else {
										const ops = { ...rOps() };
										ops[opKey] = op;
										cfg.opacities = ops;
										applyCustomTokens(ops);
									}
									saveConfig();
								},
								onChange: (v) => {
									const op = v / 100;
									if (isChat) {
										cfg.chatTextOpacity = op;
										applyViewCards();
										saveConfig();
									} else if (isTrajectory) {
										cfg.trajectoryOpacity = op;
										applyTrajectoryOverrides(op);
										saveConfig();
									} else if (isSettings) setSop(op);
									else {
										const ops = { ...rOps() };
										ops[opKey] = op;
										setOps(ops);
									}
								}
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
								label: t("uiBlur"),
								min: 0,
								max: 60,
								step: 1,
								def: rBlurs()[blurKey],
								fmt: (v) => `${v}px`,
								onInput: (v) => {
									const blurs = { ...rBlurs() };
									blurs[blurKey] = v;
									cfg.blurs = blurs;
									setPartBlur(blurKey, v);
									saveConfig();
								},
								onChange: (v) => {
									const blurs = { ...rBlurs() };
									blurs[blurKey] = v;
									setBlurs(blurs);
								}
							})
						]
					}, blurKey);
				})
			})] });
		}
		//#endregion
		//#region src/client/utils/image.ts
		/**
		* Read a chosen image file as a data URL WITHOUT re-encoding: the original
		* pixels are kept as-is (no canvas downscale / JPEG re-compression), so the
		* wallpaper is stored and displayed at full fidelity. The tradeoff is a larger
		* payload over the RPC channel and on disk for big images.
		*/
		function readImg(file, cb) {
			const r = new FileReader();
			r.onerror = () => cb(null);
			r.onload = () => cb(r.result);
			r.readAsDataURL(file);
		}
		//#endregion
		//#region src/client/components/BgEditor.tsx
		/** Placement slot for the active background type: video framing lives in its
		*  own state so image and video edits never overwrite each other. */
		const activeState = () => cfg.backgroundType === "video" ? cfg.videoBgState : cfg.bgState;
		function BgEditor({ url, t, onClose, onCommit }) {
			const pw = Math.min(window.innerWidth * .75, 860);
			const ph = Math.round(pw * window.innerHeight / window.innerWidth);
			const saved = activeState();
			const [zoom, setZoom] = (0, react.useState)(saved.iw > 0 ? saved.zoom : 1);
			const [pos, setPos] = (0, react.useState)(saved.iw > 0 ? {
				x: saved.x * pw,
				y: saved.y * ph
			} : {
				x: 0,
				y: 0
			});
			const [imgSize, setImgSize] = (0, react.useState)({
				w: 0,
				h: 0
			});
			const containerRef = (0, react.useRef)(null);
			const imgRef = (0, react.useRef)(null);
			const dragRef = (0, react.useRef)({
				active: false,
				sx: 0,
				sy: 0,
				spx: 0,
				spy: 0
			});
			(0, react.useEffect)(() => {
				const img = new Image();
				img.onload = () => {
					const scale = Math.min(pw / img.width, ph / img.height);
					const w = img.width * scale, h = img.height * scale;
					setImgSize({
						w,
						h
					});
					const s = activeState();
					if (s.iw > 0 && s.iw === img.width && s.ih === img.height) {
						setZoom(s.zoom);
						setPos({
							x: s.x * pw - w * s.zoom / 2,
							y: s.y * ph - h * s.zoom / 2
						});
					} else {
						setZoom(1);
						setPos({
							x: (pw - w) / 2,
							y: (ph - h) / 2
						});
					}
				};
				img.src = url;
			}, [
				url,
				pw,
				ph
			]);
			const onDown = (0, react.useCallback)((e) => {
				e.preventDefault();
				dragRef.current = {
					active: true,
					sx: e.clientX,
					sy: e.clientY,
					spx: pos.x,
					spy: pos.y
				};
				const onMove = (ev) => {
					if (!dragRef.current.active) return;
					setPos({
						x: dragRef.current.spx + ev.clientX - dragRef.current.sx,
						y: dragRef.current.spy + ev.clientY - dragRef.current.sy
					});
				};
				const onUp = () => {
					dragRef.current.active = false;
					document.removeEventListener("mousemove", onMove);
					document.removeEventListener("mouseup", onUp);
				};
				document.addEventListener("mousemove", onMove);
				document.addEventListener("mouseup", onUp);
			}, [pos]);
			const onWheelCb = (0, react.useCallback)((e) => {
				e.preventDefault();
				const el = containerRef.current;
				if (!el) return;
				const rect = el.getBoundingClientRect();
				const mx = rect.width / 2, my = rect.height / 2;
				const factor = e.deltaY > 0 ? .97 : 1.03;
				const nz = Math.max(.1, Math.min(10, zoom * factor));
				const nx = mx - (mx - pos.x) * (nz / zoom);
				const ny = my - (my - pos.y) * (nz / zoom);
				setZoom(nz);
				setPos({
					x: nx,
					y: ny
				});
			}, [zoom, pos]);
			(0, react.useEffect)(() => {
				const el = containerRef.current;
				if (!el) return;
				el.addEventListener("wheel", onWheelCb, { passive: false });
				return () => el.removeEventListener("wheel", onWheelCb);
			}, [onWheelCb]);
			const resetView = (0, react.useCallback)(() => {
				if (imgSize.w === 0) return;
				setZoom(1);
				setPos({
					x: (pw - imgSize.w) / 2,
					y: (ph - imgSize.h) / 2
				});
			}, [
				pw,
				ph,
				imgSize
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dab-overlay",
				onClick: (e) => {
					if (e.target === e.currentTarget) onClose();
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dab-overlay-title",
						children: t("editorTitle")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						ref: containerRef,
						className: "dab-modal-card",
						style: {
							position: "relative",
							overflow: "hidden",
							border: "2px solid rgba(255,255,255,0.3)",
							borderRadius: 12,
							background: "#000",
							cursor: "grab",
							width: pw,
							height: ph
						},
						onMouseDown: onDown,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
							ref: imgRef,
							src: url,
							alt: "",
							draggable: false,
							style: {
								position: "absolute",
								transformOrigin: "0 0",
								pointerEvents: "none",
								width: imgSize.w,
								height: imgSize.h,
								transform: `translate(${pos.x}px,${pos.y}px) scale(${zoom})`
							}
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dab-overlay-hint",
						children: t("editorHint")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: 10
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dab-btn",
								onClick: resetView,
								children: t("editorReset")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dab-btn",
								onClick: onClose,
								children: t("editorCancel")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dab-btn dab-btn-primary",
								onClick: () => onCommit(zoom, (pos.x + imgSize.w * zoom / 2) / pw, (pos.y + imgSize.h * zoom / 2) / ph, imgRef.current?.naturalWidth ?? 0, imgRef.current?.naturalHeight ?? 0),
								children: t("editorCommit")
							})
						]
					})
				]
			}) });
		}
		//#endregion
		//#region src/client/components/pages/BackgroundPage.tsx
		const SEG_W = 108;
		const BG_MODES = [
			{
				mode: "fit",
				labelKey: "bgModeFit"
			},
			{
				mode: "fill",
				labelKey: "bgModeFill"
			},
			{
				mode: "stretch",
				labelKey: "bgModeStretch"
			},
			{
				mode: "tile",
				labelKey: "bgModeTile"
			},
			{
				mode: "center",
				labelKey: "bgModeCenter"
			}
		];
		function BackgroundPage({ p }) {
			const { t, setWp, setVideo, setWop, setBl, setBgType, setGeneratedBg, regenerateBg, setRegenerateOnReload, useStore } = p;
			const store = useStore((s) => s);
			const storeUrl = store.url;
			const backgroundType = store.backgroundType;
			const generatedBg = store.generatedBg;
			const regenerateOnReload = store.regenerateOnReload;
			const fileRef = (0, react.useRef)(null);
			const [editorOpen, setEditorOpen] = (0, react.useState)(false);
			const [dragOver, setDragOver] = (0, react.useState)(false);
			const [spinTick, setSpinTick] = (0, react.useState)(0);
			const [mode, setModeState] = (0, react.useState)(rBgMode());
			const isVideo = backgroundType === "video";
			const isStatic = backgroundType === "image" || isVideo;
			const isGenerated = !isStatic;
			const activeGenType = isGenerated && generatedBg ? generatedBg.type : "mesh";
			const onFileSelect = (f) => {
				if (f.type.startsWith("video/")) {
					setVideo(f, f.type);
					return;
				}
				readImg(f, (d) => {
					if (d) setWp(d);
				});
			};
			const onDrop = (e) => {
				e.preventDefault();
				setDragOver(false);
				const f = e.dataTransfer.files?.[0];
				if (f && (f.type.startsWith("image/") || f.type.startsWith("video/"))) onFileSelect(f);
			};
			const switchToStatic = () => {
				if (isStatic) return;
				setBgType(isVideo || cfg.videoMime !== null ? "video" : "image");
			};
			const setMode = (m) => {
				if (m === mode) return;
				setModeState(m);
				cfg.bgMode = m;
				applyWp();
				saveConfig();
			};
			const setGenType = (type) => {
				if (type === activeGenType) return;
				setBgType(type);
			};
			const ensureGenParams = () => generatedBg ?? defaultParamsFor(activeGenType);
			const updateGenerated = (patch) => {
				setGeneratedBg({
					...ensureGenParams(),
					...patch
				});
			};
			const typeMeta = [
				{
					type: "mesh",
					labelKey: "bgTypeMesh",
					descKey: "bgMeshDesc",
					thumb: "dab-thumb-mesh"
				},
				{
					type: "shader",
					labelKey: "bgTypeShader",
					descKey: "bgShaderDesc",
					thumb: "dab-thumb-shader"
				},
				{
					type: "pattern",
					labelKey: "bgTypePattern",
					descKey: "bgPatternDesc",
					thumb: "dab-thumb-pattern"
				}
			];
			const presetLabel = (key) => {
				switch (key) {
					case "aurora": return t("presetAurora");
					case "nebula": return t("presetNebula");
					case "noise": return t("presetNoise");
					case "dots": return t("presetDots");
					case "waves": return t("presetWaves");
					case "poly": return t("presetPoly");
					default: return key;
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
					className: "dab-head dab-rise",
					style: { "--d": 0 },
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dab-overline",
							children: "Canvas"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
							className: "dab-h1",
							children: t("bgTitle")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "dab-desc",
							children: t("descBackground")
						})
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
					className: "dab-rise",
					style: { "--d": 1 },
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dab-hero",
						children: storeUrl ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
								className: "dab-hero-img",
								src: storeUrl,
								alt: "",
								draggable: false
							}),
							isGenerated ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "dab-hero-badge",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SparkleIcon, { size: 11 }), t("liveBadge")]
							}) : isVideo ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "dab-hero-badge",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(VideoIcon, { size: 11 }), t("bgVideoBadge")]
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dab-hero-veil",
								children: [isStatic && storeUrl ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "dab-btn",
									disabled: mode !== "fit",
									title: mode !== "fit" ? t("bgEditLocked") : void 0,
									onClick: () => setEditorOpen(true),
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(EditIcon, { size: 13 }), t("bgEdit")]
								}) : isGenerated ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "dab-btn",
									onClick: () => {
										regenerateBg();
										setSpinTick((x) => x + 1);
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RefreshIcon, { size: 13 }), t("bgRegenerate")]
								}) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "dab-btn dab-btn-danger",
									onClick: () => setWp(null),
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TrashIcon, { size: 13 }), t("bgRemove")]
								})]
							})
						] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: `dab-hero-empty${dragOver ? " is-over" : ""}`,
							onClick: () => fileRef.current?.click(),
							onDragOver: (e) => {
								e.preventDefault();
								setDragOver(true);
							},
							onDragLeave: () => setDragOver(false),
							onDrop,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(UploadIcon, { size: 20 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("dropHint") })]
						})
					})
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
					className: "dab-rise",
					style: { "--d": 2 },
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dab-seg",
						style: { "--w": `${SEG_W}px` },
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dab-seg-thumb",
								style: { transform: `translateX(${isGenerated ? SEG_W : 0}px)` }
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: `dab-seg-item${!isGenerated ? " is-active" : ""}`,
								onClick: switchToStatic,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(PhotoIcon, { size: 14 }), t("bgSourceImage")]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: `dab-seg-item${isGenerated ? " is-active" : ""}`,
								onClick: () => {
									if (!isGenerated) setBgType(generatedBg?.type ?? "mesh");
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SparkleIcon, { size: 14 }), t("bgSourceGenerated")]
							})
						]
					})
				}),
				!isGenerated ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: "dab-card dab-card-hover dab-rise",
					style: { "--d": 3 },
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dab-chip-row",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "dab-btn dab-btn-primary",
							onClick: () => fileRef.current?.click(),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(UploadIcon, { size: 14 }), t("bgChoose")]
						}), storeUrl || isVideo ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [isStatic && storeUrl ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "dab-btn",
							disabled: mode !== "fit",
							title: mode !== "fit" ? t("bgEditLocked") : void 0,
							onClick: () => setEditorOpen(true),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(EditIcon, { size: 14 }), t("bgEdit")]
						}) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "dab-btn dab-btn-ghost dab-btn-danger",
							onClick: () => setWp(null),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TrashIcon, { size: 14 }), t("bgRemove")]
						})] }) : null]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: { marginTop: 16 },
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dab-swatch-title",
							children: t("bgModeTitle")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dab-chip-row",
							children: BG_MODES.map((m) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: `dab-chip${mode === m.mode ? " is-active" : ""}`,
								onClick: () => setMode(m.mode),
								children: t(m.labelKey)
							}, m.mode))
						})]
					})]
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: "dab-card dab-rise",
					style: { "--d": 3 },
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dab-types",
							children: typeMeta.map((m) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: `dab-type${activeGenType === m.type ? " is-active" : ""}`,
								onClick: () => setGenType(m.type),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: `dab-type-thumb ${m.thumb}` }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dab-type-name",
										children: t(m.labelKey)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dab-type-desc",
										children: t(m.descKey)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dab-type-check",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CheckIcon, { size: 11 })
									})
								]
							}, m.type))
						}),
						activeGenType === "shader" && generatedBg?.type === "shader" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: { marginTop: 14 },
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dab-swatch-title",
								children: t("bgShaderPreset")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dab-chip-row",
								children: [
									"aurora",
									"nebula",
									"noise"
								].map((pr) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: `dab-chip${generatedBg.preset === pr ? " is-active" : ""}`,
									onClick: () => updateGenerated({ preset: pr }),
									children: presetLabel(pr)
								}, pr))
							})]
						}) : null,
						activeGenType === "pattern" && generatedBg?.type === "pattern" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: { marginTop: 14 },
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dab-swatch-title",
								children: t("bgPatternPreset")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dab-chip-row",
								children: [
									"dots",
									"waves",
									"poly"
								].map((pr) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: `dab-chip${generatedBg.preset === pr ? " is-active" : ""}`,
									onClick: () => updateGenerated({ preset: pr }),
									children: presetLabel(pr)
								}, pr))
							})]
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: { marginTop: 16 },
							children: [
								activeGenType === "mesh" && generatedBg?.type === "mesh" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
									label: t("bgMeshScale"),
									min: 30,
									max: 300,
									step: 1,
									def: Math.round(generatedBg.scale * 100),
									fmt: (v) => `${v}%`,
									onChange: (v) => updateGenerated({ scale: v / 100 })
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
									label: t("bgMeshIntensity"),
									min: 0,
									max: 100,
									step: 1,
									def: Math.round(generatedBg.intensity * 100),
									fmt: (v) => `${v}%`,
									onChange: (v) => updateGenerated({ intensity: v / 100 })
								})] }) : null,
								activeGenType === "shader" && generatedBg?.type === "shader" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
									label: t("bgShaderSpeed"),
									min: 0,
									max: 200,
									step: 1,
									def: Math.round(generatedBg.speed * 100),
									fmt: (v) => `${v}%`,
									onChange: (v) => updateGenerated({ speed: v / 100 })
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
									label: t("bgShaderScale"),
									min: 30,
									max: 300,
									step: 1,
									def: Math.round(generatedBg.scale * 100),
									fmt: (v) => `${v}%`,
									onChange: (v) => updateGenerated({ scale: v / 100 })
								})] }) : null,
								activeGenType === "pattern" && generatedBg?.type === "pattern" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
									label: t("bgPatternDensity"),
									min: 0,
									max: 100,
									step: 1,
									def: Math.round(generatedBg.density * 100),
									fmt: (v) => `${v}%`,
									onChange: (v) => updateGenerated({ density: v / 100 })
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
									label: t("bgPatternScale"),
									min: 30,
									max: 300,
									step: 1,
									def: Math.round(generatedBg.scale * 100),
									fmt: (v) => `${v}%`,
									onChange: (v) => updateGenerated({ scale: v / 100 })
								})] }) : null
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dab-seed",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dab-seed-ico",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LockIcon, { size: 15 })
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dab-seed-txt",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dab-seed-title",
										children: t("seedLock")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dab-seed-desc",
										children: !regenerateOnReload ? t("bgSeedLocked") : t("bgSeedUnlocked")
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: `dab-toggle${!regenerateOnReload ? " is-on" : ""}`,
									role: "switch",
									"aria-checked": !regenerateOnReload,
									onClick: () => setRegenerateOnReload(!regenerateOnReload),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dab-toggle-knob" })
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "dab-btn dab-btn-primary",
									onClick: () => {
										regenerateBg();
										setSpinTick((x) => x + 1);
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dab-spin",
										style: { display: "grid" },
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RefreshIcon, { size: 13 })
									}, spinTick), t("bgRegenerate")]
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: "dab-card dab-card-hover dab-rise",
					style: { "--d": 4 },
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
							label: t("wpOpacity"),
							min: 0,
							max: 100,
							step: 1,
							def: Math.round(rWop() * 100),
							fmt: (v) => `${v}%`,
							onInput: (v) => {
								const op = v / 100;
								cfg.wallpaperOpacity = op;
								setWpOpacity(op);
								saveConfig();
							},
							onChange: (v) => setWop(v / 100)
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
							label: t("bgBlur"),
							min: 0,
							max: 60,
							step: 1,
							def: rBl(),
							fmt: (v) => `${v}px`,
							onInput: (v) => {
								cfg.blur = v;
								setWpBlur(v);
								saveConfig();
							},
							onChange: (v) => setBl(v)
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "dab-hint",
							style: { marginTop: 12 },
							children: t("bgHint")
						})
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					ref: fileRef,
					type: "file",
					accept: "image/*,video/*",
					style: { display: "none" },
					onChange: (e) => {
						const f = e.target.files?.[0];
						if (!f) return;
						onFileSelect(f);
						e.target.value = "";
					}
				}),
				editorOpen && storeUrl && isStatic && mode === "fit" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BgEditor, {
					url: storeUrl,
					t,
					onClose: () => setEditorOpen(false),
					onCommit: (z, x, y, iw, ih) => {
						const st = {
							zoom: z,
							x,
							y,
							iw,
							ih
						};
						if (backgroundType === "video") cfg.videoBgState = st;
						else cfg.bgState = st;
						applyWp();
						saveConfig();
						setEditorOpen(false);
					}
				}) : null
			] });
		}
		//#endregion
		//#region src/client/components/pages/ProfilePage.tsx
		function ProfilePage({ p, notify }) {
			const { t, exportTheme, importTheme } = p;
			const importRef = (0, react.useRef)(null);
			const onImport = async (file) => {
				try {
					const ok = await importTheme(file);
					notify(ok ? t("importDone") : t("importFail"), ok);
				} catch {
					notify(t("importFail"), false);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
					className: "dab-head dab-rise",
					style: { "--d": 0 },
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dab-overline",
							children: "Profile"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
							className: "dab-h1",
							children: t("pageProfile")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "dab-desc",
							children: t("descProfile")
						})
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dab-profile-grid",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dab-card dab-card-hover dab-rise",
						style: { "--d": 1 },
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dab-profile-ico",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DownloadIcon, { size: 17 })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dab-profile-title",
								children: t("exportCardTitle")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dab-profile-desc",
								children: t("exportCardDesc")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "dab-btn dab-btn-primary",
								onClick: () => {
									exportTheme();
									notify(t("toastExportDone"));
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(DownloadIcon, { size: 14 }), t("exportTheme")]
							})
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dab-card dab-card-hover dab-rise",
						style: { "--d": 2 },
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dab-profile-ico",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(UploadIcon, { size: 17 })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dab-profile-title",
								children: t("importCardTitle")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dab-profile-desc",
								children: t("importCardDesc")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "dab-btn",
								onClick: () => importRef.current?.click(),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(UploadIcon, { size: 14 }), t("importTheme")]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								ref: importRef,
								type: "file",
								accept: "application/json,.json",
								style: { display: "none" },
								onChange: (e) => {
									const f = e.target.files?.[0];
									if (!f) return;
									onImport(f);
									e.target.value = "";
								}
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
					className: "dab-footer dab-rise",
					style: { "--d": 3 },
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dab-footer-mono",
						children: "dsh-any-background"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("footerTag") })]
				})
			] });
		}
		//#endregion
		//#region src/client/components/ThemeSection.tsx
		/**
		* dsh-any-background — settings section shell.
		*
		* The host renders this section only while the settings dialog is open and the
		* section is the active nav entry, so mounting IS being visible. The section is
		* rendered INLINE inside the host settings dialog's content column (the host
		* provides the modal chrome); the shell is a left nav rail + page body. Only
		* the transient toast escapes through a Portal (the shell's container-type
		* containment would otherwise capture its fixed positioning).
		*/
		function ThemeSection(props) {
			ensureUiCss();
			const { t } = props;
			const [page, setPage] = (0, react.useState)(0);
			const [toast, setToast] = (0, react.useState)(null);
			const toastTimer = (0, react.useRef)(void 0);
			(0, react.useEffect)(() => () => window.clearTimeout(toastTimer.current), []);
			const notify = (msg, ok = true) => {
				setToast({
					msg,
					ok
				});
				window.clearTimeout(toastTimer.current);
				toastTimer.current = window.setTimeout(() => setToast(null), 2600);
			};
			const pages = [
				{
					label: t("pageColor"),
					Icon: DropletIcon,
					node: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ColorPage, {
						p: props,
						notify
					})
				},
				{
					label: t("pageInterface"),
					Icon: LayersIcon,
					node: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InterfacePage, { p: props })
				},
				{
					label: t("pageBackground"),
					Icon: PhotoIcon,
					node: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BackgroundPage, { p: props })
				},
				{
					label: t("pageProfile"),
					Icon: SlidersIcon,
					node: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProfilePage, {
						p: props,
						notify
					})
				}
			];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(ErrorBoundary, {
				t,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dab-root",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dab-shell",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("nav", {
							className: "dab-nav",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dab-brand",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dab-brand-tile",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SunIcon, { size: 15 })
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dab-brand-name",
									children: t("nav")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dab-brand-tag",
									children: t("brandTag")
								})] })]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dab-nav-list",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dab-nav-ind",
									style: { transform: `translateY(${page * 42}px)` }
								}), pages.map((pg, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: `dab-nav-item${i === page ? " is-active" : ""}`,
									onClick: () => setPage(i),
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(pg.Icon, { size: 16 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: pg.label })]
								}, pg.label))]
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dab-page",
							children: pages[page].node
						}, page)]
					})
				}), toast ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dab-toast",
					role: "status",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: toast.ok ? "dab-toast-ok" : "dab-toast-err",
						children: toast.ok ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CheckIcon, { size: 14 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AlertIcon, { size: 14 })
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: toast.msg })]
				}) }) : null]
			});
		}
		//#endregion
		//#region src/client/index.tsx
		/**
		* dsh-any-background — browser half entry.
		*
		* Wires the plugin lifecycle: theme registration, wallpaper layer, viewport
		* watch, i18n, settings-section injection, boot restore, watchdog. The heavy
		* lifting lives in the sibling modules (state/rpc/wallpaper/utils/components).
		*/
		const name = "dsh-any-background";
		const inject = [
			"slots",
			"locale",
			"theme",
			"connection"
		];
		const CUSTOM_ID = "custom-color";
		function apply(ctx) {
			initRpc((endpoint, payload) => ctx.connection.rpc.call(RPC_CHANNEL, endpoint, payload).then((res) => res));
			const [initH, initS, initL] = rColor();
			let customDispose = null;
			const registerCustom = (h, s, l) => {
				customDispose?.();
				try {
					const { colorScheme, tokens } = genTokens(h, s, l);
					customDispose = ctx.theme.register({
						id: CUSTOM_ID,
						colorScheme,
						tokens
					});
				} catch {
					customDispose = null;
				}
				if (ctx.theme.getTheme().themes.some((t) => t.id === CUSTOM_ID)) ctx.theme.setTheme(CUSTOM_ID);
			};
			if (rHasColor()) registerCustom(initH, initS, initL);
			ctx.effect(() => () => {
				customDispose?.();
				if (colorTimerRef.current !== null) window.clearTimeout(colorTimerRef.current);
			}, "dsh-any-background: skin dispose");
			const styleEl = document.createElement("style");
			styleEl.dataset.plugin = "dsh-any-background";
			styleEl.textContent = `body[data-ds-dark-theme="dsh-any-background"]::before{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(255,255,255,0.03) 0%,transparent 60%)}${SETTINGS_STYLE_RULE}${TRAJECTORY_STYLE_RULE}${INPUT_BLUR_RULE}`;
			document.head.appendChild(styleEl);
			ctx.effect(() => () => {
				styleEl?.parentNode?.removeChild(styleEl);
			}, "dsh-any-background: gradient");
			const disposeDragQuality = watchWallpaperDragQuality();
			ctx.effect(() => () => disposeDragQuality(), "dsh-any-background: drag quality");
			let rev = 0;
			let colorRev = 0;
			let bgRev = 0;
			const colorTimerRef = { current: null };
			const store = (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
				init: () => ({
					url: null,
					rev: -1,
					colorRev: -1,
					color: null,
					backgroundType: cfg.backgroundType,
					generatedBg: cfg.generatedBg,
					bgRev: -1,
					regenerateOnReload: cfg.regenerateOnReload
				}),
				actions: {
					syncBg: (d, url, r, bgType, genBg, bgr, reload) => {
						if (r > d.rev) {
							d.url = url;
							d.rev = r;
						}
						if (bgr !== void 0 && bgr > d.bgRev) {
							d.backgroundType = bgType;
							d.generatedBg = genBg ?? null;
							d.bgRev = bgr;
						}
						if (reload !== void 0) d.regenerateOnReload = reload;
					},
					syncColor: (d, hsv, r) => {
						if (r > d.colorRev) {
							d.color = hsv;
							d.colorRev = r;
						}
					}
				}
			});
			let bound = null;
			const syncBg = () => {
				rev++;
				bgRev++;
				bound?.syncBg(rWp(), rev, cfg.backgroundType, cfg.generatedBg, bgRev, cfg.regenerateOnReload);
			};
			onGeneratedSnapshot(syncBg);
			applyWp();
			syncBg();
			watchParts();
			loadPersisted().then(() => {
				if (rHasColor()) {
					const [h, s, l] = rColor();
					registerCustom(h, s, l);
				}
				if (cfg.backgroundType === "video") {
					const v = rWpVideo();
					if (v) {
						captureVideoSnapshot(v).then((snap) => {
							if (rWpVideo() !== v) return;
							setWpVideoSnapshot(snap);
							applyThemeColor();
							syncBg();
						});
						applyWp();
					} else {
						cfg.backgroundType = "image";
						setWpUrl(rWpImage());
						applyThemeColor();
					}
				} else if (cfg.backgroundType !== "image") {
					if (cfg.regenerateOnReload) regenerateGeneratedBg();
					else if (cfg.generatedBg) updateGeneratedBg(cfg.generatedBg);
					persistConfig();
				} else applyThemeColor();
				syncBg();
				if (rHasColor()) {
					colorRev++;
					bound?.syncColor(hslToHsv(...rColor()), colorRev);
				}
			});
			ctx.effect(() => () => {
				teardownWp();
			}, "dsh-any-background: wp cleanup");
			ctx.effect(() => ctx.on("theme/change", () => {
				if (rHasColor()) {
					const snapshot = ctx.theme.getTheme();
					if (snapshot.preference !== CUSTOM_ID && snapshot.themes.some((t) => t.id === CUSTOM_ID)) ctx.theme.setTheme(CUSTOM_ID);
				}
				applyWp();
			}), "dsh-any-background: theme change");
			let frame = 0;
			const applySoon = () => {
				if (frame !== 0) return;
				frame = requestAnimationFrame(() => {
					frame = 0;
					applyWp();
				});
			};
			const sentinel = document.createElement("div");
			sentinel.style.cssText = "position:fixed;inset:0;pointer-events:none;visibility:hidden";
			document.body.append(sentinel);
			const viewportObserver = new ResizeObserver(applySoon);
			viewportObserver.observe(sentinel);
			const dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
			dprQuery.addEventListener("change", applySoon);
			ctx.effect(() => () => {
				viewportObserver.disconnect();
				dprQuery.removeEventListener("change", applySoon);
				sentinel.remove();
			}, "dsh-any-background: viewport watch");
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-any-background: i18n");
			const sectionInject = (actions) => {
				bound = actions;
				syncBg();
				const playVideoFromBlob = (blob, mime) => {
					const localUrl = URL.createObjectURL(blob);
					cfg.backgroundType = "video";
					setWpUrl(null);
					cfg.videoBgState = { ...DEFAULT_CONFIG.bgState };
					setWpVideoUrl(localUrl, mime ?? blob.type ?? "video/mp4");
					applyWp();
					syncBg();
					const applied = rWpVideo();
					captureVideoSnapshot(localUrl).then((snap) => {
						if (rWpVideo() !== applied) return;
						setWpVideoSnapshot(snap);
						applyThemeColor();
						syncBg();
					});
					uploadVideo(blob, mime ?? blob.type ?? "video/mp4").then((ok) => {
						if (ok) persistConfig();
					});
				};
				const [wh, ws, wl] = rColor();
				const [dh, ds, dv] = hslToHsv(wh, ws, wl);
				return {
					t: ctx.locale.bind(NS),
					hue: dh,
					sat: ds,
					lit: dv,
					setColor: (nh, ns, nl) => {
						const [sh, ss, sl] = hsvToHsl(nh, ns, nl);
						cfg.color = [
							sh,
							ss,
							sl
						];
						if (colorTimerRef.current !== null) window.clearTimeout(colorTimerRef.current);
						colorTimerRef.current = window.setTimeout(() => {
							colorTimerRef.current = null;
							registerCustom(sh, ss, sl);
							applyWp();
							saveConfig();
						}, 80);
						colorRev++;
						bound?.syncColor([
							nh,
							ns,
							nl
						], colorRev);
					},
					setWp: (u) => {
						cfg.backgroundType = "image";
						setBgDark(null);
						setWpImageUrl(u);
						setWpUrl(u);
						setBgState({ ...DEFAULT_CONFIG.bgState });
						persistWallpaper(u);
						if (u === null) {
							setWpVideoUrl(null, null);
							persistVideo(null);
						}
						applyThemeColor();
						syncBg();
					},
					setVideo: async (u, mime) => {
						setBgDark(null);
						if (u === null) {
							setWpVideoUrl(null, null);
							cfg.backgroundType = "image";
							setWpUrl(rWpImage());
							persistVideo(null);
							applyThemeColor();
							syncBg();
							saveConfig();
							return;
						}
						if (typeof u !== "string") {
							playVideoFromBlob(u, mime);
							return;
						}
						const live = await persistVideo(u) ? VIDEO_SERVE_URL : u;
						cfg.backgroundType = "video";
						setWpUrl(null);
						cfg.videoBgState = { ...DEFAULT_CONFIG.bgState };
						setWpVideoUrl(live, mime ?? null);
						applyWp();
						saveConfig();
						syncBg();
						const applied = rWpVideo();
						captureVideoSnapshot(live).then((snap) => {
							if (rWpVideo() !== applied) return;
							setWpVideoSnapshot(snap);
							applyThemeColor();
							syncBg();
						});
					},
					setBgType: (type) => {
						setBackgroundType(type);
						saveConfig();
						syncBg();
					},
					setGeneratedBg: (params) => {
						updateGeneratedBg(params);
						saveConfig();
						syncBg();
					},
					regenerateBg: () => {
						regenerateGeneratedBg();
						persistConfig();
						syncBg();
					},
					setRegenerateOnReload: (v) => {
						cfg.regenerateOnReload = v;
						persistConfig();
						syncBg();
					},
					setOps: (ops) => {
						cfg.opacities = ops;
						applyWp();
						syncBg();
						saveConfig();
					},
					setBlurs: (blurs) => {
						cfg.blurs = blurs;
						applyWp();
						syncBg();
						saveConfig();
					},
					setWop: (v) => {
						cfg.wallpaperOpacity = v;
						applyWp();
						syncBg();
						saveConfig();
					},
					setBl: (v) => {
						cfg.blur = v;
						applyWp();
						syncBg();
						saveConfig();
					},
					setSop: (v) => {
						cfg.settingsOpacity = v;
						applySettingsOverrides(v);
						saveConfig();
					},
					extractColor: async () => {
						const url = rWp();
						if (!url) return false;
						const hsl = await extractWallpaperColor(url, cfg.backgroundType === "video" ? rVideoBgState() : rBgState());
						if (!hsl) return false;
						cfg.color = hsl;
						registerCustom(hsl[0], hsl[1], hsl[2]);
						applyWp();
						saveConfig();
						const hsv = hslToHsv(hsl[0], hsl[1], hsl[2]);
						colorRev++;
						bound?.syncColor(hsv, colorRev);
						return true;
					},
					exportTheme: async () => {
						let videoPayload = null;
						if (cfg.backgroundType === "video") {
							const vurl = rWpVideo();
							if (vurl) try {
								const blob = await fetch(vurl).then((r) => r.blob());
								videoPayload = await new Promise((resolve, reject) => {
									const fr = new FileReader();
									fr.onload = () => resolve(fr.result);
									fr.onerror = () => reject(fr.error);
									fr.readAsDataURL(blob);
								});
								if (videoPayload && !/^data:video\//.test(videoPayload)) videoPayload = videoPayload.replace(/^data:[^;,]*/, `data:${cfg.videoMime ?? "video/mp4"}`);
							} catch {
								videoPayload = null;
							}
						}
						const payload = {
							version: 2,
							exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
							config: cfg,
							wallpaper: cfg.backgroundType === "image" ? rWp() : null,
							video: videoPayload
						};
						const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
						const url = URL.createObjectURL(blob);
						const a = document.createElement("a");
						a.href = url;
						a.download = "dsh-any-theme.json";
						a.click();
						URL.revokeObjectURL(url);
					},
					importTheme: async (file) => {
						try {
							const data = JSON.parse(await file.text());
							if (!data || typeof data !== "object") return false;
							const d = data;
							if (typeof d.config !== "object" || d.config === null) return false;
							adoptConfig(d.config);
							if (cfg.backgroundType === "video") {
								const video = typeof d.video === "string" && /^data:video\//.test(d.video) ? d.video : null;
								if (video !== null) {
									let blob = null;
									try {
										blob = await fetch(video).then((r) => r.blob());
									} catch {
										blob = null;
									}
									if (blob !== null) playVideoFromBlob(blob, cfg.videoMime);
									else {
										const live = await persistVideo(video) ? VIDEO_SERVE_URL : video;
										setWpVideoUrl(live, cfg.videoMime);
										applyWp();
										const applied = rWpVideo();
										captureVideoSnapshot(live).then((snap) => {
											if (rWpVideo() !== applied) return;
											setWpVideoSnapshot(snap);
											applyThemeColor();
											syncBg();
										});
									}
								} else {
									setWpVideoUrl(null, null);
									persistVideo(null);
									cfg.backgroundType = "image";
									setWpImageUrl(null);
									setWpUrl(null);
									persistWallpaper(null);
									applyThemeColor();
								}
							} else if (cfg.backgroundType === "image") {
								const wallpaper = typeof d.wallpaper === "string" && /^data:image\//.test(d.wallpaper) ? d.wallpaper : null;
								setWpImageUrl(wallpaper);
								setWpUrl(wallpaper);
								persistWallpaper(wallpaper);
								applyThemeColor();
							} else {
								setWpImageUrl(null);
								setWpUrl(null);
								persistWallpaper(null);
								if (cfg.regenerateOnReload) regenerateGeneratedBg();
								else if (cfg.generatedBg) updateGeneratedBg(cfg.generatedBg);
							}
							persistConfig();
							if (rHasColor()) {
								const [h, s, l] = rColor();
								registerCustom(h, s, l);
							}
							syncBg();
							if (rHasColor()) {
								colorRev++;
								bound?.syncColor(hslToHsv(...rColor()), colorRev);
							}
							return true;
						} catch {
							return false;
						}
					}
				};
			};
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "dsh-any-background",
				order: 35,
				label: () => ctx.locale.bind(NS)("nav"),
				locale: NS,
				store,
				inject: sectionInject
			}, ThemeSection));
			const navLabel = () => ctx.locale.bind(NS)("nav");
			const applyNavIcon = () => {
				const nav = document.querySelector("[role=\"dialog\"][aria-modal=\"true\"][aria-labelledby]")?.querySelector("nav");
				if (!nav) return;
				const target = navLabel();
				for (const cell of Array.from(nav.querySelectorAll("button"))) {
					const label = cell.querySelector("span");
					if (label && label.textContent?.trim() === target) {
						const svg = cell.querySelector("svg");
						if (svg && svg.dataset.dshAnyIcon !== "1") {
							const sun = document.createElementNS("http://www.w3.org/2000/svg", "svg");
							sun.setAttribute("width", "16");
							sun.setAttribute("height", "16");
							sun.setAttribute("viewBox", "0 0 16 16");
							sun.setAttribute("fill", "none");
							sun.setAttribute("xmlns", "http://www.w3.org/2000/svg");
							sun.dataset.dshAnyIcon = "1";
							sun.innerHTML = SUN_PATHS;
							svg.replaceWith(sun);
						}
						return;
					}
				}
			};
			let navIconObserver = null;
			const watchNavIcon = () => {
				if (navIconObserver !== null || typeof MutationObserver === "undefined") return;
				navIconObserver = new MutationObserver((records) => {
					if (records.some((r) => {
						for (const n of r.addedNodes) {
							if (n.nodeType !== 1) continue;
							const el = n;
							if (el.matches?.("[role=\"dialog\"][aria-modal=\"true\"][aria-labelledby]") || el.querySelector?.("[role=\"dialog\"][aria-modal=\"true\"][aria-labelledby]")) return true;
						}
						return false;
					})) applyNavIcon();
				});
				navIconObserver.observe(document.body, {
					childList: true,
					subtree: true
				});
				applyNavIcon();
			};
			watchNavIcon();
			ctx.effect(() => () => {
				navIconObserver?.disconnect();
				navIconObserver = null;
			}, "dsh-any-background: nav icon watch");
			const restoreSaved = () => {
				if (rHasColor()) {
					const snapshot = ctx.theme.getTheme();
					if (!snapshot.themes.some((t) => t.id === CUSTOM_ID)) {
						const [h, s, l] = rColor();
						registerCustom(h, s, l);
					} else if (snapshot.preference !== CUSTOM_ID) ctx.theme.setTheme(CUSTOM_ID);
				}
				applyWp();
			};
			const restoreTimers = [300, 1500].map((delay) => window.setTimeout(restoreSaved, delay));
			ctx.effect(() => () => {
				restoreTimers.forEach((id) => window.clearTimeout(id));
			}, "dsh-any-background: boot restore");
			const watchdogId = window.setInterval(() => {
				if (!rHasColor()) return;
				const snapshot = ctx.theme.getTheme();
				let changed = false;
				if (!snapshot.themes.some((t) => t.id === CUSTOM_ID)) {
					const [h, s, l] = rColor();
					registerCustom(h, s, l);
					changed = true;
				} else if (snapshot.preference !== CUSTOM_ID) {
					ctx.theme.setTheme(CUSTOM_ID);
					changed = true;
				}
				if (changed) applyWp();
			}, 1e3);
			ctx.effect(() => () => {
				window.clearInterval(watchdogId);
			}, "dsh-any-background: theme watchdog");
			const onPageHide = () => flushSave();
			window.addEventListener("pagehide", onPageHide);
			ctx.effect(() => () => window.removeEventListener("pagehide", onPageHide), "dsh-any-background: pagehide flush");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map