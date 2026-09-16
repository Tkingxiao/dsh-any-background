import { rWp, rWpImage, rWpVideo, rBgState, rVideoBgState, rBl, rWop, rOps, rSop, rStrokes, rColor, rHasColor, rBlurs, rBgMode, rChatTextOpacity, rTrajectoryOpacity, rPanelOpacity, rProducedOpacity, rScheme, rColorScheme, rSchemeOverride, cfg, setWpUrl, rBgDark, setBgDark, disposeVideoObjectUrl } from './state'
import type { BackgroundType, GeneratedBgParams, PartOpacities, PartBlurs, StrokeConfig } from './types'
import { genTokens, toRgba, extractWallpaperColor, analyzeFrameDark } from './utils/color'
import { loadImage } from './utils/image'
import { createDynamicBackground, defaultParamsFor } from './utils/bg-generators'

let wpEl: HTMLDivElement | null = null
let videoEl: HTMLVideoElement | null = null
let appliedTokenNames: string[] = []
let wpController: { canvas: HTMLCanvasElement; stop: () => void; pause?: () => void; resume?: () => void; snapshot: () => string } | null = null
let snapshotListener: (() => void) | null = null
let tokenStyleEl: HTMLStyleElement | null = null

/** Pause the live generated background's animation loop (session-only). */
export function pauseGeneratedBg(): void { wpController?.pause?.() }

/** Resume the live generated background's animation loop. */
export function resumeGeneratedBg(): void { wpController?.resume?.() }

function clearDynamicBg(): void {
  wpController?.stop()
  wpController?.canvas.remove()
  wpController = null
}

/** Register a callback fired once a generated snapshot is ready (so the caller
 *  can re-sync the settings preview / store). */
export function onGeneratedSnapshot(cb: () => void): void {
  snapshotListener = cb
}

function ensureTokenStyle(): HTMLStyleElement {
  if (tokenStyleEl?.isConnected) return tokenStyleEl
  tokenStyleEl = document.createElement('style')
  tokenStyleEl.dataset.plugin = 'dsh-any-background-tokens'
  document.head.appendChild(tokenStyleEl)
  return tokenStyleEl
}

function clearCustomTokens(): void {
  if (tokenStyleEl) tokenStyleEl.textContent = ''
  for (const name of appliedTokenNames) document.body.style.removeProperty(name)
  appliedTokenNames = []
}

/** Drop every applied custom token and forget the token fingerprint, so a
 *  later color-less profile (system theme) leaves no stale rule behind. */
export function clearThemeTokens(): void {
  clearCustomTokens()
  baseTokenKey = ''
  lastBgKey = ''
  document.body.removeAttribute('data-ds-dark-theme')
  document.body.style.removeProperty('color-scheme')
}

/** Label tokens flipped by the background brightness verdict. The faint tiers
 *  (caption/dimmed) are deliberately NOT flipped: they back placeholder/hint
 *  text, which must stay visibly weaker than real input even when the wallpaper
 *  brightness flips the main label direction. Exported so the skin registration
 *  (index) can flip fonts through the host theme service too. */
export const LABEL_TOKENS = [
  '--dsw-alias-label-primary',
  '--dsw-alias-label-secondary',
  '--dsw-alias-label-tertiary',
]

// Solid surface tokens grouped by which interface-opacity slider owns them.
// Every member is re-emitted with per-part alpha so surfaces over the wallpaper
// (composer input, elevated buttons, menu panels) can go translucent — not just
// the layered bg/sidebar tokens. --dsw-specific-menu (dropdowns, slash-trigger
// menu, model selector, popovers around the dialog) is owned by the card
// slider; the Cordis panel shares that token but is re-scoped to the input
// slider via INPUT_BLUR_RULE.
const OPACITY_TOKEN_GROUPS: Array<{ part: keyof PartOpacities; names: string[] }> = [
  { part: 'bg', names: ['--dsw-alias-bg-base'] },
  { part: 'sidebar', names: ['--dsw-specific-sidebar-fill'] },
  { part: 'card', names: ['--dsw-alias-bg-layer-1', '--dsw-alias-bg-layer-2', '--dsw-alias-bg-layer-3', '--dsw-specific-menu'] },
  { part: 'input', names: ['--dsw-specific-input-major'] },
]

// Plugin-owned variables the opacity-bearing tokens read from. They live as
// inline custom props on <html>, so a slider drag rewrites only those few values
// instead of re-parsing/re-matching the whole body token rule on every tick —
// the difference is critical when a large wallpaper sits under the interface.
const OPACITY_VARS: Record<string, string> = {
  '--dsw-alias-bg-base': '--dsh-any-op-bg',
  '--dsw-specific-sidebar-fill': '--dsh-any-op-sidebar',
  '--dsw-alias-bg-layer-1': '--dsh-any-op-card-1',
  '--dsw-alias-bg-layer-2': '--dsh-any-op-card-2',
  '--dsw-alias-bg-layer-3': '--dsh-any-op-card-3',
  '--dsw-specific-input-major': '--dsh-any-op-input',
  '--dsw-specific-menu': '--dsh-any-op-menu',
}

// Fingerprint of the non-alpha token base (color pick + brightness verdict).
// The static body rule is only rebuilt when it changes; a drag never touches it.
let baseTokenKey = ''

// Coalesce slider-driven token updates to one rAF: a single drag fires several
// input events per frame, and every full re-apply repaints expensive regions
// over a large wallpaper. Batching keeps at most one update per frame. The
// base-fingerprint gate above already makes a muted drag cheap; this prevents
// repeated identical reapplies from stacking within the same frame.
let pendingOps: PartOpacities | null = null
let tokensRaf: number | null = null

export function applyCustomTokens(ops: PartOpacities): void {
  pendingOps = ops
  if (tokensRaf !== null) return
  tokensRaf = requestAnimationFrame(() => {
    tokensRaf = null
    if (pendingOps === null) return
    const o = pendingOps
    pendingOps = null
    applyCustomTokensNow(o)
  })
}

// Only the main-bg slider retints the center column; keys on
// baseTokenKey + ops.bg so a sidebar/card/input drag never rewrites it.
let lastBgKey = ''

/** Palette source for the token rule: the picked color; a forced scheme
 *  without a picked color builds a neutral near-gray palette in that
 *  direction; auto without a color keeps the host's own palette (null — only
 *  the label direction gets asserted). The palette direction follows the
 *  color's own lightness (rColorScheme), not the wallpaper verdict, so the
 *  surfaces keep contrasting with the fonts. */
function paletteTokens(): Record<string, string> | null {
  const scheme = rColorScheme()
  if (rHasColor()) {
    const [h, s, l] = rColor()
    return genTokens(h, s, l, scheme).tokens
  }
  if (rSchemeOverride() !== 'auto') {
    return genTokens(220, 0.04, scheme === 'dark' ? 0.14 : 0.92, scheme).tokens
  }
  return null
}

/** Surface colors the opacity sliders fade when the plugin has NO palette of
 *  its own (no picked color, no forced scheme), read live from the host's
 *  resolved tokens on `:root` — the same trick applyPanelOverrides uses for the
 *  workbench panel. Without this source the per-part alpha is never emitted at
 *  all and every opacity slider looks inert until the user drags it once.
 *  The sliders only ever supply the alpha: the host still decides the colors,
 *  so a custom host skin survives. Returns null when the host exposes none. */
function readHostOpacityTokens(): Record<string, string> | null {
  if (typeof getComputedStyle === 'undefined') return null
  const cs = getComputedStyle(document.documentElement)
  const out: Record<string, string> = {}
  let found = false
  for (const g of OPACITY_TOKEN_GROUPS) {
    for (const name of g.names) {
      const v = cs.getPropertyValue(name).trim()
      if (v === '') continue
      out[name] = v
      found = true
    }
  }
  return found ? out : null
}

function applyCustomTokensNow(ops: PartOpacities): void {
  const hasColor = rHasColor()
  const override = rSchemeOverride()
  const [h, s, l] = rColor()
  const scheme = rScheme()
  const verdict = rBgDark()
  const palette = paletteTokens()
  // Surface source for the opacity re-emit: the plugin's own palette when it
  // has one, otherwise the host's resolved tokens — see readHostOpacityTokens.
  // This is what keeps all four interface-opacity sliders live in the default
  // state (fresh install: no picked color, no verdict, auto scheme).
  const surfaces = palette ?? readHostOpacityTokens()
  // Clone: the verdict below mutates, and genTokens' result is cached/shared.
  const tokens: Record<string, string> = { ...surfaces }
  // Font direction while the scheme is automatic: a picked color owns it —
  // its palette direction (rColorScheme) keeps the labels contrasted with the
  // surfaces they sit on, so a very dark pick flips to white fonts even over
  // a light wallpaper (and vice versa). Without a pick the wallpaper
  // brightness verdict decides: the text then sits directly on the wallpaper.
  if (override === 'auto') {
    const fontDark = hasColor ? rColorScheme() === 'dark' : verdict
    if (fontDark !== null && fontDark !== undefined) {
      const font = fontDark ? '#fff' : '#000'
      for (const name of LABEL_TOKENS) tokens[name] = font
    }
  }
  try {
    const forceDark = scheme === 'dark'
    const key = `${h}|${s}|${l}|${verdict}|${scheme}|${hasColor}`
    if (key !== baseTokenKey) {
      baseTokenKey = key
      // Drive the base-palette switch with a plugin-specific value so the
      // gradient rule never matches a host dark-mode flag; color-scheme makes
      // native controls (select popups) follow the forced palette. Both ride the
      // stylesheet (not inline styles) so the host presenter clearing body
      // inline styles on boot can't drop them, and the !important rule survives
      // that clearing too.
      if (forceDark) document.body.setAttribute('data-ds-dark-theme', 'dsh-any-background')
      else document.body.removeAttribute('data-ds-dark-theme')
      const decls: string[] = [`color-scheme:${forceDark ? 'dark' : 'light'}`]
      for (const [name, value] of Object.entries(tokens)) {
        const opVar = OPACITY_VARS[name]
        decls.push(`${name}:${opVar !== undefined ? `var(${opVar})` : value}!important`)
      }
      ensureTokenStyle().textContent = `body{${decls.join(';')}}`
      // Drop inline tokens left by earlier builds so the stylesheet is the single source of truth.
      for (const name of appliedTokenNames) document.body.style.removeProperty(name)
      appliedTokenNames = Object.keys(tokens)
    }
    // Without a palette there are no surface alphas to re-emit — the host
    // palette stays untouched and only the label direction was asserted. Now
    // that the host's own resolved tokens can back the alpha, this only bails
    // when even those are unavailable.
    if (surfaces === null) {
      // Preserve the previous "nothing derived" cleanup: a color-less auto
      // state with no verdict leaves no stale rule behind. A forced scheme or
      // a wallpaper verdict still has something to assert above.
      if (!hasColor && override === 'auto' && verdict === null) clearThemeTokens()
      return
    }
    // Cheap per-drag update: only the surface alpha vars move on <html>.
    const root = document.documentElement
    for (const g of OPACITY_TOKEN_GROUPS) {
      for (const name of g.names) {
        if (surfaces[name] === undefined) continue
        root.style.setProperty(OPACITY_VARS[name], toRgba(surfaces[name]!, ops[g.part]))
      }
    }
    // The Cordis panel keeps its own input-slider alpha (see INPUT_BLUR_RULE).
    const menu = surfaces['--dsw-specific-menu']
    if (menu !== undefined) root.style.setProperty('--dsh-any-op-menu-cordis', toRgba(menu, ops.input))
    const bgKey = `${baseTokenKey}|${ops.bg}`
    if (bgKey !== lastBgKey) { lastBgKey = bgKey; applyPartOpacities(ops) }
  } catch {
    // ignore
  }
}

// ── Settings panel opacity ─────────────────────────────────────────────────────
// The settings modal is the only aria-modal dialog identifying itself with
// aria-labelledby, so this selector scopes translucency to the settings panel.
// The surface (--dsw-alias-bg-layer-2) is re-emitted with an alpha through a
// plugin-owned variable so the panel keeps its color while fading.

const SETTINGS_PANEL_SEL = '[role="dialog"][aria-modal="true"][aria-labelledby]'
export const SETTINGS_STYLE_RULE =
  `${SETTINGS_PANEL_SEL}{` +
  `background:var(--dsh-any-bg-settings-surface,var(--dsw-alias-bg-layer-2));` +
  `backdrop-filter:var(--dsh-any-blur-settings,none);` +
  // Re-scope the dialog's layer tokens to plugin-owned variables so every
  // surface inside the dialog follows the settings opacity slider only.
  `--dsw-alias-bg-layer-1:var(--dsh-any-bg-settings-layer-1);` +
  `--dsw-alias-bg-layer-2:var(--dsh-any-bg-settings-layer-2);` +
  `--dsw-alias-bg-layer-3:var(--dsh-any-bg-settings-layer-3)}` +
  // Option-panel blur inside the dialog, owned by the card blur slider.
  `${SETTINGS_PANEL_SEL} .dab-card{backdrop-filter:var(--dsh-any-blur-card-panels,none);-webkit-backdrop-filter:var(--dsh-any-blur-card-panels,none)}`

// ── Popover / popover-style surface blur (the "card" slider's true target) ────
// The "card" opacity slider does not bind to the settings dialog's .dab-card —
// the comments at OPACITY_TOKEN_GROUPS note that --dsw-specific-menu (the
// dropdown / popover / menu surface token) is owned by the card slider, and
// the body-level re-scope in `applyCustomTokensNow` retints every consumer
// of that token globally. The host uses --dsw-specific-menu for the "popovers
// around the dialog" — the model selector (ModelSelect), the per-session
// permission preset row (PermissionRow → Menu portal), the composer
// permission seat (PermissionSelect → in-place Menu, `side="top"`), the
// stat dialog (TurnUsagePanel / StatsPills → useStatDialog), the schedule
// catalog, the subagent lineage tree, the /model command panel, the
// @-trigger suggestion list, the job list, etc.
//
// The card-blur slider has to land on the same surfaces for the visible
// effect to follow the slider.
//
// The host uses three ARIA roles for these surfaces, and one stable
// data-attribute to disqualify a non-target:
//
//   [role="menu"]   · every Menu primitive surface (.list, .submenu),
//                    ModelSelect's `.menu`.  These are the picker-style
//                    popovers, both portal-mode (rendered to body via
//                    createPortal) and in-place (rendered where the React
//                    subtree is — PermissionSelect keeps its `side="top"`
//                    list inside the composer card).
//   [role="listbox"]· the /model command panel (PopupSelectView) and the
//                    @-trigger suggestion list (MenuView).  Both live
//                    inside the composer card.  No other host element
//                    uses role="listbox".
//   [role="tree"]   · the subagent lineage tree (portaled to body) and
//                    the sidebar's workspace browser (ui-workspace).  The
//                    `body >` qualifier restricts this to the portaled
//                    variant and keeps the sidebar tree out.
//   [role="dialog"]:not([aria-modal="true"])
//                  · stat-dialog (TurnUsagePanel / StatsPills).  The
//                    settings modal is `role="dialog"` with
//                    `aria-modal="true"` and is owned by
//                    SETTINGS_STYLE_RULE; the `:not()` excludes it.
//
// The one element the rule must NOT touch is the dockkit per-tab
// right-click menu (ui-dockkit TabMenu.tsx).  It uses `role="menu"` and
// is portaled to body, and its background paints from
// `--dsw-alias-bg-layer-3` (a layer token, not the menu token) — it is a
// tab control, not a "popover around the dialog", and it carries a stable
// `data-dockkit-tab-menu` attribute.  `:not([data-dockkit-tab-menu])`
// trims it out of the menu rule.
//
// Stacking-context caveat: the in-place menus (PermissionSelect's
// `side="top"` list, MenuView's listbox, PopupSelectView's listbox) live
// inside .composerSeat, which is `position: sticky` and therefore a
// stacking-context root.  Their backdrop-filter cannot see the wallpaper
// (z-index: -1 in body) because they are trapped in that context.  The
// effect they get is "frost the composer card chrome", which the card
// slider drives just as visibly as a wallpaper-facing blur because the
// card's own surface sits in the same context.
//
// The portaled menus (ModelSelect, Menu portal mode, stat-dialog,
// SubagentHeaderLineage) are in body's stacking context and see the
// wallpaper directly through the (transparent) AppFrame.
export const POPOVER_BLUR_RULE =
  `[role="menu"]:not([data-dockkit-tab-menu]),` +
  `[role="listbox"],` +
  `body > [role="tree"],` +
  `body > [role="dialog"]:not([aria-modal="true"])` +
  `{backdrop-filter:var(--dsh-any-blur-card-panels,none);` +
  `-webkit-backdrop-filter:var(--dsh-any-blur-card-panels,none)}`

// Input/control surface blur. The composer card and the Cordis panel expose
// stable host data attributes ([data-composer-card], [data-cordis-panel]), so
// the backdrop is attached via a stylesheet rule rather than element discovery.
// The Cordis panel shares the --dsw-specific-menu token with the dialog's
// option boxes, but it stays owned by the input slider — the re-scope below
// keeps it there now that the menu token itself follows the card slider. Note
// the input slider must NOT drive the button-elevated-fill /
// button-floating-hover tokens: the settings panel's own controls (slider
// thumbs, .dab-btn, segmented thumb) are painted from those same tokens, so
// tinting them would bleach the panel's own UI.
export const INPUT_BLUR_RULE =
  // The composer capsule must NOT carry backdrop-filter itself: it is an
  // ancestor of the in-place popovers (permission / command / model lists),
  // and a backdrop-filter on it would make it a backdrop root, trapping those
  // lists' own backdrop-filter to the capsule — which chained their visible
  // frost to the input slider. The frost instead rides an isolated ::before
  // underlay (position:absolute, z-index:-1), so it sits behind the capsule
  // content AND the popovers, leaving the popovers free to sample the
  // wallpaper and follow the card slider only. (Same rule the part-blurs
  // follow: backdrop-filter never goes directly on a host part.)
  '[data-composer-card]{position:relative;isolation:isolate}' +
  '[data-composer-card]::before{' +
  'content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;border-radius:inherit;' +
  '-webkit-backdrop-filter:var(--dsh-any-input-blur,none);' +
  'backdrop-filter:var(--dsh-any-input-blur,none)}' +
  '[data-cordis-panel]{' +
  '-webkit-backdrop-filter:var(--dsh-any-input-blur,none);' +
  'backdrop-filter:var(--dsh-any-input-blur,none)}' +
  '[data-cordis-panel]{--dsw-specific-menu:var(--dsh-any-op-menu-cordis)!important}'

function applyInputBlur(px: number): void {
  if (px > 0) document.documentElement.style.setProperty('--dsh-any-input-blur', `blur(${px}px)`)
  else document.documentElement.style.removeProperty('--dsh-any-input-blur')
}

// Narrow-viewport hosts render a fixed session-title bar (.dsh-mobile-app-header)
// above the AppFrame columns, outside every column's subtree. The main-bg alpha
// lives on the columns (applyPartOpacities), so that bar paints the raw
// wallpaper and splits visually from the translucent center column. Both rules
// below ride plugin-owned variables so the bar follows the sliders and falls
// back to the host default when the plugin never set them.
export const MOBILE_HEADER_RULE =
  '.dsh-mobile-app-header{' +
  'background:var(--dsh-any-op-bg,transparent)!important;' +
  'backdrop-filter:var(--dsh-any-part-blur-global,none);' +
  '-webkit-backdrop-filter:var(--dsh-any-part-blur-global,none)}'

/** Mirror of the bg-part blur on :root. --dsh-any-part-blur is element-scoped
 *  to the columns, so surfaces outside their subtree (the mobile header, or
 *  third-party styles) can never inherit it. */
function applyBgBlurGlobal(px: number): void {
  if (px > 0) document.documentElement.style.setProperty('--dsh-any-part-blur-global', `blur(${px}px)`)
  else document.documentElement.style.removeProperty('--dsh-any-part-blur-global')
}

// ── Workbench panel (dsh-better-sidebar) ──────────────────────────────────────
// The bottom workbench panel of dsh-better-sidebar paints every surface from
// the layer/bg-base tokens ([data-dsh-bottom-panel] is its stable marker), and
// it hangs off document.body — OUTSIDE the AppFrame columns, so neither the
// column opacities nor the part-blur underlays ever reach it. Three rules
// close the gap: a static blur rule, a token re-scope, and a stacking-context
// promotion. The promotion is necessary because the bottom panel is a child
// of [data-dsh-panel-host] (z-index 25, position: fixed — a stacking
// context), and `backdrop-filter` only blurs content in the SAME stacking
// context; with the panel nested in the host, the wallpaper (z-index -1 in
// body) is invisible to the panel's backdrop-filter. Re-scoping to
// `position: fixed` (z-index 26) re-parents the panel to body's stacking
// context — still above the panel host (25), still below the cordis
// floating panel (30), preserving the original layering — and the inline
// `left/right/height` (already in viewport coordinates) keep the panel at
// the same visual position.
// The token re-scope lives in the ALWAYS-EMITTED static stylesheet (see
// `index.tsx`) so the panel can follow the slider even when the plugin has
// no palette (no picked color, no wallpaper verdict, no forced scheme).
// Pointing at unwritten vars would make the panel's `background: var(--dsw-
// alias-bg-layer-1)` declaration invalid and the panel would lose its
// surface; `applyPanelOverrides` writes the vars every call so the rule
// always has targets. Exporting here lets `index.tsx` splice it in once,
// avoiding the per-palette re-emit in `applyCustomTokensNow`.
export const PANEL_TOKEN_RULE =
  // `!important` on position/z-index beats the host's class rules
  // ([data-dsh-bottom-panel] and [data-sidebar-right-panel] both share 0,1,0
  // specificity with `.bottomPanel` and `.P3OORG_panel`, so the plugin's
  // stylesheet can lose a same-specificity tie on source order). The
  // promotion is also non-negotiable for the backdrop-filter to work — the
  // elements are otherwise trapped in a sub-tree stacking context.
  '[data-dsh-bottom-panel],[data-sidebar-right-panel]{' +
  '--dsw-alias-bg-base:var(--dsh-any-panel-bg-base);' +
  '--dsw-alias-bg-layer-1:var(--dsh-any-panel-layer-1);' +
  '--dsw-alias-bg-layer-2:var(--dsh-any-panel-layer-2);' +
  '--dsw-alias-bg-layer-3:var(--dsh-any-panel-layer-3);' +
  'position:fixed!important;z-index:26!important}' +
  // The right sidebar's fullscreen state (`data-sidebar-right-panel=fullscreen`)
  // raises it to z-index 40 in the host CSS so the modal-level surface wins.
  // Override the elevation when fullscreen so the slider still applies the
  // alpha/blur; the original z-index 40 was a host layering choice that the
  // plugin never needs to fight here (the panel still floats above the cordis
  // inventory at 30 thanks to source order plus same-specificity; the modal
  // dialog stack lives at 100+ which is unaffected).
  '[data-sidebar-right-panel][data-sidebar-right-panel="fullscreen"]{z-index:40!important}'

// Both surfaces are now `position: fixed` (see PANEL_TOKEN_RULE), so the
// host's transform animation no longer traps fixed-position descendants and
// the underlay treatment from `setBlur` (used for the host columns) is
// unnecessary. `backdrop-filter` directly on each element is safe and points
// the blur at the wallpaper.
export const PANEL_BLUR_RULE =
  '[data-dsh-bottom-panel],[data-sidebar-right-panel]{' +
  '-webkit-backdrop-filter:var(--dsh-any-blur-panel,none);' +
  'backdrop-filter:var(--dsh-any-blur-panel,none)}'

// ── Produced/artifact surfaces ─────────────────────────────────────────────
// The surfaces owned by the "产出物/高亮内容" (produced/highlights) slider are
// the code blocks inside conversation content (host CodeBlock → `.md-code-block`
// wrapping `[data-code-block-content]` > `<pre class="shiki css-variables">`),
// their banner, the inline `code` chips in markdown (the small background box
// around identifiers like `@supports`, rendered by the host's
// `:not(pre) > code` rule) and the composer's reference chips
// (`[data-composer-chip]`).
//
// Those sliders are an ALPHA control for the color a surface ALREADY uses — they
// must never paint a color of their own. The host paints the block background
// from its own tokens: `--dsl-code-block-background` (= `--dsw-alias-markdown-
// code-block`) on the wrapper and again on the inner `pre`,
// `--dsl-code-block-banner-background-color` on the banner, and
// `--dsw-alias-markdown-inline-code` on an inline chip. The shiki `pre` also
// carries an inline `background-color: var(--shiki-background)`, which the theme
// package aliases to that same `--dsw-alias-markdown-code-block`. So every layer
// is re-emitted through `color-mix(in srgb, <its own host color> <pct>,
// transparent)`: 100% reproduces the host color exactly, and lowering it fades
// THAT surface instead of stacking a second background on top of the original
// one.
//
// The opaque wrapper layers (the `.md-code-block` fill and the sticky banner
// wrapper's `--dsw-alias-bg-base` backdrop) are cleared so the wallpaper shows
// through once, and `backdrop-filter` gets something to frost; only the `pre`,
// the banner and the inline chips carry the modulated color. The
// `--shiki-background` alias is re-pointed on the content container as well, so
// the same control reaches code blocks that live outside `.md-code-block` (the
// document preview) and take their background from that inline variable alone.
// Values ride root CSS variables, so blocks and chips that stream in after a
// reply pick them up without an observer.
export const PRODUCED_RULE =
  // Frosting only — kept outside the color-mix guard so it never depends on it.
  '[data-code-block-content] pre,[data-code-block-banner],[data-composer-chip],' +
  ':not(pre)>code{' +
  '-webkit-backdrop-filter:var(--dsh-any-blur-prod,none);' +
  'backdrop-filter:var(--dsh-any-blur-prod,none)}' +
  // Alpha. Guarded: without color-mix support the host look stays untouched
  // instead of resolving the surface color to an invalid value.
  '@supports (background:color-mix(in srgb,red 50%,transparent)){' +
  '.md-code-block{background:transparent!important}' +
  '.md-code-block>div{background-color:transparent!important}' +
  // Every base falls back to the older token names (0.1.2-alpha.4 has no
  // `--dsl-code-block-*` yet), so the color-mix can never resolve to an
  // invalid value and blank a surface out.
  '.md-code-block [data-code-block-content] pre{' +
  'background-color:color-mix(in srgb,var(--dsl-code-block-background,var(--dsw-alias-markdown-code-block,transparent)) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  '.md-code-block [data-code-block-banner]{' +
  'background-color:color-mix(in srgb,var(--dsl-code-block-banner-background-color,var(--dsw-alias-markdown-code-block-banner,transparent)) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  '[data-code-block-content]{' +
  '--shiki-background:color-mix(in srgb,var(--dsw-alias-markdown-code-block,var(--dsl-code-block-background,transparent)) var(--dsh-any-prod-pct,100%),transparent)}' +
  // Inline markdown `code` chips: the host's own selector shape, so the chip
  // keeps its token color and only loses alpha (plus the shared frost).
  ':not(pre)>code{' +
  'background-color:color-mix(in srgb,var(--dsw-alias-markdown-inline-code,transparent) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  '[data-composer-chip]>*{' +
  'background-color:color-mix(in srgb,var(--dsw-alias-interactive-bg-hover,transparent) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  '}'

// ── Per-part text stroke (-webkit-text-stroke) ────────────────────────────────
// Same surface groups as the blur sliders (issue #16). Values ride two root
// CSS variables per group — width and resolved color — so a slider drag only
// rewrites variables while the (static) rules below never change. paint-order
// MUST accompany every stroke declaration: without it the stroke paints over
// the glyph and thins the characters.
//
// The two homepage columns (bg / sidebar groups) are discovered structurally
// (see discoverParts) and carry the stroke INLINE from applyStrokes instead of
// a static selector. Every other group binds to the same stable selectors the
// blur rules already proved:
//   settings   → the settings dialog (SETTINGS_PANEL_SEL)
//   card       → the popover/menu surface set (POPOVER_BLUR_RULE's selectors)
//   input      → composer card + cordis panel (INPUT_BLUR_RULE's markers), and
//                the native editors inside them (form controls do not inherit
//                text properties from their container)
//   chat       → the conversation message column ([data-chat-flow])
//   trajectory → the trajectory view root
//   produced   → code blocks / banners / inline code chips / composer chips.
//                Being a DIRECT rule it also shields those surfaces from the
//                inherited chat stroke — with produced width 0 the reset is
//                exactly the exemption shiki multi-color text needs.
//   panel      → the dsh-better-sidebar workbench surfaces
//
// Global exemptions: SVG glyphs (host icons are paths, but paint-order is
// inherited and would subtly alter stroked-and-filled icon rendering) and
// ::placeholder text (italic hint text must stay unstroked).

export const STROKE_RULE = [
  // settings
  `${SETTINGS_PANEL_SEL}{-webkit-text-stroke:var(--dsh-any-stroke-settings-w,0px) var(--dsh-any-stroke-settings-c,transparent);paint-order:stroke fill}`,
  // card / popovers — selector set mirrors POPOVER_BLUR_RULE
  `[role="menu"]:not([data-dockkit-tab-menu]),[role="listbox"],body>[role="tree"],body>[role="dialog"]:not([aria-modal="true"])` +
  `{-webkit-text-stroke:var(--dsh-any-stroke-card-w,0px) var(--dsh-any-stroke-card-c,transparent);paint-order:stroke fill}`,
  // input / controls — native editors need their own declaration
  `[data-composer-card],[data-cordis-panel],` +
  `[data-composer-card] textarea,[data-composer-card] input,[data-composer-card] [contenteditable],` +
  `[data-cordis-panel] input,[data-cordis-panel] textarea` +
  `{-webkit-text-stroke:var(--dsh-any-stroke-input-w,0px) var(--dsh-any-stroke-input-c,transparent);paint-order:stroke fill}`,
  // chat message column
  `[data-chat-flow]{-webkit-text-stroke:var(--dsh-any-stroke-chat-w,0px) var(--dsh-any-stroke-chat-c,transparent);paint-order:stroke fill}`,
  // trajectory view
  `[data-conversation-composer-overlay]{-webkit-text-stroke:var(--dsh-any-stroke-trajectory-w,0px) var(--dsh-any-stroke-trajectory-c,transparent);paint-order:stroke fill}`,
  // produced / artifact text — direct rule doubles as the chat-inheritance shield
  `[data-code-block-content] pre,[data-code-block-content],[data-code-block-banner],[data-composer-chip],:not(pre)>code` +
  `{-webkit-text-stroke:var(--dsh-any-stroke-produced-w,0px) var(--dsh-any-stroke-produced-c,transparent);paint-order:stroke fill}`,
  // workbench panel
  `[data-dsh-bottom-panel],[data-sidebar-right-panel]{-webkit-text-stroke:var(--dsh-any-stroke-panel-w,0px) var(--dsh-any-stroke-panel-c,transparent);paint-order:stroke fill}`,
  // exemptions
  `svg{-webkit-text-stroke-width:0!important;paint-order:normal!important}`,
  `::placeholder{-webkit-text-stroke-width:0!important}`,
].join('')

/** Groups whose stroke lands on the structurally-discovered columns (inline),
 *  versus every group served by the static STROKE_RULE selectors. */
const STROKE_INLINE_GROUPS = ['bg', 'sidebar'] as const
type StrokeGroup = keyof PartBlurs
const STROKE_VAR_GROUPS: StrokeGroup[] = ['card', 'settings', 'chat', 'trajectory', 'input', 'panel', 'produced']

/** Resolve one group's stroke color key into a concrete CSS color.
 *  'auto' contrasts the FONT direction (white fonts → black stroke and vice
 *  versa — mirrors the label flip in applyCustomTokensNow); 'theme' follows
 *  the live palette's brand primary (picked color → generated palette, else
 *  the host's own resolved token). */
function strokeColor(s: StrokeConfig): string {
  switch (s.color) {
    case 'gray': return '#808080'
    case 'black': return '#000'
    case 'white': return '#fff'
    case 'custom': return s.customColor
    case 'theme': {
      if (rHasColor() || rSchemeOverride() !== 'auto') {
        const [h, sa, l] = rColor()
        return genTokens(h, sa, l, rColorScheme()).tokens['--dsw-alias-brand-primary'] ?? '#808080'
      }
      if (typeof getComputedStyle !== 'undefined') {
        const v = getComputedStyle(document.documentElement).getPropertyValue('--dsw-alias-brand-primary').trim()
        if (v !== '') return v
      }
      return '#808080'
    }
    case 'auto':
    default: {
      // Font direction, same derivation order as applyCustomTokensNow: picked
      // color's palette direction, then a forced scheme, then the wallpaper
      // brightness verdict; light fonts (unknown) default to a white stroke.
      let fontDark: boolean
      if (rHasColor()) fontDark = rColorScheme() === 'dark'
      else if (rSchemeOverride() !== 'auto') fontDark = rScheme() === 'dark'
      else if (rBgDark() !== null) fontDark = rBgDark() === true
      else fontDark = false
      return fontDark ? '#000' : '#fff'
    }
  }
}

/** Write every group's stroke width/color variables + the two column strokes.
 *  Called from applyWp so palette/verdict changes re-derive 'auto'/'theme'. */
export function applyStrokes(): void {
  const strokes = rStrokes()
  const root = document.documentElement
  for (const g of STROKE_VAR_GROUPS) {
    const s = strokes[g]
    root.style.setProperty(`--dsh-any-stroke-${g}-w`, `${s.width}px`)
    root.style.setProperty(`--dsh-any-stroke-${g}-c`, strokeColor(s))
  }
  // Columns are dynamically discovered; their stroke rides inline styles and
  // is fully removed at width 0 so nothing lingers after the slider resets.
  discoverParts()
  for (const g of STROKE_INLINE_GROUPS) {
    const el = g === 'bg' ? centerEl : sidebarEl
    if (el === null) continue
    const s = strokes[g]
    if (s.width > 0) {
      el.style.setProperty('-webkit-text-stroke', `${s.width}px ${strokeColor(s)}`)
      el.style.setProperty('paint-order', 'stroke fill')
    } else {
      el.style.removeProperty('-webkit-text-stroke')
      el.style.removeProperty('paint-order')
    }
  }
}

/** Live per-group stroke update during slider drag (no full re-apply). */
export function setPartStroke(part: StrokeGroup, s: StrokeConfig): void {
  if (STROKE_VAR_GROUPS.includes(part)) {
    document.documentElement.style.setProperty(`--dsh-any-stroke-${part}-w`, `${s.width}px`)
    document.documentElement.style.setProperty(`--dsh-any-stroke-${part}-c`, strokeColor(s))
    return
  }
  discoverParts()
  const el = part === 'bg' ? centerEl : sidebarEl
  if (el === null) return
  if (s.width > 0) {
    el.style.setProperty('-webkit-text-stroke', `${s.width}px ${strokeColor(s)}`)
    el.style.setProperty('paint-order', 'stroke fill')
  } else {
    el.style.removeProperty('-webkit-text-stroke')
    el.style.removeProperty('paint-order')
  }
}

/** Teardown only: drop every stroke variable and column inline stroke. */
function removeStrokes(): void {
  const root = document.documentElement
  for (const g of [...STROKE_VAR_GROUPS, ...STROKE_INLINE_GROUPS]) {
    root.style.removeProperty(`--dsh-any-stroke-${g}-w`)
    root.style.removeProperty(`--dsh-any-stroke-${g}-c`)
  }
  for (const el of [centerEl, sidebarEl]) {
    if (el === null) continue
    el.style.removeProperty('-webkit-text-stroke')
    el.style.removeProperty('paint-order')
  }
}

// ── Custom interface font ─────────────────────────────────────────────────────
// One font file owns a server-side slot served from /dsh-any-background/font.
// Applying it means: register an @font-face for the plugin-owned 'DAnyFont'
// family and re-scope the host's interface font token (--dsw-font-family, the
// base stack every text consumer reads) to `'DAnyFont', <original stack>` at
// body level — the body-level custom property shadows :root's for all
// descendants, so the swap survives host theme re-assertions (they rewrite
// :root only). The host's code font (--ds-font-family-code) is deliberately
// untouched: code blocks keep their mono stack.
// The <style> element carries both the @font-face and the token override, so
// disabling/removing the font is just removing the element.

const FONT_FAMILY = 'DAnyFont'
let fontStyleEl: HTMLStyleElement | null = null

function fontFormatForMime(mime: string | null): string {
  switch (mime) {
    case 'font/woff2': return 'woff2'
    case 'font/woff': return 'woff'
    case 'font/otf': return 'opentype'
    default: return 'truetype'
  }
}

/** Apply or clear the custom interface font. `url` is the serve URL (null =
 *  nothing stored); `enabled` gates the token override without deleting the
 *  file. The original host stack is re-read on every apply so a host skin
 *  change is picked up, and stays as the fallback after 'DAnyFont'. */
export function applyFontFace(url: string | null, enabled: boolean, mime: string | null): void {
  if (url === null || !enabled) {
    fontStyleEl?.remove()
    fontStyleEl = null
    return
  }
  if (fontStyleEl === null || !fontStyleEl.isConnected) {
    fontStyleEl = document.createElement('style')
    fontStyleEl.dataset.plugin = 'dsh-any-background-font'
    document.head.appendChild(fontStyleEl)
  }
  let stack = ''
  if (typeof getComputedStyle !== 'undefined') {
    stack = getComputedStyle(document.documentElement).getPropertyValue('--dsw-font-family').trim()
  }
  if (stack === '') stack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif"
  const fmt = fontFormatForMime(mime)
  fontStyleEl.textContent =
    `@font-face{font-family:'${FONT_FAMILY}';src:url('${url}') format('${fmt}');font-display:swap}` +
    // Inheritable consumers only: form controls with UA default fonts keep
    // their own look unless the host already opted them into the token.
    `body{--dsw-font-family:'${FONT_FAMILY}',${stack}}` +
    `input,textarea,select,button{font-family:var(--dsw-font-family)}`
}

/** Teardown only: drop the @font-face + token override. */
function removeFontFace(): void {
  fontStyleEl?.remove()
  fontStyleEl = null
}

/** The host's own default colors for the panel layer tokens, used when the
 *  plugin has no palette (no picked color, no wallpaper verdict, no forced
 *  scheme). Without these the panel's re-scope would resolve to invalid vars
 *  and the panel would have no background — reading the host's resolved value
 *  keeps the panel opaque by default and lets the slider retint it like every
 *  other homepage part. Reads from the live `:root` so a custom host skin or
 *  theme override wins. */
function readHostLayerTokens(): { base: string; layer1: string; layer2: string; layer3: string } | null {
  if (typeof getComputedStyle === 'undefined') return null
  const root = document.documentElement
  const cs = getComputedStyle(root)
  const base = cs.getPropertyValue('--dsw-alias-bg-base').trim()
  const layer1 = cs.getPropertyValue('--dsw-alias-bg-layer-1').trim()
  const layer2 = cs.getPropertyValue('--dsw-alias-bg-layer-2').trim()
  const layer3 = cs.getPropertyValue('--dsw-alias-bg-layer-3').trim()
  if (!base && !layer1 && !layer2 && !layer3) return null
  return { base, layer1, layer2, layer3 }
}

export function applyPanelOverrides(op: number): void {
  // Palette-keyed fast path: a picked color / forced scheme builds a
  // token set in `genTokens` and remaps the panel via the re-scope rule.
  const tokens = paletteTokens()
  const root = document.documentElement
  if (tokens !== null) {
    const base = tokens['--dsw-alias-bg-base']
    const layer1 = tokens['--dsw-alias-bg-layer-1']
    const layer2 = tokens['--dsw-alias-bg-layer-2']
    const layer3 = tokens['--dsw-alias-bg-layer-3']
    if (base !== undefined) root.style.setProperty('--dsh-any-panel-bg-base', toRgba(base, op))
    if (layer1 !== undefined) root.style.setProperty('--dsh-any-panel-layer-1', toRgba(layer1, op))
    if (layer2 !== undefined) root.style.setProperty('--dsh-any-panel-layer-2', toRgba(layer2, op))
    if (layer3 !== undefined) root.style.setProperty('--dsh-any-panel-layer-3', toRgba(layer3, op))
    return
  }
  // No-palette fallback: read the host's own resolved values and re-emit them
  // with the slider's alpha. Without this the panel's re-scope (always in the
  // stylesheet) would point at unwritten vars and the panel would either keep
  // the host's default (no opacity control) or — with the `position: fixed`
  // promotion — fall through to a transparent surface. Reading the live host
  // tokens makes the slider work in every state.
  const host = readHostLayerTokens()
  if (host === null) {
    // Pre-mount or the host hasn't shipped the tokens yet: nothing to retint,
    // but the re-scope rule still needs SOMETHING — point at the existing
    // tokens via a transparent fallback so the panel surfaces stay on the
    // host palette until the next apply.
    root.style.setProperty('--dsh-any-panel-bg-base', 'transparent')
    root.style.setProperty('--dsh-any-panel-layer-1', 'transparent')
    root.style.setProperty('--dsh-any-panel-layer-2', 'transparent')
    root.style.setProperty('--dsh-any-panel-layer-3', 'transparent')
    return
  }
  if (host.base) root.style.setProperty('--dsh-any-panel-bg-base', toRgba(host.base, op))
  if (host.layer1) root.style.setProperty('--dsh-any-panel-layer-1', toRgba(host.layer1, op))
  if (host.layer2) root.style.setProperty('--dsh-any-panel-layer-2', toRgba(host.layer2, op))
  if (host.layer3) root.style.setProperty('--dsh-any-panel-layer-3', toRgba(host.layer3, op))
}

function applyPanelBlur(px: number): void {
  if (px > 0) document.documentElement.style.setProperty('--dsh-any-blur-panel', `blur(${px}px)`)
  else document.documentElement.style.removeProperty('--dsh-any-blur-panel')
}

// Placeholder/hint text inside the composer and the plugin's own input
// surfaces: rendered with the weak caption token (distinct from real input)
// plus italic, so an empty box is never mistaken for typed content. Written
// as a rule so it also covers placeholder text colored by the host's text tier.
export const PLACEHOLDER_RULE =
  '[data-composer-card] textarea::placeholder,' +
  '[data-composer-card] input::placeholder,' +
  '[data-composer-card] [contenteditable]::placeholder,' +
  '[data-cordis-panel] input::placeholder,' +
  '[data-cordis-panel] textarea::placeholder,' +
  '.dab-input::placeholder,' +
  '.dab-input textarea::placeholder,' +
  '.dab-input input::placeholder' +
  '{color:var(--dsh-any-placeholder,var(--dsw-alias-label-caption,#8a8f98))!important;font-style:italic;opacity:.85}'

export function applySettingsOverrides(op: number): void {
  // Always written explicitly (including 100%) — removing them would make
  // SETTINGS_STYLE_RULE fall back to the body layer tokens that
  // applyCustomTokens rewrites with the homepage card alpha.
  const [h, s, l] = rColor()
  const tokens = genTokens(h, s, l, rColorScheme()).tokens
  const layer1 = tokens['--dsw-alias-bg-layer-1']
  const layer2 = tokens['--dsw-alias-bg-layer-2']
  const layer3 = tokens['--dsw-alias-bg-layer-3']
  if (layer2 !== undefined) {
    document.documentElement.style.setProperty('--dsh-any-bg-settings-surface', toRgba(layer2, op))
  }
  // Dialog-scoped layer overrides consumed by SETTINGS_STYLE_RULE; opacity
  // follows the settings slider only (the card slider reaches panels via blur).
  if (layer1 !== undefined) {
    document.documentElement.style.setProperty('--dsh-any-bg-settings-layer-1', toRgba(layer1, op))
  }
  if (layer2 !== undefined) {
    document.documentElement.style.setProperty('--dsh-any-bg-settings-layer-2', toRgba(layer2, op))
  }
  if (layer3 !== undefined) {
    document.documentElement.style.setProperty('--dsh-any-bg-settings-layer-3', toRgba(layer3, op))
  }
}

// ── Trajectory view opacity ──────────────────────────────────────────────
// The trajectory view's own panels fully cover the root, so retinting only the
// root background is invisible. Re-scope the view root's layer tokens to
// plugin-owned variables so every surface follows the trajectory slider.
export const TRAJECTORY_STYLE_RULE =
  '[data-conversation-composer-overlay]{' +
  // No fallback inside var(): a self-referential fallback would be a cycle.
  '--dsw-alias-bg-layer-1:var(--dsh-any-traj-layer-1);' +
  '--dsw-alias-bg-layer-2:var(--dsh-any-traj-layer-2);' +
  '--dsw-alias-bg-layer-3:var(--dsh-any-traj-layer-3)}'

export function applyTrajectoryOverrides(op: number): void {
  // Always written explicitly so the view stays owned by this slider at 100%.
  const [h, s, l] = rColor()
  const tokens = genTokens(h, s, l, rColorScheme()).tokens
  const layer1 = tokens['--dsw-alias-bg-layer-1']
  const layer2 = tokens['--dsw-alias-bg-layer-2']
  const layer3 = tokens['--dsw-alias-bg-layer-3']
  if (layer1 !== undefined) {
    document.documentElement.style.setProperty('--dsh-any-traj-layer-1', toRgba(layer1, op))
  }
  if (layer2 !== undefined) {
    document.documentElement.style.setProperty('--dsh-any-traj-layer-2', toRgba(layer2, op))
  }
  if (layer3 !== undefined) {
    document.documentElement.style.setProperty('--dsh-any-traj-layer-3', toRgba(layer3, op))
  }
}

/** Register a callback fired when a wallpaper-extracted theme color is
 *  adopted by the auto-adaptation path, so the section can re-register the
 *  host skin, sync the editor UI and persist the pick (wallpaper.ts cannot
 *  do those itself — they live in the section). */
let colorAdoptedListener: ((hsl: [number, number, number]) => void) | null = null
export function onColorAdopted(cb: (hsl: [number, number, number]) => void): void { colorAdoptedListener = cb }

/** Apply the theme color: use the saved pick directly, or fall back to
 *  extracting a dominant color from the current wallpaper. */
export function applyThemeColor(): void {
  if (rHasColor()) {
    applyWp()
    return
  }
  const url = rWp()
  if (url) {
    // Paint the wallpaper immediately — the palette extract decodes the full
    // image and would otherwise leave the host's blank background on screen
    // for the whole decode. The verdict/skin settle a beat later on re-apply.
    applyWp()
    // Video mode samples the frame snapshot through the video's own placement
    // state; the image slot's framing does not apply to the snapshot.
    const st = cfg.backgroundType === 'video' ? rVideoBgState() : rBgState()
    void extractWallpaperColor(url, st).then(hsl => {
      // A swap during the decode (upload / rotation) points every URL-keyed
      // cache at the new picture; only adopt the color when this wallpaper is
      // still the active one.
      if (hsl && rWp() === url) {
        cfg.color = hsl
        // The listener runs before applyWp so the freshly registered skin and
        // the token pass below describe the same color.
        colorAdoptedListener?.(hsl)
      }
      applyWp()
    })
  } else {
    applyWp()
  }
}

/** Switch the background source type. For generated types a new live canvas is
 *  attached to the wallpaper layer and a snapshot is kept for the store/preview. */
export function setBackgroundType(type: BackgroundType): void {
  cfg.backgroundType = type
  if (type === 'image') {
    // Restore the retained image upload and drop the generated brightness verdict.
    clearDynamicBg()
    setBgDark(null)
    setWpUrl(rWpImage())
    applyThemeColor()
    return
  }
  if (type === 'video') {
    // Restore the retained video upload; the frame snapshot stays the preview URL.
    clearDynamicBg()
    setBgDark(null)
    setWpUrl(null)
    applyThemeColor()
    return
  }
  // Keep existing params for this generated type so sub-type switches preserve adjustments.
  if (!cfg.generatedBg || cfg.generatedBg.type !== type) {
    cfg.generatedBg = defaultParamsFor(type)
  }
  applyGeneratedBg(cfg.generatedBg)
}

function randomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff)
}

/** Regenerate the current generated background with a new visual seed while
 *  preserving the user's scale/intensity/speed/density/preset choices. */
export function regenerateGeneratedBg(): void {
  const params = cfg.generatedBg
  if (!params || cfg.backgroundType === 'image') return
  cfg.generatedBg = { ...params, seed: randomSeed() }
  applyGeneratedBg(cfg.generatedBg)
}

/** Update a generated background's parameters and re-render. */
export function updateGeneratedBg(params: GeneratedBgParams): void {
  cfg.backgroundType = params.type
  cfg.generatedBg = params
  applyGeneratedBg(params)
}

function applyGeneratedBg(params: GeneratedBgParams): void {
  clearDynamicBg()
  clearVideoEl()
  ensureWpContainer()
  wpController = createDynamicBackground(params)
  if (wpEl) {
    wpEl.style.backgroundImage = 'none'
    wpEl.appendChild(wpController.canvas)
  }
  // The canvas paints its first frame on the next animation tick; only then is
  // the snapshot meaningful. Do NOT refresh the palette here — generated
  // backgrounds must not overwrite the user's picked theme color.
  requestAnimationFrame(() => {
    if (!wpController) return
    const controller = wpController
    const frame = controller.snapshot()
    setWpUrl(frame)
    applyWp()
    snapshotListener?.()
    // One-shot brightness verdict from the captured frame to flip font
    // direction; never runs in the animation loop.
    setBgDark(null)
    void analyzeFrameDark(frame).then(dark => {
      if (dark === null || wpController !== controller) return
      applyVerdict(dark)
      applyCustomTokens(rOps())
    })
  })
}

// ── Per-part interface blur ───────────────────────────────────────────────────
// The AppFrame columns use hashed CSS-module classes, so parts are located
// structurally: the shell overlay carries a stable data attribute and the
// sidebar/center/rightbar columns are its preceding siblings.
//
// DSH 0.1.5-rc.1+ has only THREE columns in the frame: [sidebar, center,
// rightbar]. The pre-rc.1 "details" column no longer exists — the frame
// tree in 0.1.5-rc.1+ is:
//
//   [data-app-frame]? → [sidebarCol] [CenterColumn (wraps main)] [RightbarColumn] [data-shell-overlay]
//
// The rightbar carries the stable `[data-rightbar-col]` marker, so we resolve
// it directly and never let `discoverParts` collapse the right panel into a
// "details" column — that mis-target painted the rightbar's surface with the
// main-bg tint and backdrop-filter, making it disappear into the page.
//
// backdrop-filter must NEVER go directly on a host part: it turns the element
// into a containing block for fixed-positioned descendants, which would trap
// the host's settings dialog inside the column. Each blurred part carries an
// isolated ::before underlay holding the backdrop-filter instead.
let frameEl: HTMLElement | null = null
let sidebarEl: HTMLElement | null = null
let centerEl: HTMLElement | null = null
let rightEl: HTMLElement | null = null

const PART_BLUR_CLASS = 'dab-part-blur'
const PART_UNDERLAY_CLASS = 'dab-part-underlay'
const PART_BLUR_RULE =
  `${PART_BLUR_CLASS}{isolation:isolate}` +
  `.${PART_UNDERLAY_CLASS}{position:absolute;inset:0;z-index:-1;pointer-events:none;border-radius:inherit;` +
  `backdrop-filter:var(--dsh-any-part-blur,none);-webkit-backdrop-filter:var(--dsh-any-part-blur,none)}`

let partBlurStyleEl: HTMLStyleElement | null = null

function ensurePartBlurStyle(): void {
  if (partBlurStyleEl?.isConnected) return
  partBlurStyleEl = document.createElement('style')
  partBlurStyleEl.dataset.plugin = 'dsh-any-background-parts'
  partBlurStyleEl.textContent = PART_BLUR_RULE
  document.head.appendChild(partBlurStyleEl)
}

/** Find one direct child of `frame` whose `[data-rightbar-col]` marker matches.
 *  The rightbar is its own grid track, NOT a "details" twin of the center
 *  column, so it must never receive the main-bg tint or blur underlay. */
function findRightbarInFrame(frame: HTMLElement): HTMLElement | null {
  for (let i = 0; i < frame.children.length; i++) {
    const child = frame.children[i]
    if (child instanceof HTMLElement && child.dataset.rightbarCol !== undefined) return child
  }
  return null
}

function discoverParts(): void {
  const overlay = document.querySelector<HTMLElement>('[data-shell-overlay]')
  if (overlay === null) return
  const frame = overlay.parentElement
  if (frame === null) return
  frameEl = frame
  // The rightbar is the only column with its own stable host marker. Find it
  // BEFORE indexing by the overlay so it never falls into the "details"
  // slot — 0.1.5-rc.1+ only has three columns, not four.
  rightEl = findRightbarInFrame(frame)
  const idx = Array.from(frame.children).indexOf(overlay)
  // The rightbar (when found) sits between center and overlay; otherwise the
  // legacy 3-column shape is intact (sidebar, center, details) — but on
  // 0.1.5-rc.1+ this path is unreachable because every frame carries the
  // rightbar marker. The two branch are kept so the function still tolerates
  // an absent rightbar on a future build that drops the column entirely.
  if (rightEl !== null) {
    // Index of the rightbar in frame.children: with the host's grid it's
    // always `idx - 1`; resolve from the children array directly instead of
    // trusting the layout to keep that invariant.
    const rightIdx = Array.from(frame.children).indexOf(rightEl)
    sidebarEl = (frame.children[rightIdx - 2] as HTMLElement | undefined) ?? null
    centerEl = (frame.children[rightIdx - 1] as HTMLElement | undefined) ?? null
  } else {
    sidebarEl = (frame.children[idx - 3] as HTMLElement | undefined) ?? null
    centerEl = (frame.children[idx - 2] as HTMLElement | undefined) ?? null
  }
}

function setBlur(el: HTMLElement | null, px: number): void {
  if (el === null) return
  const underlay = el.querySelector<HTMLDivElement>(`:scope > .${PART_UNDERLAY_CLASS}`)
  if (px > 0) {
    ensurePartBlurStyle()
    // The underlay is position:absolute and needs a positioned host: static
    // columns get relative (a layout no-op for flex items) that is restored on
    // clear; parts the host already positions keep their own scheme.
    if (!el.classList.contains(PART_BLUR_CLASS) && getComputedStyle(el).position === 'static') {
      el.style.position = 'relative'
      el.setAttribute('data-dab-pos-patched', '1')
    }
    el.classList.add(PART_BLUR_CLASS)
    if (underlay === null) {
      const node = document.createElement('div')
      node.className = PART_UNDERLAY_CLASS
      el.prepend(node)
    }
    el.style.setProperty('--dsh-any-part-blur', `blur(${px}px)`)
  } else {
    el.classList.remove(PART_BLUR_CLASS)
    el.style.removeProperty('--dsh-any-part-blur')
    underlay?.remove()
    if (el.getAttribute('data-dab-pos-patched') === '1') {
      el.style.removeProperty('position')
      el.removeAttribute('data-dab-pos-patched')
    }
  }
}

function applySettingsBlur(px: number): void {
  if (px > 0) document.documentElement.style.setProperty('--dsh-any-blur-settings', `blur(${px}px)`)
  else document.documentElement.style.removeProperty('--dsh-any-blur-settings')
}

/** Apply the main-background opacity to the center column instead of
 *  the frame. The frame's translucent bg-base sits UNDER the sidebar, so
 *  reducing the main-bg opacity stacked a second alpha onto the sidebar; moving
 *  the alpha onto the column keeps the sidebar owned by its own slider. The
 *  rightbar (DSH 0.1.5-rc.1+) is intentionally NOT tinted here — it sits on
 *  its own grid track, paints its own surfaces from its own tokens, and
 *  inheriting the main-bg tint would blend it into the page and make the
 *  right panel disappear. */
function applyPartOpacities(ops: PartOpacities): void {
  const tokens = paletteTokens()
  if (tokens === null) return
  discoverParts()
  if (frameEl === null) return
  const base = tokens['--dsw-alias-bg-base']
  frameEl.style.background = 'transparent'
  if (centerEl !== null) centerEl.style.background = base !== undefined ? toRgba(base, ops.bg) : 'transparent'
  // Defensive: a previous build (pre-fix) may have left an inline `background`
  // on the rightbar — clear it so it stops carrying the main-bg tint.
  if (rightEl !== null) rightEl.style.background = ''
}

/** Blur of the option panels inside the settings dialog (.dab-card), owned by
 *  the "dialog option panel" (card) blur slider. Written as a plugin-owned
 *  variable consumed by SETTINGS_STYLE_RULE — deliberately NOT applied to the
 *  homepage center column, which this slider must never touch. */
function applyCardPanelsBlur(px: number): void {
  if (px > 0) document.documentElement.style.setProperty('--dsh-any-blur-card-panels', `blur(${px}px)`)
  else document.documentElement.style.removeProperty('--dsh-any-blur-card-panels')
}

/** Apply per-part interface blur to the AppFrame columns + settings panel. */
export function applyPartBlurs(blurs: PartBlurs): void {
  discoverParts()
  // The bg blur frosts the wallpaper behind the main content column; the
  // frame itself stays unblurred so the sidebar is never double-frosted by
  // both the bg and sidebar sliders. The rightbar (DSH 0.1.5-rc.1+) is
  // intentionally untouched: the host's own panel sits inside the rightbar
  // and paints from its own tokens, so a backdrop-filter there would bleed
  // the wallpaper into the panel surface and break the focused-tab chrome.
  setBlur(frameEl, 0)
  setBlur(sidebarEl, blurs.sidebar)
  setBlur(centerEl, blurs.bg)
  setBlur(rightEl, 0)
  applyBgBlurGlobal(blurs.bg)
  applyCardPanelsBlur(blurs.card)
  applySettingsBlur(blurs.settings)
  applyInputBlur(blurs.input)
  applyPanelBlur(blurs.panel)
  applyProduced()
  applyViewCards()
}

/** Produced/artifact surfaces (conversation code blocks + their banner +
 *  composer chips): re-write the root blur and the alpha percentage consumed by
 *  PRODUCED_RULE. The percentage is an alpha for the surface's OWN host color —
 *  1 (100%) reproduces the untouched host look and lowering it fades exactly
 *  that color out — so no palette sampling is involved and the surfaces keep
 *  following the active theme/wallpaper color on their own. */
export function applyProduced(): void {
  const px = rBlurs().produced
  const root = document.documentElement
  if (px > 0) root.style.setProperty('--dsh-any-blur-prod', `blur(${px}px)`)
  else root.style.removeProperty('--dsh-any-blur-prod')
  let opacity = rProducedOpacity()
  if (opacity < 0) opacity = 0
  if (opacity > 1) opacity = 1
  root.style.setProperty('--dsh-any-prod-pct', `${Math.round(opacity * 100)}%`)
}

/** Live per-part blur update during slider drag (no full re-apply). */
export function setPartBlur(part: keyof PartBlurs, v: number): void {
  if (part === 'settings') { applySettingsBlur(v); return }
  if (part === 'card') { applyCardPanelsBlur(v); return }
  if (part === 'input') { applyInputBlur(v); return }
  if (part === 'panel') { applyPanelBlur(v); return }
  if (part === 'produced') { applyProduced(); return }
  if (part === 'chat' || part === 'trajectory') { applyViewCards(); return }
  discoverParts()
  if (part === 'bg') { setBlur(centerEl, v); applyBgBlurGlobal(v) }
  else setBlur(sidebarEl, v)
}

// ── Conversation view treatments ────────────────────────────────────
// The chat message column is styled as a real card (layer-1 surface + border +
// 16px radius + 18px padding); the trajectory view gets NO card decoration —
// its own panels fully cover the view root, so its opacity slider re-scopes the
// layer tokens inside the view and its blur frosts the backdrop through the
// standard root underlay.
//
// Host structure (deepseek-harness ui-conversation / ui-trajectory):
//   ConversationRoot
//     header                     — title + tabs, OUTSIDE the scrollport
//     [data-conversation-scroll] — the single scrollport
//       [data-chat-flow]         ← chat column (flow content, NOT scrollable)
//       [data-conversation-composer-overlay] ← trajectory view root
//       [data-composer-seat]     — sticky composer, a sibling
// The input is sticky inside the same scrollport, so the stable host markers
// are used; generic heuristics remain as a chat fallback for marker-less hosts.
//
// Cards are ALWAYS styled once their host exists — sliders at zero only turn
// surface/border transparent, so the layout never reflows and the view cannot
// jump when a slider leaves zero. Removal happens only at plugin teardown.
interface ViewCardSpec {
  sel: string
  mark: string
  /** Dataset key prefix holding the stashed pre-card inline values. */
  prev: string
  opacity: () => number
  blur: () => number
  /** Generic heuristic fallback (chat card only, hosts without the marker). */
  fallback?: boolean
  /** No card decoration — surfaces follow scoped layer tokens; only the blur
   *  underlay is attached to the host element. */
  plain?: boolean
}

const VIEW_CARDS: ViewCardSpec[] = [
  { sel: '[data-chat-flow]', mark: 'data-dab-chat-card', prev: 'dabChatPrev', opacity: rChatTextOpacity, blur: () => rBlurs().chat, fallback: true },
  { sel: '[data-conversation-composer-overlay]', mark: 'data-dab-traj-card', prev: 'dabTrajPrev', opacity: rTrajectoryOpacity, blur: () => rBlurs().trajectory, plain: true },
]

const viewTargets: Array<HTMLElement | null> = VIEW_CARDS.map(() => null)

function isScrollableY(el: HTMLElement): boolean {
  const oy = getComputedStyle(el).overflowY
  // 'overlay' covers Chromium's non-standard overflow value.
  return oy === 'auto' || oy === 'scroll' || oy === 'overlay'
}

/** Whether the subtree hosts the chat input (textarea / contenteditable /
 *  textbox role) — used to keep the card off the input row. */
function containsChatEditor(el: HTMLElement): boolean {
  return el.querySelector('textarea,[contenteditable="true"],[contenteditable=""],[contenteditable="plaintext-only"],[role="textbox"]') !== null
}

/** Walk down from a coarse candidate toward the actual message column: stop
 *  at a scroll container (the card surface must stay pinned to the scroll
 *  port); while the chat input lives inside, descend into the tallest child that
 *  does NOT contain it (the header row is short, the input row holds the
 *  editor); otherwise peel wrappers dominated (>= 85%) by a single child so
 *  tab bars / titles stay outside the card. */
function refineMessageColumn(start: HTMLElement): HTMLElement {
  let cur = start
  for (let depth = 0; depth < 10; depth++) {
    if (isScrollableY(cur)) break
    const kids = Array.from(cur.children).filter((k): k is HTMLElement => k instanceof HTMLElement)
    if (kids.length === 0) break
    const tallest = kids.reduce((a, b) => (b.clientHeight > a.clientHeight ? b : a))
    if (containsChatEditor(cur)) {
      const candidates = kids.filter(k => !containsChatEditor(k) && k.clientHeight >= cur.clientHeight * 0.4)
      if (candidates.length === 0) break
      cur = candidates.reduce((a, b) => (b.clientHeight > a.clientHeight ? b : a))
      continue
    }
    if (kids.length > 1 && tallest.clientHeight >= cur.clientHeight * 0.85) { cur = tallest; continue }
    break
  }
  return cur
}

function discoverViewTarget(idx: number, spec: ViewCardSpec): HTMLElement | null {
  if (centerEl === null || !document.body.contains(centerEl)) { viewTargets[idx] = null; return null }
  // The host marker always wins over a cached fallback (the view may not be
  // mounted yet when the plugin applies early).
  const marked = centerEl.querySelector<HTMLElement>(spec.sel)
  const cached = viewTargets[idx]
  if (marked !== null) {
    if (cached !== null && cached !== marked) { setBlur(cached, 0); restoreCardHost(cached, spec.mark, spec.prev, spec.plain === true) }
    viewTargets[idx] = marked
    return marked
  }
  if (cached !== null && centerEl.contains(cached)) return cached
  viewTargets[idx] = null
  if (spec.fallback !== true) return null
  // On the harness, an absent [data-chat-flow] just means the chat view is not
  // mounted (hero phase, trajectory tab) — settling on the whole scrollport
  // there would wrap the entire page in the card.
  if (centerEl.querySelector('[data-conversation-scroll]') !== null) return null
  // Marker-less hosts keep their layout until a slider moves.
  if (spec.opacity() <= 0 && spec.blur() <= 0) return null
  // Generic fallbacks: the largest vertically scrollable element inside the
  // column, or the tallest direct child when the host virtualises scrolling.
  let best: HTMLElement | null = null
  let bestArea = 0
  for (const el of Array.from(centerEl.querySelectorAll<HTMLElement>('*'))) {
    if (!isScrollableY(el)) continue
    if (el.clientHeight < centerEl.clientHeight * 0.35) continue
    const area = el.clientWidth * el.clientHeight
    if (area > bestArea) { bestArea = area; best = el }
  }
  if (best === null) {
    for (const el of Array.from(centerEl.children)) {
      if (!(el instanceof HTMLElement)) continue
      if (el.clientHeight < centerEl.clientHeight * 0.5) continue
      if (el.clientHeight > (best?.clientHeight ?? 0)) best = el
    }
  }
  // Coarse candidates are narrowed to the message column itself.
  const refined = best !== null ? refineMessageColumn(best) : null
  viewTargets[idx] = refined
  return refined
}

/** Stash the host's own inline values so teardown restores them exactly.
 *  Plain views only get a background override, so only that is stashed. */
function stashCardPrev(el: HTMLElement, prev: string, plain: boolean): void {
  const ds = el.dataset as Record<string, string | undefined>
  ds[prev + 'Bg'] = el.style.getPropertyValue('background')
  if (plain) return
  ds[prev + 'BoxSizing'] = el.style.getPropertyValue('box-sizing')
  ds[prev + 'Border'] = el.style.getPropertyValue('border')
  ds[prev + 'Radius'] = el.style.getPropertyValue('border-radius')
  ds[prev + 'Padding'] = el.style.getPropertyValue('padding')
}

/** Undo the inline styling, restoring the host's previous inline values. */
function restoreCardHost(el: HTMLElement, mark: string, prev: string, plain: boolean): void {
  if (!el.hasAttribute(mark)) return
  const ds = el.dataset as Record<string, string | undefined>
  const restore = (prop: string, v: string | undefined): void => {
    if (v !== undefined && v !== '') el.style.setProperty(prop, v)
    else el.style.removeProperty(prop)
  }
  restore('background', ds[prev + 'Bg'])
  if (!plain) {
    restore('box-sizing', ds[prev + 'BoxSizing'])
    restore('border', ds[prev + 'Border'])
    restore('border-radius', ds[prev + 'Radius'])
    restore('padding', ds[prev + 'Padding'])
    delete ds[prev + 'BoxSizing']; delete ds[prev + 'Border']; delete ds[prev + 'Radius']; delete ds[prev + 'Padding']
  }
  delete ds[prev + 'Bg']
  el.removeAttribute(mark)
}

/** Teardown only: strip every view treatment and hand the hosts back untouched. */
function removeViewCards(): void {
  VIEW_CARDS.forEach((spec, i) => {
    const el = viewTargets[i]
    if (el !== null) { setBlur(el, 0); restoreCardHost(el, spec.mark, spec.prev, spec.plain === true) }
    viewTargets[i] = null
  })
}

// ── Wide markdown tables ──────────────────────────────────────────────────────
// DSH intentionally lets `.md-table-wide` bleed outside the text column (a
// negative --dsh-table-lead margin + max-width:none, set by a host rule like
// `.Sxvs8a_body .md-table-wide`; the prefix is a build-time hash class). That
// bleed only becomes visible once the chat surface gains a visible border, i.e.
// when the chat region opacity or blur is non-zero (see borderAlpha in
// applyViewCards). Under that same condition, pull the table back inside the
// column and let it scroll horizontally. The stable `.md-table-wide` class is
// targeted with !important so the fix survives DSH's changing hash prefixes.

const TABLE_FIX_RULE = [
  '.md-table-wide {',
  '  --dsh-table-spare: 0px !important;',
  '  --dsh-table-lead: 0px !important;',
  '  box-sizing: border-box !important;',
  '  width: 100% !important;',
  '  max-width: 100% !important;',
  '  margin-left: 0 !important;',
  '  padding-left: 0 !important;',
  '  padding-bottom: 0 !important;',
  '  overflow-x: auto !important;',
  '}',
].join('\n')
let tableFixStyleEl: HTMLStyleElement | null = null

/** Toggle the wide-table clamp according to the chat region's opacity & blur. */
function syncTableFix(): void {
  const needed = rChatTextOpacity() > 0 || rBlurs().chat > 0
  if (!needed) {
    if (tableFixStyleEl !== null) { tableFixStyleEl.remove(); tableFixStyleEl = null }
    return
  }
  if (tableFixStyleEl === null) {
    tableFixStyleEl = document.createElement('style')
    tableFixStyleEl.dataset.plugin = 'dsh-any-background-table-fix'
    tableFixStyleEl.textContent = TABLE_FIX_RULE
  }
  if (!tableFixStyleEl.isConnected) document.head.appendChild(tableFixStyleEl)
}

/** Re-derive the conversation view cards from the current config. Cheap
 *  enough for live slider drags; the card structure is applied unconditionally
 *  once the host exists so the layout never reflows when a slider leaves zero. */
export function applyViewCards(): void {
  discoverParts()
  if (centerEl === null) return
  const [h, s, l] = rColor()
  const surface = genTokens(h, s, l, rColorScheme()).tokens['--dsw-alias-bg-layer-1']
  VIEW_CARDS.forEach((spec, i) => {
    const target = discoverViewTarget(i, spec)
    if (target === null) return
    const plain = spec.plain === true
    const opacity = spec.opacity()
    const blurPx = spec.blur()
    if (!plain) {
      if (!target.hasAttribute(spec.mark)) stashCardPrev(target, spec.prev, false)
      // Mirrors .dab-card (layer-1 background, border, 16px radius, 18px
      // padding), written inline so it wins over host stylesheets; the opacity
      // slider drives surface alpha and fades the border with it.
      const borderAlpha = opacity > 0 ? Math.min(1, opacity * 1.5) : (blurPx > 0 ? 0.35 : 0)
      target.style.background = surface !== undefined ? toRgba(surface, opacity) : 'transparent'
      target.style.border = surface !== undefined ? `1px solid ${toRgba(surface, borderAlpha)}` : '1px solid transparent'
      target.style.borderRadius = '16px'
      target.style.padding = '18px'
      // DSH has no global box-sizing reset; under content-box the padding +
      // border above would push the card past its width:100% — overflowing
      // narrow screens and breaking margin:0 auto centering.
      target.style.boxSizing = 'border-box'
    }
    // Plain views write no inline styles — only the blur underlay is hosted here.
    target.setAttribute(spec.mark, '1')
    setBlur(target, blurPx)
  })
  syncTableFix()
}

let partsObserver: MutationObserver | null = null

/** Watch for the AppFrame mounting so persisted blurs land even when the shell
 *  renders after this plugin's apply. Cheap: once all parts are found, the
 *  callback returns. */
export function watchParts(): void {
  if (partsObserver !== null || typeof MutationObserver === 'undefined') return
  partsObserver = new MutationObserver(() => {
    if (frameEl !== null && sidebarEl !== null && centerEl !== null && rightEl !== null && document.body.contains(frameEl)
      // Keep re-applying while any card host is absent or was swapped by the host.
      && viewTargets.every(el => el !== null && document.body.contains(el))) return
    applyPartBlurs(rBlurs())
    applyPartOpacities(rOps())
  })
  partsObserver.observe(document.body, { childList: true, subtree: true })
}

export function stopWatchingParts(): void {
  partsObserver?.disconnect()
  partsObserver = null
}

// ── Theme-reset watchdog ──────────────────────────────────────────────────
// The host re-asserts its own :root/body scheme rules on mount, on settings
// adoption and after the plugin's startup assertion, toggling the
// `data-ds-dark-theme` attribute off / to a host value — which would paint a
// frame of light surfaces. Watch that flag and, whenever the plugin's own
// value disappears, re-set it and re-emit the token stylesheet within the same
// frame. The guard stops feedback: once our mark is present the handler
// returns, so our own re-assertion cannot re-trigger.
let themeObserver: MutationObserver | null = null
let themeRaf = 0

function reassertScheme(): void {
  const dark = rScheme() === 'dark'
  if (dark) document.body.setAttribute('data-ds-dark-theme', 'dsh-any-background')
  else document.body.removeAttribute('data-ds-dark-theme')
  applyCustomTokens(rOps())
}

/** Re-assert the plugin's forced scheme whenever the host strips it, so a
 *  refresh / cold-load / set-change never flashes a light frame. Returns a
 *  disposer for teardown. */
export function watchThemeResets(): () => void {
  if (themeObserver !== null || typeof MutationObserver === 'undefined') return () => undefined
  themeObserver = new MutationObserver(() => {
    if (document.body.getAttribute('data-ds-dark-theme') === 'dsh-any-background') return
    if (!(rHasColor() || rBgDark() !== null || rSchemeOverride() !== 'auto')) return
    if (themeRaf !== 0) return
    themeRaf = requestAnimationFrame(() => {
      themeRaf = 0
      if (document.body.getAttribute('data-ds-dark-theme') === 'dsh-any-background') return
      reassertScheme()
    })
  })
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
  return () => {
    themeObserver?.disconnect()
    themeObserver = null
  }
}

function ensureWpContainer(): void {
  if (!wpEl || !document.body.contains(wpEl)) {
    wpEl = document.createElement('div')
    wpEl.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;'
    document.body.prepend(wpEl)
  }
}

function clearVideoEl(): void {
  if (videoEl === null) return
  videoEl.pause()
  videoEl.removeAttribute('src')
  videoEl.load()
  videoEl.remove()
  videoEl = null
}

/** Intrinsic-size cache for the center mode (native pixels of the current image). */
let imgNat: { url: string; w: number; h: number } | null = null
function imageNatSize(url: string, cb: (w: number, h: number) => void): void {
  if (imgNat !== null && imgNat.url === url) { cb(imgNat.w, imgNat.h); return }
  void loadImage(url).then(img => {
    if (!img) { cb(0, 0); return }
    imgNat = { url, w: img.naturalWidth, h: img.naturalHeight }
    cb(img.naturalWidth, img.naturalHeight)
  })
}

// ── Drag-time wallpaper downscaling ──────────────────────────────────────────
// Repainting translucent surfaces over a full-resolution wallpaper is expensive
// (proportional to the image's pixel area, worse under backdrop blur). During a
// slider drag we swap the layer's background-image to a bounded-size JPEG copy,
// slashing that per-frame raster cost; the full-res image is restored on release
// and stays browser-cached, so the swap is cheap. Precomputed after each image
// apply so the first drag needs no decode hitch.
const DRAG_MAX_SIDE = 720

let lowResUrl: string | null = null
let lowResFor = ''
let dragLow = false

function captureLowRes(url: string, cb: (low: string | null) => void): void {
  if (lowResFor === url) { cb(lowResUrl); return }
  void loadImage(url).then(img => {
    if (!img) { cb(null); return }
    const k = Math.min(1, DRAG_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
    if (k >= 1) { lowResFor = url; lowResUrl = null; cb(null); return }
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(img.naturalWidth * k))
    c.height = Math.max(1, Math.round(img.naturalHeight * k))
    const g = c.getContext('2d')
    if (!g) { lowResFor = url; lowResUrl = null; cb(null); return }
    g.drawImage(img, 0, 0, c.width, c.height)
    const low = c.toDataURL('image/jpeg', 0.85)
    lowResFor = url; lowResUrl = low
    cb(low)
  })
}

function setDragLow(on: boolean): void {
  if (cfg.backgroundType !== 'image' || on === dragLow || !wpEl) return
  const full = rWpImage()
  if (!full) return
  if (on) {
    dragLow = true
    captureLowRes(full, low => {
      if (!dragLow || !wpEl || low === null) return
      if (wpEl.style.backgroundImage !== `url("${low}")`) wpEl.style.backgroundImage = `url("${low}")`
    })
  } else {
    dragLow = false
    if (wpEl.style.backgroundImage !== `url("${full}")`) wpEl.style.backgroundImage = `url("${full}")`
  }
}

/** While any range slider in the app is being dragged, run the wallpaper at
 *  reduced resolution; restore on release. Returns a disposer for teardown. */
export function watchWallpaperDragQuality(): () => void {
  const isRange = (t: EventTarget | null): boolean =>
    t instanceof HTMLInputElement && t.type === 'range'
  const down = (e: PointerEvent): void => { if (isRange(e.target)) setDragLow(true) }
  const up = (): void => { if (dragLow) setDragLow(false) }
  window.addEventListener('pointerdown', down, true)
  window.addEventListener('pointerup', up, true)
  window.addEventListener('pointercancel', up, true)
  return () => {
    window.removeEventListener('pointerdown', down, true)
    window.removeEventListener('pointerup', up, true)
    window.removeEventListener('pointercancel', up, true)
    if (dragLow) setDragLow(false)
  }
}

// ── Wallpaper brightness verdict ─────────────────────────────────────────────
// Image/video wallpapers get the same one-shot brightness verdict generated
// backgrounds analyze from their captured frame: decoded once per URL (cached),
// it drives the label direction and the auto scheme, so a light wallpaper gets
// dark fonts even when no theme color is picked and the host preference is dark.
let wpVerdict: { url: string; dark: boolean } | null = null
let verdictListener: (() => void) | null = null
// Monotonic guard for the async frame analysis: a stale result (the wallpaper
// changed while the frame was decoding) must never overwrite the current
// verdict. applyGeneratedBg guards with its own controller comparison; the
// image/video path needs the same protection.
let verdictGen = 0

/** Register a callback fired when the background brightness verdict CHANGES
 *  (a new wallpaper was analyzed, a generated bg regenerated), so the skin can
 *  be re-registered through the host theme service. */
export function onVerdictApplied(cb: () => void): void { verdictListener = cb }

function applyVerdict(dark: boolean | null): void {
  if (rBgDark() === dark) return
  setBgDark(dark)
  if (dark !== null) verdictListener?.()
}

function updateWpVerdict(url: string | null): void {
  const gen = ++verdictGen
  if (url === null) { applyVerdict(null); return }
  if (wpVerdict !== null && wpVerdict.url === url) { applyVerdict(wpVerdict.dark); return }
  void analyzeFrameDark(url).then(dark => {
    if (dark === null || gen !== verdictGen) return
    wpVerdict = { url, dark }
    applyVerdict(dark)
    applyCustomTokens(rOps())
  })
}

function applyImageWp(url: string): void {
  clearDynamicBg()
  clearVideoEl()
  ensureWpContainer()
  const bg = rBgState()
  const mode = rBgMode()
  const next = `url("${url}")`
  // Skip re-setting the same data URL — re-decoding it flashes the wallpaper
  // blank for a frame on boot re-applies.
  if (wpEl!.style.backgroundImage !== next) {
    wpEl!.style.backgroundImage = next
  }
  if (mode === 'fit') {
    wpEl!.style.backgroundRepeat = 'no-repeat'
    if (bg.iw > 0) {
      // Contain-fit at zoom with the image center pinned to the committed
      // fractional viewport point, so the framed region survives viewport changes.
      const fit = Math.min(window.innerWidth / bg.iw, window.innerHeight / bg.ih)
      const w = bg.iw * fit * bg.zoom
      const h = bg.ih * fit * bg.zoom
      wpEl!.style.backgroundSize = `${w}px ${h}px`
      wpEl!.style.backgroundPosition = `${bg.x * window.innerWidth - w / 2}px ${bg.y * window.innerHeight - h / 2}px`
    } else {
      // Fresh image: match the editor's initial centered contain view.
      wpEl!.style.backgroundSize = 'contain'
      wpEl!.style.backgroundPosition = 'center'
    }
  } else if (mode === 'fill') {
    wpEl!.style.backgroundRepeat = 'no-repeat'
    wpEl!.style.backgroundSize = 'cover'
    wpEl!.style.backgroundPosition = 'center'
  } else if (mode === 'stretch') {
    wpEl!.style.backgroundRepeat = 'no-repeat'
    wpEl!.style.backgroundSize = '100% 100%'
    wpEl!.style.backgroundPosition = 'center'
  } else if (mode === 'tile') {
    wpEl!.style.backgroundRepeat = 'repeat'
    // background-size:auto resolves the intrinsic size per tile.
    wpEl!.style.backgroundSize = 'auto'
    wpEl!.style.backgroundPosition = '0px 0px'
  } else {
    // Center: native size, centered. The intrinsic size needs an async decode;
    // 'contain' keeps a sensible frame until it lands.
    wpEl!.style.backgroundRepeat = 'no-repeat'
    wpEl!.style.backgroundSize = 'contain'
    wpEl!.style.backgroundPosition = 'center'
    imageNatSize(url, (w, h) => {
      if (!wpEl || wpEl.style.backgroundImage !== next || rBgMode() !== 'center') return
      if (w > 0 && h > 0) {
        wpEl.style.backgroundSize = `${w}px ${h}px`
        wpEl.style.backgroundPosition = 'center'
      }
    })
  }
  // Precompute the drag-time downscaled copy now so the first drag swaps without
  // a decode hitch (the original is already loaded, so this hits the cache).
  captureLowRes(url, () => undefined)
  applyWpEffects()
  updateWpVerdict(url)
}

/** Video wallpaper: a muted looping <video> inside the wallpaper layer.
 *  Placement modes map onto object-fit (tile has no video equivalent and
 *  falls back to cover). */
function applyVideoWp(url: string): void {
  clearDynamicBg()
  ensureWpContainer()
  if (wpEl!.style.backgroundImage !== 'none') wpEl!.style.backgroundImage = 'none'
  if (videoEl === null || !videoEl.isConnected) {
    videoEl = document.createElement('video')
    videoEl.muted = true
    videoEl.loop = true
    videoEl.autoplay = true
    videoEl.playsInline = true
    videoEl.preload = 'auto'
    videoEl.setAttribute('playsinline', '')
    videoEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-position:center;'
    // Attach before loading so the element is in the document when play()
    // resolves; a detached video can defer its first rendered frame.
    wpEl!.appendChild(videoEl)
    videoEl.setAttribute('src', url)
    void videoEl.play().catch(() => undefined)
  } else if (videoEl.getAttribute('src') !== url) {
    // Compare the attribute, not videoEl.src: the property getter resolves to
    // an absolute URL that would never match the relative serve URL and would
    // restart playback on every re-apply.
    videoEl.setAttribute('src', url)
    void videoEl.play().catch(() => undefined)
  }
  const mode = rBgMode()
  const bg = rVideoBgState()
  if (mode === 'fit' && bg.iw > 0) {
    // Editor-committed box at contain-fit scale × zoom, centered on the
    // fractional point; object-fit:fill stretches the frame into the box
    // (same aspect ratio, so nothing distorts).
    const fit = Math.min(window.innerWidth / bg.iw, window.innerHeight / bg.ih)
    const w = bg.iw * fit * bg.zoom
    const h = bg.ih * fit * bg.zoom
    videoEl.style.cssText = `position:absolute;left:${bg.x * window.innerWidth - w / 2}px;top:${bg.y * window.innerHeight - h / 2}px;width:${w}px;height:${h}px;object-fit:fill;`
  } else {
    videoEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-position:center;'
    videoEl.style.objectFit = mode === 'stretch' ? 'fill' : (mode === 'fill' || mode === 'tile') ? 'cover' : 'contain'
  }
  applyWpEffects()
  // Video mode has no still Image-decodable source; the captured frame
  // snapshot stands in for the brightness verdict (null until it lands, then
  // re-analyzed through the next apply).
  updateWpVerdict(rWp())
}

function applyWpEffects(): void {
  if (!wpEl) return
  const blur = rBl()
  wpEl.style.filter = blur > 0 ? `blur(${blur}px)` : 'none'
  wpEl.style.opacity = String(rWop())
}

export function applyWp(): void {
  const url = rWp()
  if (cfg.backgroundType === 'video') {
    // The frame snapshot (rWp's video branch) is preview-only; the layer plays
    // the video from its own slot.
    const vurl = rWpVideo()
    if (vurl) {
      applyVideoWp(vurl)
    } else {
      clearDynamicBg()
      clearVideoEl()
      wpEl?.remove(); wpEl = null
    }
  } else if (cfg.backgroundType !== 'image' && cfg.generatedBg) {
    // Recreate the live canvas from saved params if one is not active yet
    // (boot or after import).
    clearVideoEl()
    if (!wpController) {
      applyGeneratedBg(cfg.generatedBg)
      return
    }
    ensureWpContainer()
    if (wpController.canvas.parentElement !== wpEl) wpEl!.appendChild(wpController.canvas)
    applyWpEffects()
  } else if (url) {
    applyImageWp(url)
  } else {
    // No background: tear down the layer but keep tokens/blur intact.
    clearDynamicBg()
    clearVideoEl()
    wpEl?.remove(); wpEl = null
    wpVerdict = null
    setBgDark(null)
  }
  // Write tokens only when there is something to derive them from (a saved
  // pick, a background brightness verdict, or a forced scheme) — on boot the
  // persisted state has not loaded yet, and rColor() would flash the default.
  // Interface opacity used to sit behind that same gate, which left all four
  // sliders dead until the user dragged one: they are applied unconditionally
  // now, falling back to the host's own resolved surface tokens when the
  // plugin has no palette (see readHostOpacityTokens). Nothing here keys off
  // rColor() unless a palette is actually in play, so there is no boot flash.
  applyCustomTokens(rOps())
  if (rHasColor()) {
    applySettingsOverrides(rSop())
    applyTrajectoryOverrides(rTrajectoryOpacity())
  }
  // Panel slider: always applied, no longer gated on a palette being active.
  // The token re-scope rule lives in the always-on static stylesheet, and
  // `applyPanelOverrides` falls back to the host's own resolved tokens when
  // no plugin palette is present so the panel follows the slider in every
  // state (picked color, wallpaper verdict, forced scheme, or none).
  applyPanelOverrides(rPanelOpacity())
  applyPartBlurs(rBlurs())
  // Strokes re-derive here so 'auto'/'theme' colors follow palette and
  // wallpaper-verdict changes (applyWp runs on every theme/color re-apply).
  applyStrokes()
}

export function teardownWp(): void {
  clearDynamicBg()
  clearVideoEl()
  disposeVideoObjectUrl()
  setBgDark(null)
  wpVerdict = null
  wpEl?.remove(); wpEl = null
  clearCustomTokens()
  tokenStyleEl?.remove(); tokenStyleEl = null
  removeViewCards()
  document.body.removeAttribute('data-ds-dark-theme')
  document.body.style.removeProperty('color-scheme')
  document.documentElement.style.removeProperty('--dsh-any-bg-settings-surface')
  document.documentElement.style.removeProperty('--dsh-any-bg-settings-layer-1')
  document.documentElement.style.removeProperty('--dsh-any-bg-settings-layer-2')
  document.documentElement.style.removeProperty('--dsh-any-bg-settings-layer-3')
  document.documentElement.style.removeProperty('--dsh-any-traj-layer-1')
  document.documentElement.style.removeProperty('--dsh-any-traj-layer-2')
  document.documentElement.style.removeProperty('--dsh-any-traj-layer-3')
  document.documentElement.style.removeProperty('--dsh-any-bg-settings-card-surface')
  document.documentElement.style.removeProperty('--dsh-any-blur-settings')
  document.documentElement.style.removeProperty('--dsh-any-blur-card-panels')
  document.documentElement.style.removeProperty('--dsh-any-input-blur')
  document.documentElement.style.removeProperty('--dsh-any-part-blur-global')
  document.documentElement.style.removeProperty('--dsh-any-panel-bg-base')
  document.documentElement.style.removeProperty('--dsh-any-panel-layer-1')
  document.documentElement.style.removeProperty('--dsh-any-panel-layer-2')
  document.documentElement.style.removeProperty('--dsh-any-panel-layer-3')
  document.documentElement.style.removeProperty('--dsh-any-blur-panel')
  document.documentElement.style.removeProperty('--dsh-any-blur-prod')
  document.documentElement.style.removeProperty('--dsh-any-prod-pct')
  for (const v of Object.values(OPACITY_VARS)) document.documentElement.style.removeProperty(v)
  baseTokenKey = ''
  lastBgKey = ''
  if (tokensRaf !== null) { cancelAnimationFrame(tokensRaf); tokensRaf = null }
  pendingOps = null
  tableFixStyleEl?.remove(); tableFixStyleEl = null
  removeStrokes()
  removeFontFace()
  setBlur(frameEl, 0); setBlur(sidebarEl, 0); setBlur(centerEl, 0); setBlur(rightEl, 0)
  if (frameEl !== null) frameEl.style.removeProperty('background')
  if (centerEl !== null) centerEl.style.removeProperty('background')
  if (rightEl !== null) rightEl.style.removeProperty('background')
  stopWatchingParts()
}

/** Live wallpaper-opacity updates during slider drag (no full re-apply). */
export function setWpOpacity(v: number): void {
  if (wpEl) wpEl.style.opacity = String(v)
}

/** Live wallpaper-blur updates during slider drag (no full re-apply). */
export function setWpBlur(v: number): void {
  if (wpEl) wpEl.style.filter = v > 0 ? `blur(${v}px)` : 'none'
}
