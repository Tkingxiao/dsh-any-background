import { rWp, rWpImage, rWpVideo, rBgState, rVideoBgState, rBl, rWop, rOps, rSop, rColor, rHasColor, rBlurs, rBgMode, rChatTextOpacity, rTrajectoryOpacity, cfg, setWpUrl, rBgDark, setBgDark } from './state'
import type { BackgroundType, GeneratedBgParams, PartOpacities, PartBlurs } from './types'
import { genTokens, toRgba, extractWallpaperColor, analyzeFrameDark } from './utils/color'
import { createDynamicBackground, defaultParamsFor } from './utils/bg-generators'

let wpEl: HTMLDivElement | null = null
let videoEl: HTMLVideoElement | null = null
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
    // The generated background's brightness verdict overrides only the font
    // direction; genTokens' result is cached and shared, so clone before
    // overriding.
    const dark = rBgDark()
    if (dark !== null) {
      tokens = { ...tokens }
      const font = dark ? '#fff' : '#000'
      for (const name of LABEL_TOKENS) tokens[name] = font
    }
    // Drive the base-palette switch ourselves with a plugin-specific value so
    // the gradient rule never matches a host dark-mode flag.
    if (dark ?? l < 0.55) document.body.setAttribute('data-ds-dark-theme', 'dsh-any-background')
    else document.body.removeAttribute('data-ds-dark-theme')
    // A stylesheet rule with !important survives the host presenter clearing
    // body inline styles on boot (which would flash the system palette).
    const decls: string[] = []
    for (const [name, value] of Object.entries(tokens)) {
      let v = value
      if (name === '--dsw-alias-bg-base') v = toRgba(value, ops.bg)
      else if (name === '--dsw-specific-sidebar-fill') v = toRgba(value, ops.sidebar)
      else if (name === '--dsw-alias-bg-layer-1' || name === '--dsw-alias-bg-layer-2' || name === '--dsw-alias-bg-layer-3') v = toRgba(value, ops.card)
      decls.push(`${name}:${v}!important`)
    }
    ensureTokenStyle().textContent = `body{${decls.join(';')}}`
    // Drop inline tokens left by earlier builds so the stylesheet is the single source of truth.
    for (const name of appliedTokenNames) document.body.style.removeProperty(name)
    appliedTokenNames = Object.keys(tokens)
    applyPartOpacities(ops)
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

export function applySettingsOverrides(op: number): void {
  // Always written explicitly (including 100%) — removing them would make
  // SETTINGS_STYLE_RULE fall back to the body layer tokens that
  // applyCustomTokens rewrites with the homepage card alpha.
  const [h, s, l] = rColor()
  const tokens = genTokens(h, s, l).tokens
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
  const tokens = genTokens(h, s, l).tokens
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

/** Apply the theme color: use the saved pick directly, or fall back to
 *  extracting a dominant color from the current wallpaper. */
export function applyThemeColor(): void {
  if (rHasColor()) {
    applyWp()
    return
  }
  const url = rWp()
  if (url) {
    // Video mode samples the frame snapshot through the video's own placement
    // state; the image slot's framing does not apply to the snapshot.
    const st = cfg.backgroundType === 'video' ? rVideoBgState() : rBgState()
    void extractWallpaperColor(url, st).then(hsl => {
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
      setBgDark(dark)
      applyCustomTokens(rOps())
    })
  })
}

// ── Per-part interface blur ───────────────────────────────────────────────────
// The AppFrame columns use hashed CSS-module classes, so parts are located
// structurally: the shell overlay carries a stable data attribute and the
// sidebar/center/details columns are its three preceding siblings.
//
// backdrop-filter must NEVER go directly on a host part: it turns the element
// into a containing block for fixed-positioned descendants, which would trap
// the host's settings dialog inside the column. Each blurred part carries an
// isolated ::before underlay holding the backdrop-filter instead.
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

/** Apply the main-background opacity to the center/details columns instead of
 *  the frame. The frame's translucent bg-base sits UNDER the sidebar, so
 *  reducing the main-bg opacity stacked a second alpha onto the sidebar; moving
 *  the alpha onto the columns keeps the sidebar owned by its own slider. */
function applyPartOpacities(ops: PartOpacities): void {
  if (!(rHasColor() || rBgDark() !== null)) return
  discoverParts()
  if (frameEl === null) return
  const [h, s, l] = rColor()
  const base = genTokens(h, s, l).tokens['--dsw-alias-bg-base']
  frameEl.style.background = 'transparent'
  if (centerEl !== null) centerEl.style.background = base !== undefined ? toRgba(base, ops.bg) : 'transparent'
  if (detailsEl !== null) detailsEl.style.background = base !== undefined ? toRgba(base, ops.bg) : 'transparent'
}

/** Blur of the option panels inside the settings dialog (.dab-card), owned by
 *  the "dialog option panel" (card) blur slider. Written as a plugin-owned
 *  variable consumed by SETTINGS_STYLE_RULE — deliberately NOT applied to the
 *  homepage center/details columns, which this slider must never touch. */
function applyCardPanelsBlur(px: number): void {
  if (px > 0) document.documentElement.style.setProperty('--dsh-any-blur-card-panels', `blur(${px}px)`)
  else document.documentElement.style.removeProperty('--dsh-any-blur-card-panels')
}

/** Apply per-part interface blur to the AppFrame columns + settings panel. */
export function applyPartBlurs(blurs: PartBlurs): void {
  discoverParts()
  // The bg blur frosts the wallpaper behind the main content columns (center +
  // details); the frame itself stays unblurred so the sidebar is never
  // double-frosted by both the bg and sidebar sliders.
  setBlur(frameEl, 0)
  setBlur(sidebarEl, blurs.sidebar)
  setBlur(centerEl, blurs.bg)
  setBlur(detailsEl, blurs.bg)
  applyCardPanelsBlur(blurs.card)
  applySettingsBlur(blurs.settings)
  applyViewCards()
}

/** Live per-part blur update during slider drag (no full re-apply). */
export function setPartBlur(part: keyof PartBlurs, v: number): void {
  if (part === 'settings') { applySettingsBlur(v); return }
  if (part === 'card') { applyCardPanelsBlur(v); return }
  if (part === 'chat' || part === 'trajectory') { applyViewCards(); return }
  discoverParts()
  if (part === 'bg') { setBlur(centerEl, v); setBlur(detailsEl, v) }
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
    restore('border', ds[prev + 'Border'])
    restore('border-radius', ds[prev + 'Radius'])
    restore('padding', ds[prev + 'Padding'])
    delete ds[prev + 'Border']; delete ds[prev + 'Radius']; delete ds[prev + 'Padding']
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

/** Re-derive the conversation view cards from the current config. Cheap
 *  enough for live slider drags; the card structure is applied unconditionally
 *  once the host exists so the layout never reflows when a slider leaves zero. */
export function applyViewCards(): void {
  discoverParts()
  if (centerEl === null) return
  const [h, s, l] = rColor()
  const surface = genTokens(h, s, l).tokens['--dsw-alias-bg-layer-1']
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
    }
    // Plain views write no inline styles — only the blur underlay is hosted here.
    target.setAttribute(spec.mark, '1')
    setBlur(target, blurPx)
  })
}

let partsObserver: MutationObserver | null = null

/** Watch for the AppFrame mounting so persisted blurs land even when the shell
 *  renders after this plugin's apply. Cheap: once all parts are found, the
 *  callback returns. */
export function watchParts(): void {
  if (partsObserver !== null || typeof MutationObserver === 'undefined') return
  partsObserver = new MutationObserver(() => {
    if (frameEl !== null && sidebarEl !== null && centerEl !== null && detailsEl !== null && document.body.contains(frameEl)
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
  const img = new Image()
  img.onload = () => {
    imgNat = { url, w: img.naturalWidth, h: img.naturalHeight }
    cb(img.naturalWidth, img.naturalHeight)
  }
  img.onerror = () => cb(0, 0)
  img.src = url
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
  applyWpEffects()
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
    videoEl.setAttribute('playsinline', '')
    videoEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-position:center;'
    videoEl.setAttribute('src', url)
    void videoEl.play().catch(() => undefined)
    wpEl!.appendChild(videoEl)
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
  }
  // Write tokens only when there is a color to derive them from (a saved pick,
  // or a generated background whose brightness verdict is known) — on boot the
  // persisted state has not loaded yet, and rColor() would flash the default.
  if (rHasColor() || rBgDark() !== null) {
    applyCustomTokens(rOps())
  }
  if (rHasColor()) {
    applySettingsOverrides(rSop())
    applyTrajectoryOverrides(rTrajectoryOpacity())
  }
  applyPartBlurs(rBlurs())
}

export function teardownWp(): void {
  clearDynamicBg()
  clearVideoEl()
  setBgDark(null)
  wpEl?.remove(); wpEl = null
  clearCustomTokens()
  tokenStyleEl?.remove(); tokenStyleEl = null
  removeViewCards()
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
  setBlur(frameEl, 0); setBlur(sidebarEl, 0); setBlur(centerEl, 0); setBlur(detailsEl, 0)
  if (frameEl !== null) frameEl.style.removeProperty('background')
  if (centerEl !== null) centerEl.style.removeProperty('background')
  if (detailsEl !== null) detailsEl.style.removeProperty('background')
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
