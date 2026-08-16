window.__ModuleLoader__.load({
	id: "dsh-any-background",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/index.tsx
		const name = "dsh-any-background";
		const inject = [
			"slots",
			"locale",
			"theme",
			"connection"
		];
		const NS = "settings.anyBg";
		const DEF_OP = .85;
		const DEF_BL = 0;
		const DEF_SOP = 1;
		const CUSTOM_ID = "custom-color";
		const zh = {
			nav: "主题",
			subtitle: "自定义界面外观",
			colorTitle: "主题色",
			colorHint: "在色轮上选择色相，在方形中调整饱和度和明度",
			uiTitle: "界面",
			uiOpacity: "主界面透明度",
			uiOpacityHint: "拖动滑块调整主页界面背景的透明度",
			uiSop: "设置界面透明度",
			uiSopHint: "拖动滑块调整设置页界面背景的透明度",
			bgTitle: "背景图片",
			bgChoose: "选择图片",
			bgRemove: "移除图片",
			bgEdit: "编辑位置",
			wpOpacity: "壁纸透明度",
			bgBlur: "壁纸模糊",
			bgHint: "拖动滑块实时调整。点击背景图可打开编辑器调整位置和大小",
			editorTitle: "背景编辑器",
			editorHint: "拖动移动图片，滚轮缩放大小",
			editorCommit: "确认",
			editorCancel: "取消",
			editorReset: "重置"
		};
		const en = {
			nav: "Theme",
			subtitle: "Customize appearance",
			colorTitle: "Theme color",
			colorHint: "Pick hue on the ring, adjust saturation & lightness in the square",
			uiTitle: "Interface",
			uiOpacity: "Main interface opacity",
			uiOpacityHint: "Drag to adjust homepage interface background opacity",
			uiSop: "Settings interface opacity",
			uiSopHint: "Drag to adjust the settings page background opacity",
			bgTitle: "Wallpaper",
			bgChoose: "Choose image",
			bgRemove: "Remove image",
			bgEdit: "Edit position",
			wpOpacity: "Wallpaper opacity",
			bgBlur: "Wallpaper blur",
			bgHint: "Drag sliders for real-time adjustment. Click the image to open the editor",
			editorTitle: "Background editor",
			editorHint: "Drag to move, scroll to zoom",
			editorCommit: "Confirm",
			editorCancel: "Cancel",
			editorReset: "Reset"
		};
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
		let cfg = {
			...DEFAULT_CONFIG,
			bgState: { ...DEFAULT_CONFIG.bgState }
		};
		let wpUrl = null;
		let rpcCallFn = null;
		const RPC_CHANNEL = "/dsh-any-background";
		const RPC_NS = "dshAnyBackground";
		const rpcEndpoint = (method) => `${RPC_NS}/${method}`;
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
		/** Move a possibly-absent partial config into the shape the UI reads. */
		function adoptConfig(raw) {
			const c = raw ?? {};
			const color = Array.isArray(c.color) && c.color.length === 3 ? [
				c.color[0],
				c.color[1],
				c.color[2]
			] : null;
			const bg = c.bgState ?? {};
			cfg = {
				color,
				opacity: typeof c.opacity === "number" ? c.opacity : DEFAULT_CONFIG.opacity,
				settingsOpacity: typeof c.settingsOpacity === "number" ? c.settingsOpacity : DEFAULT_CONFIG.settingsOpacity,
				wallpaperOpacity: typeof c.wallpaperOpacity === "number" ? c.wallpaperOpacity : DEFAULT_CONFIG.wallpaperOpacity,
				blur: typeof c.blur === "number" ? c.blur : DEFAULT_CONFIG.blur,
				bgState: {
					zoom: typeof bg.zoom === "number" ? bg.zoom : 1,
					x: typeof bg.x === "number" ? bg.x : 0,
					y: typeof bg.y === "number" ? bg.y : 0,
					iw: typeof bg.iw === "number" && bg.iw > 0 ? bg.iw : 0,
					ih: typeof bg.ih === "number" && bg.ih > 0 ? bg.ih : 0
				}
			};
		}
		/** Persist the current in-memory config to the node half (fire-and-forget). */
		function saveConfig() {
			rpcCall("writeConfig", { config: cfg });
		}
		/** Load the persisted theme (config + wallpaper) from the node half. */
		async function loadPersisted() {
			const data = await rpcCall("read", {});
			if (data) {
				if (data.config) adoptConfig(data.config);
				if (typeof data.wallpaper === "string") wpUrl = data.wallpaper;
				else if (data.wallpaper === null) wpUrl = null;
			}
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
		function rOp() {
			return typeof cfg.opacity === "number" ? Math.min(1, Math.max(0, cfg.opacity)) : DEF_OP;
		}
		function rWop() {
			return typeof cfg.wallpaperOpacity === "number" ? Math.min(1, Math.max(0, cfg.wallpaperOpacity)) : 1;
		}
		function rBl() {
			return typeof cfg.blur === "number" ? Math.min(60, Math.max(0, cfg.blur)) : DEF_BL;
		}
		function rSop() {
			return typeof cfg.settingsOpacity === "number" ? Math.min(1, Math.max(0, cfg.settingsOpacity)) : DEF_SOP;
		}
		function rBgState() {
			return cfg.bgState;
		}
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
		function genTokens(hue, sat, lit) {
			const dark = lit < .55;
			const h = (d) => ((hue + d) % 360 + 360) % 360;
			const s = (d) => Math.max(0, Math.min(1, sat + d));
			const l = (d) => Math.max(0, Math.min(1, lit + d));
			const hsl = (hh, ss, ll) => `hsl(${Math.round(hh)},${Math.round(ss * 100)}%,${Math.round(ll * 100)}%)`;
			const rgba = (hh, ss, ll, a) => {
				`${Math.round(hh)}${Math.round(ss * 100)}${Math.round(ll * 100)}`;
				return `hsla(${Math.round(hh)},${Math.round(ss * 100)}%,${Math.round(ll * 100)}%,${a})`;
			};
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
					"--dsw-alias-interactive-bg-hover": rgba(h(0), s(0), l(-.3), .08),
					"--dsw-alias-interactive-bg-active": rgba(h(0), s(0), l(-.3), .14),
					"--dsw-alias-markdown-code-block": hsl(h(0), s(-.1), l(-.03)),
					"--dsw-alias-markdown-inline-code": hsl(h(0), s(-.08), l(.04)),
					"--dsw-specific-sidebar-fill": hsl(h(0), s(-.1), l(-.03)),
					"--dsw-specific-sidebar-nav-item-active": hsl(h(0), s(-.08), l(.05)),
					"--dsw-specific-sidebar-nav-item-hover": hsl(h(0), s(-.12), l(0)),
					"--dsw-specific-input-major": hsl(h(0), s(-.12), l(.1)),
					"--dsw-alias-scrollbar-bg-l1": hsl(h(0), s(-.1), l(-.08)),
					"--dsw-alias-scrollbar-bg-l2": hsl(h(0), s(-.08), l(-.12)),
					"--dsw-alias-scrollbar-hover-l1": hsl(h(0), s(-.08), l(-.16)),
					"--dsw-alias-scrollbar-hover-l2": hsl(h(0), s(-.08), l(-.16))
				}
			};
		}
		let wpEl = null;
		let ctxRef = null;
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
		let appliedTokenNames = [];
		/** Remove every inline token this plugin wrote (teardown symmetry). */
		function clearCustomTokens() {
			for (const name of appliedTokenNames) document.body.style.removeProperty(name);
			appliedTokenNames = [];
		}
		/**
		* Write the saved color's full token set as inline variables on body — the
		* same write surface the theme presenter owns, but derived DIRECTLY from the
		* saved pick, so the theme color never depends on the theme service's active
		* state or the presenter's timing. The bg-base and sidebar tokens are
		* re-emitted at the requested alpha; every other token (layers, labels,
		* borders, brand) is written verbatim. No reads: nothing can observe a stale
		* or reset theme value and leave the homepage on the system color.
		*/
		function applyCustomTokens(op) {
			const [h, s, l] = rColor();
			const { tokens } = genTokens(h, s, l);
			const sideOp = Math.min(1, op + .08);
			clearCustomTokens();
			if (l < .55) document.body.setAttribute("data-ds-dark-theme", "");
			else document.body.removeAttribute("data-ds-dark-theme");
			for (const [name, value] of Object.entries(tokens)) {
				let v = value;
				if (name === "--dsw-alias-bg-base") v = toRgba(value, op);
				else if (name === "--dsw-specific-sidebar-fill") v = toRgba(value, sideOp);
				document.body.style.setProperty(name, v);
				appliedTokenNames.push(name);
			}
		}
		const SETTINGS_STYLE_RULE = `[role="dialog"][aria-modal="true"][aria-labelledby]{background:var(--dsh-any-bg-settings-surface,var(--dsw-alias-bg-layer-2))}`;
		function applySettingsOverrides(op) {
			if (op >= 1) {
				document.documentElement.style.removeProperty("--dsh-any-bg-settings-surface");
				return;
			}
			const [h, s, l] = rColor();
			const layer2 = genTokens(h, s, l).tokens["--dsw-alias-bg-layer-2"];
			if (layer2 !== void 0) document.documentElement.style.setProperty("--dsh-any-bg-settings-surface", toRgba(layer2, op));
		}
		function applyWp(ctx) {
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
			applyCustomTokens(rOp());
			applySettingsOverrides(rSop());
		}
		function teardownWp() {
			wpEl?.remove();
			wpEl = null;
			clearCustomTokens();
			document.documentElement.style.removeProperty("--dsh-any-bg-settings-surface");
		}
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
		function compress(img, side, q) {
			const s = Math.min(1, side / Math.max(img.width, img.height));
			const c = document.createElement("canvas");
			c.width = Math.max(1, Math.round(img.width * s));
			c.height = Math.max(1, Math.round(img.height * s));
			c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
			return c.toDataURL("image/jpeg", q);
		}
		function readImg(file, cb) {
			const r = new FileReader();
			r.onerror = () => cb(null);
			r.onload = () => {
				const img = new Image();
				img.onerror = () => cb(null);
				img.onload = () => {
					try {
						let u = compress(img, 1600, .75);
						if (u.length > 2e6) u = compress(img, 1e3, .6);
						if (u.length > 2e6) u = compress(img, 800, .5);
						cb(u);
					} catch {
						cb(null);
					}
				};
				img.src = r.result;
			};
			r.readAsDataURL(file);
		}
		const ST = {
			root: {
				display: "flex",
				flexDirection: "column",
				gap: "20px",
				padding: "4px 0",
				maxWidth: "640px"
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
			smallHint: {
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "11px",
				lineHeight: "16px"
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
			}
		};
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
				const rect = containerRef.current.getBoundingClientRect();
				const mx = e.clientX - rect.left, my = e.clientY - rect.top;
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
		function LiveSlider({ min, max, step, def, fmt, onInput, onChange }) {
			const valRef = (0, react.useRef)(null);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: ST.sliderRow,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
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
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					ref: valRef,
					style: ST.sliderVal,
					children: fmt(def)
				})]
			});
		}
		function ThemeSection(props) {
			const { t, hue, sat, lit, setColor, url, setWp, setOp, setWop, setBl, setSop, useStore } = props;
			const storeUrl = useStore((s) => s.url);
			const fileRef = (0, react.useRef)(null);
			const [editorOpen, setEditorOpen] = (0, react.useState)(false);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: ST.root,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						style: ST.h2,
						children: t("nav")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: ST.sub,
						children: t("subtitle")
					})] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: ST.label,
							children: t("colorTitle")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: ST.center,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ColorWheel, {
								hue,
								sat,
								lit,
								onChange: setColor
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: ST.colorHint,
							children: t("colorHint")
						})
					] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("hr", { style: ST.hr }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: ST.label,
						children: t("uiTitle")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: ST.sliders,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: ST.sliderBlock,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: ST.sliderLabel,
									children: t("uiOpacity")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: ST.smallHint,
									children: t("uiOpacityHint")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
									min: 0,
									max: 100,
									step: 1,
									def: Math.round(rOp() * 100),
									fmt: (v) => `${v}%`,
									onInput: (v) => {
										const op = v / 100;
										cfg.opacity = op;
										applyCustomTokens(op);
										saveConfig();
									},
									onChange: (v) => setOp(v / 100)
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: ST.sliderBlock,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: ST.sliderLabel,
									children: t("uiSop")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: ST.smallHint,
									children: t("uiSopHint")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
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
								})
							]
						})]
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
						}),
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
										if (wpEl) wpEl.style.opacity = String(op);
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
										if (wpEl) wpEl.style.filter = v > 0 ? `blur(${v}px)` : "none";
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
							applyWp(ctxRef);
							saveConfig();
							setEditorOpen(false);
						}
					}) : null
				]
			});
		}
		function apply(ctx) {
			ctxRef = ctx;
			rpcCallFn = (endpoint, payload) => ctx.connection.rpc.call(RPC_CHANNEL, endpoint, payload).then((res) => res);
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
				ctx.theme.setTheme(CUSTOM_ID);
			};
			if (rHasColor()) registerCustom(initH, initS, initL);
			ctx.effect(() => () => {
				customDispose?.();
			}, "dsh-any-background: skin dispose");
			let styleEl;
			if (typeof document !== "undefined") {
				styleEl = document.createElement("style");
				styleEl.dataset.plugin = "dsh-any-background";
				styleEl.textContent = `body[data-ds-dark-theme="${CUSTOM_ID}"]::before{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(255,255,255,0.03) 0%,transparent 60%)}${SETTINGS_STYLE_RULE}`;
				document.head.appendChild(styleEl);
			}
			ctx.effect(() => () => {
				styleEl?.parentNode?.removeChild(styleEl);
			}, "dsh-any-background: gradient");
			let rev = 0;
			const store = (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
				init: () => ({
					url: null,
					rev: -1
				}),
				actions: { syncBg: (d, url, r) => {
					if (r <= d.rev) return;
					d.url = url;
					d.rev = r;
				} }
			});
			let bound;
			const syncBg = () => {
				rev++;
				bound?.syncBg(rWp(), rev);
			};
			applyWp(ctx);
			syncBg();
			loadPersisted().then(() => {
				applyWp(ctx);
				syncBg();
			});
			ctx.effect(() => () => {
				teardownWp();
			}, "dsh-any-background: wp cleanup");
			ctx.effect(() => ctx.on("theme/change", () => {
				if (rHasColor()) {
					const snapshot = ctx.theme.getTheme();
					if (snapshot.preference !== CUSTOM_ID && snapshot.themes.some((t) => t.id === CUSTOM_ID)) ctx.theme.setTheme(CUSTOM_ID);
				}
				applyWp(ctx);
			}), "dsh-any-background: theme change");
			let frame = 0;
			const applySoon = () => {
				if (frame !== 0) return;
				frame = requestAnimationFrame(() => {
					frame = 0;
					applyWp(ctx);
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
					setColor: (nh, ns, nl) => {
						const [sh, ss, sl] = hsvToHsl(nh, ns, nl);
						cfg.color = [
							sh,
							ss,
							sl
						];
						registerCustom(sh, ss, sl);
						applyWp(ctx);
						saveConfig();
					},
					setWp: (u) => {
						wpUrl = u;
						cfg.bgState = { ...DEFAULT_CONFIG.bgState };
						applyWp(ctx);
						syncBg();
						rpcCall("setWallpaper", { dataUrl: u });
					},
					setOp: (v) => {
						cfg.opacity = v;
						applyWp(ctx);
						syncBg();
						saveConfig();
					},
					setWop: (v) => {
						cfg.wallpaperOpacity = v;
						applyWp(ctx);
						syncBg();
						saveConfig();
					},
					setBl: (v) => {
						cfg.blur = v;
						applyWp(ctx);
						syncBg();
						saveConfig();
					},
					setSop: (v) => {
						cfg.settingsOpacity = v;
						applySettingsOverrides(v);
						saveConfig();
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
			const restoreSaved = () => {
				if (rHasColor()) {
					const [h, s, l] = rColor();
					registerCustom(h, s, l);
				}
				applyWp(ctx);
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
				if (changed) applyWp(ctx);
			}, 1e3);
			ctx.effect(() => () => {
				window.clearInterval(watchdogId);
			}, "dsh-any-background: theme watchdog");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map