/**
 * dsh-any-background — settings UI design system.
 *
 * The section is styled entirely through these scoped classes instead of the
 * host's inline-style approach: animations (page transitions, staggered
 * reveals, the rotating orb ring) and pseudo-element effects cannot be
 * expressed as React inline styles. Every color reads the host's
 * --dsw-alias-* tokens so the panel follows the user's custom theme color and
 * light/dark scheme automatically; `color-mix` tints carry a plain-token
 * fallback first for older engines.
 */
export const NAV_ITEM_H = 38
export const NAV_GAP = 4

export const UI_CSS = `
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
.dab-nav-list{position:relative;display:flex;flex-direction:column;gap:${NAV_GAP}px}
.dab-nav-ind{position:absolute;left:0;right:0;top:0;height:${NAV_ITEM_H}px;border-radius:11px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 13%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 25%,transparent);transition:transform .38s cubic-bezier(.22,1,.36,1)}
.dab-nav-item{position:relative;z-index:1;display:flex;align-items:center;gap:10px;height:${NAV_ITEM_H}px;padding:0 12px;border:0;background:none;border-radius:11px;color:var(--dsw-alias-label-tertiary);font-size:13px;cursor:pointer;text-align:left;transition:color .22s ease}
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
/* flex:none is load bearing, not cosmetic: the pointer maths reads client
 * coordinates straight off this element's box, so any shrink below the 220px
 * drawing surface would desynchronise the ring from the cursor. */
.dab-wheel{position:relative;flex:none;cursor:crosshair;border-radius:50%;box-shadow:0 12px 32px -14px rgba(0,0,0,.4)}
.dab-hint{font-size:11.5px;line-height:1.55;color:var(--dsw-alias-label-tertiary);padding:0 4px}

/* ── precise color inputs ────────────────────────────────────────────────── */
.dab-inputs{display:flex;flex-direction:column;gap:10px;min-width:172px}
.dab-field{display:flex;align-items:center;gap:8px}
.dab-field-label{width:14px;text-align:center;font-family:var(--dab-mono);font-size:11px;font-weight:600;color:var(--dsw-alias-label-tertiary)}
.dab-num{flex:1;min-width:0;height:30px;padding:0 10px;border-radius:9px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-family:var(--dab-mono);font-size:12px;outline:none;transition:border-color .2s,box-shadow .2s}
.dab-num:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 18%,transparent)}
.dab-num::-webkit-outer-spin-button,.dab-num::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.dab-num{-moz-appearance:textfield;appearance:textfield}
.dab-urlinput{flex:1;min-width:180px;height:34px;padding:0 12px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:12.5px;outline:none;transition:border-color .2s}
.dab-urlinput::placeholder{color:var(--dsw-alias-label-quaternary)}
.dab-urlinput:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 18%,transparent)}
.dab-urlrow{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px;animation:dab-list-in .3s cubic-bezier(.22,1,.36,1) both}
.dab-swatch-lg{height:38px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);box-shadow:inset 0 0 14px rgba(0,0,0,.1);transition:transform .3s ease}
.dab-swatch-lg:hover{transform:scale(1.02)}

/* ── buttons & chips ─────────────────────────────────────────────────────── */
.dab-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;height:34px;padding:0 14px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);color:var(--dsw-alias-label-primary);font-size:12.5px;font-weight:550;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,opacity .18s ease,background .18s ease}
.dab-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 5px 14px -6px rgba(0,0,0,.32)}
.dab-btn:active:not(:disabled){transform:translateY(0) scale(.97);box-shadow:none}
.dab-btn:disabled{opacity:.5;cursor:not-allowed}
.dab-btn-primary{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-text);border-color:transparent}
.dab-btn-danger{color:var(--dsw-alias-state-error-primary)}
.dab-btn-danger-solid{background:var(--dsw-alias-state-error-primary);color:#fff;border-color:transparent}
.dab-btn-danger-solid:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 85%,#000)}
.dab-btn-ghost{background:transparent;border-color:transparent;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-tertiary))}
.dab-btn-ghost:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);box-shadow:none}
/* Soft solid button: subtle layer background instead of transparent ghost. */
.dab-btn-soft{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-tertiary))}
.dab-btn-soft:hover:not(:disabled){background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-layer-2));color:var(--dsw-alias-label-primary)}
/* White background with error-red text (inverse of danger-solid). */
.dab-btn-danger-inverted{background:#fff;color:var(--dsw-alias-state-error-primary);border-color:transparent}
.dab-btn-danger-inverted:hover:not(:disabled){background:#f3f4f6}
.dab-btn:focus-visible,.dab-nav-item:focus-visible,.dab-seg-item:focus-visible,.dab-swatch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.dab-chip-row{display:flex;flex-wrap:wrap;gap:8px}
.dab-chip{height:30px;padding:0 14px;border-radius:99px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-tertiary));font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:background-color .22s ease,border-color .22s ease,color .22s ease}
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
.dab-grid-parts{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(240px,100%),1fr));gap:13px}
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

/* ── custom font card ────────────────────────────────────────────────────── */
.dab-font-title{display:flex;align-items:center;gap:11px}
.dab-font-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px}
.dab-font-name{font-family:var(--dab-mono);font-size:13.5px;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-tertiary));background:var(--dsw-alias-bg-layer-2);border-radius:99px;padding:5px 11px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dab-font-name.is-empty{color:var(--dsw-alias-label-tertiary)}
.dab-font-actions{display:flex;align-items:center;gap:8px;margin-left:auto}
/* The font card's labels read one step larger than the rest of the panel —
   they carry most of the explanation on this page. Scoped to the card so the
   same .dab-hint / .dab-btn elsewhere keep their size. */
.dab-font-actions .dab-btn{font-size:14.5px}
.dab-font-card .dab-hint{font-size:13.5px}

/* ── text-stroke color dots ──────────────────────────────────────────────── */
.dab-stroke-dots{display:flex;align-items:center;gap:9px;margin-top:14px}
.dab-stroke-dot-wrap{position:relative;width:18px;height:18px;flex:none}
.dab-stroke-dot{width:18px;height:18px;padding:0;border-radius:50%;border:1.5px solid var(--dsw-alias-border-l2);background-clip:padding-box;cursor:pointer;transition:transform .18s cubic-bezier(.34,1.56,.64,1),box-shadow .18s ease}
.dab-stroke-dot:hover{transform:scale(1.16)}
/* 'auto' has no fixed value — half light / half dark reads as "derived". */
.dab-stroke-dot-auto{background:conic-gradient(from -90deg,#fff 0 50%,#000 50% 100%)}
.dab-stroke-dot.is-active{box-shadow:0 0 0 2px var(--dsw-alias-bg-layer-1),0 0 0 3.5px var(--dsw-alias-brand-primary);border-color:transparent}
/* The native color picker sits invisible on top of the custom swatch. */
.dab-stroke-dot-input{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;border-radius:50%;background:none;opacity:0;cursor:pointer}

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
.dab-type{position:relative;border:1.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:14px;padding:10px;cursor:pointer;text-align:left;font:inherit;transition:border-color .25s,transform .25s,box-shadow .25s;animation:dab-type-in .42s cubic-bezier(.22,1,.36,1) both;animation-delay:calc(var(--i,0) * 60ms)}
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
.dab-profile-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:13px}
.dab-profile-ico{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;margin-bottom:13px;color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent)}
.dab-profile-title{font-size:14px;font-weight:650}
.dab-profile-desc{font-size:12px;color:var(--dsw-alias-label-tertiary);line-height:1.55;margin:5px 0 15px}
.dab-footer{margin-top:6px;padding:14px 4px 0;border-top:1px solid var(--dsw-alias-border-l2);display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.dab-footer-mono{font-family:var(--dab-mono);letter-spacing:.02em}

/* ── presets / profiles / schedule / rotation ────────────────────────────── */
.dab-row-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.dab-preset-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(150px,100%),1fr));gap:10px}
.dab-preset{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:12px;border:1.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:13px;cursor:pointer;font:inherit;text-align:left;transition:border-color .25s,transform .25s,box-shadow .25s;animation:dab-row-in .34s cubic-bezier(.22,1,.36,1) both;animation-delay:calc(var(--i,0) * 45ms)}
.dab-preset:hover{transform:translateY(-2px);border-color:var(--dsw-alias-brand-primary);box-shadow:0 8px 22px -12px rgba(0,0,0,.3)}
.dab-preset-dot{width:22px;height:22px;border-radius:50%;margin-bottom:4px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12),0 4px 10px -4px rgba(0,0,0,.35);background:var(--dsw-alias-bg-layer-2);display:grid;place-items:center;color:var(--dsw-alias-label-tertiary)}
.dab-preset-name{font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-primary)}
.dab-preset-desc{font-size:10.5px;line-height:1.45;color:var(--dsw-alias-label-tertiary)}
.dab-profile-list{display:flex;flex-direction:column;gap:8px;margin-top:12px;animation:dab-list-in .38s cubic-bezier(.22,1,.36,1) both}
.dab-profile-row{display:flex;align-items:center;gap:11px;padding:9px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2);animation:dab-row-in .34s cubic-bezier(.22,1,.36,1) both;animation-delay:calc(var(--i,0) * 45ms);transition:border-color .22s ease,background .22s ease}
.dab-profile-row:hover{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 28%,transparent);background:color-mix(in srgb,var(--dsw-alias-label-primary) 4%,var(--dsw-alias-bg-layer-2))}
.dab-profile-row.is-active{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 7%,var(--dsw-alias-bg-layer-2))}
.dab-profile-dot{width:22px;height:22px;flex:none;border-radius:50%;background:var(--dsw-alias-bg-layer-1);box-shadow:inset 0 0 0 1px rgba(0,0,0,.12);display:grid;place-items:center;color:var(--dsw-alias-label-tertiary)}
.dab-profile-meta{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.dab-profile-name{font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dab-profile-sub{font-family:var(--dab-mono);font-size:10px;color:var(--dsw-alias-label-tertiary)}
.dab-btn-confirm{background:var(--dsw-alias-state-error-primary)!important;color:#fff!important;border-color:transparent!important}
.dab-select{height:32px;padding:0 10px;border-radius:9px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:12px;outline:none;cursor:pointer;max-width:180px}
.dab-select:focus{border-color:var(--dsw-alias-brand-primary)}
.dab-timeinput{height:32px;padding:0 8px;border-radius:9px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-family:var(--dab-mono);font-size:12px;outline:none}
.dab-timeinput:focus{border-color:var(--dsw-alias-brand-primary)}
/* Collapsible panel: animates grid-template-rows 0fr→1fr so the schedule
   block unfolds to its content height instead of popping in. visibility
   flips after the fold finishes (and instantly on open) so hidden inputs
   are never focusable. */
.dab-schedule-wrap{display:grid;grid-template-rows:0fr;visibility:hidden;transition:grid-template-rows .42s cubic-bezier(.22,1,.36,1),visibility 0s linear .42s}
.dab-schedule-wrap.is-open{grid-template-rows:1fr;visibility:visible;transition:grid-template-rows .42s cubic-bezier(.22,1,.36,1)}
.dab-schedule-clip{overflow:hidden;min-height:0;opacity:0;transition:opacity .28s ease}
.dab-schedule-wrap.is-open .dab-schedule-clip{opacity:1;transition:opacity .32s ease .1s}
.dab-schedule-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:16px;padding-top:12px}
.dab-schedule-cell{min-width:0;animation:dab-row-in .34s cubic-bezier(.22,1,.36,1) both;animation-delay:calc(var(--i,0) * 60ms)}
.dab-time-row{display:flex;flex-direction:column;gap:9px}
.dab-time-label{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-tertiary))}
.dab-time-label svg{color:var(--dsw-alias-brand-primary);flex:none}
.dab-time-label .dab-select,.dab-time-label .dab-timeinput{flex:1;min-width:0}
.dab-thumbstrip{display:flex;flex-wrap:wrap;gap:9px;margin-top:13px}
.dab-thumb{position:relative;width:64px;height:44px;border-radius:9px;overflow:hidden;border:1.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);display:grid;place-items:center;color:var(--dsw-alias-label-tertiary);animation:dab-list-in .3s cubic-bezier(.22,1,.36,1) both}
.dab-thumb.is-current{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary) 25%,transparent)}
.dab-thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.dab-thumb-x{position:absolute;top:2px;right:2px;width:16px;height:16px;border:0;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;cursor:pointer;display:grid;place-items:center;opacity:0;transition:opacity .18s ease,background .18s ease;padding:0}
.dab-thumb:hover .dab-thumb-x{opacity:1}
.dab-thumb-x:hover{background:var(--dsw-alias-state-error-primary)}
.dab-thumb-add{border-style:dashed;cursor:pointer;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;transition:border-color .22s ease,color .22s ease}
.dab-thumb-add:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.dab-chip-sep{width:1px;height:18px;background:var(--dsw-alias-border-l2);margin:0 4px;flex:none}

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
/* The crash cause: readable, scrollable, and clipped to a few lines so a long
 * stack cannot push the reset button off the panel. */
.dab-crash-detail{margin:0;max-width:min(520px,80vw);max-height:132px;overflow:auto;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);font-family:var(--dab-mono);font-size:10.5px;line-height:1.5;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-tertiary));text-align:left;white-space:pre-wrap;word-break:break-word}

/* ── keyframes ───────────────────────────────────────────────────────────── */
@keyframes dab-fade-in{from{opacity:0}to{opacity:1}}
@keyframes dab-page-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes dab-rise-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes dab-list-in{from{opacity:0;transform:translateY(-7px)}to{opacity:1;transform:none}}
@keyframes dab-row-in{from{opacity:0;transform:translateY(6px) scale(.985)}to{opacity:1;transform:none}}
@keyframes dab-type-in{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
@keyframes dab-orb-in{from{opacity:0;transform:scale(.82)}to{opacity:1;transform:none}}
@keyframes dab-spin{to{transform:rotate(360deg)}}
@keyframes dab-rotate{to{transform:rotate(360deg)}}
@keyframes dab-toast-in{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes dab-zoom-in{from{opacity:0;transform:scale(.94) translateY(8px)}to{opacity:1;transform:none}}
@keyframes dab-flow{to{background-position:300% 50%}}

/* ── sidebar surface (a dsh-better-sidebar page) ─────────────────────────────
 * Same shell, hosted in a panel that is handed a full-height column (the host's
 * native tab body is height:100%) and whose width the user drags freely. So only
 * THREE things are fixed here, all of them structural:
 *   1. the shell fills the height and the page body owns the scroll
 *      (flex:1 + min-height:0), so the panel stays one scrollable column instead
 *      of pushing the whole tab into a scrollbar;
 *   2. the nav is a rail ABOVE the page rather than beside it — a side rail would
 *      spend 150px of a panel that is narrow by nature, and this way the page
 *      keeps the full width for its own grids;
 *   3. long tokens (paths, hex, URLs) may wrap instead of widening the panel.
 *
 * Everything else — grid columns, paddings, type scale, whether the cards lift on
 * hover — is width-driven through the container queries below, which measure this
 * shell (the .dab-root container, which declares container-type:inline-size) and
 * not the viewport. A narrow sidebar compacts; a wide one falls back to the
 * dialog's own spacing and multi-column grids, because at that point it *is* a
 * dialog-sized surface. */
[data-dab-surface="sidebar"].dab-root{height:100%;min-height:0;padding:12px 12px 0}
[data-dab-surface="sidebar"] .dab-shell{display:flex;flex-direction:column;align-items:stretch;gap:11px;height:100%;min-height:0;max-width:none;padding-bottom:0}
[data-dab-surface="sidebar"] .dab-nav{gap:0}
[data-dab-surface="sidebar"] .dab-nav-list{flex-direction:row;gap:2px;overflow-x:auto;overflow-y:hidden;padding-bottom:1px}
[data-dab-surface="sidebar"] .dab-nav-list::-webkit-scrollbar{display:none}
[data-dab-surface="sidebar"] .dab-nav-ind{display:none}
[data-dab-surface="sidebar"] .dab-nav-item{flex:none;height:32px;gap:7px;padding:0 10px;font-size:12px}
[data-dab-surface="sidebar"] .dab-nav-item.is-active{background:var(--dsw-alias-bg-layer-2)}
[data-dab-surface="sidebar"] .dab-page{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding-bottom:16px;scrollbar-width:thin}
/* Last-resort safety for text that cannot wrap (paths, hex, URLs). */
[data-dab-surface="sidebar"] .dab-hint,[data-dab-surface="sidebar"] .dab-part-name{overflow-wrap:anywhere}
/* The panel's width is whatever the user dragged it to, so let the part cards
 * fill as many columns as actually fit instead of hard-coding one. 170px is the
 * narrowest a part card stays readable once its header can wrap (see the head
 * rules below), which puts the second column at roughly a 380px panel — the
 * default right-sidebar width. */
[data-dab-surface="sidebar"] .dab-grid-parts{grid-template-columns:repeat(auto-fill,minmax(min(170px,100%),1fr));gap:12px}
[data-dab-surface="sidebar"] .dab-types{grid-template-columns:repeat(auto-fit,minmax(min(150px,100%),1fr))}
[data-dab-surface="sidebar"] .dab-card{padding:12px}
[data-dab-surface="sidebar"] .dab-part-head{gap:8px;margin-bottom:10px}
[data-dab-surface="sidebar"] .dab-part-ico{width:26px;height:26px;border-radius:8px}
[data-dab-surface="sidebar"] .dab-part-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px}
[data-dab-surface="sidebar"] .dab-part-badge{padding:2px 7px;font-size:10px}

/* Narrow panel: tighten the chrome so the content still has room. */
@container (max-width:539px){
  [data-dab-surface="sidebar"] .dab-page{gap:11px}
  [data-dab-surface="sidebar"] .dab-h1{font-size:17px}
  [data-dab-surface="sidebar"] .dab-desc{font-size:12px}
  [data-dab-surface="sidebar"] .dab-orb-wrap{width:96px;height:96px}
  [data-dab-surface="sidebar"] .dab-wheel-card{padding:14px 10px;gap:16px}
  [data-dab-surface="sidebar"] .dab-wheel-glow{width:170px;height:170px}
  /* Lift-on-hover is a dialog affordance; in a cramped scrolling panel it only
   * adds jitter under the cursor. */
  [data-dab-surface="sidebar"] .dab-card-hover:hover{transform:none;box-shadow:none}
}
/* Roomy panel: behave like the dialog again — its spacing, its type scale, and
 * multi-column grids (a smaller track minimum than the dialog, because the page
 * here is a few hundred px narrower than a dialog's content column). */
@container (min-width:540px){
  [data-dab-surface="sidebar"] .dab-shell{gap:16px}
  [data-dab-surface="sidebar"] .dab-page{gap:13px}
  [data-dab-surface="sidebar"] .dab-nav-item{height:34px;font-size:12.5px;padding:0 12px}
  /* The shared ≤620px rule flattens the type cards to one column, which is right
   * for a narrow phone-width dialog but wasteful in a roomy panel. */
  [data-dab-surface="sidebar"] .dab-types{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
}

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
/* Phone: on a handset the settings dialog's content column shrinks to roughly
 * the viewport, and the dialog-sized chrome (18px cards, 21px headings, a 118px
 * orb, 24px paddings) stops fitting — cards end up wider than the column or the
 * color row wraps into three cramped pieces. These are the same tightenings the
 * sidebar surface applies at its own narrow widths, so a phone settings dialog
 * and a narrow sidebar panel end up looking the same. */
@container (max-width:480px){
  .dab-shell{gap:10px}
  .dab-page{gap:10px}
  .dab-head{margin:0 0 2px}
  .dab-h1{font-size:18px}
  .dab-desc{font-size:12px}
  .dab-card{padding:14px;border-radius:14px}
  .dab-hero-accent{gap:16px}
  .dab-orb-wrap{width:92px;height:92px}
  .dab-wheel-card{padding:14px 10px;gap:16px}
  .dab-wheel-glow{width:180px;height:180px}
  /* Three fixed type-card columns need ~400px; two adaptive ones fit 320px. */
  .dab-types{grid-template-columns:repeat(auto-fit,minmax(min(150px,100%),1fr))}
  .dab-grid-parts{gap:11px}
  .dab-part-head{margin-bottom:10px}
  .dab-slider-block + .dab-slider-block{margin-top:10px}
  .dab-footer{padding-top:10px}
}
@media (prefers-reduced-motion:reduce){
  .dab-root *,.dab-root *::before,.dab-root *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
`

const CSS_ID = 'dab-ui-css'

/** Inject the design-system stylesheet once per document (HMR-safe). */
export function ensureUiCss(): void {
  if (typeof document === 'undefined') return
  let el = document.getElementById(CSS_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = CSS_ID
    document.head.appendChild(el)
  }
  if (el.textContent !== UI_CSS) el.textContent = UI_CSS
}
