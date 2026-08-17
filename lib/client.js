window.__ModuleLoader__.load({
	id: "dsh-any-background",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/i18n.ts
		const NS = "settings.anyBg";
		const zh = {
			nav: "主题",
			subtitle: "自定义界面外观",
			colorTitle: "主题色",
			colorHint: "在色轮上选择色相，在方形中调整饱和度和明度",
			uiTitle: "主界面",
			uiOpacity: "透明度",
			uiBlur: "模糊度",
			uiOpacityBg: "主背景",
			uiOpacitySide: "侧边栏",
			uiOpacityCard: "对话框中选项面板",
			uiSop: "设置界面透明度",
			bgTitle: "背景",
			bgChoose: "选择图片",
			bgRemove: "移除背景",
			bgEdit: "编辑位置",
			wpOpacity: "背景透明度",
			bgBlur: "背景模糊",
			bgHint: "拖动滑块实时调整。点击背景图可打开编辑器调整位置和大小；也可以直接使用下方生成器创建动态背景",
			editorTitle: "背景编辑器",
			editorHint: "拖动移动图片，滚轮缩放大小",
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
			importDone: "已导入主题配置",
			importFail: "导入失败，文件格式不正确",
			eyedropper: "从背景取色",
			pickerTitle: "从背景取色",
			pickerHint: "移动鼠标预览颜色，点击背景选取为主题色",
			pickerClose: "关闭",
			bgTypeImage: "图片",
			bgTypeMesh: "网格渐变",
			bgTypeShader: "Shader",
			bgTypePattern: "几何图案",
			bgRegenerate: "重新生成",
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
			subtitle: "Customize appearance",
			colorTitle: "Theme color",
			colorHint: "Pick hue on the ring, adjust saturation & lightness in the square",
			uiTitle: "Interface opacity",
			uiOpacity: "Opacity",
			uiBlur: "Blur",
			uiOpacityBg: "Main background",
			uiOpacitySide: "Sidebar",
			uiOpacityCard: "Cards & panels",
			uiSop: "Settings interface opacity",
			bgTitle: "Background",
			bgChoose: "Choose image",
			bgRemove: "Remove background",
			bgEdit: "Edit position",
			wpOpacity: "Background opacity",
			bgBlur: "Background blur",
			bgHint: "Drag sliders for real-time adjustment. Click the image to open the editor, or use the generator below to create a dynamic background",
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
			importDone: "Theme imported",
			importFail: "Import failed — invalid file",
			eyedropper: "Eyedropper",
			pickerTitle: "Pick from background",
			pickerHint: "Hover to preview, click to pick as theme color",
			pickerClose: "Close",
			bgTypeImage: "Image",
			bgTypeMesh: "Mesh gradient",
			bgTypeShader: "Shader",
			bgTypePattern: "Pattern",
			bgRegenerate: "Regenerate",
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
				card: 1
			},
			blurs: {
				bg: 0,
				sidebar: 0,
				card: 0,
				settings: 0
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
			backgroundType: "image",
			generatedBg: null
		};
		let palette = null;
		function setPalette(p) {
			palette = p;
		}
		function rPalette() {
			return palette;
		}
		let cfg = {
			...DEFAULT_CONFIG,
			opacities: { ...DEFAULT_CONFIG.opacities },
			blurs: { ...DEFAULT_CONFIG.blurs },
			bgState: { ...DEFAULT_CONFIG.bgState }
		};
		let wpUrl = null;
		function setWpUrl(url) {
			wpUrl = url;
		}
		function setBgState(s) {
			cfg.bgState = s;
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
		function rWp() {
			return wpUrl;
		}
		function rOps() {
			const o = cfg.opacities ?? {};
			return {
				bg: typeof o.bg === "number" ? Math.min(1, Math.max(0, o.bg)) : DEFAULT_CONFIG.opacities.bg,
				sidebar: typeof o.sidebar === "number" ? Math.min(1, Math.max(0, o.sidebar)) : DEFAULT_CONFIG.opacities.sidebar,
				card: typeof o.card === "number" ? Math.min(1, Math.max(0, o.card)) : DEFAULT_CONFIG.opacities.card
			};
		}
		function rBlurs() {
			const b = cfg.blurs ?? {};
			return {
				bg: typeof b.bg === "number" ? Math.min(60, Math.max(0, b.bg)) : DEFAULT_CONFIG.blurs.bg,
				sidebar: typeof b.sidebar === "number" ? Math.min(60, Math.max(0, b.sidebar)) : DEFAULT_CONFIG.blurs.sidebar,
				card: typeof b.card === "number" ? Math.min(60, Math.max(0, b.card)) : DEFAULT_CONFIG.blurs.card,
				settings: typeof b.settings === "number" ? Math.min(60, Math.max(0, b.settings)) : DEFAULT_CONFIG.blurs.settings
			};
		}
		function rWop() {
			return typeof cfg.wallpaperOpacity === "number" ? Math.min(1, Math.max(0, cfg.wallpaperOpacity)) : DEFAULT_CONFIG.wallpaperOpacity;
		}
		function rBl() {
			return typeof cfg.blur === "number" ? Math.min(60, Math.max(0, cfg.blur)) : DEFAULT_CONFIG.blur;
		}
		function rSop() {
			return typeof cfg.settingsOpacity === "number" ? Math.min(1, Math.max(0, cfg.settingsOpacity)) : DEFAULT_CONFIG.settingsOpacity;
		}
		function rBgState() {
			return cfg.bgState;
		}
		/** Move a possibly-absent partial config into the shape the UI reads. */
		function adoptConfig(raw) {
			const c = raw ?? {};
			const color = Array.isArray(c.color) && c.color.length === 3 ? [
				c.color[0],
				c.color[1],
				c.color[2]
			] : null;
			const bg = c.bgState ?? {};
			const legacy = typeof c.opacity === "number" ? c.opacity : null;
			const ops = c.opacities ?? {};
			const bl = c.blurs ?? {};
			const bgType = c.backgroundType === "mesh" || c.backgroundType === "shader" || c.backgroundType === "pattern" ? c.backgroundType : DEFAULT_CONFIG.backgroundType;
			const gen = c.generatedBg && typeof c.generatedBg === "object" ? c.generatedBg : null;
			const generatedBg = gen && gen.type === bgType ? c.generatedBg : null;
			cfg = {
				color,
				opacities: {
					bg: typeof ops.bg === "number" ? ops.bg : legacy ?? DEFAULT_CONFIG.opacities.bg,
					sidebar: typeof ops.sidebar === "number" ? ops.sidebar : legacy !== null ? Math.min(1, legacy + .08) : DEFAULT_CONFIG.opacities.sidebar,
					card: typeof ops.card === "number" ? ops.card : DEFAULT_CONFIG.opacities.card
				},
				blurs: {
					bg: typeof bl.bg === "number" ? bl.bg : DEFAULT_CONFIG.blurs.bg,
					sidebar: typeof bl.sidebar === "number" ? bl.sidebar : DEFAULT_CONFIG.blurs.sidebar,
					card: typeof bl.card === "number" ? bl.card : DEFAULT_CONFIG.blurs.card,
					settings: typeof bl.settings === "number" ? bl.settings : DEFAULT_CONFIG.blurs.settings
				},
				settingsOpacity: typeof c.settingsOpacity === "number" ? c.settingsOpacity : DEFAULT_CONFIG.settingsOpacity,
				wallpaperOpacity: typeof c.wallpaperOpacity === "number" ? c.wallpaperOpacity : DEFAULT_CONFIG.wallpaperOpacity,
				blur: typeof c.blur === "number" ? c.blur : DEFAULT_CONFIG.blur,
				bgState: {
					zoom: typeof bg.zoom === "number" ? bg.zoom : 1,
					x: typeof bg.x === "number" ? bg.x : 0,
					y: typeof bg.y === "number" ? bg.y : 0,
					iw: typeof bg.iw === "number" && bg.iw > 0 ? bg.iw : 0,
					ih: typeof bg.ih === "number" && bg.ih > 0 ? bg.ih : 0
				},
				backgroundType: bgType,
				generatedBg: generatedBg ? normalizeGeneratedBg(generatedBg) : null
			};
		}
		function normalizeGeneratedBg(p) {
			if (!p) return null;
			if (p.type === "mesh") return {
				type: "mesh",
				seed: typeof p.seed === "number" ? p.seed : 0,
				scale: typeof p.scale === "number" ? Math.min(3, Math.max(.3, p.scale)) : 1,
				intensity: typeof p.intensity === "number" ? Math.min(1, Math.max(0, p.intensity)) : .6
			};
			if (p.type === "shader") return {
				type: "shader",
				preset: [
					"aurora",
					"nebula",
					"noise"
				].includes(p.preset) ? p.preset : "aurora",
				speed: typeof p.speed === "number" ? Math.min(2, Math.max(0, p.speed)) : .3,
				scale: typeof p.scale === "number" ? Math.min(3, Math.max(.3, p.scale)) : 1
			};
			return {
				type: "pattern",
				preset: [
					"dots",
					"waves",
					"poly"
				].includes(p.preset) ? p.preset : "dots",
				density: typeof p.density === "number" ? Math.min(1, Math.max(0, p.density)) : .5,
				scale: typeof p.scale === "number" ? Math.min(3, Math.max(.3, p.scale)) : 1
			};
		}
		//#endregion
		//#region src/client/rpc.ts
		const RPC_CHANNEL = "/dsh-any-background";
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
		/** Load the persisted theme (config + wallpaper) from the node half. */
		async function loadPersisted() {
			const data = await rpcCall("read", {});
			if (data && typeof data === "object") {
				const d = data;
				if (d.config) adoptConfig(d.config);
				if (typeof d.wallpaper === "string") setWpUrl(d.wallpaper);
				else if (d.wallpaper === null) setWpUrl(null);
			}
		}
		/** Persist a wallpaper (null removes it). One-shot large payload, no debounce. */
		function persistWallpaper(dataUrl) {
			rpcCall("setWallpaper", { dataUrl });
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
		*
		* When a Material-You-style palette is provided, primary/secondary/tertiary
		* hues are used for brand and accent tokens; the surface and label colors still
		* follow the primary hue so the scheme stays readable.
		*/
		function genTokens(hue, sat, lit, palette) {
			const key = `${hue}|${sat}|${lit}|${palette ? hslKey(palette.primary) + "/" + hslKey(palette.secondary) + "/" + hslKey(palette.tertiary) + "/" + hslKey(palette.surface) : ""}`;
			if (tokensCacheKey === key && tokensCache) return tokensCache;
			tokensCacheKey = key;
			tokensCache = buildTokens(hue, sat, lit, palette);
			return tokensCache;
		}
		function hslKey([h, s, l]) {
			return `${Math.round(h)}:${Math.round(s * 100)}:${Math.round(l * 100)}`;
		}
		function buildTokens(hue, sat, lit, palette) {
			const dark = lit < .55;
			const h = (d) => ((hue + d) % 360 + 360) % 360;
			const s = (d) => Math.max(0, Math.min(1, sat + d));
			const l = (d) => Math.max(0, Math.min(1, lit + d));
			const hsl = (hh, ss, ll) => `hsl(${Math.round(hh)},${Math.round(ss * 100)}%,${Math.round(ll * 100)}%)`;
			const rgba = (hh, ss, ll, a) => `hsla(${Math.round(hh)},${Math.round(ss * 100)}%,${Math.round(ll * 100)}%,${a})`;
			const accentHue = palette ? palette.tertiary[0] : h(180);
			const secondaryHue = palette ? palette.secondary[0] : h(30);
			const surfaceHue = palette ? palette.surface[0] : hue;
			const surfaceSat = palette ? Math.min(.08, palette.surface[1]) : 0;
			if (dark) return {
				colorScheme: "dark",
				tokens: {
					"--dsw-alias-bg-base": hsl(surfaceHue, surfaceSat, l(-.04)),
					"--dsw-alias-bg-layer-1": hsl(surfaceHue, surfaceSat, l(.02)),
					"--dsw-alias-bg-layer-2": hsl(surfaceHue, Math.min(1, surfaceSat + .03), l(.07)),
					"--dsw-alias-bg-layer-3": hsl(surfaceHue, Math.min(1, surfaceSat + .05), l(.12)),
					"--dsw-alias-bg-overlay": hsl(surfaceHue, Math.min(1, surfaceSat + .05), l(.12)),
					"--dsw-alias-border-l1": rgba(surfaceHue, s(-.1), l(.18), .12),
					"--dsw-alias-border-l2": rgba(surfaceHue, s(-.1), l(.22), .22),
					"--dsw-alias-label-primary": hsl(0, 0, 1),
					"--dsw-alias-label-secondary": hsl(0, 0, 1),
					"--dsw-alias-label-tertiary": hsl(0, 0, 1),
					"--dsw-alias-label-caption": hsl(0, 0, 1),
					"--dsw-alias-label-dimmed": hsl(0, 0, 1),
					"--dsw-alias-label-quaternary": hsl(0, 0, 1),
					"--dsw-alias-brand-primary": hsl(secondaryHue, Math.min(1, s(.15) + .05), Math.max(l(.15), .5)),
					"--dsw-alias-brand-text": l(.15) > .6 ? "#000" : "#fff",
					"--dsw-alias-button-primary-hover": hsl(secondaryHue, Math.min(1, s(.15) + .05), Math.max(l(.25), .58)),
					"--dsw-alias-button-primary-dimmed": hsl(secondaryHue, Math.min(1, s(.05) + .02), l(.07)),
					"--dsw-alias-button-elevated-fill": hsl(surfaceHue, surfaceSat, l(.04)),
					"--dsw-alias-interactive-bg-hover": rgba(accentHue, Math.min(1, s(.05) + .05), Math.max(l(.15), .4), .12),
					"--dsw-alias-interactive-bg-active": rgba(accentHue, Math.min(1, s(.05) + .05), Math.max(l(.15), .4), .2),
					"--dsw-alias-markdown-code-block": hsl(h(0), s(0), l(-.06)),
					"--dsw-alias-markdown-inline-code": hsl(h(0), s(0), l(.04)),
					"--dsw-alias-state-error-primary": "#ff5c72",
					"--dsw-alias-state-success-primary": "#3ddc84",
					"--dsw-alias-state-warn-primary": "#ffb347",
					"--dsw-specific-sidebar-fill": hsl(surfaceHue, surfaceSat, l(-.06)),
					"--dsw-specific-sidebar-nav-item-active": hsl(surfaceHue, Math.min(1, surfaceSat + .02), l(.04)),
					"--dsw-specific-sidebar-nav-item-hover": hsl(surfaceHue, surfaceSat, l(0)),
					"--dsw-specific-input-major": hsl(surfaceHue, surfaceSat, l(.02)),
					"--dsw-alias-scrollbar-bg-l1": hsl(surfaceHue, Math.min(1, surfaceSat + .02), l(.12)),
					"--dsw-alias-scrollbar-bg-l2": hsl(surfaceHue, Math.min(1, surfaceSat + .04), l(.16)),
					"--dsw-alias-scrollbar-hover-l1": hsl(surfaceHue, Math.min(1, surfaceSat + .04), l(.22)),
					"--dsw-alias-scrollbar-hover-l2": hsl(surfaceHue, Math.min(1, surfaceSat + .06), l(.22))
				}
			};
			return {
				colorScheme: "light",
				tokens: {
					"--dsw-alias-bg-base": hsl(surfaceHue, surfaceSat, l(.03)),
					"--dsw-alias-bg-layer-1": hsl(surfaceHue, Math.min(1, surfaceSat + .03), l(.07)),
					"--dsw-alias-bg-layer-2": hsl(surfaceHue, Math.min(1, surfaceSat + .05), l(-.03)),
					"--dsw-alias-bg-layer-3": hsl(surfaceHue, Math.min(1, surfaceSat + .08), l(-.09)),
					"--dsw-alias-bg-overlay": hsl(surfaceHue, surfaceSat, l(.08)),
					"--dsw-alias-border-l1": rgba(surfaceHue, s(-.15), l(-.35), .18),
					"--dsw-alias-border-l2": rgba(surfaceHue, s(-.15), l(-.35), .3),
					"--dsw-alias-label-primary": hsl(0, 0, 0),
					"--dsw-alias-label-secondary": hsl(0, 0, 0),
					"--dsw-alias-label-tertiary": hsl(0, 0, 0),
					"--dsw-alias-label-caption": hsl(0, 0, 0),
					"--dsw-alias-label-dimmed": hsl(0, 0, 0),
					"--dsw-alias-label-quaternary": hsl(0, 0, 0),
					"--dsw-alias-brand-primary": hsl(secondaryHue, Math.min(1, s(.1) + .05), Math.min(l(-.18), .45)),
					"--dsw-alias-brand-text": "#fff",
					"--dsw-alias-button-primary-hover": hsl(secondaryHue, Math.min(1, s(.1) + .05), Math.min(l(-.12), .5)),
					"--dsw-alias-button-primary-dimmed": hsl(secondaryHue, Math.min(1, s(.05) + .02), l(-.03)),
					"--dsw-alias-button-elevated-fill": hsl(surfaceHue, Math.min(1, surfaceSat + .02), l(.1)),
					"--dsw-alias-interactive-bg-hover": rgba(accentHue, Math.min(1, s(.05) + .05), l(-.3), .08),
					"--dsw-alias-interactive-bg-active": rgba(accentHue, Math.min(1, s(.05) + .05), l(-.3), .14),
					"--dsw-alias-markdown-code-block": hsl(h(0), s(-.1), l(-.03)),
					"--dsw-alias-markdown-inline-code": hsl(h(0), s(-.08), l(.04)),
					"--dsw-specific-sidebar-fill": hsl(surfaceHue, Math.min(1, surfaceSat + .02), l(-.03)),
					"--dsw-specific-sidebar-nav-item-active": hsl(surfaceHue, Math.min(1, surfaceSat + .05), l(.05)),
					"--dsw-specific-sidebar-nav-item-hover": hsl(surfaceHue, surfaceSat, l(0)),
					"--dsw-specific-input-major": hsl(surfaceHue, Math.min(1, surfaceSat + .02), l(.1)),
					"--dsw-alias-scrollbar-bg-l1": hsl(surfaceHue, Math.min(1, surfaceSat + .02), l(-.08)),
					"--dsw-alias-scrollbar-bg-l2": hsl(surfaceHue, Math.min(1, surfaceSat + .04), l(-.12)),
					"--dsw-alias-scrollbar-hover-l1": hsl(surfaceHue, Math.min(1, surfaceSat + .04), l(-.16)),
					"--dsw-alias-scrollbar-hover-l2": hsl(surfaceHue, Math.min(1, surfaceSat + .06), l(-.16))
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
		/** Fallback palette when only a seed HSL color is known (no wallpaper). */
		function paletteFromHsl([h, s, l]) {
			const lc = l < .55 ? Math.min(.44, Math.max(.2, l)) : Math.max(.6, Math.min(.82, l));
			const hue = (h % 360 + 360) % 360;
			return {
				primary: [
					hue,
					Math.min(.9, Math.max(.15, s)),
					lc
				],
				secondary: [
					(hue + 30) % 360,
					Math.min(.8, Math.max(.2, s)),
					Math.min(.75, Math.max(.35, l))
				],
				tertiary: [
					(hue + 180) % 360,
					Math.min(.7, Math.max(.2, s)),
					Math.min(.7, Math.max(.35, l))
				],
				surface: [
					hue,
					Math.min(.06, s * .3),
					l
				],
				luminance: l
			};
		}
		/** Backward-compatible single-color extraction: returns the primary HSL. */
		async function extractWallpaperColor(dataUrl, bgState) {
			const palette = await extractWallpaperPalette(dataUrl, bgState);
			return palette ? palette.primary : null;
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
		const RENDER_W = 1920;
		const RENDER_H = Math.round(RENDER_W * 9 / 16);
		const RENDER_SIZE = RENDER_W;
		function createCanvas(w, h) {
			const c = document.createElement("canvas");
			c.width = w;
			c.height = h;
			return c;
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
		function renderMeshGradient(params) {
			const w = RENDER_SIZE;
			const h = Math.round(RENDER_SIZE * 9 / 16);
			const c = createCanvas(w, h);
			const g = c.getContext("2d");
			const rng = createRng(params.seed);
			const scale = params.scale;
			const intensity = params.intensity;
			const dark = rng() < .5;
			g.fillStyle = dark ? "#0b0c10" : "#f4f6f8";
			g.fillRect(0, 0, w, h);
			const count = Math.round(6 * scale);
			for (let i = 0; i < count; i++) {
				const cx = rng() * w;
				const cy = rng() * h;
				const r = (.25 + rng() * .55) * Math.min(w, h) * scale;
				const hue = Math.round(rng() * 360);
				const sat = Math.round(40 + rng() * 50 * intensity);
				const lit = dark ? Math.round(15 + rng() * 35 * intensity) : Math.round(65 + rng() * 25 * intensity);
				const rad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
				const alpha = (.25 + rng() * .35 * intensity).toFixed(2);
				rad.addColorStop(0, `hsla(${hue},${sat}%,${lit}%,${alpha})`);
				rad.addColorStop(1, "hsla(0,0%,0%,0)");
				g.fillStyle = rad;
				g.fillRect(0, 0, w, h);
			}
			addNoise(g, w, h, dark ? 12 : 8);
			return c.toDataURL("image/jpeg", .92);
		}
		function addNoise(g, w, h, amount) {
			const id = g.getImageData(0, 0, w, h);
			const d = id.data;
			for (let i = 0; i < d.length; i += 4) {
				const n = (Math.random() - .5) * amount;
				d[i] = Math.max(0, Math.min(255, d[i] + n));
				d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
				d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
			}
			g.putImageData(id, 0, 0);
		}
		function renderShader(params) {
			const w = RENDER_SIZE;
			const h = Math.round(RENDER_SIZE * 9 / 16);
			const c = createCanvas(w, h);
			const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
			if (!gl) return renderMeshGradient({
				type: "mesh",
				seed: params.speed * 1e3,
				scale: params.scale,
				intensity: .6
			});
			const program = createProgram(gl, `
    attribute vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `, shaderFragment(params.preset));
			if (!program) return renderMeshGradient({
				type: "mesh",
				seed: params.speed * 1e3,
				scale: params.scale,
				intensity: .6
			});
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
			gl.viewport(0, 0, w, h);
			gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), w, h);
			gl.uniform1f(gl.getUniformLocation(program, "u_time"), params.speed * 10);
			gl.uniform1f(gl.getUniformLocation(program, "u_scale"), params.scale);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
			return c.toDataURL("image/jpeg", .95);
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

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
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
        float t = u_time * 0.1;
        float n1 = fbm(vec3(uv * 2.0 * u_scale, t));
        float n2 = fbm(vec3(uv * 3.0 * u_scale + 5.2, t * 1.3));
        float bands = smoothstep(0.2, 0.8, 0.5 + 0.5 * sin(uv.y * 6.0 + n1 * 2.0));
        vec3 c1 = vec3(0.05, 0.12, 0.18);
        vec3 c2 = vec3(0.08, 0.35, 0.35);
        vec3 c3 = vec3(0.25, 0.65, 0.45);
        vec3 c4 = vec3(0.55, 0.25, 0.55);
        vec3 col = mix(c1, c2, bands);
        col = mix(col, c3, smoothstep(0.3, 0.7, n1));
        col = mix(col, c4, smoothstep(0.5, 0.9, n2) * 0.6);
        gl_FragColor = vec4(col, 1.0);
      }
    `;
			if (preset === "nebula") return common + `
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float t = u_time * 0.08;
        float n = fbm(vec3(uv * 1.8 * u_scale, t));
        float n2 = fbm(vec3(uv * 4.0 * u_scale - 3.0, t * 0.7));
        vec3 c1 = vec3(0.04, 0.03, 0.12);
        vec3 c2 = vec3(0.15, 0.05, 0.25);
        vec3 c3 = vec3(0.35, 0.12, 0.35);
        vec3 c4 = vec3(0.12, 0.18, 0.45);
        vec3 col = mix(c1, c2, smoothstep(-0.4, 0.6, n));
        col = mix(col, c3, smoothstep(0.2, 0.8, n2) * 0.7);
        col = mix(col, c4, smoothstep(0.4, 0.9, n) * 0.5);
        gl_FragColor = vec4(col, 1.0);
      }
    `;
			return common + `
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float t = u_time * 0.05;
      float n = fbm(vec3(uv * 3.0 * u_scale, t));
      float n2 = fbm(vec3(uv * 8.0 * u_scale + 12.0, t * 1.5));
      vec3 c1 = vec3(0.08, 0.08, 0.10);
      vec3 c2 = vec3(0.18, 0.20, 0.24);
      vec3 c3 = vec3(0.32, 0.34, 0.38);
      vec3 col = mix(c1, c2, 0.5 + 0.5 * n);
      col = mix(col, c3, smoothstep(0.35, 0.85, n2) * 0.4);
      gl_FragColor = vec4(col, 1.0);
    }
  `;
		}
		function renderPattern(params) {
			if (params.preset === "waves") return renderWaves(params);
			if (params.preset === "poly") return renderLowPoly(params);
			return renderDots(params);
		}
		function renderDots(params) {
			const w = RENDER_SIZE;
			const h = Math.round(RENDER_SIZE * 9 / 16);
			const c = createCanvas(w, h);
			const g = c.getContext("2d");
			const rng = createRng(Math.round(params.density * 1e3 + params.scale * 100));
			const dark = rng() < .5;
			g.fillStyle = dark ? "#0a0b0d" : "#f6f7f9";
			g.fillRect(0, 0, w, h);
			const spacing = Math.max(20, 120 * params.scale / (.3 + params.density));
			const baseR = spacing * .25;
			for (let y = spacing / 2; y < h; y += spacing) for (let x = spacing / 2; x < w; x += spacing) {
				const r = baseR * (.4 + rng() * .8);
				const hue = Math.round(rng() * 360);
				const sat = Math.round(30 + rng() * 50);
				const lit = dark ? Math.round(35 + rng() * 35) : Math.round(55 + rng() * 30);
				g.beginPath();
				g.arc(x + (rng() - .5) * spacing * .3, y + (rng() - .5) * spacing * .3, r, 0, Math.PI * 2);
				g.fillStyle = `hsla(${hue},${sat}%,${lit}%,${(.15 + rng() * .35).toFixed(2)})`;
				g.fill();
			}
			addNoise(g, w, h, dark ? 10 : 6);
			return c.toDataURL("image/jpeg", .94);
		}
		function renderWaves(params) {
			const w = RENDER_SIZE;
			const h = Math.round(RENDER_SIZE * 9 / 16);
			const c = createCanvas(w, h);
			const g = c.getContext("2d");
			const rng = createRng(Math.round(params.density * 1e3 + params.scale * 100));
			const dark = rng() < .5;
			g.fillStyle = dark ? "#07080a" : "#f8f9fb";
			g.fillRect(0, 0, w, h);
			const hue = Math.round(rng() * 360);
			const layers = Math.round(4 + params.density * 6);
			for (let i = 0; i < layers; i++) {
				const yBase = h * (.3 + i / layers * .6);
				const amp = 30 * params.scale + rng() * 40;
				const freq = (.003 + rng() * .006) / params.scale;
				const phase = rng() * Math.PI * 2;
				g.beginPath();
				g.moveTo(0, h);
				for (let x = 0; x <= w; x += 8) {
					const y = yBase + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase) * amp * .5;
					g.lineTo(x, y);
				}
				g.lineTo(w, h);
				g.closePath();
				const sat = Math.round(40 + rng() * 40);
				const lit = dark ? Math.round(15 + i / layers * 30) : Math.round(70 - i / layers * 25);
				g.fillStyle = `hsla(${hue + i * 15},${sat}%,${lit}%,${(.25 + rng() * .3).toFixed(2)})`;
				g.fill();
			}
			addNoise(g, w, h, dark ? 10 : 6);
			return c.toDataURL("image/jpeg", .94);
		}
		function renderLowPoly(params) {
			const w = RENDER_SIZE;
			const h = Math.round(RENDER_SIZE * 9 / 16);
			const c = createCanvas(w, h);
			const g = c.getContext("2d");
			const rng = createRng(Math.round(params.density * 1e3 + params.scale * 100));
			const dark = rng() < .5;
			g.fillStyle = dark ? "#08090c" : "#f5f6f8";
			g.fillRect(0, 0, w, h);
			const hue = Math.round(rng() * 360);
			const cols = Math.round(8 + params.density * 16);
			const rows = Math.round(cols * h / w);
			const points = [];
			for (let y = 0; y <= rows; y++) {
				const row = [];
				for (let x = 0; x <= cols; x++) row.push({
					x: x / cols * w + (rng() - .5) * (w / cols) * .7,
					y: y / rows * h + (rng() - .5) * (h / rows) * .7
				});
				points.push(row);
			}
			for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
				const p1 = points[y][x], p2 = points[y][x + 1], p3 = points[y + 1][x];
				const cx = (p1.x + p2.x + p3.x) / 3 / w;
				const lit = dark ? Math.round(12 + cx * 35 + rng() * 15) : Math.round(85 - cx * 25 + rng() * 10);
				g.beginPath();
				g.moveTo(p1.x, p1.y);
				g.lineTo(p2.x, p2.y);
				g.lineTo(p3.x, p3.y);
				g.closePath();
				g.fillStyle = `hsla(${hue + cx * 60},${Math.round(35 + rng() * 35)}%,${lit}%,0.9)`;
				g.fill();
				const p4 = points[y + 1][x + 1];
				g.beginPath();
				g.moveTo(p2.x, p2.y);
				g.lineTo(p4.x, p4.y);
				g.lineTo(p3.x, p3.y);
				g.closePath();
				g.fillStyle = `hsla(${hue + cx * 60 + 10},${Math.round(35 + rng() * 35)}%,${Math.max(0, lit - 5)}%,0.9)`;
				g.fill();
			}
			addNoise(g, w, h, dark ? 8 : 5);
			return c.toDataURL("image/jpeg", .94);
		}
		/** Dispatch to the right generator based on params type. */
		function renderGeneratedBg(params) {
			if (params.type === "mesh") return renderMeshGradient(params);
			if (params.type === "shader") return renderShader(params);
			return renderPattern(params);
		}
		/** Build default params for a newly selected background type. */
		function defaultParamsFor(type) {
			if (type === "mesh") return {
				type: "mesh",
				seed: Math.floor(Math.random() * 1e5),
				scale: 1,
				intensity: .6
			};
			if (type === "shader") return {
				type: "shader",
				preset: "aurora",
				speed: .3,
				scale: 1
			};
			return {
				type: "pattern",
				preset: "dots",
				density: .5,
				scale: 1
			};
		}
		//#endregion
		//#region src/client/wallpaper.ts
		let wpEl = null;
		let appliedTokenNames = [];
		function clearCustomTokens() {
			for (const name of appliedTokenNames) document.body.style.removeProperty(name);
			appliedTokenNames = [];
		}
		/**
		* Write the saved color's full token set as inline variables on body — the
		* same write surface the theme presenter owns, but derived DIRECTLY from the
		* saved pick, so the theme color never depends on the theme service's active
		* state or the presenter's timing. The bg-base, sidebar and layer surfaces are
		* re-emitted at their per-part alpha; every other token (labels, borders,
		* brand) is written verbatim. No reads: nothing can observe a stale or reset
		* theme value and leave the homepage on the system color.
		*/
		function applyCustomTokens(ops) {
			const [h, s, l] = rColor();
			const { tokens } = genTokens(h, s, l, rPalette());
			clearCustomTokens();
			if (l < .55) document.body.setAttribute("data-ds-dark-theme", "dsh-any-background");
			else document.body.removeAttribute("data-ds-dark-theme");
			for (const [name, value] of Object.entries(tokens)) {
				let v = value;
				if (name === "--dsw-alias-bg-base") v = toRgba(value, ops.bg);
				else if (name === "--dsw-specific-sidebar-fill") v = toRgba(value, ops.sidebar);
				else if (name === "--dsw-alias-bg-layer-1" || name === "--dsw-alias-bg-layer-2" || name === "--dsw-alias-bg-layer-3") v = toRgba(value, ops.card);
				document.body.style.setProperty(name, v);
				appliedTokenNames.push(name);
			}
		}
		const SETTINGS_STYLE_RULE = `[role="dialog"][aria-modal="true"][aria-labelledby]{background:var(--dsh-any-bg-settings-surface,var(--dsw-alias-bg-layer-2));backdrop-filter:var(--dsh-any-blur-settings,none)}`;
		function applySettingsOverrides(op) {
			if (op >= 1) {
				document.documentElement.style.removeProperty("--dsh-any-bg-settings-surface");
				return;
			}
			const [h, s, l] = rColor();
			const layer2 = genTokens(h, s, l, rPalette()).tokens["--dsw-alias-bg-layer-2"];
			if (layer2 !== void 0) document.documentElement.style.setProperty("--dsh-any-bg-settings-surface", toRgba(layer2, op));
		}
		/** Derive a Material-You-style palette from the current wallpaper/color and
		*  re-apply so the generated tokens pick it up. Called whenever the wallpaper
		*  source changes (image upload, generated bg switch/regeneration). */
		function refreshPaletteAndApply() {
			const url = rWp();
			const color = rColor();
			if (url) extractWallpaperPalette(url, rBgState()).then((palette) => {
				setPalette(palette ?? paletteFromHsl(color));
				applyWp();
			});
			else {
				setPalette(paletteFromHsl(color));
				applyWp();
			}
		}
		/** Switch the background source type. For generated types a new data URL is
		*  rendered immediately and the parameters are persisted. */
		function setBackgroundType(type) {
			cfg.backgroundType = type;
			if (type === "image") {
				refreshPaletteAndApply();
				return;
			}
			cfg.generatedBg = defaultParamsFor(type);
			setBgState({
				...DEFAULT_CONFIG.bgState,
				iw: RENDER_W,
				ih: RENDER_H
			});
			setWpUrl(renderGeneratedBg(cfg.generatedBg));
			refreshPaletteAndApply();
		}
		/** Regenerate the current generated background from its saved parameters. */
		function regenerateGeneratedBg() {
			const params = cfg.generatedBg;
			if (!params || cfg.backgroundType === "image") return;
			setWpUrl(renderGeneratedBg(params));
			refreshPaletteAndApply();
		}
		/** Update a generated background's parameters and re-render. */
		function updateGeneratedBg(params) {
			cfg.backgroundType = params.type;
			cfg.generatedBg = params;
			setBgState({
				...DEFAULT_CONFIG.bgState,
				iw: RENDER_W,
				ih: RENDER_H
			});
			setWpUrl(renderGeneratedBg(params));
			refreshPaletteAndApply();
		}
		let frameEl = null;
		let sidebarEl = null;
		let centerEl = null;
		let detailsEl = null;
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
			if (px > 0) el.style.backdropFilter = `blur(${px}px)`;
			else el.style.removeProperty("backdrop-filter");
		}
		function applySettingsBlur(px) {
			if (px > 0) document.documentElement.style.setProperty("--dsh-any-blur-settings", `blur(${px}px)`);
			else document.documentElement.style.removeProperty("--dsh-any-blur-settings");
		}
		/** Apply per-part interface blur to the AppFrame columns + settings panel. */
		function applyPartBlurs(blurs) {
			discoverParts();
			setBlur(frameEl, blurs.bg);
			setBlur(sidebarEl, blurs.sidebar);
			setBlur(centerEl, blurs.card);
			setBlur(detailsEl, blurs.card);
			applySettingsBlur(blurs.settings);
		}
		/** Live per-part blur update during slider drag (no full re-apply). */
		function setPartBlur(part, v) {
			if (part === "settings") {
				applySettingsBlur(v);
				return;
			}
			discoverParts();
			if (part === "bg") setBlur(frameEl, v);
			else if (part === "sidebar") setBlur(sidebarEl, v);
			else {
				setBlur(centerEl, v);
				setBlur(detailsEl, v);
			}
		}
		let partsObserver = null;
		/** Watch for the AppFrame mounting so persisted blurs land even when the shell
		*  renders after this plugin's apply. Cheap: once all parts are found, the
		*  callback returns. */
		function watchParts() {
			if (partsObserver !== null || typeof MutationObserver === "undefined") return;
			partsObserver = new MutationObserver(() => {
				if (frameEl !== null && sidebarEl !== null && centerEl !== null && detailsEl !== null && document.body.contains(frameEl)) return;
				applyPartBlurs(rBlurs());
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
		function applyWp() {
			const url = rWp();
			if (!url) {
				wpEl?.remove();
				wpEl = null;
			} else {
				if (!wpEl || !document.body.contains(wpEl)) {
					wpEl = document.createElement("div");
					wpEl.style.cssText = "position:fixed;inset:0;z-index:-1;pointer-events:none;background-repeat:no-repeat;";
					document.body.prepend(wpEl);
				}
				const bg = rBgState();
				wpEl.style.backgroundImage = `url("${url}")`;
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
				const blur = rBl();
				wpEl.style.filter = blur > 0 ? `blur(${blur}px)` : "none";
				wpEl.style.opacity = String(rWop());
			}
			applyCustomTokens(rOps());
			applySettingsOverrides(rSop());
			applyPartBlurs(rBlurs());
		}
		function teardownWp() {
			wpEl?.remove();
			wpEl = null;
			clearCustomTokens();
			document.documentElement.style.removeProperty("--dsh-any-bg-settings-surface");
			document.documentElement.style.removeProperty("--dsh-any-blur-settings");
			setBlur(frameEl, 0);
			setBlur(sidebarEl, 0);
			setBlur(centerEl, 0);
			setBlur(detailsEl, 0);
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
		//#region src/client/styles.ts
		const ST = {
			root: {
				display: "flex",
				flexDirection: "column",
				gap: "20px",
				padding: "4px 0",
				maxWidth: "640px"
			},
			headerRow: {
				display: "flex",
				alignItems: "flex-start",
				justifyContent: "space-between",
				gap: "12px",
				flexWrap: "wrap"
			},
			h2: {
				color: "var(--dsw-alias-label-primary)",
				fontSize: "18px",
				fontWeight: 600,
				margin: 0
			},
			sub: {
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "13px"
			},
			hr: {
				height: "1px",
				background: "var(--dsw-alias-border-l2)",
				border: "none",
				margin: "4px 0"
			},
			label: {
				color: "var(--dsw-alias-label-primary)",
				fontSize: "16px",
				fontWeight: 600,
				marginBottom: "8px"
			},
			hint: {
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "12px",
				lineHeight: "18px",
				marginTop: "4px"
			},
			colorHint: {
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "12px",
				lineHeight: "18px",
				marginTop: "7px",
				textAlign: "center"
			},
			wheelCanvas: {
				cursor: "crosshair",
				borderRadius: "50%"
			},
			center: {
				display: "flex",
				justifyContent: "center"
			},
			wheelRow: {
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				gap: "24px",
				flexWrap: "wrap"
			},
			inputPanel: {
				display: "flex",
				flexDirection: "column",
				gap: "10px",
				minWidth: "168px"
			},
			inputTabs: {
				display: "flex",
				gap: "6px"
			},
			inputTab: {
				height: "26px",
				padding: "0 12px",
				borderRadius: "6px",
				border: "1px solid var(--dsw-alias-border-l2)",
				background: "var(--dsw-alias-button-elevated-fill)",
				color: "var(--dsw-alias-label-tertiary)",
				cursor: "pointer",
				fontSize: "12px",
				font: "inherit"
			},
			inputTabActive: {
				background: "var(--dsw-alias-brand-primary)",
				color: "var(--dsw-alias-brand-text)",
				borderColor: "transparent"
			},
			inputGrid: {
				display: "flex",
				flexDirection: "column",
				gap: "6px"
			},
			inputField: {
				display: "flex",
				alignItems: "center",
				gap: "8px"
			},
			inputLabel: {
				color: "var(--dsw-alias-label-secondary)",
				fontSize: "12px",
				width: "14px",
				textAlign: "center"
			},
			input: {
				flex: 1,
				height: "28px",
				padding: "0 8px",
				borderRadius: "6px",
				border: "1px solid var(--dsw-alias-border-l2)",
				background: "var(--dsw-alias-button-elevated-fill)",
				color: "var(--dsw-alias-label-primary)",
				fontSize: "12px",
				font: "inherit",
				boxSizing: "border-box",
				minWidth: "0"
			},
			swatch: {
				height: "22px",
				borderRadius: "6px",
				border: "1px solid var(--dsw-alias-border-l2)"
			},
			crashBox: {
				display: "flex",
				flexDirection: "column",
				gap: "10px",
				alignItems: "center",
				padding: "24px 16px",
				border: "1px solid var(--dsw-alias-border-l2)",
				borderRadius: "10px"
			},
			crashTitle: {
				color: "var(--dsw-alias-label-primary)",
				fontSize: "15px",
				fontWeight: 600
			},
			crashDesc: {
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "12px",
				textAlign: "center"
			},
			btnGroup: {
				display: "flex",
				justifyContent: "center",
				marginTop: "10px"
			},
			row: {
				display: "flex",
				alignItems: "center",
				gap: "10px",
				flexWrap: "wrap"
			},
			sliderBlock: {
				display: "flex",
				flexDirection: "column",
				gap: "4px"
			},
			sliderRow: {
				display: "flex",
				alignItems: "center",
				gap: "10px"
			},
			sliderLabel: {
				color: "var(--dsw-alias-label-secondary)",
				fontSize: "13px"
			},
			slider: {
				flex: 1,
				accentColor: "var(--dsw-alias-brand-primary)",
				minWidth: "160px"
			},
			sliderVal: {
				color: "var(--dsw-alias-label-secondary)",
				fontSize: "12px",
				whiteSpace: "nowrap",
				width: "44px",
				textAlign: "right"
			},
			btn: {
				height: "32px",
				padding: "0 14px",
				borderRadius: "8px",
				border: "1px solid var(--dsw-alias-border-l2)",
				background: "var(--dsw-alias-button-elevated-fill)",
				color: "var(--dsw-alias-label-primary)",
				cursor: "pointer",
				fontSize: "13px",
				font: "inherit",
				boxSizing: "border-box"
			},
			btnDanger: { color: "var(--dsw-alias-state-error-primary)" },
			btnPrimary: {
				background: "var(--dsw-alias-brand-primary)",
				color: "var(--dsw-alias-brand-text)",
				border: "none"
			},
			preview: {
				width: "368px",
				height: "225px",
				objectFit: "cover",
				borderRadius: "6px",
				border: "1px solid var(--dsw-alias-border-l2)",
				cursor: "pointer"
			},
			sliders: {
				display: "flex",
				flexDirection: "column",
				gap: "12px",
				marginTop: "8px"
			},
			overlay: {
				position: "fixed",
				inset: 0,
				zIndex: 9999,
				background: "rgba(0,0,0,0.7)",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: "12px"
			},
			modalTitle: {
				color: "#fff",
				fontSize: "16px",
				fontWeight: 500
			},
			modalHint: {
				color: "rgba(255,255,255,0.6)",
				fontSize: "12px"
			},
			previewRect: {
				position: "relative",
				overflow: "hidden",
				border: "2px solid rgba(255,255,255,0.3)",
				borderRadius: "8px",
				background: "#000",
				cursor: "grab"
			},
			previewImg: {
				position: "absolute",
				transformOrigin: "0 0",
				pointerEvents: "none"
			},
			modalBtns: {
				display: "flex",
				gap: "10px"
			},
			pickerBox: {
				maxWidth: "min(90vw, 720px)",
				maxHeight: "60vh",
				overflow: "hidden",
				borderRadius: "8px",
				border: "2px solid rgba(255,255,255,0.3)",
				background: "#000",
				cursor: "crosshair"
			},
			pickerCanvas: {
				display: "block",
				maxWidth: "100%",
				maxHeight: "60vh",
				objectFit: "contain"
			},
			pickerBar: {
				display: "flex",
				alignItems: "center",
				gap: "10px",
				minWidth: "260px"
			},
			pickerSwatch: {
				width: "28px",
				height: "28px",
				borderRadius: "6px",
				border: "1px solid rgba(255,255,255,0.4)",
				flexShrink: 0
			},
			pickerValue: {
				color: "#fff",
				fontSize: "13px",
				fontFamily: "monospace"
			},
			magnifier: {
				position: "fixed",
				width: "96px",
				height: "96px",
				borderRadius: "50%",
				border: "2px solid rgba(255,255,255,0.7)",
				boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
				zIndex: 1e4,
				background: "#000",
				pointerEvents: "none",
				transition: "opacity 0.08s"
			}
		};
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
		//#region src/client/components/ColorWheel.tsx
		const WHEEL_SIZE = 220;
		const CX = WHEEL_SIZE / 2;
		const RING_OUTER = 106;
		const RING_INNER = 82;
		const SQ_HALF = Math.round(RING_INNER / Math.SQRT2);
		function drawWheel(cvs, hue, sat, lit) {
			const c = cvs.getContext("2d");
			c.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);
			for (let a = 0; a < 360; a++) {
				const r1 = (a - 90) * Math.PI / 180;
				const r2 = (a + 1.5 - 90) * Math.PI / 180;
				c.beginPath();
				c.arc(CX, CX, RING_OUTER, r1, r2);
				c.arc(CX, CX, RING_INNER, r2, r1, true);
				c.closePath();
				c.fillStyle = `hsl(${a},100%,50%)`;
				c.fill();
			}
			const gx = CX - SQ_HALF, gy = CX - SQ_HALF, sz = SQ_HALF * 2;
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
			const hRad = (hue - 90) * Math.PI / 180;
			const hR = 94;
			const hmx = CX + Math.cos(hRad) * hR, hmy = CX + Math.sin(hRad) * hR;
			c.beginPath();
			c.arc(hmx, hmy, 8, 0, Math.PI * 2);
			c.fillStyle = "rgba(0,0,0,0.25)";
			c.fill();
			c.beginPath();
			c.arc(hmx, hmy, 6.5, 0, Math.PI * 2);
			c.strokeStyle = "#fff";
			c.lineWidth = 2;
			c.stroke();
			const smx = gx + sat * sz, smy = gy + (1 - lit) * sz;
			c.beginPath();
			c.arc(smx, smy, 7, 0, Math.PI * 2);
			c.fillStyle = "rgba(0,0,0,0.25)";
			c.fill();
			c.beginPath();
			c.arc(smx, smy, 5.5, 0, Math.PI * 2);
			c.strokeStyle = "#fff";
			c.lineWidth = 2;
			c.stroke();
			c.beginPath();
			c.arc(smx, smy, 3.5, 0, Math.PI * 2);
			c.strokeStyle = "#000";
			c.lineWidth = 1;
			c.stroke();
		}
		function hitTest(x, y) {
			if (Math.abs(x - CX) <= SQ_HALF && Math.abs(y - CX) <= SQ_HALF) return "square";
			const dx = x - CX, dy = y - CX;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist >= 78 && dist <= 110) return "ring";
			return null;
		}
		function pickHue(x, y) {
			let angle = Math.atan2(y - CX, x - CX) * 180 / Math.PI + 90;
			if (angle < 0) angle += 360;
			return angle;
		}
		function pickSL(x, y) {
			const gx = CX - SQ_HALF, gy = CX - SQ_HALF, sz = SQ_HALF * 2;
			return [Math.max(0, Math.min(1, (x - gx) / sz)), Math.max(.02, Math.min(.98, 1 - (y - gy) / sz))];
		}
		function ColorWheel({ hue, sat, lit, onChange }) {
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
				if (cvsRef.current) drawWheel(cvsRef.current, col.hue, col.sat, col.lit);
			}, [col]);
			const apply = (0, react.useCallback)((nh, ns, nl) => {
				setCol({
					hue: nh,
					sat: ns,
					lit: nl
				});
				onChange(nh, ns, nl);
			}, [onChange]);
			const onDown = (0, react.useCallback)((e) => {
				const r = cvsRef.current.getBoundingClientRect();
				const x = e.clientX - r.left, y = e.clientY - r.top;
				const region = hitTest(x, y);
				if (!region) return;
				if (region === "ring") apply(pickHue(x, y), colRef.current.sat, colRef.current.lit);
				else {
					const [s, l] = pickSL(x, y);
					apply(colRef.current.hue, s, l);
				}
				const onMove = (ev) => {
					const rr = cvsRef.current.getBoundingClientRect();
					const mx = ev.clientX - rr.left, my = ev.clientY - rr.top;
					if (region === "ring") {
						const d = Math.sqrt((mx - CX) ** 2 + (my - CX) ** 2);
						if (d >= 72 && d <= 116) apply(pickHue(mx, my), colRef.current.sat, colRef.current.lit);
					} else {
						const [s, l] = pickSL(mx, my);
						apply(colRef.current.hue, s, l);
					}
				};
				const onUp = () => {
					document.removeEventListener("mousemove", onMove);
					document.removeEventListener("mouseup", onUp);
				};
				document.addEventListener("mousemove", onMove);
				document.addEventListener("mouseup", onUp);
			}, [apply]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("canvas", {
				ref: cvsRef,
				width: WHEEL_SIZE,
				height: WHEEL_SIZE,
				style: ST.wheelCanvas,
				onMouseDown: onDown
			});
		}
		//#endregion
		//#region src/client/components/ColorInputs.tsx
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
				style: ST.inputField,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: ST.inputLabel,
					children: label
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					type: "number",
					min,
					max,
					step,
					value: text,
					style: ST.input,
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
		* Precise color entry next to the wheel: a HSL/RGB mode toggle plus three
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
				style: ST.inputPanel,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: ST.inputTabs,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							style: {
								...ST.inputTab,
								...mode === "hsl" ? ST.inputTabActive : {}
							},
							onClick: () => setMode("hsl"),
							children: "HSL"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							style: {
								...ST.inputTab,
								...mode === "rgb" ? ST.inputTabActive : {}
							},
							onClick: () => setMode("rgb"),
							children: "RGB"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: ST.inputGrid,
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
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: {
						...ST.swatch,
						background: `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`
					} })
				]
			});
		}
		//#endregion
		//#region src/client/components/ColorPicker.tsx
		const MAG_SIZE = 96;
		const MAG_ZOOM = 8;
		function toHex(rgb) {
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
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: ST.overlay,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: ST.modalTitle,
						children: t("pickerTitle")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: ST.modalHint,
						children: t("pickerHint")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: ST.pickerBox,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("canvas", {
							ref: canvasRef,
							style: ST.pickerCanvas,
							onMouseMove: onMove,
							onMouseLeave: () => {
								setHover(null);
								setMag(null);
							},
							onClick
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: ST.pickerBar,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: {
							...ST.pickerSwatch,
							background: hover ? toHex(hover.rgb) : "transparent"
						} }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: ST.pickerValue,
							children: hover ? `${toHex(hover.rgb)} · rgb(${hover.rgb.join(", ")})` : "—"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: ST.modalBtns,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							style: ST.btn,
							onClick: onClose,
							children: t("pickerClose")
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("canvas", {
						ref: magRef,
						width: MAG_SIZE,
						height: MAG_SIZE,
						style: {
							...ST.magnifier,
							left: mag?.x ?? 0,
							top: mag?.y ?? 0,
							opacity: mag ? 1 : 0
						}
					})
				]
			});
		}
		//#endregion
		//#region src/client/components/BgEditor.tsx
		function BgEditor({ url, t, onClose, onCommit }) {
			const pw = Math.min(window.innerWidth * .75, 860);
			const ph = Math.round(pw * window.innerHeight / window.innerWidth);
			const saved = rBgState();
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
					const s = rBgState();
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
				const factor = e.deltaY > 0 ? .92 : 1.08;
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
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: ST.overlay,
				onClick: (e) => {
					if (e.target === e.currentTarget) onClose();
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: ST.modalTitle,
						children: t("editorTitle")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						ref: containerRef,
						style: {
							...ST.previewRect,
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
								...ST.previewImg,
								width: imgSize.w,
								height: imgSize.h,
								transform: `translate(${pos.x}px,${pos.y}px) scale(${zoom})`
							}
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: ST.modalHint,
						children: t("editorHint")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: ST.modalBtns,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								style: ST.btn,
								onClick: resetView,
								children: t("editorReset")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								style: ST.btn,
								onClick: onClose,
								children: t("editorCancel")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								style: {
									...ST.btn,
									...ST.btnPrimary
								},
								onClick: () => onCommit(zoom, (pos.x + imgSize.w * zoom / 2) / pw, (pos.y + imgSize.h * zoom / 2) / ph, imgRef.current?.naturalWidth ?? 0, imgRef.current?.naturalHeight ?? 0),
								children: t("editorCommit")
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/components/LiveSlider.tsx
		function LiveSlider({ min, max, step, def, fmt, label, onInput, onChange }) {
			const valRef = (0, react.useRef)(null);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: ST.sliderRow,
				children: [
					label ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: ST.sliderLabel,
						children: label
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						type: "range",
						min,
						max,
						step,
						defaultValue: def,
						style: ST.slider,
						onInput: (e) => {
							const v = Number(e.target.value);
							onInput(v);
							if (valRef.current) valRef.current.textContent = fmt(v);
						},
						onChange: (e) => onChange(Number(e.target.value))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						ref: valRef,
						style: ST.sliderVal,
						children: fmt(def)
					})
				]
			});
		}
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
					style: ST.crashBox,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: ST.crashTitle,
							children: this.props.t("crashTitle")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: ST.crashDesc,
							children: this.props.t("crashDesc")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							style: ST.btn,
							onClick: this.reset,
							children: this.props.t("crashReset")
						})
					]
				});
				return this.props.children;
			}
		};
		//#endregion
		//#region src/client/components/ThemeSection.tsx
		const BG_TYPES = [
			"image",
			"mesh",
			"shader",
			"pattern"
		];
		function ThemeSection(props) {
			const { t, hue, sat, lit, setColor, setWp, setOps, setBlurs, setWop, setBl, setSop, backgroundType, generatedBg, setBgType, setGeneratedBg, regenerateBg, useStore, extractColor, exportTheme, importTheme } = props;
			const storeUrl = useStore((s) => s.url);
			const storeColor = useStore((s) => s.color);
			const fileRef = (0, react.useRef)(null);
			const importRef = (0, react.useRef)(null);
			const [editorOpen, setEditorOpen] = (0, react.useState)(false);
			const [pickerOpen, setPickerOpen] = (0, react.useState)(false);
			const [extracting, setExtracting] = (0, react.useState)(false);
			const [extractMsg, setExtractMsg] = (0, react.useState)(null);
			const [importMsg, setImportMsg] = (0, react.useState)(null);
			const msgTimer = (0, react.useRef)(void 0);
			(0, react.useEffect)(() => () => window.clearTimeout(msgTimer.current), []);
			const showMsg = (setter, key) => {
				setter(t(key));
				window.clearTimeout(msgTimer.current);
				msgTimer.current = window.setTimeout(() => setter(null), 2500);
			};
			const onExtract = async () => {
				if (!storeUrl || extracting) return;
				setExtracting(true);
				try {
					showMsg(setExtractMsg, await extractColor() ? "extractDone" : "extractFail");
				} catch {
					showMsg(setExtractMsg, "extractFail");
				} finally {
					setExtracting(false);
				}
			};
			const onImport = async (file) => {
				try {
					showMsg(setImportMsg, await importTheme(file) ? "importDone" : "importFail");
				} catch {
					showMsg(setImportMsg, "importFail");
				}
			};
			const wheel = storeColor ?? [
				hue,
				sat,
				lit
			];
			const blurSlider = (part) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
				label: t("uiBlur"),
				min: 0,
				max: 60,
				step: 1,
				def: rBlurs()[part],
				fmt: (v) => `${v}px`,
				onInput: (v) => {
					const blurs = { ...rBlurs() };
					blurs[part] = v;
					cfg.blurs = blurs;
					setPartBlur(part, v);
					saveConfig();
				},
				onChange: (v) => {
					const blurs = { ...rBlurs() };
					blurs[part] = v;
					setBlurs(blurs);
				}
			});
			const partSlider = (labelKey, part) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: ST.sliderBlock,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: ST.sliderLabel,
						children: t(labelKey)
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
						label: t("uiOpacity"),
						min: 0,
						max: 100,
						step: 1,
						def: Math.round(rOps()[part] * 100),
						fmt: (v) => `${v}%`,
						onInput: (v) => {
							const ops = { ...rOps() };
							ops[part] = v / 100;
							cfg.opacities = ops;
							applyCustomTokens(ops);
							saveConfig();
						},
						onChange: (v) => {
							const ops = { ...rOps() };
							ops[part] = v / 100;
							setOps(ops);
						}
					}),
					blurSlider(part)
				]
			});
			const typeLabel = (type) => {
				switch (type) {
					case "image": return t("bgTypeImage");
					case "mesh": return t("bgTypeMesh");
					case "shader": return t("bgTypeShader");
					case "pattern": return t("bgTypePattern");
				}
			};
			const presetLabel = (key) => {
				if (key === "aurora") return t("presetAurora");
				if (key === "nebula") return t("presetNebula");
				if (key === "noise") return t("presetNoise");
				if (key === "dots") return t("presetDots");
				if (key === "waves") return t("presetWaves");
				if (key === "poly") return t("presetPoly");
				return key;
			};
			const updateGenerated = (patch) => {
				if (!generatedBg) return;
				setGeneratedBg({
					...generatedBg,
					...patch
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ErrorBoundary, {
				t,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: ST.root,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: ST.headerRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
								style: ST.h2,
								children: t("nav")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: ST.sub,
								children: t("subtitle")
							})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: ST.row,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										style: ST.btn,
										onClick: exportTheme,
										children: t("exportTheme")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										style: ST.btn,
										onClick: () => importRef.current?.click(),
										children: t("importTheme")
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
						importMsg ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: ST.colorHint,
							children: importMsg
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: ST.label,
								children: t("colorTitle")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: ST.wheelRow,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ColorWheel, {
									hue: wheel[0],
									sat: wheel[1],
									lit: wheel[2],
									onChange: setColor
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ColorInputs, {
									hue: wheel[0],
									sat: wheel[1],
									lit: wheel[2],
									onChange: setColor
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: ST.colorHint,
								children: t("colorHint")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: ST.btnGroup,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: {
										...ST.btn,
										opacity: !storeUrl || extracting ? .55 : 1
									},
									title: !storeUrl ? t("extractNoWp") : void 0,
									disabled: !storeUrl || extracting,
									onClick: onExtract,
									children: extracting ? t("extracting") : t("extractColor")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: {
										...ST.btn,
										opacity: !storeUrl ? .55 : 1
									},
									title: !storeUrl ? t("extractNoWp") : void 0,
									disabled: !storeUrl,
									onClick: () => setPickerOpen(true),
									children: t("eyedropper")
								})]
							}),
							extractMsg ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: ST.colorHint,
								children: extractMsg
							}) : null
						] }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("hr", { style: ST.hr }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: ST.label,
							children: t("uiTitle")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: ST.sliders,
							children: [
								partSlider("uiOpacityBg", "bg"),
								partSlider("uiOpacitySide", "sidebar"),
								partSlider("uiOpacityCard", "card"),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: ST.sliderBlock,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											style: ST.sliderLabel,
											children: t("uiSop")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
											label: t("uiOpacity"),
											min: 0,
											max: 100,
											step: 1,
											def: Math.round(rSop() * 100),
											fmt: (v) => `${v}%`,
											onInput: (v) => {
												const op = v / 100;
												cfg.settingsOpacity = op;
												applySettingsOverrides(op);
												saveConfig();
											},
											onChange: (v) => setSop(v / 100)
										}),
										blurSlider("settings")
									]
								})
							]
						})] }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("hr", { style: ST.hr }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: ST.label,
								children: t("bgTitle")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: ST.center,
								children: storeUrl ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
									src: storeUrl,
									alt: "",
									style: ST.preview,
									onClick: () => setEditorOpen(true)
								}) : null
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: {
									...ST.row,
									justifyContent: "center",
									marginTop: "10px"
								},
								children: BG_TYPES.map((type) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: {
										...ST.btn,
										...backgroundType === type ? ST.btnPrimary : {}
									},
									onClick: () => setBgType(type),
									children: typeLabel(type)
								}, type))
							}),
							backgroundType === "image" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: ST.btnGroup,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: ST.row,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											style: ST.btn,
											onClick: () => fileRef.current?.click(),
											children: t("bgChoose")
										}),
										storeUrl ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											style: ST.btn,
											onClick: () => setEditorOpen(true),
											children: t("bgEdit")
										}) : null,
										storeUrl ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											style: {
												...ST.btn,
												...ST.btnDanger
											},
											onClick: () => setWp(null),
											children: t("bgRemove")
										}) : null,
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											ref: fileRef,
											type: "file",
											accept: "image/*",
											style: { display: "none" },
											onChange: (e) => {
												const f = e.target.files?.[0];
												if (!f) return;
												readImg(f, (d) => {
													if (d) setWp(d);
													e.target.value = "";
												});
											}
										})
									]
								})
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: ST.btnGroup,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: {
										...ST.btn,
										...ST.btnPrimary
									},
									onClick: regenerateBg,
									children: t("bgRegenerate")
								}), storeUrl ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: {
										...ST.btn,
										...ST.btnDanger
									},
									onClick: () => setWp(null),
									children: t("bgRemove")
								}) : null]
							}),
							backgroundType === "mesh" && generatedBg?.type === "mesh" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: ST.sliders,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
									label: t("bgMeshScale"),
									min: 30,
									max: 300,
									step: 1,
									def: Math.round(generatedBg.scale * 100),
									fmt: (v) => `${v}%`,
									onInput: () => {},
									onChange: (v) => updateGenerated({ scale: v / 100 })
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
									label: t("bgMeshIntensity"),
									min: 0,
									max: 100,
									step: 1,
									def: Math.round(generatedBg.intensity * 100),
									fmt: (v) => `${v}%`,
									onInput: () => {},
									onChange: (v) => updateGenerated({ intensity: v / 100 })
								})]
							}) : null,
							backgroundType === "shader" && generatedBg?.type === "shader" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: ST.sliders,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										style: ST.row,
										children: [
											"aurora",
											"nebula",
											"noise"
										].map((p) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											style: {
												...ST.btn,
												...generatedBg.preset === p ? ST.btnPrimary : {}
											},
											onClick: () => updateGenerated({ preset: p }),
											children: presetLabel(p)
										}, p))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
										label: t("bgShaderSpeed"),
										min: 0,
										max: 200,
										step: 1,
										def: Math.round(generatedBg.speed * 100),
										fmt: (v) => `${v}%`,
										onInput: () => {},
										onChange: (v) => updateGenerated({ speed: v / 100 })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
										label: t("bgShaderScale"),
										min: 30,
										max: 300,
										step: 1,
										def: Math.round(generatedBg.scale * 100),
										fmt: (v) => `${v}%`,
										onInput: () => {},
										onChange: (v) => updateGenerated({ scale: v / 100 })
									})
								]
							}) : null,
							backgroundType === "pattern" && generatedBg?.type === "pattern" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: ST.sliders,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										style: ST.row,
										children: [
											"dots",
											"waves",
											"poly"
										].map((p) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											style: {
												...ST.btn,
												...generatedBg.preset === p ? ST.btnPrimary : {}
											},
											onClick: () => updateGenerated({ preset: p }),
											children: presetLabel(p)
										}, p))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
										label: t("bgPatternDensity"),
										min: 0,
										max: 100,
										step: 1,
										def: Math.round(generatedBg.density * 100),
										fmt: (v) => `${v}%`,
										onInput: () => {},
										onChange: (v) => updateGenerated({ density: v / 100 })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
										label: t("bgPatternScale"),
										min: 30,
										max: 300,
										step: 1,
										def: Math.round(generatedBg.scale * 100),
										fmt: (v) => `${v}%`,
										onInput: () => {},
										onChange: (v) => updateGenerated({ scale: v / 100 })
									})
								]
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: ST.sliders,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: ST.sliderBlock,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										style: ST.sliderLabel,
										children: t("wpOpacity")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
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
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: ST.sliderBlock,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										style: ST.sliderLabel,
										children: t("bgBlur")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
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
									})]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: ST.hint,
								children: t("bgHint")
							})
						] }),
						pickerOpen && storeUrl ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ColorPicker, {
							url: storeUrl,
							t,
							onClose: () => setPickerOpen(false),
							onPick: (hsv) => {
								setColor(hsv[0], hsv[1], hsv[2]);
								setPickerOpen(false);
							}
						}) : null,
						editorOpen && storeUrl ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BgEditor, {
							url: storeUrl,
							t,
							onClose: () => setEditorOpen(false),
							onCommit: (z, x, y, iw, ih) => {
								cfg.bgState = {
									zoom: z,
									x,
									y,
									iw,
									ih
								};
								applyWp();
								saveConfig();
								setEditorOpen(false);
							}
						}) : null
					]
				})
			});
		}
		//#endregion
		//#region src/client/components/icons.tsx
		/** Sun glyph, migrated from @deepseek-ai/dsh-client-ui-primitives IconLightOutline16. */
		const SUN_PATHS = "<path d=\"M11.3496 8C11.3496 6.14985 9.85015 4.65039 8 4.65039C6.14985 4.65039 4.65039 6.14985 4.65039 8C4.65039 9.85015 6.14985 11.3496 8 11.3496C9.85015 11.3496 11.3496 9.85015 11.3496 8ZM12.6504 8C12.6504 10.5681 10.5681 12.6504 8 12.6504C5.43188 12.6504 3.34961 10.5681 3.34961 8C3.34961 5.43188 5.43188 3.34961 8 3.34961C10.5681 3.34961 12.6504 5.43188 12.6504 8Z\" fill=\"currentColor\"/><path d=\"M8.65039 0.5V2.5H7.34961V0.5H8.65039Z\" fill=\"currentColor\"/><path d=\"M8.65039 13.5V15.5H7.34961V13.5H8.65039Z\" fill=\"currentColor\"/><path d=\"M3.15808 2.24035L4.57229 3.65456L3.6525 4.57435L2.23829 3.16014L3.15808 2.24035Z\" fill=\"currentColor\"/><path d=\"M12.3505 11.4327L13.7647 12.8469L12.8449 13.7667L11.4307 12.3525L12.3505 11.4327Z\" fill=\"currentColor\"/><path d=\"M2.24537 12.8469L3.65958 11.4327L4.57937 12.3525L3.16516 13.7667L2.24537 12.8469Z\" fill=\"currentColor\"/><path d=\"M11.4377 3.65455L12.852 2.24033L13.7718 3.16012L12.3575 4.57434L11.4377 3.65455Z\" fill=\"currentColor\"/><path d=\"M0.5 7.35461H2.5V8.6554H0.5L0.5 7.35461Z\" fill=\"currentColor\"/><path d=\"M13.5 7.35461H15.5V8.6554H13.5V7.35461Z\" fill=\"currentColor\"/>";
		//#endregion
		//#region src/client/index.tsx
		/**
		* dsh-any-background — browser half entry.
		*
		* Appearance plugin with:
		* 1. PS-style color wheel (hue ring + saturation/lightness square) for
		*    real-time theme color selection with dynamic token generation.
		* 2. Background image editor modal with drag-to-pan and scroll-to-zoom
		*    inside a viewport-proportional preview rectangle.
		* 3. Opacity / blur sliders with zero-lag direct DOM manipulation: the
		*    homepage background opacity (主界面) and the settings panel opacity
		*    (设置界面透明度) are separate sliders.
		*
		* This file wires the plugin lifecycle (theme registration, wallpaper layer,
		* viewport watch, i18n, settings-section injection, boot restore, watchdog).
		* The heavy lifting lives in the sibling modules:
		*   state.ts       in-memory config mirror + getters
		*   rpc.ts         file-backed persistence over the /dsh-any-background channel
		*   wallpaper.ts   wallpaper DOM layer + inline token writes
		*   utils/         color math, token generation, image compression
		*   components/    ColorWheel, BgEditor, LiveSlider, ThemeSection
		*   i18n.ts        zh/en dictionaries
		*   styles.ts      shared inline styles
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
			}, "dsh-any-background: skin dispose");
			let styleEl;
			if (typeof document !== "undefined") {
				styleEl = document.createElement("style");
				styleEl.dataset.plugin = "dsh-any-background";
				styleEl.textContent = `body[data-ds-dark-theme="dsh-any-background"]::before{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(255,255,255,0.03) 0%,transparent 60%)}${SETTINGS_STYLE_RULE}`;
				document.head.appendChild(styleEl);
			}
			ctx.effect(() => () => {
				styleEl?.parentNode?.removeChild(styleEl);
			}, "dsh-any-background: gradient");
			let rev = 0;
			let colorRev = 0;
			const store = (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
				init: () => ({
					url: null,
					rev: -1,
					colorRev: -1,
					color: null
				}),
				actions: {
					syncBg: (d, url, r) => {
						if (r <= d.rev) return;
						d.url = url;
						d.rev = r;
					},
					syncColor: (d, hsv, r) => {
						if (r <= d.colorRev) return;
						d.color = hsv;
						d.colorRev = r;
					}
				}
			});
			let bound = null;
			const syncBg = () => {
				rev++;
				bound?.syncBg(rWp(), rev);
			};
			applyWp();
			syncBg();
			watchParts();
			loadPersisted().then(() => {
				if (rHasColor()) {
					const [h, s, l] = rColor();
					registerCustom(h, s, l);
				}
				if (cfg.backgroundType !== "image") regenerateGeneratedBg();
				else refreshPaletteAndApply();
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
				const [wh, ws, wl] = rColor();
				const [dh, ds, dv] = hslToHsv(wh, ws, wl);
				return {
					t: ctx.locale.bind(NS),
					hue: dh,
					sat: ds,
					lit: dv,
					backgroundType: cfg.backgroundType,
					generatedBg: cfg.generatedBg,
					setColor: (nh, ns, nl) => {
						const [sh, ss, sl] = hsvToHsl(nh, ns, nl);
						cfg.color = [
							sh,
							ss,
							sl
						];
						registerCustom(sh, ss, sl);
						refreshPaletteAndApply();
						saveConfig();
						colorRev++;
						bound?.syncColor([
							nh,
							ns,
							nl
						], colorRev);
					},
					setWp: (u) => {
						cfg.backgroundType = "image";
						setWpUrl(u);
						setBgState({ ...DEFAULT_CONFIG.bgState });
						persistWallpaper(u);
						refreshPaletteAndApply();
						syncBg();
					},
					setBgType: (type) => {
						setBackgroundType(type);
						if (type !== "image") persistWallpaper(null);
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
						saveConfig();
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
						const hsl = await extractWallpaperColor(url, rBgState());
						if (!hsl) return false;
						cfg.color = hsl;
						registerCustom(hsl[0], hsl[1], hsl[2]);
						refreshPaletteAndApply();
						saveConfig();
						const hsv = hslToHsv(hsl[0], hsl[1], hsl[2]);
						colorRev++;
						bound?.syncColor(hsv, colorRev);
						return true;
					},
					exportTheme: () => {
						const payload = {
							version: 2,
							exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
							config: cfg,
							wallpaper: cfg.backgroundType === "image" ? rWp() : null
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
							if (cfg.backgroundType === "image") {
								const wallpaper = typeof d.wallpaper === "string" && /^data:image\//.test(d.wallpaper) ? d.wallpaper : null;
								setWpUrl(wallpaper);
								persistWallpaper(wallpaper);
								refreshPaletteAndApply();
							} else {
								setWpUrl(null);
								persistWallpaper(null);
								regenerateGeneratedBg();
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
					const [h, s, l] = rColor();
					registerCustom(h, s, l);
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