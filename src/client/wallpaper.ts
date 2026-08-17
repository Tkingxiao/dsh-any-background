import { rWp, rBgState, rBl, rWop, rOps, rSop, rColor, rBlurs, rPalette, setPalette, cfg, setWpUrl, setBgState, DEFAULT_CONFIG } from './state'
import type { BackgroundType, GeneratedBgParams, PartOpacities, PartBlurs } from './types'
import { genTokens, toRgba, extractWallpaperPalette, paletteFromHsl } from './utils/color'
import { renderGeneratedBg, defaultParamsFor, RENDER_W, RENDER_H } from './utils/bg-generators'

let wpEl: HTMLDivElement | null = null
let appliedTokenNames: string[] = []

function clearCustomTokens(): void {
  for (const name of appliedTokenNames) document.body.style.removeProperty(name)
  appliedTokenNames = []
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
export function applyCustomTokens(ops: PartOpacities): void {
  const [h, s, l] = rColor()
  const { tokens } = genTokens(h, s, l, rPalette())
  clearCustomTokens()
  // Drive the base-palette switch ourselves so tokens the plugin does not
  // override (the input surface, masks, static tokens) follow the picked
  // color's dark/light scheme even while the theme service preference is
  // being adopted/reset.
  // Use a plugin-specific value so the gradient rule does not accidentally
  // match a dark-mode flag set by the host harness.
  if (l < 0.55) document.body.setAttribute('data-ds-dark-theme', 'dsh-any-background')
  else document.body.removeAttribute('data-ds-dark-theme')
  for (const [name, value] of Object.entries(tokens)) {
    let v = value
    if (name === '--dsw-alias-bg-base') v = toRgba(value, ops.bg)
    else if (name === '--dsw-specific-sidebar-fill') v = toRgba(value, ops.sidebar)
    else if (name === '--dsw-alias-bg-layer-1' || name === '--dsw-alias-bg-layer-2' || name === '--dsw-alias-bg-layer-3') v = toRgba(value, ops.card)
    document.body.style.setProperty(name, v)
    appliedTokenNames.push(name)
  }
}

// ── Settings panel opacity ─────────────────────────────────────────────────────
// The settings modal is the only aria-modal dialog that identifies itself with
// aria-labelledby (ui-primitives' Modal and the image lightbox use aria-label),
// so this selector scopes the translucency to the settings panel alone. The
// panel surface is --dsw-alias-bg-layer-2, resolved here from body's computed
// style (the theme presenter writes custom-theme tokens inline on body; the
// base palettes declare the alias in the stylesheets) and re-emitted with an
// alpha through a plugin-owned variable, so the panel keeps its current color
// while fading toward whatever sits behind the modal.

const SETTINGS_PANEL_SEL = '[role="dialog"][aria-modal="true"][aria-labelledby]'
export const SETTINGS_STYLE_RULE = `${SETTINGS_PANEL_SEL}{background:var(--dsh-any-bg-settings-surface,var(--dsw-alias-bg-layer-2));backdrop-filter:var(--dsh-any-blur-settings,none)}`

export function applySettingsOverrides(op: number): void {
  if (op >= 1) {
    document.documentElement.style.removeProperty('--dsh-any-bg-settings-surface')
    return
  }
  // Derive the panel surface from the saved color's layer-2 token (not a
  // computed-style read), so the settings panel matches the homepage tint
  // without depending on the presenter or theme state.
  const [h, s, l] = rColor()
  const layer2 = genTokens(h, s, l, rPalette()).tokens['--dsw-alias-bg-layer-2']
  if (layer2 !== undefined) {
    document.documentElement.style.setProperty('--dsh-any-bg-settings-surface', toRgba(layer2, op))
  }
}

// ── Generated backgrounds & palette refresh ───────────────────────────────────

/** Derive a Material-You-style palette from the current wallpaper/color and
 *  re-apply so the generated tokens pick it up. Called whenever the wallpaper
 *  source changes (image upload, generated bg switch/regeneration). */
export function refreshPaletteAndApply(): void {
  const url = rWp()
  const color = rColor()
  if (url) {
    void extractWallpaperPalette(url, rBgState()).then(palette => {
      setPalette(palette ?? paletteFromHsl(color))
      applyWp()
    })
  } else {
    setPalette(paletteFromHsl(color))
    applyWp()
  }
}

/** Switch the background source type. For generated types a new data URL is
 *  rendered immediately and the parameters are persisted. */
export function setBackgroundType(type: BackgroundType): void {
  cfg.backgroundType = type
  if (type === 'image') {
    // Keep the existing image URL (or null) as-is.
    refreshPaletteAndApply()
    return
  }
  cfg.generatedBg = defaultParamsFor(type)
  setBgState({ ...DEFAULT_CONFIG.bgState, iw: RENDER_W, ih: RENDER_H })
  const url = renderGeneratedBg(cfg.generatedBg)
  // The URL is set synchronously; palette extraction runs async below.
  setWpUrl(url)
  refreshPaletteAndApply()
}

/** Regenerate the current generated background from its saved parameters. */
export function regenerateGeneratedBg(): void {
  const params = cfg.generatedBg
  if (!params || cfg.backgroundType === 'image') return
  const url = renderGeneratedBg(params)
  setWpUrl(url)
  refreshPaletteAndApply()
}

/** Update a generated background's parameters and re-render. */
export function updateGeneratedBg(params: GeneratedBgParams): void {
  cfg.backgroundType = params.type
  cfg.generatedBg = params
  setBgState({ ...DEFAULT_CONFIG.bgState, iw: RENDER_W, ih: RENDER_H })
  const url = renderGeneratedBg(params)
  setWpUrl(url)
  refreshPaletteAndApply()
}

// ── Per-part interface blur ───────────────────────────────────────────────────
// The three-column AppFrame (ui-layout) styles its columns with hashed
// CSS-module classes, so the parts are located structurally instead: the shell
// overlay carries a stable data attribute, and the sidebar/center/details
// columns are its three preceding siblings inside the frame. The frame fills
// the viewport (html/body/#root are 100% tall), so making it a backdrop root
// does not move or clip the fixed settings overlay it contains.
let frameEl: HTMLElement | null = null
let sidebarEl: HTMLElement | null = null
let centerEl: HTMLElement | null = null
let detailsEl: HTMLElement | null = null

function discoverParts(): void {
  const overlay = document.querySelector<HTMLElement>('[data-shell-overlay]')
  if (overlay === null) return
  const frame = overlay.parentElement
  if (frame === null) return
  frameEl = frame
  const idx = Array.from(frame.children).indexOf(overlay)
  sidebarEl = (frame.children[idx - 3] as HTMLElement | undefined) ?? null
  centerEl = (frame.children[idx - 2] as HTMLElement | undefined) ?? null
  detailsEl = (frame.children[idx - 1] as HTMLElement | undefined) ?? null
}

function setBlur(el: HTMLElement | null, px: number): void {
  if (el === null) return
  if (px > 0) el.style.backdropFilter = `blur(${px}px)`
  else el.style.removeProperty('backdrop-filter')
}

function applySettingsBlur(px: number): void {
  if (px > 0) document.documentElement.style.setProperty('--dsh-any-blur-settings', `blur(${px}px)`)
  else document.documentElement.style.removeProperty('--dsh-any-blur-settings')
}

/** Apply per-part interface blur to the AppFrame columns + settings panel. */
export function applyPartBlurs(blurs: PartBlurs): void {
  discoverParts()
  setBlur(frameEl, blurs.bg)
  setBlur(sidebarEl, blurs.sidebar)
  setBlur(centerEl, blurs.card)
  setBlur(detailsEl, blurs.card)
  applySettingsBlur(blurs.settings)
}

/** Live per-part blur update during slider drag (no full re-apply). */
export function setPartBlur(part: keyof PartBlurs, v: number): void {
  if (part === 'settings') { applySettingsBlur(v); return }
  discoverParts()
  if (part === 'bg') setBlur(frameEl, v)
  else if (part === 'sidebar') setBlur(sidebarEl, v)
  else { setBlur(centerEl, v); setBlur(detailsEl, v) }
}

let partsObserver: MutationObserver | null = null

/** Watch for the AppFrame mounting so persisted blurs land even when the shell
 *  renders after this plugin's apply. Cheap: once all parts are found, the
 *  callback returns. */
export function watchParts(): void {
  if (partsObserver !== null || typeof MutationObserver === 'undefined') return
  partsObserver = new MutationObserver(() => {
    if (frameEl !== null && sidebarEl !== null && centerEl !== null && detailsEl !== null && document.body.contains(frameEl)) return
    applyPartBlurs(rBlurs())
  })
  partsObserver.observe(document.body, { childList: true, subtree: true })
}

export function stopWatchingParts(): void {
  partsObserver?.disconnect()
  partsObserver = null
}

export function applyWp(): void {
  const url = rWp()
  // Wallpaper element (only when image exists)
  if (!url) { wpEl?.remove(); wpEl = null } else {
    if (!wpEl || !document.body.contains(wpEl)) {
      wpEl = document.createElement('div')
      wpEl.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;background-repeat:no-repeat;'
      document.body.prepend(wpEl)
    }
    const bg = rBgState()
    wpEl.style.backgroundImage = `url("${url}")`
    if (bg.iw > 0) {
      // Saved placement: contain-fit at zoom with the image CENTER pinned to
      // the committed fractional viewport point (x, y are center fractions,
      // 0.5 = viewport center — the editor commits the same anchor), so the
      // framed region survives viewport changes: window moves between screens,
      // aspect-ratio changes, and panel splitters re-derive a consistent view.
      const fit = Math.min(window.innerWidth / bg.iw, window.innerHeight / bg.ih)
      const w = bg.iw * fit * bg.zoom
      const h = bg.ih * fit * bg.zoom
      wpEl.style.backgroundSize = `${w}px ${h}px`
      wpEl.style.backgroundPosition = `${bg.x * window.innerWidth - w / 2}px ${bg.y * window.innerHeight - h / 2}px`
    } else {
      // Fresh image: match the editor's initial centered contain view.
      wpEl.style.backgroundSize = 'contain'
      wpEl.style.backgroundPosition = 'center'
    }
    const blur = rBl()
    wpEl.style.filter = blur > 0 ? `blur(${blur}px)` : 'none'
    wpEl.style.opacity = String(rWop())
  }
  // Theme color + per-part opacities: write the full token set inline
  // (self-contained), then the settings panel surface + per-part blur.
  applyCustomTokens(rOps())
  applySettingsOverrides(rSop())
  applyPartBlurs(rBlurs())
}

export function teardownWp(): void {
  wpEl?.remove(); wpEl = null
  clearCustomTokens()
  document.documentElement.style.removeProperty('--dsh-any-bg-settings-surface')
  document.documentElement.style.removeProperty('--dsh-any-blur-settings')
  setBlur(frameEl, 0); setBlur(sidebarEl, 0); setBlur(centerEl, 0); setBlur(detailsEl, 0)
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
