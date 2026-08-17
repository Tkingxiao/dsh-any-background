import { rWp, rWpImage, rBgState, rBl, rWop, rOps, rSop, rColor, rHasColor, rBlurs, cfg, setWpUrl, rBgDark, setBgDark } from './state'
import type { BackgroundType, GeneratedBgParams, PartOpacities, PartBlurs } from './types'
import { genTokens, toRgba, extractWallpaperColor, analyzeFrameDark } from './utils/color'
import { createDynamicBackground, defaultParamsFor } from './utils/bg-generators'

let wpEl: HTMLDivElement | null = null
let appliedTokenNames: string[] = []
let wpController: { canvas: HTMLCanvasElement; stop: () => void; snapshot: () => string } | null = null
let snapshotListener: (() => void) | null = null
let tokenStyleEl: HTMLStyleElement | null = null

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

/**
 * Write the saved color's full token set as inline variables on body — the
 * same write surface the theme presenter owns, but derived DIRECTLY from the
 * saved pick, so the theme color never depends on the theme service's active
 * state or the presenter's timing. The bg-base, sidebar and layer surfaces are
 * re-emitted at their per-part alpha; every other token (labels, borders,
 * brand) is written verbatim. No reads: nothing can observe a stale or reset
 * theme value and leave the homepage on the system color.
 */
/** Label tokens flipped by the generated-background brightness verdict. */
const LABEL_TOKENS = [
  '--dsw-alias-label-primary',
  '--dsw-alias-label-secondary',
  '--dsw-alias-label-tertiary',
  '--dsw-alias-label-caption',
  '--dsw-alias-label-dimmed',
  '--dsw-alias-label-quaternary',
]

export function applyCustomTokens(ops: PartOpacities): void {
  const [h, s, l] = rColor()
  let { tokens } = genTokens(h, s, l)
  try {
    // A generated background carries its own brightness verdict (analyzed once
    // per switch from a captured frame — never per-frame). It overrides ONLY
    // the font direction (dark frame → white labels, light frame → black) so
    // text stays readable over the animated background; every other token
    // keeps following the picked color. genTokens' result is cached and shared,
    // so clone before overriding.
    const dark = rBgDark()
    if (dark !== null) {
      tokens = { ...tokens }
      const font = dark ? '#fff' : '#000'
      for (const name of LABEL_TOKENS) tokens[name] = font
    }
    // Drive the base-palette switch ourselves so tokens the plugin does not
    // override (the input surface, masks, static tokens) follow the picked
    // color's dark/light scheme even while the theme service preference is
    // being adopted/reset.
    // Use a plugin-specific value so the gradient rule does not accidentally
    // match a dark-mode flag set by the host harness.
    if (dark ?? l < 0.55) document.body.setAttribute('data-ds-dark-theme', 'dsh-any-background')
    else document.body.removeAttribute('data-ds-dark-theme')
    // Write the tokens as a stylesheet rule with !important instead of inline
    // on body. The host's theme presenter clears body inline styles when it
    // adopts a built-in preference (observed on boot), which wipes inline
    // tokens for ~150ms and flashes the interface back to the system palette.
    // A stylesheet rule survives that clearing and, being !important, also
    // outranks the host's own non-important inline token writes.
    const decls: string[] = []
    for (const [name, value] of Object.entries(tokens)) {
      let v = value
      if (name === '--dsw-alias-bg-base') v = toRgba(value, ops.bg)
      else if (name === '--dsw-specific-sidebar-fill') v = toRgba(value, ops.sidebar)
      else if (name === '--dsw-alias-bg-layer-1' || name === '--dsw-alias-bg-layer-2' || name === '--dsw-alias-bg-layer-3') v = toRgba(value, ops.card)
      decls.push(`${name}:${v}!important`)
    }
    ensureTokenStyle().textContent = `body{${decls.join(';')}}`
    // Drop any inline tokens left by earlier builds so the stylesheet is the
    // single source of truth.
    for (const name of appliedTokenNames) document.body.style.removeProperty(name)
    appliedTokenNames = Object.keys(tokens)
  } catch (e) {
    // ignore
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
  // No saved color → the panel keeps the host surface; nothing to tint.
  if (!rHasColor()) return
  // Derive the panel surface from the saved color's layer-2 token (not a
  // computed-style read), so the settings panel matches the homepage tint
  // without depending on the presenter or theme state.
  const [h, s, l] = rColor()
  const layer2 = genTokens(h, s, l).tokens['--dsw-alias-bg-layer-2']
  if (layer2 !== undefined) {
    document.documentElement.style.setProperty('--dsh-any-bg-settings-surface', toRgba(layer2, op))
  }
}

// ── Generated backgrounds & palette refresh ───────────────────────────────────

/** Apply only the wallpaper layer (position, scale, opacity, blur) without
 *  touching the theme color palette. Used when generated background parameters
 *  change so the visual keeps updating without shifting the picked theme color. */
function applyWallpaper(): void {
  applyWp()
}

/** Re-apply the current theme/wallpaper state. Since genTokens now derives
 *  everything directly from the saved HSL pick, no palette refresh is needed. */
export function refreshPaletteAndApply(): void {
  applyWp()
}

/** Apply the theme color. If the user has an explicit saved pick we use it
 *  directly; otherwise we fall back to extracting a dominant color from the
 *  current wallpaper (one HSL sample, no palette), so new uploads still get a
 *  matching theme automatically. */
export function applyThemeColor(): void {
  if (rHasColor()) {
    applyWp()
    return
  }
  const url = rWp()
  if (url) {
    void extractWallpaperColor(url, rBgState()).then(hsl => {
      if (hsl) cfg.color = hsl
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
    // Restore the previously uploaded image (it is retained separately), remove
    // the live canvas, and point the display URL back at the image. The
    // generated-background brightness verdict no longer applies.
    clearDynamicBg()
    setBgDark(null)
    setWpUrl(rWpImage())
    applyThemeColor()
    return
  }
  // If we already have params for this generated type, keep them so switching
  // between generated sub-types does not wipe user adjustments.
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
  const next: GeneratedBgParams =
    params.type === 'mesh'
      ? { ...params, seed: randomSeed() }
      : { ...params, seed: randomSeed() }
  cfg.generatedBg = next
  applyGeneratedBg(next)
}

/** Update a generated background's parameters and re-render. */
export function updateGeneratedBg(params: GeneratedBgParams): void {
  cfg.backgroundType = params.type
  cfg.generatedBg = params
  applyGeneratedBg(params)
}

function applyGeneratedBg(params: GeneratedBgParams): void {
  clearDynamicBg()
  ensureWpContainer()
  wpController = createDynamicBackground(params)
  if (wpEl) {
    wpEl.style.backgroundImage = 'none'
    wpEl.appendChild(wpController.canvas)
  }
  // The canvas paints its first frame on the next animation tick; only then is
  // the snapshot meaningful for the settings preview and color picker. Capture
  // it after that frame and re-sync dependents. Do NOT refresh the palette here:
  // generated backgrounds should not overwrite the user's picked theme color.
  requestAnimationFrame(() => {
    if (!wpController) return
    const controller = wpController
    const frame = controller.snapshot()
    setWpUrl(frame)
    applyWallpaper()
    snapshotListener?.()
    // One-shot brightness verdict from the just-captured frame: decode +
    // average luma on a 32×32 canvas, then flip the font direction. Runs only
    // on switches — never in the animation loop — so there is zero per-frame
    // cost. While pending, the picked color's lightness keeps deciding fonts.
    setBgDark(null)
    void analyzeFrameDark(frame).then(dark => {
      if (dark === null || wpController !== controller) return
      setBgDark(dark)
      applyCustomTokens(rOps())
    })
  })
}

// ── Per-part interface blur ───────────────────────────────────────────────────
// The three-column AppFrame (ui-layout) styles its columns with hashed
// CSS-module classes, so the parts are located structurally instead: the shell
// overlay carries a stable data attribute, and the sidebar/center/details
// columns are its three preceding siblings inside the frame.
//
// backdrop-filter must NEVER be written directly onto a host part: any element
// with a non-none backdrop-filter becomes the containing block for its
// fixed-positioned descendants, and the host mounts the settings dialog inside
// the AppFrame subtree (observed inside the sidebar column) — a direct blur
// would lock that fixed dialog into the column box ("settings window stuck in
// the sidebar"). Each blurred part instead carries an isolated ::before
// underlay that holds the backdrop-filter, so the part itself never traps
// fixed-positioned host UI.
let frameEl: HTMLElement | null = null
let sidebarEl: HTMLElement | null = null
let centerEl: HTMLElement | null = null
let detailsEl: HTMLElement | null = null

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

function ensureWpContainer(): void {
  if (!wpEl || !document.body.contains(wpEl)) {
    wpEl = document.createElement('div')
    wpEl.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;'
    document.body.prepend(wpEl)
  }
}

function applyImageWp(url: string): void {
  clearDynamicBg()
  ensureWpContainer()
  const bg = rBgState()
  const next = `url("${url}")`
  // Skip re-setting the background image when it is already in place. Re-setting
  // the same data URL makes the browser re-decode the image, which flashes the
  // wallpaper blank for a frame on boot re-applies.
  if (wpEl!.style.backgroundImage !== next) {
    wpEl!.style.backgroundImage = next
    wpEl!.style.backgroundRepeat = 'no-repeat'
  }
  if (bg.iw > 0) {
    // Saved placement: contain-fit at zoom with the image CENTER pinned to
    // the committed fractional viewport point (x, y are center fractions,
    // 0.5 = viewport center — the editor commits the same anchor), so the
    // framed region survives viewport changes: window moves between screens,
    // aspect-ratio changes, and panel splitters re-derive a consistent view.
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
  applyWpEffects()
}

function applyWpEffects(): void {
  if (!wpEl) return
  const blur = rBl()
  wpEl.style.filter = blur > 0 ? `blur(${blur}px)` : 'none'
  wpEl.style.opacity = String(rWop())
}

export function applyWp(): void {
  const url = rWp()
  if (cfg.backgroundType !== 'image' && cfg.generatedBg) {
    // Generated backgrounds are live canvases. If one is not active yet,
    // create it from the saved params (happens on boot or after import).
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
    wpEl?.remove(); wpEl = null
  }
  // Theme color + per-part opacities: write the full token set inline
  // (self-contained), then the settings panel surface + per-part blur.
  // Only write tokens when there is a color to derive them from (a saved pick,
  // or a generated background whose brightness verdict is known). On boot the
  // persisted state has not loaded yet, so rColor() falls back to the default
  // blue and would flash the whole interface before the saved color lands.
  if (rHasColor() || rBgDark() !== null) {
    applyCustomTokens(rOps())
  }
  if (rHasColor()) {
    applySettingsOverrides(rSop())
  }
  applyPartBlurs(rBlurs())
}

export function teardownWp(): void {
  clearDynamicBg()
  setBgDark(null)
  wpEl?.remove(); wpEl = null
  clearCustomTokens()
  tokenStyleEl?.remove(); tokenStyleEl = null
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
