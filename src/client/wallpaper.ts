import { MENU_FILL_TOKEN, PANEL_SURFACES, BETTER_SIDEBAR_PANEL, COMPOSER_TAKEOVER_CARD, COMPOSER_TAKEOVER_EDITOR, elementFrostDecl } from './host-compat/versions/shared'
import { hostAdapter } from './host-compat/capabilities'
import { HEADER_POPOVER_ATTR } from './header-tag'
import { watchDom } from './dom-watch'
import { rWp, rWpImage, rWpVideo, rBgState, rVideoBgState, rBl, rWop, rOps, rSop, rStrokes, rColor, rHasColor, rBlurs, rBgMode, rChatTextOpacity, rTrajectoryOpacity, rPanelOpacity, rProducedOpacity, rHeaderOpacity, rHeaderBarOpacity, rCaptionInk, rProtectThirdParty, rScheme, rColorScheme, rSchemeOverride, cfg, setWpUrl, rBgDark, setBgDark, disposeVideoObjectUrl } from './state'
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
 *  can re-sync the settings preview / store). Returns an unsubscribe: HMR
 *  re-runs apply and would otherwise leave the previous apply's closure as the
 *  live listener (a stale this-session callback invoked by a lingering
 *  controller). */
export function onGeneratedSnapshot(cb: () => void): () => void {
  snapshotListener = cb
  return () => { if (snapshotListener === cb) snapshotListener = null }
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
// slider via inputBlurRule.
//
// `--dsw-alias-bg-base` IS the main-background surface: the AppFrame ground and
// the conversation root that fills the center column both paint from it, which
// is exactly what lets the wallpaper show through the main area. It must stay
// remapped — un-remapping it makes those surfaces opaque and hides the wallpaper
// entirely behind a solid theme color.
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

/** Every host token this plugin re-emits on `body` at a slider's alpha. Exported
 *  because it is also the answer to "what can another plugin collide with": anything
 *  that fills from one of these names fades with our sliders whether or not its author
 *  knew we existed — the whole of §2-V. `third-party.ts` scans installed plugin
 *  stylesheets for exactly this list. */
export const OWNED_TOKENS: readonly string[] = Object.keys(OPACITY_VARS)

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

/** Surface colors the opacity sliders fade when the plugin has NO palette of its own
 *  (no picked color, no forced scheme), read live from the host's own resolved tokens —
 *  the same trick applyPanelOverrides uses for the workbench panel. The sliders only
 *  ever supply the alpha: the host still decides the colors, so a custom host skin
 *  survives. Returns null when the host exposes none.
 *
 *  SAMPLED ON `<body>`, NOT `:root`: `design-platform.css` declares this whole token set
 *  inside a `body { … }` block (light at :166, dark at :284), and a custom property is
 *  inherited DOWNWARD only — read off the root element every one of them is the empty
 *  string, this function answers null, `applyCustomTokensNow` takes its `surfaces ===
 *  null` exit, and on an install with no picked color every interface-opacity slider does
 *  nothing at all (the frame never gets cleared either, so the wallpaper stays hidden).
 *  Measured against the host's own declarations: `:root` → all five tokens empty,
 *  `body` → all five resolve.
 *
 *  …AND CACHED PER HOST GENERATION, with our own sheet switched off while reading: the
 *  plugin re-scopes these same names on `body`
 *  (`body{--dsw-specific-menu:var(--dsh-any-op-menu)!important}`), so a second read after
 *  the first write returns the plugin's OWN substituted literal — the surfaces would
 *  freeze at whatever color they first sampled instead of following the host. The
 *  generation key is what can flip the host's palette without anything in this plugin
 *  moving: its dark-mode marker, and the platform attribute (`[data-platform='darwin']`
 *  re-declares `--dsw-specific-menu`). */
let hostSurfaceSample: { key: string; map: Record<string, string> | null } | null = null

function readHostOpacityTokens(): Record<string, string> | null {
  if (typeof getComputedStyle === 'undefined' || typeof document === 'undefined') return null
  const body = document.body
  if (body === null) return null
  const key = `${body.getAttribute('data-ds-dark-theme') ?? ''}|${document.documentElement.getAttribute('data-platform') ?? ''}`
  if (hostSurfaceSample !== null && hostSurfaceSample.key === key) return hostSurfaceSample.map
  const sheet = tokenStyleEl
  const wasDisabled = sheet === null ? false : sheet.disabled
  if (sheet !== null) sheet.disabled = true
  const cs = getComputedStyle(body)
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
  if (sheet !== null) sheet.disabled = wasDisabled
  hostSurfaceSample = { key, map: found ? out : null }
  return hostSurfaceSample.map
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
    const key = `${h}|${s}|${l}|${verdict}|${scheme}|${hasColor}|${hostAdapter().menus.fillTokens.join(',')}`
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
      // A release that paints menus from a second token needs that name re-scoped
      // too, or the menu would inherit the CARD alpha from `body` under one name and
      // the host's own opaque value under the other — which is precisely how the
      // opacity sliders went inert on 0.1.7-rc.2. Same variable, so one slider still
      // writes one value. Guarded on the sampled color existing, because a `var()`
      // naming an unset property is the guaranteed-invalid-value trap documented on
      // `applyHeaderPopovers`.
      if (tokens[MENU_FILL_TOKEN] !== undefined) {
        const menuVar = OPACITY_VARS[MENU_FILL_TOKEN]
        for (const name of hostAdapter().menus.fillTokens) {
          if (name === MENU_FILL_TOKEN || tokens[name] !== undefined) continue
          decls.push(`${name}:var(${menuVar})!important`)
        }
      }
      ensureTokenStyle().textContent = `body{${decls.join(';')}}`
      // Drop inline tokens left by earlier builds so the stylesheet is the single source of truth.
      for (const name of appliedTokenNames) document.body.style.removeProperty(name)
      appliedTokenNames = Object.keys(tokens)
    }
    // The header bar is painted here, before the surface bail below: its own
    // opacity is a part value like any other, and its material is the
    // main-background surface this funnel already resolved. The Windows caption
    // band and the host's native-button probe are pinned here too — the same
    // resolved source, but at full strength rather than through a slider.
    applyHeaderBar(surfaces)
    applyNativeCaption(surfaces)
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
    // The Cordis panel keeps its own input-slider alpha (see inputBlurRule).
    const menu = surfaces['--dsw-specific-menu']
    if (menu !== undefined) root.style.setProperty('--dsh-any-op-menu-cordis', toRgba(menu, ops.input))
    const bgKey = `${baseTokenKey}|${ops.bg}`
    if (bgKey !== lastBgKey) { lastBgKey = bgKey; applyPartOpacities(ops) }
    // The exempt surfaces (exemptDefaultRule) point at the host's OWN token
    // values, sampled from :root here — so re-capture them whenever the palette
    // underneath changes. This is the one function every color/verdict/scheme
    // path funnels through.
    applyExemptDefaults()
    // Same funnel, same reason, for the pinned reading lanes of dsh-better-display:
    // its plate must follow the theme color while ignoring every slider.
    applyReaderLanes(surfaces)
  } catch {
    // ignore
  }
}

// ── Settings panel opacity ─────────────────────────────────────────────────────
// Scoped by the settings dialog's own identity, not just its ARIA shape: every
// aria-modal dialog that labels itself would otherwise be claimed here, and a
// third-party confirm dialog does exactly that (an antd `Modal` carries
// `role="dialog"`, `aria-modal="true"` AND `aria-labelledby` pointing at its
// title). Claimed by mistake, it inherits the settings surface + blur + layer
// re-scope + settings text stroke — which reads as a mis-adapted dialog with a
// shifted button label rather than as the plugin's own look.
// The discriminator is the hashed `_panel` class: SettingsRoot.tsx renders
// `<div className={css.panel} role="dialog" aria-modal="true"
// aria-labelledby={titleId}>` identically on 0.1.5-rc.2 / 0.1.6-alpha.2 /
// 0.1.7-alpha.2 / 0.1.7-rc.1, while antd's classes are all `ant-*` (hyphens, so
// `_panel` can never match one).
// The surface (--dsw-alias-bg-layer-2) is re-emitted with an alpha through a
// plugin-owned variable so the panel keeps its color while fading.

export const SETTINGS_PANEL_SEL = '[role="dialog"][aria-modal="true"][aria-labelledby][class*="_panel"]'
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
//   [role="listbox"]· the /model command panel (PopupSelectView `.viewport`)
//                    and the @-trigger suggestion list (MenuView `.viewport`)
//                    — both the inner scroll box, not the card.  From
//                    0.1.7-rc.2 the schedule ClockPicker adds one per column
//                    (`ui-schedule/ClockPicker.tsx`), inside its own popover.
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
//
// THE MENU ARM IS NOT HOST-AGNOSTIC and asks the release adapter for its
// declaration (`MenuSurfaceFacts`): up to 0.1.7-rc.1 the `[role="menu"]` element
// painted its own fill and frost (`Menu.module.css`, `ModelSelect.module.css` each
// declared `background:var(--dsw-specific-menu)` plus
// `backdrop-filter:var(--dsw-menu-backdrop-filter)` on that element), so filtering
// it is the whole job. From 0.1.7-rc.2 that element carries no paint — a
// `position:absolute;inset:0;z-index:-1` `.material` child of `MenuSurface` does,
// and the host states why the root stays unfiltered ("Filtering only the background
// keeps nested menus and fixed overlays free of an ancestor backdrop root or a new
// fixed-position containing block"). So the plugin hands the value to the host's
// blur token there instead of filtering an ancestor the host deliberately left clear.
//
// THE OTHER ARMS KEEP THE ELEMENT-LEVEL FROST, because the token cannot reach them:
// custom properties travel downward, and on the layered releases the filtered layer
// sits above or beside the matched element, never inside it — `[role="listbox"]` is
// the MenuSurface's *child* viewport (PopupSelectView.tsx:153, MenuView.tsx:132; the
// surface root carries no role), and `[role="tree"]` sits inside `.menu`, whose frost
// lives on `.menu::before`. Setting the token on either is inert, so the element
// filter is the only declaration that lands. Note these cards were never owned by the
// card slider on either shape: the host frosts the card and our filter adds a frost
// inside it, which is how the slider behaved at 0.1.7-rc.1 too.
const CARD_BLUR_VAR = '--dsh-any-blur-card-panels'
const POPOVER_MENU_SEL = `[role="menu"]:not([data-dockkit-tab-menu])`
/** The `MenuSurface` root's own marker (`ui-primitives/MenuSurface.tsx`), present on
 *  every release whose menus paint through that layer. It joins the card group because
 *  the role set cannot reach all of them: `ModelSelect` renders its model pane as
 *  `role="group"` (ModelSelect.tsx:486), so keyed on `[role="menu"]` alone that card
 *  fades with the slider — its fill comes off `body` — and never frosts with it.
 *  The dockkit exclusion has to be spelled again here: a tab menu IS a `MenuSurface`
 *  now, and it stays owned by its own layer token, not by the menu one. */
const MENU_MATERIAL_SEL = `[data-menu-material]:not([data-dockkit-tab-menu])`
const POPOVER_OTHER_SEL =
  `[role="listbox"],` +
  `body > [role="tree"],` +
  `body > [role="dialog"]:not([aria-modal="true"])`

/** The frost declaration this release's menus want, driven by the named plugin var.
 *  Every menu-shaped surface group asks through here, so the card group, the header
 *  group and the exemptions can never disagree about which layer to paint. */
function menuFrost(blurVar: string): string {
  return hostAdapter().menus.frostDecl(`var(${blurVar},none)`)
}

/** The frost token, asserted ALWAYS — and what that means for the slider's bottom end.
 *
 *  The host declares its own menu frost on `body` (`ui-theme/src/styles/gradient-shadow-text.css`
 *  — `--dsw-menu-backdrop-filter: blur(40px) saturate(150%)`, no media query), and every menu
 *  frosts from that INHERITED value, whether it filters itself (the background-job `<ul>`) or
 *  hands the value to a `MenuSurface` `.material` child. An element's own declaration always
 *  beats what it inherits, so writing the token with a `none` fallback does not "add no blur"
 *  at slider 0 — it DELETES the host's frost.
 *
 *  0.3.7 answered that with a `<html>` class gate (`dab-card-frost` / `dab-header-frost`) that
 *  only let the declaration through while the slider was non-zero, so 0 meant "leave the host
 *  alone". That was the wrong trade and this is the report that says so: with the gate on, the
 *  slider's LOW end is its HIGH end — 0 renders the host's 40 px frost and 1 renders 1 px — so
 *  the control reads as dead in both directions, and 「把模糊关掉」 is simply not reachable
 *  (measured in `dsh web` with 顶栏选项 at 0/0: the open-in-app panel still came out a soft,
 *  opaque-looking card, because what it was showing was the host's blur, not the plugin's).
 *  The token is therefore asserted at every value, `none` included: **0 means no frost**.
 *  Nothing loses the host look by accident, because the part DEFAULTS are 30 px — a stock
 *  install is frosted like the host's and only an explicit drag to 0 clears it. The same is
 *  already true of every other blur slider in this plugin (0 = off), which is the interface
 *  consistency the gate broke.
 *
 *  `none` stays correct for the exempt group as well: `applyExemptDefaults` pins those surfaces
 *  at alpha 1 alongside the cleared frost, so they are opaque by design. */

/** Declare EVERY token this release's menus can paint their fill from with the same
 *  value. One slider, one value, every layer reached — and a token the host does not
 *  read is inert, so this is safe to emit on a line that only needs one.
 *
 *  Used for values that are guaranteed to resolve. Where the value is a `var()` the
 *  caller must first confirm the variable it names is actually set: an undefined
 *  custom property inside `background:var(…)` computes to the guaranteed-invalid
 *  value and the surface goes fully transparent (see the notes on
 *  `applyHeaderPopovers` and `applyExemptDefaults`). */
function menuFillDecls(value: string): string {
  return hostAdapter().menus.fillTokens.map(name => `${name}:${value}`).join(';')
}

export function popoverBlurRule(): string {
  return `${POPOVER_MENU_SEL},${MENU_MATERIAL_SEL}{${menuFrost(CARD_BLUR_VAR)}}` +
    `${POPOVER_OTHER_SEL}{${elementFrostDecl(`var(${CARD_BLUR_VAR},none)`)}}`
}

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
// Set on <html> while the input blur is non-zero, to gate `inputBlurRule`'s
// composer-card rules below (see the paint-order note there).
const INPUT_FROST_CLASS = 'dab-input-frost'

// Carried by each composer-seat takeover card (approval / plan review /
// question) while the input frost is on. Unlike the capsule's arm above, this
// class is attached PER CARD at runtime by `applyTakeoverFrost`, not by a
// `[data-approval-key]>div` selector: see the note inside `inputBlurRule` for
// why the anchor has to be probed rather than declared.
const TAKEOVER_FROST_CLASS = 'dab-takeover-frost'

// Marks a card whose `position:relative` was written by the plugin because the
// host left it static — the `setBlur` idiom, same attribute name and same
// meaning: only the writer may clear it.
const TAKEOVER_POS_ATTR = 'data-dab-pos-patched'

export function inputBlurRule(): string {
  // The composer capsule must NOT carry backdrop-filter itself: it is an
  // ancestor of the in-place popovers (permission / command / model lists),
  // and a backdrop-filter on it would make it a backdrop root, trapping those
  // lists' own backdrop-filter to the capsule — which chained their visible
  // frost to the input slider. The frost instead rides an isolated ::before
  // underlay (position:absolute, z-index:-1), so it sits behind the capsule
  // content AND the popovers, leaving the popovers free to sample the
  // wallpaper and follow the card slider only. (Same rule the part-blurs
  // follow: backdrop-filter never goes directly on a host part.)
  //
  // The price of that underlay is `position:relative` + `isolation:isolate`, and
  // both are PAINT ORDER: a positioned element — or any element that establishes a
  // stacking context, which `isolation` does — is painted in the positioned layer,
  // above other plugins' in-flow or earlier-in-tree notices that overlap the same
  // spot. That is the "输入框的 z 层级太高，挡住了通知" report, and it cannot be
  // fixed away while a frost is requested: a frost needs an isolated containing
  // block, and no CSS construct provides one that paints *below* in-flow content.
  // What can be fixed is paying the cost for nothing, so both declarations are
  // gated on the blur being non-zero — at 0 the capsule keeps the host's own
  // layering and the plugin competes for nothing.
  return `.${INPUT_FROST_CLASS} [data-composer-card]{position:relative;isolation:isolate}` +
    `.${INPUT_FROST_CLASS} [data-composer-card]::before{` +
    'content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;border-radius:inherit;' +
    '-webkit-backdrop-filter:var(--dsh-any-input-blur,none);' +
    'backdrop-filter:var(--dsh-any-input-blur,none)}' +
    // The takeover cards that sit in the composer seat (approval / plan review /
    // question) are the capsule's SIBLINGS, so the rule above never reaches them.
    // They fill from the same `--dsw-specific-input-major`, which this plugin
    // re-emits with the input alpha — so they faded while staying bare, and the
    // blur slider read as broken on exactly the surface the user is meant to read.
    // Same underlay recipe as the capsule: never a backdrop root of its own.
    //
    // WHY THIS ARM IS CLASS-ONLY (no `[data-approval-key]>div` selector, no
    // `position`, and why the class is attached at runtime): the underlay needs
    // the card to BE the containing block for its `inset:0` layer, and the host
    // never positions these cards — no release in range declares `position` on
    // any of the three (see `COMPOSER_TAKEOVER_CARD`). A stylesheet rule that
    // declares one therefore decides the card's position BY CASCADE against
    // whatever else is styling the page, and a host build that positions the card
    // itself (issue #24's desktop shell pins it with a percentage `max-height`,
    // so the card's absolute containing block is load-bearing) hands the plugin
    // that decision: the `relative` wins or loses on specificity, and whichever
    // way it lands the host's box is now the plugin's to move. Measured both ways
    // against a shell rule of the same weight — the plugin's rule wins by source
    // order and turns the host's absolute card into an in-flow one, seat height
    // and all — which is a host layout this plugin has no business deciding; that
    // report is where the card's box came apart. So: `applyTakeoverFrost` attaches
    // this class only while the blur is non-zero, and writes `position:relative`
    // INLINE only when the card's computed position is `static` — the `setBlur`
    // guard. A card the host positions keeps its own position (which is then the
    // containing block the underlay rides, so the frost still lands) and gets
    // nothing but the stacking context below.
    `.${TAKEOVER_FROST_CLASS}{isolation:isolate}` +
    `.${TAKEOVER_FROST_CLASS}::before{` +
    'content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;border-radius:inherit;' +
    '-webkit-backdrop-filter:var(--dsh-any-input-blur,none);' +
    'backdrop-filter:var(--dsh-any-input-blur,none)}' +
    // …but that stacking context is the same trap PART_BLUR_RULE documents: a
    // dialog mounted inside the card keeps its z-index local and can be buried
    // under the seat. The cards are host-owned surfaces a Tool fills through the
    // `conversation.approval.detail` slot, so a dialog can legitimately open
    // inside one. Losing the frost while it is open is the cheaper half.
    `.${TAKEOVER_FROST_CLASS}:has([role="dialog"]){isolation:auto}` +
    '[data-cordis-panel]{' +
    '-webkit-backdrop-filter:var(--dsh-any-input-blur,none);' +
    'backdrop-filter:var(--dsh-any-input-blur,none)}' +
    // Every fill token, not just the one the Cordis panel's option boxes used to
    // read: on a release where a menu paints from a layer token, scoping only the
    // old name would let the box inherit the CARD alpha from `body` while the panel
    // itself follows the input slider. Inert where the host reads one token.
    `[data-cordis-panel]{${menuFillDecls('var(--dsh-any-op-menu-cordis)!important')}}`
}

function applyInputBlur(px: number): void {
  const root = document.documentElement
  // The frost gate: with the slider at 0 the plugin must not add any layering to
  // the composer at all (see inputBlurRule).
  if (px > 0) root.classList.add(INPUT_FROST_CLASS)
  else root.classList.remove(INPUT_FROST_CLASS)
  if (px > 0) root.style.setProperty('--dsh-any-input-blur', `blur(${px}px)`)
  else root.style.removeProperty('--dsh-any-input-blur')
  applyTakeoverFrost(px)
}

/** Carry the input frost on the seat's takeover cards (approval / plan review /
 *  question), the capsule's siblings — see `inputBlurRule` for the recipe and
 *  why it is attached here rather than by a stylesheet selector.
 *
 *  The anchor probe is the `setBlur` guard: `position:relative` is written
 *  inline ONLY where the host left the card `static`, and remembered with
 *  `TAKEOVER_POS_ATTR` so clearing it is this function's job. A card a host or a
 *  desktop shell positions itself is left exactly as it is — its own position
 *  supplies the underlay's containing block — so no host box ever has its
 *  position decided by this plugin's cascade (issue #24).
 *
 *  Idempotent and cheap in the steady state: cards already carrying the class
 *  (or already clear of it) are skipped without a style read. */
function applyTakeoverFrost(px: number): void {
  const cards = document.querySelectorAll<HTMLElement>(COMPOSER_TAKEOVER_CARD)
  if (px > 0) {
    for (const card of cards) {
      if (card.classList.contains(TAKEOVER_FROST_CLASS)) continue
      if (getComputedStyle(card).position === 'static') {
        card.style.position = 'relative'
        card.setAttribute(TAKEOVER_POS_ATTR, '1')
      }
      card.classList.add(TAKEOVER_FROST_CLASS)
    }
    return
  }
  for (const card of cards) {
    if (!card.classList.contains(TAKEOVER_FROST_CLASS)) continue
    card.classList.remove(TAKEOVER_FROST_CLASS)
    if (card.getAttribute(TAKEOVER_POS_ATTR) === '1') {
      card.style.removeProperty('position')
      card.removeAttribute(TAKEOVER_POS_ATTR)
    }
  }
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

// ── Session header bar (the conversation's own 「标题栏」) ──────────────────────
// The row that carries the session title, its actions and the view tabs — the
// host's `ConversationHeader`, its own file from `0.1.7-alpha.1`:
// `ui-conversation/skeleton/ConversationHeader.tsx` renders one `<header>` that
// holds the header slots. Before that line (0.1.5-rc.2 / 0.1.6-alpha.2) the slots
// mounted straight into the conversation root with no row of their own, so there
// is nothing to tint there and this part never claims anything.
//
// The bar has no surface of its own — the centre column's background paints
// straight through it — so once a wallpaper is up, the strip the title and the
// tabs sit on shows the raw picture while every surface around it is masked. It
// gets its own opacity + blur pair, painted as a REGION TINT the way the chat
// column's card is (see `VIEW_CARDS`): the material is the plugin's
// main-background surface at this part's own opacity, so the bar reads as one band
// over the column instead of a second colour stacked on it, and the frost rides
// the element's own `backdrop-filter` — the header hosts no in-place overlay of
// its own (its dropdowns portal to `body`), so it may be the backdrop root here.
//
// The row is CLAIMED AT RUNTIME, not matched by a stylesheet selector: the
// addressable seam every release in range emits is the slot wrapper
// (`[data-slot^="conversation.session.header"]`), so the plugin walks from that
// anchor up to the nearest `<header>` and tags it with `dab-header-bar` — the same
// idiom the view cards and the frame use, and the one that cannot be broken by a
// host that re-wraps or renames the element around the slots.
const HEADER_BAR_CLASS = 'dab-header-bar'
/** Added to the same row only while its blur is non-zero — see `HEADER_BAR_RULE`. */
const HEADER_BAR_FROST_CLASS = 'dab-header-bar-frost'
const HEADER_BAR_ANCHOR = '[data-slot^="conversation.session.header"]'

/** The session header bar, or null where this host has no such element.
 *
 *  A BLANK session is excluded. `ConversationHeader` marks that row
 *  `headerBlank`, whose rule zeroes its min-height and drops its bottom rule, so
 *  the host paints nothing there and only the row's padding plus the corner
 *  control remain. Claiming it paints a bar over a row the host deliberately
 *  leaves empty — the box that appeared on a fresh session (0.2.0-rc.2). Matched
 *  by the CSS-module LOCAL name: the hash prefix is build-specific, the suffix is
 *  not, and a host that never emits the marker keeps the old behaviour. */
function discoverHeaderBar(): HTMLElement | null {
  if (centerEl === null || !document.body.contains(centerEl)) return null
  const bar = centerEl.querySelector(HEADER_BAR_ANCHOR)?.closest('header')
  if (!(bar instanceof HTMLElement)) return null
  if (bar.className.includes('headerBlank')) return null
  return bar
}

let headerBarEl: HTMLElement | null = null
/** Exactly one owner: the row the current conversation mounted. A row that went
 *  blank, or one the host replaced, must not keep a class — or a `position` — from an
 *  earlier pass. `frost` decides whether the row also carries the underlay arm, and the
 *  underlay's containing block is written inline only while it is needed. */
function releaseHeaderBar(bar: HTMLElement): void {
  bar.classList.remove(HEADER_BAR_CLASS, HEADER_BAR_FROST_CLASS)
  if (bar.getAttribute(TAKEOVER_POS_ATTR) === '1') {
    bar.style.removeProperty('position')
    bar.removeAttribute(TAKEOVER_POS_ATTR)
  }
}

function claimHeaderBar(bar: HTMLElement | null, frost: boolean): void {
  if (headerBarEl !== null && headerBarEl !== bar) releaseHeaderBar(headerBarEl)
  if (bar === null) { headerBarEl = null; return }
  headerBarEl = bar
  bar.classList.add(HEADER_BAR_CLASS)
  if (!frost) { bar.classList.remove(HEADER_BAR_FROST_CLASS); return }
  if (getComputedStyle(bar).position === 'static') {
    bar.style.position = 'relative'
    bar.setAttribute(TAKEOVER_POS_ATTR, '1')
  }
  bar.classList.add(HEADER_BAR_FROST_CLASS)
}

/** The bar's paint. The variables are written by `applyHeaderBar`; the class is
 *  only ever added when they are, so a host the plugin is not theming keeps its
 *  own header untouched.
 *
 *  WHY THE ROW NEEDS A `z-index`: the 「标题栏」 card frosts the row, and a
 *  `backdrop-filter` other than `none` makes the element a STACKING CONTEXT — which the
 *  row cannot avoid wanting, since the frost is the feature. The row is not an empty
 *  strip: the host mounts its header chrome INTO it (`conversation.session.header
 *  .actions|.utilities|.corner`), and that chrome raises its overlays from inside the
 *  row:
 *    · `ui-jobs/JobListAction.module.css` — `.root{position:relative}` +
 *      `.menu{position:absolute; top:calc(100% + 5px); z-index:100}` on every release
 *      through `0.2.1-alpha.1` (the `{open ? <ul style={{left: menuShift}}/> : null}`
 *      the bug was captured from; `0.2.1-alpha.2` portaled it to `body`, which is why
 *      that build hid the symptom rather than fixed it);
 *    · `ui-schedule/TaskMenu.module.css` — the list root carries `role="menu"` and is
 *      `position:absolute; top:calc(100% + 4px); z-index:100` whenever the primitive is
 *      NOT in portal mode, and it sits in `…header.utilities` on every release in range.
 *  Once the row is a stacking context those `z-index:100`s stop being page-level values:
 *  they only order the overlays WITHIN the row, and the row itself then paints at its
 *  own level — under the conversation body, the composer seat and `.root`'s background,
 *  all of which follow it in the column. The menu was not demoted by the host; it was
 *  confined by us, and confining it is what "the list is behind the chat" meant.
 *
 *  THE COMPENSATION IS THE ROW'S OWN `z-index`, not a release of the frost: a `:has()`
 *  valve dropping the blur while an overlay is open was the first attempt, and it
 *  visibly re-tints the whole title bar every time anyone opens a header menu — the
 *  part's two sliders appear to change state on their own. Raising the row instead keeps
 *  the frost steady and restores the order the host assumed. The value has to clear the
 *  in-column chrome the row hangs over — `.seat` 9 (composer), the back-to-bottom control
 *  8, the footer 7, `.tabs` 1 (all measured from `ConversationRoot.module.css`) — while
 *  staying UNDER every page-level surface, because the centre column is not itself a
 *  stacking context unless the background blur is on: portaled menus/tooltips are 100,
 *  modal overlays 1000, stat and context panels 1100 (`Menu.module.css`, `Modal.module.css`,
 *  `ContextMeter.module.css` — the last lives in `InputBar`, NOT in this row, so the row's
 *  filter never had to be blamed for its anchoring). 10 sits in that gap: above 9, far
 *  below 100, so a portaled list still covers the title row exactly as the host intends.
 *
 *  `z-index` needs no `position` here and none is written by the BASE rule: the row is
 *  a flex ITEM of `ConversationRoot .root{display:flex;flex-direction:column}` on every
 *  release in range, and z-index applies to flex items as they are. Writing
 *  `position:relative` would also make the row a containing block — and deciding a host
 *  box's positioning is the exact race this plugin lost once already (issue #24).
 *
 *  THE FROST DOES NOT SIT ON THE ROW. That was the first version of this rule, and it
 *  cost the row's own children their backdrop: `backdrop-filter` makes an element a
 *  BACKDROP ROOT as well as a stacking context, so an in-place header popover (the
 *  session-log `…` menu, which `HeaderAction.tsx` renders without `portal`) could only
 *  ever blur what the row itself paints — a flat tint — and the 「标题栏」 blur slider
 *  read as dead on exactly the panel that hangs off the row. `isolation:isolate` is a
 *  stacking context WITHOUT being a backdrop root, so the frost now rides a `::before`
 *  underlay like it does on every other host part this plugin filters (`PART_BLUR_RULE`,
 *  `inputBlurRule`), and the row's children sample the wallpaper again. The underlay
 *  needs the row to be its containing block, which is why the frost arm adds
 *  `position:relative` — INLINE, only when the host left the row `static`, and marked
 *  `data-dab-pos-patched` so only this writer takes it back: the same guard
 *  `setBlur` uses, for the same reason (a stylesheet `position` would cascade against
 *  whatever the host or another plugin decides that box's position is). */
export const HEADER_BAR_RULE =
  `.${HEADER_BAR_CLASS}{` +
  'background:var(--dsh-any-op-header-bar,transparent)!important;' +
  'z-index:10}' +
  `.${HEADER_BAR_FROST_CLASS}{isolation:isolate}` +
  `.${HEADER_BAR_FROST_CLASS}::before{` +
  'content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;border-radius:inherit;' +
  '-webkit-backdrop-filter:var(--dsh-any-blur-header-bar,none);' +
  'backdrop-filter:var(--dsh-any-blur-header-bar,none)}'

/** The 「标题栏」card's paint: the card's material at the card's opacity, empty
 *  where the plugin is not theming. The conversation header row, the Windows
 *  caption band, and — through the desktop preload's probe — the native
 *  minimize/maximize/close block all read this one value. */
function headerBarPaint(src?: Record<string, string> | null): string {
  const map = src === undefined ? (paletteTokens() ?? readHostOpacityTokens()) : src
  const base = map?.['--dsw-alias-bg-base']
  return base === undefined ? '' : toRgba(base, rHeaderBarOpacity())
}

/** Claim the bar and write its material + frost. `surfaces` arrives from the token
 *  funnel, which already has the resolved source list; the settings sliders and the
 *  parts pass call it without one and the sources are re-resolved here. */
export function applyHeaderBar(surfaces?: Record<string, string> | null): void {
  const src = surfaces === undefined ? (paletteTokens() ?? readHostOpacityTokens()) : surfaces
  const root = document.documentElement
  discoverParts()
  const bar = discoverHeaderBar()
  const paint = headerBarPaint(src)
  if (paint === '') {
    // Not theming (no picked color, no wallpaper verdict): not our row.
    claimHeaderBar(null, false)
    root.style.removeProperty('--dsh-any-op-header-bar')
    root.style.removeProperty('--dsh-any-blur-header-bar')
    applyNativeCaption(surfaces)
    return
  }
  root.style.setProperty('--dsh-any-op-header-bar', paint)
  const px = rBlurs().headerBar
  if (px > 0) root.style.setProperty('--dsh-any-blur-header-bar', `blur(${px}px)`)
  else root.style.removeProperty('--dsh-any-blur-header-bar')
  claimHeaderBar(bar, px > 0)
  // The native button block is painted from the color the desktop preload measures
  // off its probe, and the probe carries this paint as a literal, so a slider move
  // has to rewrite the band's rule text for the preload to re-measure it.
  applyNativeCaption(surfaces)
}

// ── Windows desktop caption band + native window-controls block ───────────────
// The caption row is CHROME, so it stops following the sidebar slider. The facts,
// read off the desktop app rather than inferred:
//   · `preload-windows.ts` stamps `data-windows-titlebar` on <html> for the
//     primary window and paints nothing itself;
//   · the caption band is `AppFrame.module.css`'s `.frame::before`, and both it
//     and `.frame` fill from `--dsw-specific-sidebar-fill` — the token the
//     sidebar slider owns, which is why dialing that slider down leaves the
//     window's own caption clear and the wallpaper raw under the title and the
//     Application / Edit menubar (issue #23, symptom 1);
//   · the native window-controls overlay — the minimize/maximize/close block,
//     drawn by Windows and not by the page — is colored by that same preload,
//     which MEASURES `--dsw-specific-sidebar-fill` and `--dsw-alias-label-primary`
//     off a probe span it appends to <body> and ships them over
//     `dsh-desktop:windows-appearance`; main.ts forwards both to
//     `setTitleBarOverlay` and its guard accepts an `rgba()` value. There is no
//     page-callable IPC and the `dshDesktop` bridge exposes none, so those
//     measured tokens ARE the plugin's entire lever on that block.
// The band is TWO OWNERS, split at the sidebar's width: the segment above the left
// sidebar belongs to the 「侧栏」 pair (same material, same frost), and everything right
// of it belongs to the 「标题栏」 card (its material at its opacity, its blur variable).
// See `applyNativeCaption` for how the cut is made and why the drag region survives it.
// The probe is handed `transparent`, so Windows paints the block with NO
// background of its own. The band already spans the full caption width at exactly
// the overlay's height (`.frame::before` is `inset: 0 0 auto` at
// `--dsh-windows-titlebar-height`, 40px), so the block IS the band — one
// continuous surface, matching at every opacity. Handing the probe the card's
// paint instead, which this did first, makes Windows draw each button its own
// translucent patch and the three stack into a lighter, visibly segmented block.
// The glyphs are a SEPARATE measurement off the same probe
// (`--dsw-alias-label-primary`, the label ink the plugin asserts — see the label
// flip in `applyCustomTokensNow`), so they stay opaque and readable over whatever
// the band is doing.
// The same pass squares the content column's top-left corner. `AppFrame` rounds
// `.centerCol`'s top-left by 16px and clips its overflow; with the frame cleared
// to show the wallpaper, that notch lets the wallpaper through under the
// conversation header's first pixels (measured live on 0.2.0-rc.2).
// Inert where the preload did not mark the document, and no declaration at all
// where the plugin is not theming (no picked color, no wallpaper verdict), so a
// stock install's caption keeps the host's own look.
const CAPTION_FRAME_CLASS = 'dab-frame-caption'
const FLAT_CENTER_CLASS = 'dab-center-flat'
const WCO_PROBE_SEL = 'body > span[style*="--dsw-specific-sidebar-fill"]'

/** Marks the sidebar's own caption controls — the toggle and, while collapsed,
 *  the new-session button. Both are `position:fixed` and float over the band, so
 *  they inherit the band's ink instead of the sidebar's. */
const CAPTION_INK_ATTR = 'data-dab-caption-ink'

/** The strip's chrome ink, and its collapsed-state variant.
 *
 *  WHY THIS IS NOT SIMPLY THE LABEL INK: the plugin flips the label tokens against the
 *  PICKED PALETTE (white on a dark pick), but the caption band is that palette at
 *  the sidebar/header-bar opacity OVER the wallpaper. At a low opacity the strip
 *  is mostly wallpaper, so white ink lands on a light band and the toggle
 *  disappears (reported on the desktop build, on a 22%-opacity sidebar over a bright
 *  wallpaper). The strip therefore derives its own ink from what it is actually
 *  painted on: past ~85% opacity the surface dominates and the palette direction
 *  is the truth; below it the wallpaper's brightness verdict decides.
 *
 *  WHY THAT DERIVATION IS NOT THE WHOLE ANSWER (issue #30): the same derivation makes
 *  the native caption menubar (「应用 / 编辑」) black on a dark theme whose sidebar is
 *  translucent over a bright wallpaper — the strip really is light there, so the strip
 *  is right and the rest of the window is wrong, and the two reports of this same
 *  situation asked for opposite outcomes. So the policy is the user's: 「标题栏文字」
 *  picks the winner, and `auto` keeps the strip-following behaviour that fixed the
 *  invisible toggle. `theme` returns null, which removes every ink declaration this
 *  function feeds — the menubar and the sidebar's fixed controls then read the host's
 *  own label tokens, exactly as they did before 0.3.8.
 *
 *  Returned as `{ ink, collapsedInk }` because the strip's material changes with
 *  the sidebar: expanded it is the sidebar segment, collapsed it is the 「标题栏」
 *  card's band. `null` means "no override" — either no verdict and no palette
 *  direction, or the user asked for the theme's own ink. */
function captionInkPair(): { ink: string; collapsedInk: string } | null {
  const mode = rCaptionInk()
  if (mode === 'theme') return null
  if (mode === 'white') return { ink: '#fff', collapsedInk: '#fff' }
  if (mode === 'black') return { ink: '#000', collapsedInk: '#000' }
  const verdict = rBgDark()
  const override = rSchemeOverride()
  const inkIsWhite = override === 'auto'
    ? (rHasColor() ? rColorScheme() === 'dark' : verdict)
    : rScheme() === 'dark'
  if (inkIsWhite === null || inkIsWhite === undefined) return null
  const stripInk = (alpha: number): string => {
    const dark = verdict === null || verdict === undefined || alpha >= 0.85 ? inkIsWhite : verdict
    return dark ? '#fff' : '#000'
  }
  return { ink: stripInk(rOps().sidebar), collapsedInk: stripInk(rHeaderBarOpacity()) }
}

/** The fixed caption controls of the sidebar root, re-inked (and released) as the
 *  strip's material changes. Throttled: this runs on every caption re-apply, and
 *  the header-bar slider drags through that path frame by frame. */
let captionInkEls: HTMLElement[] = []
let captionInkSidebar: HTMLElement | null = null
let captionScanAt = 0

function releaseCaptionInk(): void {
  for (const el of captionInkEls) {
    el.style.removeProperty('--dsw-alias-label-secondary')
    el.removeAttribute(CAPTION_INK_ATTR)
  }
  captionInkEls = []
}

function applyCaptionInk(enabled: boolean): void {
  if (!enabled || sidebarEl === null) { releaseCaptionInk(); return }
  const now = typeof performance === 'undefined' ? Date.now() : performance.now()
  const stale = captionInkEls.some(el => !el.isConnected)
  if (stale || sidebarEl !== captionInkSidebar || now - captionScanAt > 250) {
    captionScanAt = now
    captionInkSidebar = sidebarEl
    releaseCaptionInk()
    for (const btn of sidebarEl.querySelectorAll<HTMLElement>('button')) {
      if (getComputedStyle(btn).position !== 'fixed') continue
      captionInkEls.push(btn)
    }
  }
  for (const el of captionInkEls) {
    el.style.setProperty('--dsw-alias-label-secondary', 'var(--dsh-any-caption-ink, #fff)')
    el.setAttribute(CAPTION_INK_ATTR, '')
  }
}

let wcoStyleEl: HTMLStyleElement | null = null

function ensureWcoStyle(): HTMLStyleElement {
  if (wcoStyleEl?.isConnected) return wcoStyleEl
  wcoStyleEl = document.createElement('style')
  wcoStyleEl.dataset.plugin = 'dsh-any-background-wco'
  document.head.appendChild(wcoStyleEl)
  return wcoStyleEl
}

/** The band's opaque material, or '' when the plugin has no theme to assert. The
 *  sampled sidebar fill is already opaque in both source paths (the plugin's
 *  palette builds `hsl()`, the host's own token is a static colour) — it only
 *  misses on a host that exposes neither, and then the neutral the plugin builds
 *  for the effective scheme stands in so the band still tracks the label ink. */
function captionFill(src: Record<string, string> | null): string {
  const sampled = src?.['--dsw-specific-sidebar-fill']
  if (sampled !== undefined) return sampled
  if (paletteTokens() === null && rBgDark() === null) return ''
  const dark = rScheme() === 'dark'
  return genTokens(220, 0.04, dark ? 0.14 : 0.92, dark ? 'dark' : 'light').tokens['--dsw-specific-sidebar-fill'] ?? ''
}

/** Write the caption rule and mark the frame it targets. The frame is the
 *  plugin's own discovery (`discoverParts`), not a guessed hashed class name. The
 *  probe selector is a verified shape: an inline style that mentions the sidebar
 *  token on a body-level span is the desktop preload's caption probe and nothing
 *  else, so no match means no desktop caption and the rule is inert.
 *
 *  THE BAND IS TWO REGIONS, NOT ONE. `AppFrame.module.css` paints the whole caption
 *  with one box (`.frame::before`, `inset: 0 0 auto` at `--dsh-windows-titlebar-height`)
 *  in `--dsw-specific-sidebar-fill` — the SIDEBAR's token — while the sidebar column
 *  below it (`AppFrame.tsx`'s first grid track, `${cols.sidebar}px`) is the surface
 *  that slider actually owns. The 标题栏 card took the band over in 0.3.6, which made
 *  the strip above the sidebar follow the session title row instead of the sidebar. So
 *  the band is now cut at the sidebar's own width:
 *    · `::before` keeps the host's box (and its `-webkit-app-region: drag`) and is
 *      CLIPPED to everything right of that width — `clip-path:inset(0 0 0 …)` clips
 *      the paint AND the backdrop-filter's effect, so the region under the cut is
 *      genuinely untouched rather than frosted twice.
 *    · `::after` (a box `.frame` does not use on any release in range) paints exactly
 *      that left segment from `--dsh-any-op-sidebar` — the same literal the sidebar
 *      column is painted with — and frosts from the sidebar blur's root mirror, so the
 *      column and the strip above it are one surface under one opacity + blur pair.
 *      It is PAINT ONLY: `pointer-events:none`, and deliberately NO
 *      `-webkit-app-region: drag`. Chromium collects app-region items in paint order,
 *      and a drag annotation on a generated layer overrides the `no-drag` holes the
 *      native caption menubar punched for itself (`preload-menu.ts` marks its host
 *      `no-drag`), which left the top-left controls unclickable while the window still
 *      dragged (issue #29). The host's own `.frame::before` keeps its drag region, so
 *      the band remains movable.
 *  `--dsh-windows-sidebar-width` is published INLINE ON THE FRAME by the host
 *  (`AppFrame.tsx`, Windows builds only, `${cols.sidebar}px`) and both pseudo-elements
 *  inherit it, so the split tracks a dragged or collapsed sidebar with no observer of
 *  our own. Collapsed is `0px`: the `::after` box vanishes and `::before` un-clips, so
 *  the band goes back to being entirely the 标题栏 card's.
 *  The native button block still reads the probe as `transparent`, and it sits at the
 *  window's right edge — inside the region that stays 标题栏-owned. */
function applyNativeCaption(surfaces?: Record<string, string> | null): void {
  if (!document.documentElement.hasAttribute('data-windows-titlebar')) return
  const src = surfaces === undefined ? (paletteTokens() ?? readHostOpacityTokens()) : surfaces
  const fill = captionFill(src)
  const paint = headerBarPaint(src) || fill
  const width = 'var(--dsh-windows-sidebar-width,0px)'
  const css = fill === '' ? '' : `${WCO_PROBE_SEL}{--dsw-specific-sidebar-fill:transparent}` +
    `[data-windows-titlebar] .${CAPTION_FRAME_CLASS}::before{` +
    `background:var(--dsh-any-op-header-bar,${paint})!important;` +
    `backdrop-filter:var(--dsh-any-blur-header-bar,none);` +
    `-webkit-backdrop-filter:var(--dsh-any-blur-header-bar,none);` +
    `clip-path:inset(0 0 0 ${width});-webkit-clip-path:inset(0 0 0 ${width})}` +
    `[data-windows-titlebar] .${CAPTION_FRAME_CLASS}::after{` +
    `content:"";position:absolute;top:0;left:0;pointer-events:none;z-index:-1;` +
    `width:${width};height:var(--dsh-windows-titlebar-height,40px);` +
    `background:var(--dsh-any-op-sidebar,${fill});` +
    `backdrop-filter:var(--dsh-any-blur-sidebar-band,none);` +
    `-webkit-backdrop-filter:var(--dsh-any-blur-sidebar-band,none)}` +
    // A modal's mask deliberately starts BELOW the caption (`--dsh-frame-chrome-top`
    // = the titlebar height, ui-layout) so the native drag strip keeps working. That
    // leaves the 40px band bright above a dimmed page once the wallpaper is showing —
    // our band is our own paint, so it dims itself here, with the host's own mask
    // color. Paint only: no pointer or drag behavior is touched.
    `[data-windows-titlebar]:has([role="dialog"][aria-modal="true"]) .${CAPTION_FRAME_CLASS}::before,` +
    `[data-windows-titlebar]:has([role="dialog"][aria-modal="true"]) .${CAPTION_FRAME_CLASS}::after{` +
    `box-shadow:inset 0 0 0 9999px var(--dsw-alias-bg-mask-1,rgba(0,0,0,.24))}` +
    // The strip's chrome reads the caption ink (see `captionInkPair`), and while
    // the sidebar is collapsed the whole strip is the 标题栏 card's band, so the
    // switch to that variant rides the host's own collapsed marker. Under
    // 「标题栏文字」= 跟随主题 this block is emitted NOT AT ALL: the menubar and the
    // sidebar's fixed controls keep the host's label tokens, which is the only way
    // "the theme's own ink" can mean anything for an element the plugin does not paint.
    (rCaptionInk() === 'theme' ? '' :
      `:root:has([data-sidebar-collapsed="true"]){--dsh-any-caption-ink:var(--dsh-any-caption-ink-collapsed,#fff)!important}` +
      `[data-windows-titlebar] [data-windows-menu]{` +
      `--dsw-alias-label-secondary:var(--dsh-any-caption-ink,#fff);` +
      `--dsw-alias-label-primary:var(--dsh-any-caption-ink,#fff)}`) +
    `[data-windows-titlebar] .${FLAT_CENTER_CLASS}{border-top-left-radius:0!important}`
  const el = ensureWcoStyle()
  if (el.textContent !== css) el.textContent = css
  const ink = css === '' ? null : captionInkPair()
  const root = document.documentElement
  if (ink === null) {
    root.style.removeProperty('--dsh-any-caption-ink')
    root.style.removeProperty('--dsh-any-caption-ink-collapsed')
  } else {
    root.style.setProperty('--dsh-any-caption-ink', ink.ink)
    root.style.setProperty('--dsh-any-caption-ink-collapsed', ink.collapsedInk)
  }
  discoverParts()
  applyCaptionInk(ink !== null)
  if (frameEl === null) return
  if (css === '') {
    frameEl.classList.remove(CAPTION_FRAME_CLASS)
    centerEl?.classList.remove(FLAT_CENTER_CLASS)
  } else {
    frameEl.classList.add(CAPTION_FRAME_CLASS)
    centerEl?.classList.add(FLAT_CENTER_CLASS)
  }
}

/** Mirror of the sidebar-part blur on `:root`, for the caption segment above the
 *  sidebar column. `--dsh-any-part-blur` is written INLINE on the column and the band
 *  is a pseudo-element of the FRAME, one level up, so it can never inherit it. */
function applySidebarBandBlur(px: number): void {
  if (px > 0) document.documentElement.style.setProperty('--dsh-any-blur-sidebar-band', `blur(${px}px)`)
  else document.documentElement.style.removeProperty('--dsh-any-blur-sidebar-band')
}

/** Mirror of the bg-part blur on :root. --dsh-any-part-blur is element-scoped
 *  to the columns, so surfaces outside their subtree (the mobile header, or
 *  third-party styles) can never inherit it. */
function applyBgBlurGlobal(px: number): void {
  if (px > 0) document.documentElement.style.setProperty('--dsh-any-part-blur-global', `blur(${px}px)`)
  else document.documentElement.style.removeProperty('--dsh-any-part-blur-global')
}

// ── Right sidebar / workbench panel (the "panel" slider pair) ────────────────
// The `panelOpacity` / blurs.panel pair targets two surfaces by mode:
//   · native — the host's own right Sidebar (`[data-sidebar-right-panel]`),
//     a `--dsw-alias-bg-base`-painted column of the page;
//   · dsh-better-sidebar installed — its bottom workbench panel
//     (`[data-dsh-bottom-panel]`), which paints every surface from the same
//     layer/bg-base tokens.
// Both hang where neither the column opacities nor the part-blur underlays
// reach, so both need their own treatment: a token re-scope here, and a blur rule
// from the adapters.
//
// Which element the blur rides, and whether the panel has to be lifted out of its
// stacking context to have wallpaper to sample, CHANGED between host releases —
// that history (and the measurement behind it) lives with the adapters that answer
// it, in `host-compat/versions/*`. The token re-scope below is layout-neutral and
// stays correct on every release.
export const PANEL_TOKEN_RULE =
  // Re-scope the layer tokens so every surface inside the panel follows the
  // panel opacity slider only. The re-scope lives in the always-emitted
  // stylesheet so it works even with no palette (pointing at unwritten vars
  // would invalidate the background and drop the surface entirely;
  // `applyPanelOverrides` writes the vars on every call).
  `${PANEL_SURFACES}{` +
  '--dsw-alias-bg-base:var(--dsh-any-panel-bg-base);' +
  '--dsw-alias-bg-layer-1:var(--dsh-any-panel-layer-1);' +
  '--dsw-alias-bg-layer-2:var(--dsh-any-panel-layer-2);' +
  '--dsw-alias-bg-layer-3:var(--dsh-any-panel-layer-3)}'

// ── Header popovers (Agent Team panel + background-job list + open-in-app /
//    session-log menus + subagent lineage tree) ────────────────────────────────
// Session-header dropdowns that paint from --dsw-specific-menu, the same token
// the card slider owns — so they used to follow the card opacity, and the
// non-Menu ones never got any blur (they are `position: absolute` under their
// own trigger, not portaled to body, so popoverBlurRule's
// `body > [role="dialog"]` selector misses them). This rule gives them their
// own part: the header opacity slider retints the menu token for these
// surfaces only, and the header blur slider frosts them.
//
// This rule is appended AFTER popoverBlurRule in the static stylesheet, and
// each selector carries equal-or-higher specificity — so listing a surface here
// cleanly overrides the card group instead of fighting it. That matters for the
// menu selectors below, which DO already match `[role="menu"]`: they are moved
// from the card group to the header group, not merely added.
//
// TWO MATCHING STRATEGIES, primary first:
//
// 1. [data-dsh-any-header-popover] — the runtime tag (see header-tag.ts). Every
//    header dropdown portals its popover to <body> through the Menu/tree
//    primitive, which severs the DOM link to the header and exposes no
//    id/aria-controls back-link, so no ancestor selector can reach it. The tag
//    module observes the stable `[data-slot="conversation.session.header*"]`
//    anchors (emitted by the slot renderer on 0.1.5 → 0.1.7 alike) and marks the
//    open popover. This is the ONLY strategy that still works on 0.1.7, where
//    open-in-app moved to a portal and the session row menu became a dynamic
//    slot — see below.
//
// 2. Class-shape fallbacks — retained for hosts where the tag observer has not
//    run yet (first paint) or is unavailable, and they still cover 0.1.5/0.1.6:
//      · ul[class*="_menu"]  — the background-job list. It is one of exactly TWO
//        host <ul> elements styled by a `menu` CSS-module class; the other is the
//        schedule catalog (`ui-schedule` ScheduleCatalogAction.tsx), verified on
//        0.1.7-alpha.1. Every remaining `_menu` consumer (ModelSelect, TabMenu,
//        MenuView, TerminalGuide, SubagentHeaderLineage) renders a <div>. The two
//        <ul>s are portal'd siblings with the same attributes (class, style,
//        aria-label) and no distinguishing marker, so this fallback cannot single
//        out the job list: the schedule catalog takes the header look too.
//        Strategy 1 never tags it, so that overlap comes from this rule alone.
//        ACCEPTED as-is: keeping the job list styled on first paint is worth more
//        than holding the catalog on the card group, so do not "fix" the match.
//      · div[role="dialog"][class*="_panel"]:not([aria-modal="true"]) — the
//        Agent Team panel. The other `_panel` + role="dialog" element is the
//        settings modal (aria-modal="true"), which SETTINGS_STYLE_RULE owns.
//      · [role="tree"][class*="_menu"] — the subagent lineage tree. Portal'd, so
//        `body > [role="tree"]` already matched it; the class is what separates
//        it from every other `role="tree"` (workspace lists use `.list` /
//        `.flatList` / `.searchTree`).
//      · [role="menu"][class*="_denseList"]:not([class*="_portal"]) — the two
//        in-place `dense` Menu primitives: open-in-app's picker and the
//        session-log download menu on 0.1.5/0.1.6. The `:not([_portal])` is
//        what keeps every PORTALED dense menu (WorkspaceBrowser view options,
//        TextPreview open-with, ReviewTab file selector) on the card slider.
//        NOTE: on 0.1.7 open-in-app became `portal`+`dense` (see
//        OpenTargetButton.tsx), so this fallback deliberately no longer matches
//        it — strategy 1's tag is what restores the header grouping there.
//        Keeping the exclusion matters: broadening it would drag the side-panel
//        dense menus into the header group.
// SPECIFICITY IS LOAD-BEARING HERE. The card group's rule is
// `[role="menu"]:not([data-dockkit-tab-menu])` — specificity (0,2,0) — so a bare
// `[data-dsh-any-header-popover]` (0,1,0) LOSES to it no matter how late it
// appears in the sheet. That is exactly how the tagged open-in-app menu kept
// taking the card blur. Every header selector below therefore carries an extra
// attribute so it reaches (0,2,0)+ and genuinely overrides the card group:
//   · [data-dsh-any-header-popover][role]     → (0,2,0)
//   · [role="menu"][class*="_denseList"]...    → (0,2,0)+
//
// NO TOKEN DECLARATION LIVES HERE. The header group's surface color is written
// as a LITERAL by `applyHeaderPopovers` into a dedicated sheet, for the same
// reason `applyExemptDefaults` is: an earlier revision declared
// `--dsw-specific-menu:var(--dsh-any-op-menu-header,var(--dsw-specific-menu))`,
// which is a SELF-REFERENCE. With `--dsh-any-op-menu-header` unset (before the
// first apply, or on a host the plugin cannot sample) the fallback names the
// property being declared, the custom property computes to the
// guaranteed-invalid value, and every menu background reading it goes fully
// transparent. Literals cannot cycle; when no color resolves we emit nothing and
// the surface keeps the re-scoped value instead.
/** The header dropdown surfaces, spelled ONCE. Three rules consume this set (the
 *  static blur rule, the dynamic token rule and the stroke group), and every one
 *  of them drifting by a single attribute re-introduces the bug where a header
 *  menu keeps the card slider's look instead of its own.
 *
 *  Strategy 1 is the runtime tag (`header-tag.ts`); strategies 2 are class-shape
 *  fallbacks for the first paint before the tag observer runs. */
const HEADER_TAG_SELECTOR = `[${HEADER_POPOVER_ATTR}]`
const HEADER_SURFACES = [
  HEADER_TAG_SELECTOR,
  'ul[class*="_menu"],div[role="dialog"][class*="_panel"]:not([aria-modal="true"])',
  `[role="menu"][class*="_denseList"]:not([class*="_portal"])`,
  '[role="tree"][class*="_menu"]',
]

/** SPECIFICITY IS LOAD-BEARING HERE. The card group's rule is
 *  `[role="menu"]:not([data-dockkit-tab-menu])` — specificity (0,2,0) — so a bare
 *  `[data-dsh-any-header-popover]` (0,1,0) LOSES to it no matter how late it
 *  appears in the sheet. That is exactly how the tagged open-in-app menu kept
 *  taking the card blur. `[role]` is a no-op presence test that raises only the
 *  tagged arm to (0,2,0); the other three already qualify at (0,2,0)+. */
const HEADER_SURFACES_PADDED = [
  `${HEADER_TAG_SELECTOR}[role]`,
  // `0.2.1-alpha.3`+: the background-job list moved onto `MenuSurface`, whose root
  // has no role — the tagger claims it by `data-menu-material`, and the padded
  // selector has to follow (`[role]` would never match it). (0,2,0), same as the
  // card group's `[data-menu-material]` arm; this group is written later, so the
  // header answer wins for a tagged surface.
  `${HEADER_TAG_SELECTOR}[data-menu-material]`,
  ...HEADER_SURFACES.slice(1),
]

/** The header blur variable, and the rule that frosts the header's dropdown set.
 *  The declaration comes from the same adapter answer as the card group's menu arm:
 *  every surface in this set paints its skin from the host's own menu-blur token
 *  (`SubagentHeaderLineage.module.css:120` uses a pseudo-element, the stat dialog and
 *  goal bar use their own layer), so handing over the token reaches all of them on
 *  both paint shapes, while filtering the element would install the ancestor
 *  backdrop root each of those files documents avoiding. */
const HEADER_BLUR_VAR = '--dsh-any-blur-header'

export function headerPopoverRule(): string {
  return `${HEADER_SURFACES_PADDED.join(',')}{${menuFrost(HEADER_BLUR_VAR)}}`
}

// ── Surfaces pinned against the sliders (theme color kept) ────────────────────
// Two groups the user wants the sliders to leave alone, for two reasons:
//
// 1. Modal-native confirm dialogs — `role="dialog"[aria-modal="true"]` WITHOUT
//    `aria-labelledby` (which is what separates them from the settings panel
//    that SETTINGS_STYLE_RULE owns). These are the rename / delete / risk /
//    feedback confirmations: short-lived, destructive or decision-critical
//    prompts whose legibility must not depend on an appearance slider. They do
//    not match SETTINGS_STYLE_RULE, but they still inherit the body-level token
//    re-scope, so the card slider's alpha on --dsw-alias-bg-layer-2 bleeds into
//    them. `applyExemptDefaults` pins those tokens at alpha 1 — keeping whatever
//    color the theme dictates, dropping only the slider's translucency.
//
// 2. Session row menus — the portal'd `[role="menu"]` listing rename / fork /
//    archive / delete. Structurally identical to every other Menu primitive
//    (model selector, @-suggestions, …) and portalled to body, so no attribute
//    or ancestor distinguishes it. `:has([class*="_danger"])` approximates it:
//    `_danger` is the destructive-row class, and among host menus only the
//    session-row menu carries one (for its 删除会话 entry). Deliberately narrow,
//    and it no-ops on engines without :has() (the menu simply keeps the card
//    look rather than breaking).
//
// Both groups come AFTER popoverBlurRule / SETTINGS_STYLE_RULE so they win on
// order.
//
// IMPORTANT — no self-referencing fallbacks. An earlier version wrote
// `--dsw-alias-bg-layer-2:var(--dsh-any-host-layer-2,var(--dsw-alias-bg-layer-2))`.
// When the host var is unset the fallback names the property being declared,
// which is a CSS cycle: the custom property computes to the guaranteed-invalid
// value and every `background:var(--dsw-alias-bg-layer-2)` consuming it becomes
// invalid — i.e. fully transparent. That is why the pin is emitted DYNAMICALLY
// with real literals (see applyExemptDefaults): when no color resolves we emit
// NO declaration at all, so the element keeps the re-scoped value instead of
// going transparent.
//
// Only the parts that cannot go invalid stay static: the blur/stroke resets.
export function exemptDefaultRule(): string {
  return '[role="dialog"][aria-modal="true"]:not([aria-labelledby]){' +
    'backdrop-filter:none;-webkit-backdrop-filter:none}' +
    // Session row menus (approximated by their destructive row): no plugin blur,
    // no plugin stroke. Its surface color is restored dynamically too. The frost is
    // cleared through the release's own menu arm — on a MenuSurface host
    // `backdrop-filter:none` on the element would leave the child layer frosted.
    `[role="menu"]:has([class*="_danger"]){${hostAdapter().menus.frostDecl('none')};` +
    '-webkit-text-stroke-width:0}'
}

/** Selector the dynamic header token rule targets — the same set as the static
 *  headerPopoverRule above, so the two can never drift apart. */
const HEADER_TOKEN_SELECTOR = HEADER_SURFACES_PADDED.join(',')

/** Header-popover surfaces: retint the menu token and (re)write the blur.
 *  Mirrors applyProduced: the static rule above never changes, so a drag only
 *  rewrites the blur variable and this one dynamic rule. */
export function applyHeaderPopovers(): void {
  const root = document.documentElement
  const px = rBlurs().header
  // At 0 the variable is REMOVED, which is not "leave it alone": the static rule
  // declares `var(--dsh-any-blur-header, none)` on the surfaces themselves, so the
  // fallback wins over the host's inherited frost and the panel stops froasting.
  // That is the intended reading of a 0 on this slider (see the note above
  // `popoverBlurRule`).
  if (px > 0) root.style.setProperty(HEADER_BLUR_VAR, `blur(${px}px)`)
  else root.style.removeProperty(HEADER_BLUR_VAR)
  // Alpha: re-emit the live menu token's own color with the header opacity so
  // the popover keeps the host palette (and follows a picked color) while fading
  // independently of the card slider. EVERY fill token the release paints menus
  // from gets that same literal (`menuFillDecls`), because one header opacity has
  // to mean one look whether the surface reads the old name or the layer's new one.
  //
  // LITERAL, not a CSS var indirection — see the note above on the header group.
  // The declaration goes into a dedicated sheet so the static rule stays
  // selector-only and a drag rewrites just this one text node.
  let opacity = rHeaderOpacity()
  if (opacity < 0) opacity = 0
  if (opacity > 1) opacity = 1
  const surfaces = paletteTokens() ?? readHostOpacityTokens()
  const menu = surfaces?.[MENU_FILL_TOKEN]
  const el = ensureHeaderStyle()
  // Nothing resolved: emit NO declaration rather than an invalid one, so the
  // surface keeps the re-scoped token value instead of going transparent.
  const css = menu === undefined
    ? ''
    : `${HEADER_TOKEN_SELECTOR}{${menuFillDecls(toRgba(menu, opacity))}}`
  if (el.textContent !== css) el.textContent = css
}

let headerStyleEl: HTMLStyleElement | null = null
function ensureHeaderStyle(): HTMLStyleElement {
  if (headerStyleEl?.isConnected) return headerStyleEl
  headerStyleEl = document.createElement('style')
  headerStyleEl.dataset.plugin = 'dsh-any-background-header'
  document.head.appendChild(headerStyleEl)
  return headerStyleEl
}

/** Pin the exempt groups (confirm dialogs and the session-row menu) so no
 *  appearance slider moves them — while KEEPING the active theme color.
 *
 *  "Default" here means "not faded, not blurred", NOT "host-palette original":
 *  an earlier version restored the :root host colors, which also stripped the
 *  picked theme color and made the menu look un-themed. The correct source is
 *  the same one every other slider uses (the plugin palette when there is one,
 *  else the host's resolved tokens) with alpha pinned to 1 — so the surface
 *  keeps whatever color the theme currently dictates and only loses the slider's
 *  translucency and blur.
 *
 *  Emitted as REAL literals into a dedicated stylesheet, never as
 *  `var(--x, var(--x))`: a self-referencing fallback is a CSS cycle that
 *  computes to the guaranteed-invalid value and turns every consuming
 *  `background:var(--dsw-alias-bg-layer-2)` fully transparent. Literals also
 *  mean that when no color can be resolved we emit NO declaration at all, so
 *  the surface keeps the re-scoped value rather than going transparent. */
export function applyExemptDefaults(): void {
  if (typeof document === 'undefined') return
  const source = paletteTokens() ?? readHostOpacityTokens()
  const el = ensureExemptStyle()
  const decls: string[] = []
  // Only declare a token we actually resolved a color for, and pin it opaque.
  const add = (token: string, value: string | undefined): void => {
    if (value === undefined || value === '') return
    // Literal with alpha 1 — no cycle possible, and no slider translucency.
    decls.push(`${token}:${toRgba(value, 1)}`)
  }
  add('--dsw-alias-bg-layer-1', source?.['--dsw-alias-bg-layer-1'])
  add('--dsw-alias-bg-layer-2', source?.['--dsw-alias-bg-layer-2'])
  add('--dsw-alias-bg-layer-3', source?.['--dsw-alias-bg-layer-3'])
  // One sampled color, declared under EVERY name this release paints a menu from:
  // a session-row menu on a `MenuSurface` host fades out of the layer token, and
  // pinning only the old name would leave it faded while everything else around it
  // went opaque. A name the host does not read is inert.
  const menuColor = source?.[MENU_FILL_TOKEN]
  for (const name of hostAdapter().menus.fillTokens) add(name, menuColor)
  if (decls.length === 0) {
    // Nothing resolved (pre-mount / host ships none): drop the pin rather than
    // emit an invalid one. The surfaces keep the re-scoped look.
    if (el.textContent !== '') el.textContent = ''
    return
  }
  const dialog = '[role="dialog"][aria-modal="true"]:not([aria-labelledby])'
  // The plugin-install dialog's npm-registry chooser (`PluginManagerPage.tsx:1231`,
  // `<fieldset data-install-registry>`). It is `createPortal`ed to `document.body` as
  // a `position:fixed; z-index:1100` panel, so no dialog-scoped rule reaches it, and it
  // fills from the layer tokens the CARD slider owns: `--dsw-alias-bg-layer-2` for the
  // panel and its toggle, `--dsw-alias-bg-layer-3` for the expanded toggle and the
  // custom-registry `<input>`. The host's own comment on that rule states why it is
  // opaque — "an opaque layer keeps the registry form controls readable over the dialog"
  // — and the panel faded with the card slider on the desktop build anyway. Pinning the
  // tokens for the fieldset AND its subtree is also what keeps the pin from being a
  // one-element fix: the custom property travels down, so without ` *` the options and
  // the typed address would still inherit the card alpha and fade anyway.
  const registry = '[data-install-registry]'
  const body = decls.join(';')
  const css =
    `${dialog},${dialog} *{${body}}` +
    `[role="menu"]:has([class*="_danger"]){${body}}` +
    `${registry},${registry} *{${body}}`
  if (el.textContent !== css) el.textContent = css
}

let exemptStyleEl: HTMLStyleElement | null = null
function ensureExemptStyle(): HTMLStyleElement {
  if (exemptStyleEl?.isConnected) return exemptStyleEl
  exemptStyleEl = document.createElement('style')
  exemptStyleEl.dataset.plugin = 'dsh-any-background-exempt'
  document.head.appendChild(exemptStyleEl)
  return exemptStyleEl
}

// ── dsh-better-display reading lanes ───────────────────────────────────────
// dsh-better-display (github.com/aa2246740/dsh-better-display) registers its own
// reading view over the conversation and pins a stack of summary lanes to the top
// of the scrollport: a toolbar lane, the live 「正在处理」 status lane, a closed-turn
// digest, and the live-fold summary cell. Every one of them paints its plate from
// the host's page-ground token — `Reader.module.css:13 / :17 / :558` all declare
// `background:var(--dsw-alias-bg-base)`, and `:555 / :564 / :565` extend that plate
// over the in-flow gaps with same-color `box-shadow` — and every one of them then
// sets `backdrop-filter:none` (`:538`, `:546`), because an OPAQUE plate is what
// hides the text that scrolls under a sticky band.
//
// That token is exactly what 「主界面」透明度 owns (`OPACITY_TOKEN_GROUPS`, part `bg`),
// and its default is 0: on a fresh install their lanes paint nothing, the
// conversation streams straight through the summary bar, and the bar is unreadable.
// Their own answer is the `data-reader-glass` "skin mode" opt-in (`store.ts:52`,
// off by default) that drops the plates and puts a frosted pill on each control
// instead — a different product decision, not a fix for this.
//
// The shim pins that band OUTSIDE the sliders: a plate literal at `READER_LANE_ALPHA`
// plus a `blur(READER_LANE_BLUR_PX)` frost. Only the ALPHA is pinned — the color still
// comes from the active theme, the same rule `applyExemptDefaults` follows, so a picked
// color / forced scheme / wallpaper verdict keep re-tinting the band while its density
// stops being a knob.
//
// BINDING — the plate is re-declared as the TOKEN, not as `background`. They never
// define or override `--dsw-alias-bg-base` anywhere (their `src/` and built sheet:
// reads only, no declarations), so a local re-declaration is uncontested and needs
// no `!important`: an element's own declaration beats `body`'s `!important` re-scope
// because that one reaches it by inheritance only — the same mechanism documented on
// `SIDEBAR_ONE_LAYER_RULE`.
//
// ONE BOX, NOT THREE — pinning every lane separately produced stacked bars that
// visibly disagreed (different widths, a darker strip at every seam where their
// same-color `box-shadow` gap plates overlapped another plate at 20% + 20%). The paint
// therefore moved to a single element — the sticky wrapper — which is grown over the
// whole band stack with padding cancelled by equal negative margins so no content
// moves; see `READER_LANE_RULE` for the geometry and `READER_SILENT` for what stops
// painting. The one thing this buys at a price: while a turn's lanes are NOT stuck
// (you are looking at the very top of that turn), the grown box paints its 40px of
// frost over the strip above it — the same trick their own `box-shadow` gap plates play
// at 14px, just taller. CSS cannot see "stuck", so this is the trade, not an oversight.
//
// SCOPE — `[data-dsh-better-display]` is that plugin's own root marker
// (`Reader.tsx:890`), the same selector it relies on internally (`StickyLane.tsx:9`),
// and the three lane attributes are its own: `data-reader-lane` (`StickyLane.tsx:33`,
// kinds `toolbar` | `status`), `data-reader-closed-summary`
// (`ClosedProcessSummary.tsx:16`), `data-flow-summary` (`ChoreographedFlow.tsx:95`).
// None of these four names exists anywhere in the host's 0.2.1-rc.3 install tree
// (grep across all 97 `lib/client.js` bundles: 0 hits — the same grep finds
// `data-chat-flow`), so this cannot reach a host element. A better-display build
// that renames them simply stops matching, which leaves its lanes as it paints them.
//
// WHY GLASS MODE IS EXCLUDED — under `[data-reader-glass]` they set
// `background:transparent` + `backdrop-filter:none` on these very lanes
// (`:585-598`) and move the wash onto the buttons (`:602-609`). Pinning there would
// replace their choice with ours; the `:not()` also keeps this selector out of any
// cascade race with those glass rules.
//
// WHY THE FROST MAY SIT ON THEIR ELEMENT (the §2-F three-sins test) — a
// backdrop-filter is only a hazard when something gets trapped, and nothing does:
// the disclosed process body renders as a SIBLING of the lanes (`Reader.tsx:663` vs
// `:648`), the diff panel a summary row opens is an in-flow `position:static` row
// inside it (`DiffPanel.tsx:109-110`, `Reader.module.css:155`), the only positioned
// descendants are self-contained pairs (`.think`/`.thinkText`, `.numberRoll*`), and
// their image viewer is a `<dialog>` in the browser top layer. No new stacking
// context reaches the paint order either: `.turnStickyLanes` already owns one
// (`:27`, z-index 6) and `:556` pins its children `position:static; z-index:auto`, so
// the lanes gain a filter without gaining a level — §2-T's ladder is untouched.
const READER_ROOT = '[data-dsh-better-display]:not([data-reader-glass])'

/** Plate density the lanes are pinned at: 「主界面」 at 20% — a band that reads as a
 *  band while still letting the wallpaper through. */
const READER_LANE_ALPHA = 0.2

/** Frost the lanes are pinned at (px) — the middle of the 0–60 blur range, i.e. the
 *  plugin's own default, so the band looks like every other frosted surface here. */
const READER_LANE_BLUR_PX = 30

/** The sticky wrapper holding the status lane and the closed-turn digest. It paints
 *  NOTHING today (`Reader.module.css:27`), and `:556` forces both children
 *  `position:static; z-index:auto` — so it is the one element whose box can simply BE
 *  the band: one plate, one frost region, one pair of rounded corners. */
const READER_WRAP = `${READER_ROOT} [class*="_turnStickyLanes"]`

/** The band's two height levers, both published by that plugin itself
 *  (`StickyLane.tsx:11-13` writes the measured toolbar and status-lane heights onto
 *  ancestors the wrapper inherits from), so the merged box tracks real text wrapping
 *  instead of a hardcoded 40px. */
const READER_TOOLBAR_H = 'var(--reader-toolbar-height,40px)'
const READER_BAND_TOP = `max(${READER_TOOLBAR_H},var(--reader-status-height,40px))`

/** The two surfaces that paint a band, spelled once so the static and dynamic halves
 *  cannot drift: the merged wrapper, and the live-fold summary cell — which cannot be
 *  merged into it, because it sticks at `z-index:5` BELOW the wrapper's 6, so growing
 *  the wrapper over that row would paint the wrapper's plate straight across the row's
 *  own text (tried, measured, reverted). */
export const READER_LANE_SEL = `${READER_WRAP},${READER_ROOT} [data-flow-summary]`

/** Everything that used to paint its own plate and must stop now that the wrapper
 *  does. Their plates are what made the stack read as separate bars: the status lane is
 *  `width:calc(100% - var(--reader-control-width))` (`:546`) so it notched short of the
 *  toolbar's width, and each `box-shadow` gap plate (`:555/:564/:565`) lands on a
 *  neighbour and doubles the alpha there — a 14–16px darker strip per seam.
 *
 *  The toolbar lane hands its plate over only while a band exists to swallow it: a turn
 *  with no process steps renders no wrapper at all, and there the strip would be left
 *  with nothing behind its own button. It can be swallowed at all because its
 *  `z-index:7` (`:538`) sits ABOVE the wrapper's 6 — its own text keeps painting over
 *  the merged plate, which is exactly the arrangement the live-fold cell cannot use. */
const READER_SILENT =
  `${READER_WRAP}>*,` +
  `${READER_ROOT}:has([class*="_turnStickyLanes"]) [data-reader-lane="toolbar"]`

/** Static half — the merge, the frost, the shape. Every value is a literal or one of
 *  that plugin's own published variables; nothing here reads a slider, which is what
 *  makes the band immune to 调控.
 *
 *  It is TEXT in the dynamic sheet rather than a rule in `buildStaticStyles()`, and
 *  that is the point: the static sheet is this plugin's contract with the HOST, and a
 *  third-party accommodation must be able to vanish completely — paint, frost and the
 *  merged box's geometry alike — when 「保护第三方表面」 is switched off. One sheet, one
 *  owner, one thing to remove.
 *
 *  HOW THE BOX GROWS WITHOUT MOVING CONTENT: `padding-top` reaches up over the toolbar
 *  strip and an equal negative `margin-top` cancels it, so the wrapper's margin box
 *  keeps its height and every following sibling stays exactly where it was; `top` is
 *  pulled up by the same amount so the STUCK position puts the wrapper's content back at
 *  `max(toolbar, status)`. The lanes' text does not move a pixel — only the paint does.
 *  Measured in the §4.2 mock with the pin on and off: the column's height and the first
 *  paragraph's offset are identical, and the status row's `top` is unchanged.
 *
 *  The rounded bottom goes on whichever band is actually LAST: the live-fold cell sticks
 *  40px below the wrapper (`:558`), so while the turn has one the wrapper is not the
 *  bottom edge and rounding it would open a notch against the cell under it. A build
 *  without `:has()` keeps both bands square; nothing else changes. */
export const READER_LANE_RULE =
  `${READER_LANE_SEL}{background:var(--dsw-alias-bg-base);box-shadow:none;` +
  `${elementFrostDecl(`blur(${READER_LANE_BLUR_PX}px)`)}}` +
  `${READER_WRAP}{border-radius:0 0 14px 14px;` +
  `padding-top:${READER_TOOLBAR_H};margin-top:calc(0px - ${READER_TOOLBAR_H});` +
  `top:calc(${READER_BAND_TOP} - ${READER_TOOLBAR_H})}` +
  `${READER_ROOT} [data-flow-summary]{border-radius:0 0 14px 14px}` +
  `${READER_ROOT} [data-reader-turn]:has([data-flow-summary]) ` +
  `[class*="_turnStickyLanes"]{border-radius:0}` +
  `${READER_SILENT}{background:transparent;box-shadow:none}`

let readerStyleEl: HTMLStyleElement | null = null

/** Emit the whole pin — geometry, frost and the plate literal — into one sheet, or
 *  remove that sheet entirely. Two things switch it off: 「保护第三方表面」 being turned
 *  off, and no color resolving yet (the palette and the host's own tokens are both
 *  empty pre-boot), because a `var()` naming an unwritten property is the §2-E
 *  guaranteed-invalid trap and its symptom here is the very bug being pinned. */
export function applyReaderLanes(surfaces?: Record<string, string> | null): void {
  if (typeof document === 'undefined') return
  const base = rProtectThirdParty()
    ? (surfaces ?? paletteTokens() ?? readHostOpacityTokens())?.['--dsw-alias-bg-base']
    : undefined
  if (base === undefined || base === '') {
    if (readerStyleEl !== null) { readerStyleEl.remove(); readerStyleEl = null }
    return
  }
  if (readerStyleEl === null) {
    readerStyleEl = document.createElement('style')
    readerStyleEl.dataset.plugin = 'dsh-any-background-reader'
    document.head.appendChild(readerStyleEl)
  }
  // The plate is re-declared as the TOKEN, never as `background`: that plugin's own
  // `background:var(--dsw-alias-bg-base)` then carries it, and an element's own
  // declaration beats `body`'s inherited `!important` re-scope without needing
  // `!important` (the mechanism documented on `SIDEBAR_ONE_LAYER_RULE`).
  const css = `${READER_LANE_RULE}${READER_LANE_SEL}{--dsw-alias-bg-base:${toRgba(base, READER_LANE_ALPHA)}}`
  if (readerStyleEl.textContent !== css) readerStyleEl.textContent = css
}

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
  // ── Frosting (backdrop-filter) ─────────────────────────────────────────────
  // Kept outside the color-mix guard so it never depends on color-mix support.
  // TerminalBlock ([data-terminal]), ReadBlock ([data-read]) and
  // ContextInjectionRow body ([data-context-injection-body]) all share the
  // --dsw-alias-markdown-code-block surface as code blocks, so they receive
  // both blur and alpha modulation below.
  //
  // ChangedFiles ([data-changed-files]): from 0.1.7 the card ROOT carries its own
  // fill (--dsw-alias-bg-layer-1), so the frost belongs on the root — one frost
  // per card. The header button and its tile are faded by alpha alone (see the
  // --changes-fill arms below); frosting them too would blur the already frosted
  // root behind them.
  //
  // SearchBlock ([data-search]) and WebBlock ([data-web]) both paint from
  // --dsw-alias-markdown-code-block (their .block root), so they join the
  // same produced surface group.
  //
  // The expanded IN/OUT card (.ioCard, ToolRow + bash-sample) also paints from
  // --dsw-alias-markdown-code-block. It carries no data-* attribute, so it binds
  // by its CSS-Module class shape: the harness build hashes classes as
  // `<hash>_<localName>` (e.g. `o3BgMG_ioCard`), so `[class*="_ioCard"]` is
  // stable across builds while a bare `.ioCard` would never match.
  //
  // The three surfaces 0.1.7 added to the produced family all filled from
  // --dsw-alias-markdown-code-block when they appeared: DiffBlock ([data-diff]), the
  // tool-result detail block (ToolDetails .root, marked [data-inspect] when it offers
  // the inspector) and the turn-event row ([data-turn-trigger]). They frost off the
  // same attribute either way; the turn row's own fill moved at `0.2.0-rc.2`, which
  // is the alpha arm's business, not this list's.
  //
  // Inline `code` chips (:not(pre)>code) ride the frost as well: they are the one
  // produced surface a reader sees mid-sentence, and leaving them opaque while the
  // block behind them faded made them look pinned to the wallpaper instead of part
  // of it. They are display:inline-flex, so the promotion risk is real — the
  // compact markdown variant ([data-markdown-variant="compact"], used by the
  // reasoning rows) resets display to `inline`, where a frost would fragment
  // across line boxes, so that context opts back out.
  //
  // The hover preview window ([style*="--dsh-hover-preview-fade"]) is the artifact
  // a produced surface opens: `ui-primitives/HoverCard` portals its card to
  // document.body, so no in-tree re-scope can reach it and it painted its own
  // literal `--dsw-hovercard-bg: #2C2C2E` (identical in both themes, deliberately a
  // component variable and not a theme token — see HoverCard.module.css) untouched
  // by any slider. That inline custom property is the only stable marker it has:
  // the class is hashed per build, and on 0.1.5-rc.2 / 0.1.6-alpha.2 the card
  // element carries no attribute at all, so those hosts simply never match it here
  // rather than being caught by a `[class$="_card"]` that would also hit the
  // composer and the changed-files card.
  '[data-code-block-content] pre,[data-code-block-banner],[data-composer-chip],' +
  '[data-changed-files],' +
  '[data-terminal],[data-read],[data-diff],[data-context-injection-body],' +
  '[data-search],[data-web],[class*="_ioCard"],' +
  '[data-inspect],[data-turn-trigger],' +
  '[style*="--dsh-hover-preview-fade"],' +
  ':not(pre)>code{' +
  '-webkit-backdrop-filter:var(--dsh-any-blur-prod,none);' +
  'backdrop-filter:var(--dsh-any-blur-prod,none)}' +
  '[data-markdown-variant="compact"] :not(pre)>code{' +
  '-webkit-backdrop-filter:none;backdrop-filter:none}' +
  // ── dsh-better-sidebar workbench [data-dsh-bottom-panel] ──────────────────
  // The third-party bottom panel is a produced surface by nature — it opens the
  // artifact a conversation row points at — so since 0.3.2 the produced pair owns
  // it instead of the panel row, which is now just the host's own right Sidebar.
  // Unlike a code block it does not paint one token: every surface inside it
  // (pane chrome, tab bar, cards) reads a layer token, so its alpha cannot ride
  // `--dsh-any-prod-pct` and re-emit in place; the four tokens are re-scoped from
  // root variables `applyProduced` writes at the slider's alpha, exactly the way
  // PANEL_TOKEN_RULE does for the native panel. Kept in its own block, not merged
  // into the selector list above, because an engine that drops one of these
  // declarations must not take the code-block frost down with it.
  `${BETTER_SIDEBAR_PANEL}{` +
  '-webkit-backdrop-filter:var(--dsh-any-blur-prod,none);' +
  'backdrop-filter:var(--dsh-any-blur-prod,none)}' +
  `${BETTER_SIDEBAR_PANEL}{` +
  '--dsw-alias-bg-base:var(--dsh-any-prod-panel-bg-base);' +
  '--dsw-alias-bg-layer-1:var(--dsh-any-prod-panel-layer-1);' +
  '--dsw-alias-bg-layer-2:var(--dsh-any-prod-panel-layer-2);' +
  '--dsw-alias-bg-layer-3:var(--dsh-any-prod-panel-layer-3)}' +
  // ── Alpha (color-mix) ──────────────────────────────────────────────────────
  // Guarded: without color-mix support the host look stays untouched instead
  // of resolving the surface color to an invalid value.
  '@supports (background:color-mix(in srgb,red 50%,transparent)){' +
  // ── Existing code-block surfaces ───────────────────────────────────────────
  '.md-code-block{background:transparent!important}' +
  '.md-code-block>div{background-color:transparent!important}' +
  // Every base falls back to the older token names (0.1.2-alpha.4 has no
  // `--dsl-code-block-*` yet), so the color-mix can never resolve to an
  // invalid value and blank a surface out.
  '.md-code-block [data-code-block-content] pre{' +
  'background-color:color-mix(in srgb,var(--dsl-code-block-background,var(--dsw-alias-markdown-code-block,transparent)) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  '.md-code-block [data-code-block-banner]{' +
  'background-color:color-mix(in srgb,var(--dsl-code-block-banner-background-color,var(--dsw-alias-markdown-code-block-banner,transparent)) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  // Banners outside the markdown block: 0.1.7 moved ReadBlock / DiffBlock /
  // CodeBlock onto one shared CodeCard, whose `.header` fills from
  // `--dsl-code-block-banner-background-color` when a markdown block is in scope
  // and otherwise from `--dsl-code-block-background` → `--dsw-alias-markdown-code-block`
  // (CodeCard.module.css:16). Re-emitting that same chain is what keeps the banner
  // themed: the older `--dsw-alias-markdown-code-block-banner` token below is a
  // near-white value 0.1.7 no longer paints here, so forcing it made every read /
  // diff header a pale slab that ignored the produced alpha.
  '[data-code-block-banner]{' +
  'background-color:color-mix(in srgb,var(--dsl-code-block-banner-background-color,var(--dsl-code-block-background,var(--dsw-alias-markdown-code-block,transparent))) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  '[data-code-block-content]{' +
  '--shiki-background:color-mix(in srgb,var(--dsw-alias-markdown-code-block,var(--dsl-code-block-background,transparent)) var(--dsh-any-prod-pct,100%),transparent)}' +
  // Inline markdown `code` chips: the host's own selector shape, so the chip
  // keeps its token color and only loses alpha (plus the shared frost).
  ':not(pre)>code{' +
  'background-color:color-mix(in srgb,var(--dsw-alias-markdown-inline-code,transparent) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  '[data-composer-chip]>*{' +
  'background-color:color-mix(in srgb,var(--dsw-alias-interactive-bg-hover,transparent) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  // ── TerminalBlock [data-terminal] ──────────────────────────────────────────
  // Root: background: var(--dsw-alias-markdown-code-block) (TerminalBlock.module.css).
  // The copy button inside re-asserts that same token as an opaque fill so it
  // stays readable over scrolling output. Clear it so the card fades uniformly.
  '[data-terminal]{' +
  'background-color:color-mix(in srgb,var(--dsw-alias-markdown-code-block,transparent) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  '[data-terminal] button{background-color:transparent!important}' +
  // ── ReadBlock [data-read] / DiffBlock [data-diff] ────────────────────────
  // Both are CodeCards from 0.1.7: the root fills from
  // --dsw-alias-markdown-code-block and the banner carries
  // [data-code-block-banner], handled by the shared banner arm above. The guarded
  // rule below only serves 0.1.6, where ReadBlock's first child WAS a banner
  // painted from --dsw-alias-markdown-code-block-banner and carried no marker.
  '[data-read],[data-diff]{' +
  'background-color:color-mix(in srgb,var(--dsw-alias-markdown-code-block,transparent) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  '[data-read]>div:first-child:not([data-code-block-banner]),' +
  '[data-diff]>div:first-child:not([data-code-block-banner]){' +
  'background-color:color-mix(in srgb,var(--dsw-alias-markdown-code-block-banner,transparent) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  // ── ContextInjectionRow body [data-context-injection-body] ────────────────
  // The .body element uses --dsw-alias-markdown-code-block (same as code blocks).
  '[data-context-injection-body]{' +
  'background-color:color-mix(in srgb,var(--dsw-alias-markdown-code-block,transparent) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  // ── ToolDetails [data-inspect] / turn-event row [data-turn-trigger] ───────
  // The two produced surfaces 0.1.7 added outside the code-block family. They read
  // the same token through `0.1.7` … `0.2.0-rc.1` (ToolDetails.module.css,
  // TurnTriggerNodeView.module.css), and `0.2.0-rc.2` gave the turn row its own
  // pair — but wrote it the way a host hands a surface to its theme:
  //   background: var(--dsw-alias-turn-trigger-bg, var(--dsw-alias-markdown-code-block))
  //   :hover      var(--dsw-alias-turn-trigger-bg-hover, var(--dsw-alias-interactive-bg-hover))
  // with both aliases declared on `body`, so in DARK mode the row is
  // `--dsw-alias-interactive-bg-hover` (and its hover is `-bg-active`) while the
  // code block stays where it was. Reading the same chain is what keeps this arm
  // release-neutral — a `var()` fallback is the host's own "if that property is not
  // set" test, so an older host takes the code-block color and a newer one takes its
  // own, with no version check here. Sharing one rule with `[data-inspect]` instead
  // would be a visible bug: the `!important` mix would keep painting the row with
  // the pre-rc.2 color and the row would stop tracking its hover state.
  '[data-inspect]{' +
  'background-color:color-mix(in srgb,var(--dsw-alias-markdown-code-block,transparent) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  '[data-turn-trigger]{' +
  'background-color:color-mix(in srgb,var(--dsw-alias-turn-trigger-bg,var(--dsw-alias-markdown-code-block,transparent)) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  '[data-turn-trigger]:hover{' +
  'background-color:color-mix(in srgb,var(--dsw-alias-turn-trigger-bg-hover,var(--dsw-alias-interactive-bg-hover,transparent)) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  // ── ChangedFiles card [data-changed-files] ────────────────────────────────
  // 0.1.7 gave the card a root fill (--dsw-alias-bg-layer-1) plus a header and a
  // file-count tile that both paint from --changes-fill (neutral-50 light /
  // neutral-850 dark, redefined under body[data-ds-dark-theme]). All three follow
  // the produced slider now: with the root opaque and the file rows transparent,
  // the card read as a hard white plate no matter where the slider sat. The tile
  // is alpha-only because the root behind it already frosts.
  //
  // The root cannot fade with color-mix the way its siblings do: --dsw-alias-bg-layer-1
  // is the token the interface "card" (option-panel) slider re-emits globally on
  // `body`, so mixing on top of it multiplied two alphas and the artifact card
  // answered to both sliders. It reads the produced slider's own re-emit of the
  // RAW token instead — one surface, one slider.
  '[data-changed-files]{' +
  'background-color:var(--dsh-any-prod-layer-1,var(--dsw-alias-bg-layer-1,transparent))!important}' +
  '[data-changed-files]>button:first-child{' +
  'background-color:color-mix(in srgb,var(--changes-fill,transparent) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  '[data-changed-files]>button:first-child:hover{' +
  'background-color:color-mix(in srgb,var(--changes-hover,var(--changes-fill,transparent)) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  '[data-changed-files]>button:first-child>span:first-child{' +
  'background-color:color-mix(in srgb,var(--changes-fill,transparent) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  // ── Hover preview window [style*="--dsh-hover-preview-fade"] ───────────────
  // See the frost list above for why this is the marker. Two surfaces live under
  // that one attribute, and they do NOT paint from the same place:
  //   · the plain card — `.card` in HoverCard.module.css — keeps its component
  //     literal `--dsw-hovercard-bg: #2C2C2E` (dark in BOTH themes by the host's
  //     own choice), so mixing on that token fades the color the host uses.
  //   · the `preview` variant (`.preview`, what ChangedFiles opens) repaints from
  //     --dsw-alias-bg-layer-1, i.e. the THEME surface, and never redefines the
  //     literal. Mixing on --dsw-hovercard-bg there would replace a light themed
  //     card with the dark one — measured: the preview came out
  //     rgb(44,44,46) over a light theme. It reads the produced slider's raw
  //     layer-1 instead, the same single-slider route the changed-files card uses.
  // The fallback keeps the host's own color if that variable has not been written
  // yet; it is the card-slider remapped token there, which is the pre-existing host
  // look, not a second alpha.
  '[style*="--dsh-hover-preview-fade"]{' +
  'background-color:color-mix(in srgb,var(--dsw-hovercard-bg,#2c2c2e) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  '[style*="--dsh-hover-preview-fade"][class*="_preview"]{' +
  'background-color:var(--dsh-any-prod-layer-1,var(--dsw-alias-bg-layer-1,transparent))!important}' +
  // ── SearchBlock [data-search] ─────────────────────────────────────────────
  // Root (.block): background: var(--dsw-alias-markdown-code-block).
  // Header (.header): background: var(--dsw-alias-markdown-code-block-banner).
  // Only the root body fades — the header banner keeps its opaque host color
  // so the white/grey title bar stays visually stable regardless of the slider.
  '[data-search]{' +
  'background-color:color-mix(in srgb,var(--dsw-alias-markdown-code-block,transparent) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  // ── WebBlock [data-web] ───────────────────────────────────────────────────
  // Root (.block): background: var(--dsw-alias-markdown-code-block).
  // No banner sub-surface; the single fill fades uniformly.
  '[data-web]{' +
  'background-color:color-mix(in srgb,var(--dsw-alias-markdown-code-block,transparent) var(--dsh-any-prod-pct,100%),transparent)!important}' +
  // ── Expanded IN/OUT card [class*="_ioCard"] ───────────────────────────────
  // ToolRow's and bash-sample's .ioCard: background: var(--dsw-alias-markdown-
  // code-block), the same surface as a code block. No banner sub-surface.
  '[class*="_ioCard"]{' +
  'background-color:color-mix(in srgb,var(--dsw-alias-markdown-code-block,transparent) var(--dsh-any-prod-pct,100%),transparent)!important}' +
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
//   card       → the popover/menu surface set (popoverBlurRule's selectors)
//   input      → composer card + cordis panel (inputBlurRule's markers), the
//                seat takeover cards beside the capsule, and the native editors
//                inside them (form controls do not inherit text properties from
//                their container)
//   chat       → the conversation message column ([data-chat-flow])
//   trajectory → the trajectory view root
//   produced   → code blocks / banners / inline code chips / composer chips.
//                Being a DIRECT rule it also shields those surfaces from the
//                inherited chat stroke — with produced width 0 the reset is
//                exactly the exemption shiki multi-color text needs.
//   panel      → the host's own right Sidebar column (the dsh-better-sidebar
//                workbench sits in the produced group above, since 0.3.2)
//
// Global exemptions: SVG glyphs (host icons are paths, but paint-order is
// inherited and would subtly alter stroked-and-filled icon rendering) and
// ::placeholder text (italic hint text must stay unstroked).

export const STROKE_RULE = [
  // settings
  `${SETTINGS_PANEL_SEL}{-webkit-text-stroke:var(--dsh-any-stroke-settings-w,0px) var(--dsh-any-stroke-settings-c,transparent);paint-order:stroke fill}`,
  // card / popovers — selector set mirrors popoverBlurRule, `[data-menu-material]`
  // included so the `role="group"` model pane is stroked like the menus beside it
  `[role="menu"]:not([data-dockkit-tab-menu]),[data-menu-material]:not([data-dockkit-tab-menu]),[role="listbox"],body>[role="tree"],body>[role="dialog"]:not([aria-modal="true"])` +
  `{-webkit-text-stroke:var(--dsh-any-stroke-card-w,0px) var(--dsh-any-stroke-card-c,transparent);paint-order:stroke fill}`,
  // input / controls — native editors need their own declaration
  `[data-composer-card],[data-cordis-panel],` +
  `[data-composer-card] textarea,[data-composer-card] input,[data-composer-card] [contenteditable],` +
  `[data-cordis-panel] input,[data-cordis-panel] textarea,` +
  // the seat takeover cards belong to this slider too (see inputBlurRule)
  `${COMPOSER_TAKEOVER_CARD},${COMPOSER_TAKEOVER_EDITOR}` +
  `{-webkit-text-stroke:var(--dsh-any-stroke-input-w,0px) var(--dsh-any-stroke-input-c,transparent);paint-order:stroke fill}`,
  // session header bar (its title, actions and view tabs inherit from the row)
  `.${HEADER_BAR_CLASS}{-webkit-text-stroke:var(--dsh-any-stroke-headerBar-w,0px) var(--dsh-any-stroke-headerBar-c,transparent);paint-order:stroke fill}`,
  // chat message column
  `[data-chat-flow]{-webkit-text-stroke:var(--dsh-any-stroke-chat-w,0px) var(--dsh-any-stroke-chat-c,transparent);paint-order:stroke fill}`,
  // trajectory view
  `[data-conversation-composer-overlay]{-webkit-text-stroke:var(--dsh-any-stroke-trajectory-w,0px) var(--dsh-any-stroke-trajectory-c,transparent);paint-order:stroke fill}`,
  // produced / artifact text — direct rule doubles as the chat-inheritance shield;
  // also covers changed-files card, tool-call terminal, file-read block and
  // context-injection notice (all "produced/highlight" surfaces).
  // SearchBlock [data-search] and WebBlock [data-web] join the same group:
  // they share the --dsw-alias-markdown-code-block surface and appear inline
  // in the conversation column, so they inherit the chat stroke without this
  // direct exemption, just like the other produced surfaces.
  // The expanded IN/OUT card joins by CSS-Module class shape ([class*="_ioCard"],
  // see PRODUCED_RULE) — same surface, same exemption.
  // [data-diff] / [data-inspect] / [data-turn-trigger] join with the same PRODUCED_RULE
  // group: without a direct rule here their text would keep inheriting the chat
  // stroke while every other produced surface obeyed its own slider.
  `[data-code-block-content] pre,[data-code-block-content],[data-code-block-banner],[data-composer-chip],:not(pre)>code,` +
  `[data-changed-files],[data-terminal],[data-read],[data-diff],[data-inspect],[data-turn-trigger],[data-context-injection-body],[data-search],[data-web],[class*="_ioCard"],[style*="--dsh-hover-preview-fade"]` +
  // The workbench joined this group with 0.3.2 (PRODUCED_RULE), so its text does
  // too — otherwise the produced stroke would cover every artifact except the one
  // that opens them.
  `,${BETTER_SIDEBAR_PANEL}` +
  `{-webkit-text-stroke:var(--dsh-any-stroke-produced-w,0px) var(--dsh-any-stroke-produced-c,transparent);paint-order:stroke fill}`,
  // the host's own right Sidebar column
  `${PANEL_SURFACES}{-webkit-text-stroke:var(--dsh-any-stroke-panel-w,0px) var(--dsh-any-stroke-panel-c,transparent);paint-order:stroke fill}`,
  // header popovers — the same surfaces as headerPopoverRule, unpadded: a
  // stroke never competed with the card group's backdrop-filter, so raising
  // specificity here would change which group wins and is not ours to decide.
  `${HEADER_SURFACES.join(',')}` +
  `{-webkit-text-stroke:var(--dsh-any-stroke-header-w,0px) var(--dsh-any-stroke-header-c,transparent);paint-order:stroke fill}`,
  // exemptions
  // Turn status / progress chrome — never owned by the "conversation text
  // frame" (chat) stroke group, because `-webkit-text-stroke` is INHERITED: a rule
  // on [data-chat-flow] reaches straight into these rows, and on every host
  // generation that damage is not cosmetic.
  //
  // One selector per shape actually observed, so all generations are covered
  // without a version check — an attribute a release does not emit simply matches
  // nothing:
  //   · [role="status"] — 0.1.5/0.1.6 render the live line as a bare
  //     `.turnStatus` div under [data-chat-flow] (ChatView.module.css: brand-blue
  //     gradient + background-clip:text + -webkit-text-fill-color:transparent).
  //     This is the reported 0.1.6 regression. It also covers the hidden live
  //     announcement 0.1.7 emits for a11y, and the retry/error status rows.
  //   · [data-turn-process] — the turn-process disclosure row (0.1.6 and 0.1.7
  //     TurnProcessNodeView). Its label is elapsed-time / activity chrome
  //     ("深度求索中，用时40秒", "已搜索代码并协调子任务"), not conversation prose.
  //   · [style*="--dsh-text-shimmer-spread"] / [data-text-shimmer] — the TextShimmer
  //     primitive as 0.1.7 shipped it: it published that custom property INLINE on
  //     the clipped element, so the substring match finds every instance whatever
  //     the hashed class name is, and the semantic attribute marks exactly the
  //     moments the gradient exists. Here the stroke is destructive: the glyphs are
  //     painted by their own clipped gradient with a transparent fill, so a stroke
  //     repaints them as one flat stroke-coloured blob and the shimmer disappears.
  //   · [data-shimmer] — the SAME primitive, rewritten at 0.2.0-rc.1 (the old
  //     attribute and the `--dsh-text-shimmer-spread` property are both gone from
  //     that tag). Its paint moved off the text onto an absolutely-positioned
  //     overlay (`.decoration` / `.sweep` / `.highlight`), so the failure mode
  //     changed rather than disappeared: the real glyphs keep their own color, but
  //     the inherited stroke lands on BOTH of the two stacked copies of the string,
  //     outlining the sweeping one too. One rule on the root is enough here — the
  //     attribute sits on the wrapper and the stroke reset inherits down into the
  //     overlay subtree.
  //
  // `paint-order:normal` rides along for the same reason it does on `svg` below:
  // it is inherited too, and a stray `stroke fill` would reorder the fill.
  `[data-chat-flow] [role="status"],` +
  `[data-chat-flow] [data-turn-process],` +
  `[data-chat-flow] [data-text-shimmer],` +
  `[data-chat-flow] [data-shimmer],` +
  `[data-chat-flow] [style*="--dsh-text-shimmer-spread"]` +
  `{-webkit-text-stroke-width:0!important;paint-order:normal!important}`,
  `svg{-webkit-text-stroke-width:0!important;paint-order:normal!important}`,
  `::placeholder{-webkit-text-stroke-width:0!important}`,
].join('')

/** Groups whose stroke lands on the structurally-discovered columns (inline),
 *  versus every group served by the static STROKE_RULE selectors. */
const STROKE_INLINE_GROUPS = ['bg', 'sidebar'] as const
type StrokeGroup = keyof PartBlurs
const STROKE_VAR_GROUPS: StrokeGroup[] = ['card', 'settings', 'chat', 'trajectory', 'input', 'panel', 'produced', 'header', 'headerBar']

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
/** Write (or clear) one column's inline text stroke. The stroke rides inline
 *  styles and is fully removed at width 0 so nothing lingers after the slider
 *  resets. */
function applyInlineStroke(el: HTMLElement, s: StrokeConfig): void {
  if (s.width > 0) {
    el.style.setProperty('-webkit-text-stroke', `${s.width}px ${strokeColor(s)}`)
    el.style.setProperty('paint-order', 'stroke fill')
  } else {
    el.style.removeProperty('-webkit-text-stroke')
    el.style.removeProperty('paint-order')
  }
}

export function applyStrokes(): void {
  const strokes = rStrokes()
  const root = document.documentElement
  for (const g of STROKE_VAR_GROUPS) {
    const s = strokes[g]
    root.style.setProperty(`--dsh-any-stroke-${g}-w`, `${s.width}px`)
    root.style.setProperty(`--dsh-any-stroke-${g}-c`, strokeColor(s))
  }
  // Columns are dynamically discovered; the var groups above ride CSS
  // variables, the two column groups ride inline styles.
  discoverParts()
  for (const g of STROKE_INLINE_GROUPS) {
    const el = g === 'bg' ? centerEl : sidebarEl
    if (el !== null) applyInlineStroke(el, strokes[g])
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
  applyInlineStroke(el, s)
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
    //
    // `!important` is load-bearing since `0.2.1-alpha.2`, not decoration: that tag
    // moved the user font list into `--dsh-font-family-text` and made the host itself
    // compose the token — `base.css` now declares
    // `body{--dsw-font-family:var(--dsh-font-family-text,…),…}`. Same element selector
    // as the rule below, so without a flag the winner is whoever's stylesheet lands
    // last, and a host that re-injects its base sheet (a theme change, a presenter
    // rebuild) silently drops the picked font. The plugin's token sheet already asserts
    // its `body` declarations this way for exactly this reason.
    `body{--dsw-font-family:'${FONT_FAMILY}',${stack}!important}` +
    `input,textarea,select,button{font-family:var(--dsw-font-family)}`
}

/** Teardown only: drop the @font-face + token override. */
function removeFontFace(): void {
  fontStyleEl?.remove()
  fontStyleEl = null
}

/** The four layer slots a panel-wide token re-scope owns — both the variable
 *  names to write and the shape the token source comes back in. */
interface LayerVarNames { base: string; layer1: string; layer2: string; layer3: string }

/** The host's own defaults, read from the live `:root` so a custom host skin or
 *  theme override wins. */
function readHostLayerTokens(): LayerVarNames | null {
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

/** The host's own right Sidebar (`PANEL_TOKEN_RULE`) reads this set. */
const PANEL_LAYER_VARS: LayerVarNames = {
  base: '--dsh-any-panel-bg-base',
  layer1: '--dsh-any-panel-layer-1',
  layer2: '--dsh-any-panel-layer-2',
  layer3: '--dsh-any-panel-layer-3',
}

/** The dsh-better-sidebar workbench (see `PRODUCED_RULE`) reads this set, so the
 *  two panels can follow two different sliders. */
const PROD_PANEL_LAYER_VARS: LayerVarNames = {
  base: '--dsh-any-prod-panel-bg-base',
  layer1: '--dsh-any-prod-panel-layer-1',
  layer2: '--dsh-any-prod-panel-layer-2',
  layer3: '--dsh-any-prod-panel-layer-3',
}
/** The changed-files card root needs one token only — the RAW `--dsw-alias-bg-layer-1`
 *  at the produced alpha. It cannot mix on the token itself the way the other
 *  produced surfaces do, because that name is what the interface card slider
 *  re-emits globally on `body` (OPACITY_TOKEN_GROUPS), so mixing on it would bind
 *  one artifact card to two sliders. */
const PROD_LAYER_VARS: Partial<LayerVarNames> = { layer1: '--dsh-any-prod-layer-1' }

const LAYER_KEYS = ['base', 'layer1', 'layer2', 'layer3'] as const

/** Re-emit the four layer colors at `op` alpha into `names`. The source is the
 *  plugin palette when a picked color / forced scheme owns the theme, otherwise
 *  the host's own resolved tokens — a slider only ever supplies the alpha, so the
 *  colors keep following whichever theme or host skin is active.
 *
 *  Every pass writes SOMETHING: the re-scope rules live in the always-emitted
 *  stylesheet, and a `var()` naming an unwritten variable makes the surface
 *  guaranteed-invalid, which drops its background entirely rather than leaving it
 *  on the host default. */
function writeLayerVars(names: Partial<LayerVarNames>, op: number): void {
  const palette = paletteTokens()
  const src: Partial<LayerVarNames> = palette !== null
    ? {
        base: palette['--dsw-alias-bg-base'],
        layer1: palette['--dsw-alias-bg-layer-1'],
        layer2: palette['--dsw-alias-bg-layer-2'],
        layer3: palette['--dsw-alias-bg-layer-3'],
      }
    : readHostLayerTokens() ?? {}
  const root = document.documentElement
  if (LAYER_KEYS.every(k => !src[k])) {
    // Pre-mount, or neither source has shipped the tokens yet: nothing to retint,
    // so park the surfaces on transparent until the next apply.
    for (const k of LAYER_KEYS) if (names[k]) root.style.setProperty(names[k]!, 'transparent')
    return
  }
  for (const k of LAYER_KEYS) {
    const name = names[k]
    const v = src[k]
    if (name && v) root.style.setProperty(name, toRgba(v, op))
  }
}

export function applyPanelOverrides(op: number): void {
  writeLayerVars(PANEL_LAYER_VARS, op)
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
  `${COMPOSER_TAKEOVER_EDITOR}::placeholder,` +
  '.dab-input::placeholder,' +
  '.dab-input textarea::placeholder,' +
  '.dab-input input::placeholder' +
  '{color:var(--dsh-any-placeholder,var(--dsw-alias-label-caption,#8a8f98))!important;font-style:italic;opacity:.85}'

type LayerPrefix = '--dsh-any-bg-settings' | '--dsh-any-traj'

/** Re-scope one surface group's layer tokens onto plugin-owned variables so a
 *  dedicated slider owns its alpha (the host has no per-surface opacity). The
 *  settings group additionally retints its dialog surface variable. Always
 *  written explicitly — including at 100% — so removing a slider's effect means
 *  writing 1, not deleting the variable (the style rules below have no fallback
 *  and would otherwise resolve the body tokens that applyCustomTokens rewrote
 *  with the homepage card alpha). */
function applyLayerOverrides(prefix: LayerPrefix, op: number, surface: boolean): void {
  const [h, s, l] = rColor()
  const tokens = genTokens(h, s, l, rColorScheme()).tokens
  if (surface) {
    const surfaceColor = tokens['--dsw-alias-bg-layer-2']
    if (surfaceColor !== undefined) {
      document.documentElement.style.setProperty(`${prefix}-surface`, toRgba(surfaceColor, op))
    }
  }
  for (const layer of [1, 2, 3] as const) {
    const c = tokens[`--dsw-alias-bg-layer-${layer}`]
    if (c !== undefined) {
      document.documentElement.style.setProperty(`${prefix}-layer-${layer}`, toRgba(c, op))
    }
  }
}

export function applySettingsOverrides(op: number): void {
  applyLayerOverrides('--dsh-any-bg-settings', op, true)
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
  applyLayerOverrides('--dsh-any-traj', op, false)
}

/** Register a callback fired when a wallpaper-extracted theme color is
 *  adopted by the auto-adaptation path, so the section can re-register the
 *  host skin, sync the editor UI and persist the pick (wallpaper.ts cannot
 *  do those itself — they live in the section). */
let colorAdoptedListener: ((hsl: [number, number, number]) => void) | null = null
export function onColorAdopted(cb: (hsl: [number, number, number]) => void): () => void {
  colorAdoptedListener = cb
  return () => { if (colorAdoptedListener === cb) colorAdoptedListener = null }
}

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
        // The color changed, so a re-apply is needed for the token pass. When
        // the decode yielded nothing (or the wallpaper was swapped out) the
        // first applyWp above still describes the screen and a second one
        // would only re-do the same work.
        applyWp()
      }
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
  // 'video' also carries a generatedBg-less slot: bailing here keeps this from
  // racing applyWp's video branch (it would clear the player's state while the
  // video branch is setting it up).
  if (!params || cfg.backgroundType === 'image' || cfg.backgroundType === 'video') return
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
    // Two guards, because clearDynamicBg() stops the OLD controller without
    // cancelling its already-scheduled rAF: a rapid regenerate (or a type
    // switch) leaves a stale callback whose `wpController` read is the NEW one.
    // Snapshotting through the captured `controller` and re-checking identity
    // after keeps a dead background's frame from overwriting the live URL.
    const controller = wpController
    if (controller === null) return
    const frame = controller.snapshot()
    if (wpController !== controller) return
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
/** Paint-order lift for the frosted SIDEBAR column (issue #32).
 *
 *  The host's `Tooltip` bubble is an IN-PLACE `span[role="tooltip"]`: its sheet
 *  (`dsh-web-frontend` `Tooltip.module.css`, read on 0.2.1-rc.3) reads
 *  `position:fixed;z-index:100`, going to `z-index:1100` only under
 *  `[data-portal]` — and the `portal` prop defaults to FALSE, which the
 *  workspace browser's 添加工作区 trigger (`ui-workspace` `headerActions`) does
 *  not pass. `position:fixed` keeps the bubble anchored to the viewport, but
 *  its z-index only competes INSIDE the nearest stacking-context ancestor. The
 *  frosted sidebar column IS that ancestor — `PART_BLUR_RULE`'s
 *  `isolation:isolate` is what keeps the underlay's `z-index:-1` inside — so
 *  the bubble, hanging below the icon row and past the column's right edge, is
 *  painted as part of the sidebar's subtree, and the center column (a later
 *  sibling, itself an isolated stacking context once 「主界面」模糊 is up)
 *  paints its translucent fill + frost OVER the overhang: the tooltip's right
 *  half comes out blurred and tinted. The trap is not the tooltip's alone —
 *  every in-place float the sidebar hangs (the workspace pick flow anchors
 *  there too) sits in the same local context.
 *
 *  Lifting the FROSTED sidebar column to `z-index:1` moves its whole paint
 *  slot after the center column's. The two are grid siblings on separate
 *  tracks — they never overlap geometrically, so the lift only matters to
 *  floating layers that overhang a column edge, which is exactly the set that
 *  must win. It stays below everything that has to beat it: the host's overlay
 *  layer (`AppFrame.module.css` `.overlayLayer{z-index:20}`, byte-identical on
 *  0.2.0-rc.1 and 0.2.1-rc.3), the settings modal (it escapes the center
 *  column through the `isolation:auto` arm below and carries z-index 1000+),
 *  and body-level portaled menus/tooltips (z-index 100 / 1100). Grid items
 *  honor `z-index` without `position`, so this lands even on a column the
 *  host leaves `static`.
 *
 *  The `:has([role="dialog"])` arm must pair `z-index:auto` with the
 *  isolation arm: with the settings view open the sidebar column itself holds
 *  a `[role="dialog"]` (counted live when the isolation arm was written), and
 *  a column pinned at `z-index:1` would REMAIN a stacking context through that
 *  arm — the dialog would keep its z-index local and paint under the overlay
 *  layer instead of covering the page. Back at `auto` it escapes the column
 *  exactly as it did before this class existed. */
const PART_LIFT_CLASS = 'dab-part-blur-side'

/** The AppFrame's main-bg clear-out, as a class rather than an inline write.
 *
 * WHY NOT INLINE (measured on 0.1.7): the frame's own translucent
 * `--dsw-alias-bg-base` is what hides the wallpaper, so `applyPartOpacities` has
 * to clear it. Written as `frameEl.style.background = 'transparent'` the clear
 * survived a settings change but not a sidebar open/close — the host owns that
 * element's `style` too (it animates `grid-template-columns`), and while it
 * re-asserts its own background the frame snaps back to an opaque
 * `rgb(200,207,218)`: wallpaper gone, and every frost on top of it flattened,
 * because a backdrop-filter with nothing behind it has nothing to blur. A class
 * rule with `!important` sits outside the host's `style` writes entirely, so the
 * clear cannot be re-clobbered and there is nothing to re-apply. */
export const PART_FRAME_CLASS = 'dab-frame-clear'
export const FRAME_CLEAR_RULE = `.${PART_FRAME_CLASS}{background:transparent!important}`

/** The sidebar column paints its fill ONCE, no matter how many nested elements
 *  ask for it.
 *
 *  WHY THIS IS NOT COSMETICS: `--dsw-specific-sidebar-fill` is a theme token the
 *  host ships OPAQUE (`design-platform.css`: light `--dsw-static-neutral-bluish-50`,
 *  dark `-900`), and three elements stacked in the sidebar's region each declare
 *  `background:var(--dsw-specific-sidebar-fill)` on top of one another —
 *  `AppFrame.module.css` `.sidebarCol` (the grid track), `ui-sidebar/SidebarRoot.module.css:16`
 *  `.root` (the shell it fills) and `ui-workspace/WorkspaceBrowser.module.css:335`
 *  `.fade` (the tree's 24px bottom gradient). Over an opaque color that layering is
 *  invisible; the moment this plugin's 「侧栏」 slider makes the token translucent
 *  every copy adds its alpha again, so the region stops reading as one surface. On
 *  the desktop build it is outright visible: the caption strip above the sidebar is
 *  the plugin's own `::after`, painted with the SAME variable at the SAME alpha but
 *  exactly once (`applyNativeCaption`), so the strip and the column under it come out
 *  at two different densities and the sidebar looks split horizontally.
 *
 *  The column is the one that keeps the paint — it is the outermost box, it is the
 *  box whose width the caption strip is cut to, and the host already treats it as the
 *  owner on macOS, where `SidebarRoot.module.css:27` sets `.root{background:transparent}`
 *  for exactly this reason ("the AppFrame column owns the translucent sidebar tint").
 *  The host retires the gradient the same way for the same reason:
 *  `WorkspaceBrowser.module.css:341` hides `.fade` on darwin because "the opaque fill
 *  gradient would paint a solid smear instead of a fade" once the sidebar is
 *  translucent over the window — which is the state this slider puts the sidebar in on
 *  every platform. So the token is re-declared `transparent` for the column's
 *  DESCENDANTS only: an element's own declaration beats what it inherits, and `body`'s
 *  `!important` re-scope reaches these elements by inheritance only, so no `!important`
 *  is needed here and none of the three consumers can win it back. The column itself
 *  still resolves the faded value it inherits, which is why `*` is a descendant
 *  combinator and not part of the column's own selector.
 *
 *  Bound by the CSS-Module class shape, same as `[class*="_ioCard"]`: the built
 *  bundle names these `pI_x6G_sidebarCol` — prefix first, local name last, and the
 *  pair is identical across `0.2.0-rc.1`, `0.2.1-alpha.3`, `0.2.1-rc.2` and
 *  `0.2.1-rc.3` (`AppFrame.module.css` byte-identical rc.2→rc.3). A build
 *  that renames the track simply stops matching, which is the untouched host look. */
export const SIDEBAR_ONE_LAYER_RULE = '[class*="_sidebarCol"] *{--dsw-specific-sidebar-fill:transparent}'

const PART_BLUR_RULE =
  // The dot is load-bearing: without `isolation` the host does not create a
  // stacking context, so the underlay's `z-index:-1` escapes into the page's and
  // the frost paints over the wrong area instead of staying inside the surface.
  `.${PART_BLUR_CLASS}{isolation:isolate}` +
  // …but that same stacking context is a trap for the host's dialogs: a
  // `position:fixed` modal mounted inside a column keeps its z-index LOCAL to the
  // column, so a column that paints early (the sidebar) buries a modal that must
  // cover the whole page. Verified live against 0.1.7: the settings overlay's
  // center hit-tested to the composer card below it, and dropped back onto the
  // dialog the moment this exemption was added. Losing the frost for as long as a
  // modal is open is the cheaper half of the trade — a dialog you cannot see is a
  // dead end. The cost is bounded because the match is transient: with the
  // settings view closed the sidebar column holds no `[role="dialog"]` at all,
  // which was counted live before this exemption was written.
  `.${PART_BLUR_CLASS}:has([role="dialog"]){isolation:auto}` +
  `.${PART_LIFT_CLASS}{z-index:1}` +
  `.${PART_LIFT_CLASS}:has([role="dialog"]){z-index:auto}` +
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

function discoverParts(): void {
  const overlay = document.querySelector<HTMLElement>('[data-shell-overlay]')
  if (overlay === null) return
  const frame = overlay.parentElement
  if (frame === null) return
  frameEl = frame
  // One pass over frame.children for both anchors: the rightbar is the only
  // column with its own stable host marker (its own grid track — never the
  // "details" twin of center, so it must never take the main-bg tint), and the
  // overlay's index anchors the column order behind it.
  let overlayIdx = -1
  let rightIdx = -1
  let right: HTMLElement | null = null
  const children = frame.children
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (child === overlay) {
      overlayIdx = i
    } else if (child instanceof HTMLElement && child.dataset.rightbarCol !== undefined) {
      right = child
      rightIdx = i
    }
  }
  rightEl = right
  // With the host's grid the rightbar sits between center and overlay; the
  // indexes are resolved from the children array directly instead of trusting
  // the layout to keep that invariant. The else branch covers a future build
  // that drops the rightbar entirely (legacy 3-column shape).
  if (right !== null) {
    sidebarEl = (children[rightIdx - 2] as HTMLElement | undefined) ?? null
    centerEl = (children[rightIdx - 1] as HTMLElement | undefined) ?? null
  } else {
    sidebarEl = (children[overlayIdx - 3] as HTMLElement | undefined) ?? null
    centerEl = (children[overlayIdx - 2] as HTMLElement | undefined) ?? null
  }
}

function setBlur(el: HTMLElement | null, px: number, lift = false): void {
  if (el === null) return
  // Nothing to clear and nothing applied yet: skip the querySelector and the
  // style writes. This is the common steady state — every observer tick and
  // every applyWp calls setBlur(el, 0) on parts that never had a blur.
  if (
    px === 0 &&
    !el.classList.contains(PART_BLUR_CLASS) &&
    !el.classList.contains(PART_LIFT_CLASS) &&
    el.getAttribute('data-dab-pos-patched') !== '1'
  )
    return
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
    el.classList.toggle(PART_LIFT_CLASS, lift)
    if (underlay === null) {
      const node = document.createElement('div')
      node.className = PART_UNDERLAY_CLASS
      el.prepend(node)
    }
    el.style.setProperty('--dsh-any-part-blur', `blur(${px}px)`)
  } else {
    el.classList.remove(PART_BLUR_CLASS)
    el.classList.remove(PART_LIFT_CLASS)
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
  frameEl.classList.add(PART_FRAME_CLASS)
  // An inline clear from an earlier build of this plugin would be a stale
  // duplicate of what the class now says; drop it so the class is the only owner.
  if (frameEl.style.background !== '') frameEl.style.removeProperty('background')
  if (centerEl !== null) centerEl.style.background = base !== undefined ? toRgba(base, ops.bg) : 'transparent'
  // Defensive: a previous build (pre-fix) may have left an inline `background`
  // on the rightbar — clear it so it stops carrying the main-bg tint.
  if (rightEl !== null) rightEl.style.background = ''
}

/** Blur of the option panels inside the settings dialog (.dab-card), owned by
 *  the "dialog option panel" (card) blur slider. Written as a plugin-owned
 *  variable consumed by SETTINGS_STYLE_RULE — deliberately NOT applied to the
 *  homepage center column, which this slider must never touch. At 0 the variable is
 *  removed and the menu rule's `none` fallback wins, which is what "no frost" means
 *  on this slider (see the note above `popoverBlurRule`). */
function applyCardPanelsBlur(px: number): void {
  const root = document.documentElement
  if (px > 0) root.style.setProperty(CARD_BLUR_VAR, `blur(${px}px)`)
  else root.style.removeProperty(CARD_BLUR_VAR)
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
  setBlur(sidebarEl, blurs.sidebar, true)
  setBlur(centerEl, blurs.bg)
  setBlur(rightEl, 0)
  applyBgBlurGlobal(blurs.bg)
  applySidebarBandBlur(blurs.sidebar)
  applyCardPanelsBlur(blurs.card)
  applySettingsBlur(blurs.settings)
  applyInputBlur(blurs.input)
  applyPanelBlur(blurs.panel)
  applyProduced()
  applyHeaderPopovers()
  // Re-claims the session header bar: a conversation switch remounts the row, and
  // the class has to land on the element the host just created.
  applyHeaderBar()
  // Same for the Windows caption band: the frame can be rebuilt with the rest of
  // the shell, and the pin has to land on the element the host just created.
  applyNativeCaption()
  applyViewCards()
}

/** Produced/artifact surfaces (conversation code blocks + their banner +
 *  inline code chips + composer chips + the dsh-better-sidebar workbench):
 *  re-write the root blur and the alpha percentage consumed by PRODUCED_RULE. The
 *  percentage is an alpha for the surface's OWN host color — 1 (100%) reproduces
 *  the untouched host look and lowering it fades exactly that color out — so no
 *  palette sampling is involved and the surfaces keep following the active
 *  theme/wallpaper color on their own. Two surfaces are the exception: the
 *  workbench reads a whole set of layer tokens rather than one color, and the
 *  changed-files card reads a token the card slider owns globally — both take their
 *  alpha from `writeLayerVars` instead of mixing on the live token. */
export function applyProduced(): void {
  const px = rBlurs().produced
  const root = document.documentElement
  if (px > 0) root.style.setProperty('--dsh-any-blur-prod', `blur(${px}px)`)
  else root.style.removeProperty('--dsh-any-blur-prod')
  let opacity = rProducedOpacity()
  if (opacity < 0) opacity = 0
  if (opacity > 1) opacity = 1
  root.style.setProperty('--dsh-any-prod-pct', `${Math.round(opacity * 100)}%`)
  writeLayerVars(PROD_PANEL_LAYER_VARS, opacity)
  writeLayerVars(PROD_LAYER_VARS, opacity)
}

/** Live per-part blur update during slider drag (no full re-apply). */
export function setPartBlur(part: keyof PartBlurs, v: number): void {
  if (part === 'settings') { applySettingsBlur(v); return }
  if (part === 'card') { applyCardPanelsBlur(v); return }
  if (part === 'input') { applyInputBlur(v); return }
  if (part === 'panel') { applyPanelBlur(v); return }
  if (part === 'produced') { applyProduced(); return }
  if (part === 'header') { applyHeaderPopovers(); return }
  if (part === 'headerBar') { applyHeaderBar(); return }
  if (part === 'chat' || part === 'trajectory') { applyViewCards(); return }
  discoverParts()
  if (part === 'bg') { setBlur(centerEl, v); applyBgBlurGlobal(v); return }
  // The caption segment above the sidebar frosts from the same value, mirrored on
  // :root — the live-drag path has to move both or the band lags the column.
  // The lift rides along (see PART_LIFT_CLASS): a frosted sidebar paints after
  // the center column, or its in-place floats lose to the center's frost.
  setBlur(sidebarEl, v, true)
  applySidebarBandBlur(v)
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

/** View specs whose real host marker has been seen at least once. Until a
 *  marker is seen, its absence is ambiguous — "that view is not mounted" or
 *  "this build has no such marker, keep running the generic fallback" — and the
 *  pass has to keep probing. Once seen, absence can only mean the former, so the
 *  pass may be skipped.
 *
 *  This matters because the two specs are two different MAIN VIEWS and only one
 *  of them is mounted at a time (the host renders the main slot for the active
 *  panel id, keyed by `entryKey` — see AppFrame's MainPanel). So "every surface
 *  present" is never true during a normal session, and an all-or-nothing gate on
 *  it silently never engages: that is exactly how the previous version of this
 *  observer ended up running the full pass on every animation frame while
 *  tokens streamed. */
const markerSeen = new Set<number>()

/** Resolve just the stable host markers for the view specs — one querySelector
 *  each, no fallback heuristics. Cheap enough to run on every coalesced burst,
 *  and enough to notice a view mounting/unmounting. */
function probeViewMarkers(): (HTMLElement | null)[] {
  const center = centerEl
  if (center === null || !document.body.contains(center)) return VIEW_CARDS.map(() => null)
  return VIEW_CARDS.map(spec => center.querySelector<HTMLElement>(spec.sel))
}

/** Whether the pass must run regardless of the value/identity signature. */
function needsPartsPass(markers: (HTMLElement | null)[]): boolean {
  // Columns missing: the pass is what discovers them.
  if (!columnsPresent()) return true
  // A mounted view whose marker moved (appeared, or was replaced by a fresh
  // element) has to be re-styled — the identity gate below cannot see it,
  // because an undiscovered target is still null in viewTargets.
  if (markers.some((el, i) => el !== null && el !== viewTargets[i])) return true
  // A spec with a generic fallback whose marker has never been seen on this
  // host: the pass performs that resolution, so it cannot be skipped.
  return VIEW_CARDS.some((spec, i) => spec.fallback === true && markers[i] === null && !markerSeen.has(i))
}

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
    // This host does expose the marker, so from now on its absence means "that
    // view is not the active one" — see the note on markerSeen.
    markerSeen.add(idx)
    if (cached !== null && cached !== marked) { setBlur(cached, 0); restoreCardHost(cached, spec.mark, spec.prev, spec.plain === true) }
    viewTargets[idx] = marked
    return marked
  }
  if (cached !== null && centerEl.contains(cached)) return cached
  viewTargets[idx] = null
  if (spec.fallback !== true) return null
  // The fallback may only refine a conversation that is ALREADY there; it must
  // never invent one. With no conversation marker in the column the chat view is
  // simply not mounted — the settings view owns the column then, and its page is
  // routinely the column's only tall element, so the heuristic below would dress
  // that page up as a chat card and hang a 15px frost over the whole window.
  // Every release in the supported range emits at least one of these four.
  if (
    centerEl.querySelector(
      '[data-chat-flow],[data-conversation-scroll],[data-composer-seat],[data-conversation-composer-overlay]'
    ) === null
  ) return null
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
  // A settings-dialog surface is never the chat card: the dialog owns its own
  // look through SETTINGS_STYLE_RULE, and while it is open with no conversation
  // mounted its page IS the column's largest scroller, so the geometry above
  // would wrap, say, the 「插件」 page in card chrome and hang a frost underlay on
  // it. Tested on the picked element rather than on the column so it also holds
  // when the dialog is portal'd and only its content renders inside the column.
  if (best !== null && best.closest(SETTINGS_PANEL_SEL) !== null) best = null
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

let partsDispose: (() => void) | null = null
let partsPending: Promise<void> | null = null
/** False once stopped, so a pass already queued on the microtask queue cannot
 *  re-style anything after the teardown. */
let partsActive = false
/** Signature of the last blur+opacity pass we actually wrote to the DOM. */
let appliedPartsKey = ''
/** The surfaces the last pass styled, compared BY IDENTITY: the host can swap
 *  a view element for a fresh one while the slider values stay identical, and
 *  the value signature alone would then skip the pass and leave the new view
 *  unstyled until a slider moves. */
let appliedTargets: (HTMLElement | null)[] = []

/** The four frame columns are mounted and still attached. These are the frame's
 *  own children (see the host's AppFrame: sidebar / center / rightbar carrying
 *  `data-rightbar-col` / the overlay), so they exist as soon as the shell does —
 *  unlike the per-view cards below, which come and go with the active view. */
function columnsPresent(): boolean {
  return frameEl !== null && sidebarEl !== null && centerEl !== null && rightEl !== null
    && document.body.contains(frameEl) && document.body.contains(centerEl)
}

/** The composer seat's elected takeover card (approval / plan review / question)
 *  when one is mounted. It is not a view, but it shares the view cards' problem:
 *  the host mounts a fresh element when a takeover is elected, and the pass
 *  signature alone would skip that pass — `applyTakeoverFrost` rides
 *  `applyInputBlur` — leaving the new card bare until a slider moves. Scoped to
 *  the center column exactly like the view markers, because this query runs on
 *  every coalesced mutation burst, including token streaming. */
function probeTakeoverCard(): HTMLElement | null {
  if (centerEl === null || !document.body.contains(centerEl)) return null
  return centerEl.querySelector<HTMLElement>(COMPOSER_TAKEOVER_CARD)
}

/** Snapshot of every surface the pass would style, for the identity check. */
function targetsNow(): (HTMLElement | null)[] {
  return [frameEl, sidebarEl, centerEl, rightEl, ...viewTargets, probeTakeoverCard()]
}

/** Watch for the AppFrame mounting so persisted blurs land even when the shell
 *  renders after this plugin's apply. */
export function watchParts(): void {
  if (partsDispose !== null || typeof MutationObserver === 'undefined') return
  partsActive = true
  // The shared body observer (dom-watch): one MutationObserver for every
  // body-subtree watch this plugin runs.
  partsDispose = watchDom(() => {
    // The observer cannot tell whether a mutation touched our surfaces, so
    // without a gate every childList change on body — streaming tokens,
    // keystrokes — re-runs the full blur+opacity pass. Coalesce a burst into
    // ONE pass, then skip it when it cannot change anything.
    //
    // MICROTASK, not rAF — the lesson header-tag learned in v0.3.9 (AGENTS.md
    // §H): a queued animation frame never runs while the window is not painting
    // (hidden tab, occluded or minimized desktop window), so a takeover card
    // elected or a view mounted in the background would keep the stock look
    // until the next paint. A MutationObserver batch is already delivered once
    // per task at microtask time, so coalescing is just as effective and has no
    // dependency on the compositor at all.
    if (partsPending !== null || !partsActive) return
    partsPending = Promise.resolve().then(() => {
      partsPending = null
      if (!partsActive) return
      const blurs = rBlurs()
      const ops = rOps()
      const key = JSON.stringify([blurs, ops])
      const markers = probeViewMarkers()
      if (!needsPartsPass(markers) && key === appliedPartsKey
        && !targetsNow().some((el, i) => el !== appliedTargets[i])) return
      applyPartBlurs(blurs)
      applyPartOpacities(ops)
      // Snapshot AFTER the pass, not before: discovery happens inside it, and
      // comparing the next tick against a pre-discovery snapshot would make that
      // tick re-run the whole pass for nothing.
      appliedPartsKey = key
      appliedTargets = targetsNow()
    })
  })
}

export function stopWatchingParts(): void {
  partsDispose?.()
  partsDispose = null
  partsActive = false
  partsPending = null
  appliedPartsKey = ''
  appliedTargets = []
  // Re-probe on the next enable: a marker seen before the teardown is no longer
  // evidence about the DOM at hand.
  markerSeen.clear()
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
export function onVerdictApplied(cb: () => void): () => void {
  verdictListener = cb
  return () => { if (verdictListener === cb) verdictListener = null }
}

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
      // An empty video slot must not keep the previous wallpaper's brightness
      // verdict alive: nothing is on screen to justify it, and a stale verdict
      // would flip the next background's font direction the wrong way. The
      // no-background branch below does the same.
      wpVerdict = null
      setBgDark(null)
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
  applyExemptDefaults()
  // Directly, not only from the rAF-coalesced token pass above: a page that is not
  // painting (hidden tab, occluded desktop window) never runs that frame, and the
  // lanes would boot with no plate at all (§2-H).
  applyReaderLanes()
  // applyProduced / applyHeaderPopovers (and, through them, the header-bar,
  // caption-band and view-card passes) are reached from applyPartBlurs just
  // below — spelling them out here too made every applyWp run each pass twice.
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
  for (const set of [PANEL_LAYER_VARS, PROD_PANEL_LAYER_VARS, PROD_LAYER_VARS]) {
    for (const k of LAYER_KEYS) {
      const name = set[k]
      if (name) document.documentElement.style.removeProperty(name)
    }
  }
  // The two menu frost gates are `<html>` classes that switch a TOKEN re-declaration
  // on and off; left behind, they would keep the host's own menu frost overridden
  // with no slider driving it.
  document.documentElement.classList.remove(INPUT_FROST_CLASS)
  // Hand the seat takeover cards back untouched — the inline `position` this
  // pass may have written included (typed teardown, so no observer will).
  applyTakeoverFrost(0)
  // The header bar, the Windows caption band, the squared content corner and the
  // pinned probe go back to the host: the classes come off, the two part variables
  // and the rules are dropped.
  document.documentElement.style.removeProperty('--dsh-any-op-header-bar')
  document.documentElement.style.removeProperty('--dsh-any-blur-header-bar')
  document.documentElement.style.removeProperty('--dsh-any-blur-sidebar-band')
  document.documentElement.style.removeProperty('--dsh-any-caption-ink')
  document.documentElement.style.removeProperty('--dsh-any-caption-ink-collapsed')
  releaseCaptionInk()
  document.querySelectorAll(`.${HEADER_BAR_CLASS}`).forEach(el => releaseHeaderBar(el as HTMLElement))
  headerBarEl = null
  frameEl?.classList.remove(CAPTION_FRAME_CLASS)
  document.querySelectorAll(`.${FLAT_CENTER_CLASS}`).forEach(el => el.classList.remove(FLAT_CENTER_CLASS))
  wcoStyleEl?.remove(); wcoStyleEl = null
  document.documentElement.style.removeProperty('--dsh-any-blur-panel')
  document.documentElement.style.removeProperty('--dsh-any-blur-prod')
  document.documentElement.style.removeProperty('--dsh-any-prod-pct')
  document.documentElement.style.removeProperty('--dsh-any-blur-header')
  headerStyleEl?.remove(); headerStyleEl = null
  exemptStyleEl?.remove(); exemptStyleEl = null
  readerStyleEl?.remove(); readerStyleEl = null
  for (const v of Object.values(OPACITY_VARS)) document.documentElement.style.removeProperty(v)
  baseTokenKey = ''
  lastBgKey = ''
  if (tokensRaf !== null) { cancelAnimationFrame(tokensRaf); tokensRaf = null }
  pendingOps = null
  tableFixStyleEl?.remove(); tableFixStyleEl = null
  partBlurStyleEl?.remove(); partBlurStyleEl = null
  removeStrokes()
  removeFontFace()
  // Drop the low-res drag cache and the drag flag: a teardown mid-drag leaves
  // the disposer's reset path short-circuited (!wpEl), and dragLow stuck true
  // would make every later setDragLow(true) a no-op — the drag-quality
  // downgrade silently never engages again.
  imgNat = null
  lowResUrl = null
  lowResFor = ''
  dragLow = false
  setBlur(frameEl, 0); setBlur(sidebarEl, 0); setBlur(centerEl, 0); setBlur(rightEl, 0)
  if (frameEl !== null) frameEl.classList.remove(PART_FRAME_CLASS)
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
