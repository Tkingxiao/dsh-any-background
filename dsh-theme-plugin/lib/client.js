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
			"theme"
		];
		const NS = "settings.anyBg";
		const LS_COLOR = "dsh-any-background:color";
		const LS_WP = "dsh-any-background:wallpaper";
		const LS_OP = "dsh-any-background:opacity";
		const LS_BL = "dsh-any-background:blur";
		const LS_BG = "dsh-any-background:bgState";
		const DEF_OP = .85;
		const DEF_BL = 0;
		const OVERRIDE_SRC = "dsh-any-background:wallpaper";
		const CUSTOM_ID = "custom-color";
		const zh = {
			nav: "主题",
			subtitle: "自定义界面外观",
			colorTitle: "主题色",
			colorHint: "在色轮上选择色相，在方形中调整饱和度和明度",
			bgTitle: "背景图片",
			bgChoose: "选择图片",
			bgRemove: "移除",
			bgEdit: "编辑位置",
			bgOpacity: "透明度",
			bgBlur: "模糊",
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
			bgTitle: "Wallpaper",
			bgChoose: "Choose image",
			bgRemove: "Remove",
			bgEdit: "Edit position",
			bgOpacity: "Opacity",
			bgBlur: "Blur",
			bgHint: "Drag sliders for real-time adjustment. Click the image to open the editor",
			editorTitle: "Background editor",
			editorHint: "Drag to move, scroll to zoom",
			editorCommit: "Confirm",
			editorCancel: "Cancel",
			editorReset: "Reset"
		};
		function rLS(k) {
			try {
				const v = localStorage.getItem(k);
				return typeof v === "string" ? v : null;
			} catch {
				return null;
			}
		}
		function wLS(k, v) {
			try {
				v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
			} catch {}
		}
		function rColor() {
			try {
				const v = JSON.parse(rLS(LS_COLOR) || "");
				if (Array.isArray(v) && v.length === 3) return v;
			} catch {}
			return [
				220,
				.55,
				.25
			];
		}
		function rWp() {
			const v = rLS(LS_WP);
			return v?.length ? v : null;
		}
		function rOp() {
			const v = rLS(LS_OP);
			if (!v) return DEF_OP;
			const n = +v;
			return isFinite(n) ? Math.min(1, Math.max(0, n)) : DEF_OP;
		}
		function rBl() {
			const v = rLS(LS_BL);
			if (!v) return DEF_BL;
			const n = +v;
			return isFinite(n) ? Math.min(60, Math.max(0, n)) : DEF_BL;
		}
		function rBgState() {
			try {
				const v = JSON.parse(rLS(LS_BG) || "");
				if (v && typeof v.zoom === "number") return v;
			} catch {}
			return {
				zoom: 1,
				px: 0,
				py: 0
			};
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
					"--dsw-alias-label-primary": hsl(h(0), s(-.35), .92),
					"--dsw-alias-label-secondary": hsl(h(0), s(-.3), .65),
					"--dsw-alias-label-tertiary": hsl(h(0), s(-.3), .48),
					"--dsw-alias-brand-primary": hsl(h(0), s(.1), Math.max(l(.2), .5)),
					"--dsw-alias-brand-text": l(.2) > .6 ? "#000" : "#fff",
					"--dsw-alias-button-primary-hover": hsl(h(0), s(.1), Math.max(l(.28), .58)),
					"--dsw-alias-button-primary-dimmed": hsl(h(0), s(0), l(.07)),
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
					"--dsw-alias-scrollbar-bg-l1": hsl(h(0), s(-.05), l(.12)),
					"--dsw-alias-scrollbar-bg-l2": hsl(h(0), s(-.05), l(.16)),
					"--dsw-alias-scrollbar-hover-l1": hsl(h(0), s(-.05), l(.22)),
					"--dsw-alias-scrollbar-hover-l2": hsl(h(0), s(-.05), l(.22))
				}
			};
			return {
				colorScheme: "light",
				tokens: {
					"--dsw-alias-bg-base": hsl(h(0), s(-.2), l(.04)),
					"--dsw-alias-bg-layer-1": hsl(h(0), s(-.3), l(.08)),
					"--dsw-alias-bg-layer-2": hsl(h(0), s(-.2), l(-.02)),
					"--dsw-alias-bg-layer-3": hsl(h(0), s(-.15), l(-.08)),
					"--dsw-alias-bg-overlay": hsl(h(0), s(-.3), l(.09)),
					"--dsw-alias-border-l1": rgba(h(0), s(-.2), l(-.2), .1),
					"--dsw-alias-border-l2": rgba(h(0), s(-.2), l(-.2), .18),
					"--dsw-alias-label-primary": hsl(h(0), s(-.2), l(-.35)),
					"--dsw-alias-label-secondary": hsl(h(0), s(-.15), l(-.15)),
					"--dsw-alias-label-tertiary": hsl(h(0), s(-.1), l(-.08)),
					"--dsw-alias-brand-primary": hsl(h(0), s(.05), l(-.15)),
					"--dsw-alias-brand-text": "#fff",
					"--dsw-alias-button-primary-hover": hsl(h(0), s(.05), l(-.1)),
					"--dsw-alias-button-primary-dimmed": hsl(h(0), s(-.2), l(-.02)),
					"--dsw-alias-interactive-bg-hover": rgba(h(0), s(0), l(-.15), .08),
					"--dsw-alias-interactive-bg-active": rgba(h(0), s(0), l(-.15), .14),
					"--dsw-alias-markdown-code-block": hsl(h(0), s(-.2), l(-.02)),
					"--dsw-alias-markdown-inline-code": hsl(h(0), s(-.15), l(-.04)),
					"--dsw-specific-sidebar-fill": hsl(h(0), s(-.2), l(-.02)),
					"--dsw-specific-sidebar-nav-item-active": hsl(h(0), s(-.15), l(-.06)),
					"--dsw-specific-sidebar-nav-item-hover": hsl(h(0), s(-.18), l(-.03)),
					"--dsw-alias-scrollbar-bg-l1": hsl(h(0), s(-.15), l(-.1)),
					"--dsw-alias-scrollbar-bg-l2": hsl(h(0), s(-.12), l(-.12)),
					"--dsw-alias-scrollbar-hover-l1": hsl(h(0), s(-.1), l(-.16)),
					"--dsw-alias-scrollbar-hover-l2": hsl(h(0), s(-.1), l(-.16))
				}
			};
		}
		let wpEl = null;
		let ovDispose = null;
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
			return c.trim();
		}
		function resolveBase(scheme, active) {
			if (active.colorScheme === scheme && active.tokens["--dsw-alias-bg-base"]) return active.tokens["--dsw-alias-bg-base"];
			return scheme === "light" ? "rgb(255,255,255)" : "rgb(21,21,23)";
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
				wpEl.style.backgroundSize = `${Math.round(bg.zoom * 100)}%`;
				wpEl.style.backgroundPosition = `${bg.px}px ${bg.py}px`;
				const blur = rBl();
				wpEl.style.filter = blur > 0 ? `blur(${blur}px)` : "none";
			}
			const op = rOp();
			const sideOp = Math.min(1, op + .08);
			const snap = ctx.theme.getTheme();
			ovDispose?.();
			ovDispose = ctx.theme.overrideTokens(OVERRIDE_SRC, {
				"--dsw-alias-bg-base": {
					light: toRgba(resolveBase("light", snap.active), op),
					dark: toRgba(resolveBase("dark", snap.active), op)
				},
				"--dsw-specific-sidebar-fill": {
					light: toRgba(resolveBase("light", snap.active), sideOp),
					dark: toRgba(resolveBase("dark", snap.active), sideOp)
				}
			});
		}
		function teardownWp() {
			wpEl?.remove();
			wpEl = null;
			ovDispose?.();
			ovDispose = null;
		}
		const WHEEL_SIZE = 220;
		const CX = WHEEL_SIZE / 2;
		const RING_OUTER = 106;
		const RING_INNER = 82;
		const SQ_HALF = 74;
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
			const gh = c.createLinearGradient(gx, 0, 184, 0);
			gh.addColorStop(0, "rgba(255,255,255,1)");
			gh.addColorStop(1, `hsl(${hue},100%,50%)`);
			c.fillStyle = gh;
			c.fillRect(gx, gy, sz, sz);
			const gv = c.createLinearGradient(0, gy, 0, 184);
			gv.addColorStop(0, "rgba(0,0,0,0)");
			gv.addColorStop(1, "rgba(0,0,0,1)");
			c.fillStyle = gv;
			c.fillRect(gx, gy, sz, sz);
			const hRad = (hue - 90) * Math.PI / 180;
			const hR = 188 / 2;
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
			const dx = x - CX, dy = y - CX;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist >= RING_INNER - 4 && dist <= 110) return "ring";
			if (Math.abs(x - CX) <= SQ_HALF && Math.abs(y - CX) <= SQ_HALF) return "square";
			return null;
		}
		function pickHue(x, y) {
			let angle = Math.atan2(y - CX, x - CX) * 180 / Math.PI + 90;
			if (angle < 0) angle += 360;
			return angle;
		}
		function pickSL(x, y) {
			const gx = CX - SQ_HALF, sz = SQ_HALF * 2;
			return [Math.max(0, Math.min(1, (x - gx) / sz)), Math.max(.02, Math.min(.98, 1 - (y - gx) / sz))];
		}
		function ColorWheel({ hue, sat, lit, onChange }) {
			const cvsRef = (0, react.useRef)(null);
			const st = (0, react.useRef)({
				hue,
				sat,
				lit
			});
			st.current = {
				hue,
				sat,
				lit
			};
			(0, react.useEffect)(() => {
				if (cvsRef.current) drawWheel(cvsRef.current, hue, sat, lit);
			}, [
				hue,
				sat,
				lit
			]);
			const onDown = (0, react.useCallback)((e) => {
				const r = cvsRef.current.getBoundingClientRect();
				const x = e.clientX - r.left, y = e.clientY - r.top;
				const region = hitTest(x, y);
				if (!region) return;
				if (region === "ring") onChange(pickHue(x, y), st.current.sat, st.current.lit);
				else {
					const [s, l] = pickSL(x, y);
					onChange(st.current.hue, s, l);
				}
				const onMove = (ev) => {
					const rr = cvsRef.current.getBoundingClientRect();
					const mx = ev.clientX - rr.left, my = ev.clientY - rr.top;
					if (region === "ring") {
						const d = Math.sqrt((mx - CX) ** 2 + (my - CX) ** 2);
						if (d >= RING_INNER - 10 && d <= 116) onChange(pickHue(mx, my), st.current.sat, st.current.lit);
					} else {
						const [s, l] = pickSL(mx, my);
						onChange(st.current.hue, s, l);
					}
				};
				const onUp = () => {
					document.removeEventListener("mousemove", onMove);
					document.removeEventListener("mouseup", onUp);
				};
				document.addEventListener("mousemove", onMove);
				document.addEventListener("mouseup", onUp);
			}, [onChange]);
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
				fontSize: "14px",
				fontWeight: 500,
				marginBottom: "8px"
			},
			hint: {
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "12px",
				lineHeight: "18px",
				marginTop: "4px"
			},
			wheelCanvas: {
				cursor: "crosshair",
				borderRadius: "50%"
			},
			row: {
				display: "flex",
				alignItems: "center",
				gap: "10px",
				flexWrap: "wrap"
			},
			sliderRow: {
				display: "flex",
				alignItems: "center",
				gap: "10px"
			},
			sliderLabel: {
				color: "var(--dsw-alias-label-secondary)",
				fontSize: "13px",
				whiteSpace: "nowrap",
				width: "52px"
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
				width: "72px",
				height: "44px",
				objectFit: "cover",
				borderRadius: "6px",
				border: "1px solid var(--dsw-alias-border-l2)",
				cursor: "pointer"
			},
			sliders: {
				display: "flex",
				flexDirection: "column",
				gap: "8px",
				marginTop: "12px"
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
		function BgEditor({ url, onClose, onCommit }) {
			const [zoom, setZoom] = (0, react.useState)(1);
			const [pos, setPos] = (0, react.useState)({
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
			const pw = Math.min(window.innerWidth * .75, 860);
			const ph = Math.round(pw * window.innerHeight / window.innerWidth);
			(0, react.useEffect)(() => {
				const img = new Image();
				img.onload = () => {
					const scale = Math.min(pw / img.width, ph / img.height);
					const w = img.width * scale, h = img.height * scale;
					setImgSize({
						w,
						h
					});
					setPos({
						x: (pw - w) / 2,
						y: (ph - h) / 2
					});
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
				if (!imgRef.current) return;
				const scale = Math.min(pw / imgSize.w, ph / imgSize.h);
				const w = imgSize.w * scale, h = imgSize.h * scale;
				setZoom(1);
				setPos({
					x: (pw - w) / 2,
					y: (ph - h) / 2
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
						children: "背景编辑器"
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
						children: "拖动移动图片，滚轮缩放大小"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: ST.modalBtns,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								style: ST.btn,
								onClick: resetView,
								children: "重置"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								style: ST.btn,
								onClick: onClose,
								children: "取消"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								style: {
									...ST.btn,
									...ST.btnPrimary
								},
								onClick: () => onCommit(zoom, pos.x / pw, pos.y / ph),
								children: "确认"
							})
						]
					})
				]
			});
		}
		function LiveSlider({ label, min, max, step, def, fmt, onInput, onChange }) {
			const valRef = (0, react.useRef)(null);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: ST.sliderRow,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: ST.sliderLabel,
						children: label
					}),
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
		function ThemeSection(props) {
			const { t, hue, sat, lit, setColor, url, setWp, setOp, setBl, useStore } = props;
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
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ColorWheel, {
							hue,
							sat,
							lit,
							onChange: setColor
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: ST.hint,
							children: t("colorHint")
						})
					] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("hr", { style: ST.hr }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: ST.label,
							children: t("bgTitle")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: ST.row,
							children: [
								storeUrl ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
									src: storeUrl,
									alt: "",
									style: ST.preview,
									onClick: () => setEditorOpen(true)
								}) : null,
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
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: ST.sliders,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
								label: t("bgOpacity"),
								min: 0,
								max: 100,
								step: 1,
								def: Math.round(rOp() * 100),
								fmt: (v) => `${v}%`,
								onInput: (v) => {
									const op = v / 100;
									wLS(LS_OP, String(op));
									if (wpEl) wpEl.style.opacity = String(op);
									const sideOp = Math.min(1, op + .08);
									const snap = ctxRef.theme.getTheme();
									ovDispose?.();
									ovDispose = ctxRef.theme.overrideTokens(OVERRIDE_SRC, {
										"--dsw-alias-bg-base": {
											light: toRgba(resolveBase("light", snap.active), op),
											dark: toRgba(resolveBase("dark", snap.active), op)
										},
										"--dsw-specific-sidebar-fill": {
											light: toRgba(resolveBase("light", snap.active), sideOp),
											dark: toRgba(resolveBase("dark", snap.active), sideOp)
										}
									});
								},
								onChange: (v) => setOp(v / 100)
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveSlider, {
								label: t("bgBlur"),
								min: 0,
								max: 60,
								step: 1,
								def: rBl(),
								fmt: (v) => `${v}px`,
								onInput: (v) => {
									wLS(LS_BL, String(v));
									if (wpEl) wpEl.style.filter = v > 0 ? `blur(${v}px)` : "none";
								},
								onChange: (v) => setBl(v)
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: ST.hint,
							children: t("bgHint")
						})
					] }),
					editorOpen && storeUrl ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BgEditor, {
						url: storeUrl,
						onClose: () => setEditorOpen(false),
						onCommit: (z, px, py) => {
							wLS(LS_BG, JSON.stringify({
								zoom: z,
								px,
								py
							}));
							applyWp(ctxRef);
							setEditorOpen(false);
						}
					}) : null
				]
			});
		}
		function apply(ctx) {
			ctxRef = ctx;
			const [initH, initS, initL] = rColor();
			let customDispose = null;
			const registerCustom = (h, s, l) => {
				customDispose?.();
				const { colorScheme, tokens } = genTokens(h, s, l);
				customDispose = ctx.theme.register({
					id: CUSTOM_ID,
					colorScheme,
					tokens
				});
				ctx.theme.setTheme(CUSTOM_ID);
			};
			if (rLS(LS_COLOR)) registerCustom(initH, initS, initL);
			ctx.effect(() => () => {
				customDispose?.();
			}, "dsh-any-background: skin dispose");
			let styleEl;
			if (typeof document !== "undefined") {
				styleEl = document.createElement("style");
				styleEl.dataset.plugin = "dsh-any-background";
				styleEl.textContent = `body[data-ds-dark-theme="${CUSTOM_ID}"]::before{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(255,255,255,0.03) 0%,transparent 60%)}`;
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
			ctx.effect(() => () => {
				teardownWp();
			}, "dsh-any-background: wp cleanup");
			ctx.on("theme/change", () => applyWp(ctx));
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-any-background: i18n");
			const sectionInject = (actions) => {
				bound = actions;
				syncBg();
				const [h, s, l] = rColor();
				return {
					t: ctx.locale.bind(NS),
					hue: h,
					sat: s,
					lit: l,
					setColor: (nh, ns, nl) => {
						wLS(LS_COLOR, JSON.stringify([
							nh,
							ns,
							nl
						]));
						registerCustom(nh, ns, nl);
						applyWp(ctx);
					},
					setWp: (u) => {
						wLS(LS_WP, u);
						applyWp(ctx);
						syncBg();
					},
					setOp: (v) => {
						wLS(LS_OP, String(v));
						applyWp(ctx);
						syncBg();
					},
					setBl: (v) => {
						wLS(LS_BL, String(v));
						applyWp(ctx);
						syncBg();
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
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map