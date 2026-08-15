/**
 * dsh-any-background — browser half.
 *
 * Appearance plugin with:
 * 1. PS-style color wheel (hue ring + saturation/lightness square) for
 *    real-time theme color selection with dynamic token generation.
 * 2. Background image editor modal with drag-to-pan and scroll-to-zoom
 *    inside a viewport-proportional preview rectangle.
 * 3. Opacity / blur sliders with zero-lag direct DOM manipulation: the
 *    homepage background opacity (主界面透明度) and the settings panel opacity
 *    (设置界面透明度) are separate sliders.
 *
 * The color wheel is one canvas: a hue ring and an inscribed SL square.
 * Mouse interaction on either region regenerates the full theme token set
 * and applies it instantly via ctx.theme.setTheme().
 *
 * The bg editor modal shows a rectangle matching the viewport aspect ratio.
 * The image can be dragged and zoomed (mouse wheel) inside it. What you see
 * in the rectangle is exactly how the background appears on the page.
 */
import { createElement as h } from 'react'
import { useRef, useState, useEffect, useCallback } from 'react'
import { defineStore } from '@deepseek-ai/dsh-client-runtime/client'

export const name = 'dsh-any-background'
export const inject = ['slots', 'locale', 'theme', 'connection']

// ── Interfaces ─────────────────────────────────────────────────────────────────

interface ThemeSnapshot {
  preference: string; revision: number
  active: { colorScheme: string; tokens: Record<string, string> }
  themes: Array<{ id: string; colorScheme: string; tokens: Record<string, string> }>
}
interface ThemeService {
  getTheme(): ThemeSnapshot; setTheme(id: string): void
  register(def: { id: string; colorScheme: string; tokens: Record<string, string> }): () => void
  overrideTokens(source: string, overrides: Record<string, Record<string, string>>): () => void
}
interface LocaleService {
  register(ns: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): unknown
  bind(ns: string): (key: string) => string
  subscribe(cb: () => void): () => void; getSnapshot(): { active: string }
}
interface SlotsService {
  inject(slot: string, register: () => unknown): void
  register(meta: Record<string, unknown>, component: () => unknown): unknown
}
interface ConnectionService {
  rpc: { call(channel: string, endpoint: string, payload: unknown): Promise<unknown> }
}
interface Ctx {
  effect(cb: () => unknown, label?: string): void
  on(event: string, cb: (...a: any[]) => void): () => void
  locale: LocaleService; slots: SlotsService; theme: ThemeService; connection: ConnectionService
}

// ── Constants ──────────────────────────────────────────────────────────────────

const NS = 'settings.anyBg'
const DEF_OP = 0.85; const DEF_BL = 0; const DEF_SOP = 1
const CUSTOM_ID = 'custom-color'

// ── i18n ───────────────────────────────────────────────────────────────────────

const zh: Record<string, string> = {
  nav: '主题', subtitle: '自定义界面外观',
  colorTitle: '主题色', colorHint: '在色轮上选择色相，在方形中调整饱和度和明度',
  uiTitle: '界面',
  uiOpacity: '主界面透明度', uiOpacityHint: '拖动滑块调整主页界面背景的透明度',
  uiSop: '设置界面透明度', uiSopHint: '拖动滑块调整设置页界面背景的透明度',
  bgTitle: '背景图片', bgChoose: '选择图片', bgRemove: '移除图片',
  bgEdit: '编辑位置', wpOpacity: '壁纸透明度', bgBlur: '壁纸模糊',
  bgHint: '拖动滑块实时调整。点击背景图可打开编辑器调整位置和大小',
  editorTitle: '背景编辑器', editorHint: '拖动移动图片，滚轮缩放大小',
  editorCommit: '确认', editorCancel: '取消', editorReset: '重置',
}
const en: Record<string, string> = {
  nav: 'Theme', subtitle: 'Customize appearance',
  colorTitle: 'Theme color', colorHint: 'Pick hue on the ring, adjust saturation & lightness in the square',
  uiTitle: 'Interface',
  uiOpacity: 'Main interface opacity', uiOpacityHint: 'Drag to adjust homepage interface background opacity',
  uiSop: 'Settings interface opacity', uiSopHint: 'Drag to adjust the settings page background opacity',
  bgTitle: 'Wallpaper', bgChoose: 'Choose image', bgRemove: 'Remove image',
  bgEdit: 'Edit position', wpOpacity: 'Wallpaper opacity', bgBlur: 'Wallpaper blur',
  bgHint: 'Drag sliders for real-time adjustment. Click the image to open the editor',
  editorTitle: 'Background editor', editorHint: 'Drag to move, scroll to zoom',
  editorCommit: 'Confirm', editorCancel: 'Cancel', editorReset: 'Reset',
}

// ── Persistence (file-backed via node half) ───────────────────────────────────
// The node half owns `.dsh-any-background-data/` on the DSH data home. This
// module keeps an in-memory ThemeConfig mirror + the wallpaper data URL, and
// pushes changes to the node half over the shared `/api` RPC channel. Reads
// fall back to defaults when the connection is unavailable or the file is
// missing/malformed, so the UI never crashes on a broken store.

interface BgState { zoom: number; x: number; y: number; iw: number; ih: number }
interface ThemeConfig {
  color: [number, number, number] | null
  opacity: number
  settingsOpacity: number
  wallpaperOpacity: number
  blur: number
  bgState: BgState
}
interface RpcResultLike { ok: boolean; value?: any; error?: any }

const DEFAULT_CONFIG: ThemeConfig = {
  color: null,
  opacity: 0.85,
  settingsOpacity: 1,
  wallpaperOpacity: 1,
  blur: 0,
  bgState: { zoom: 1, x: 0, y: 0, iw: 0, ih: 0 },
}

let cfg: ThemeConfig = { ...DEFAULT_CONFIG, bgState: { ...DEFAULT_CONFIG.bgState } }
let wpUrl: string | null = null
let rpcCallFn: ((endpoint: string, payload: unknown) => Promise<RpcResultLike | undefined>) | null = null

const RPC_CHANNEL = '/api'
const RPC_NS = 'dshAnyBackground'
const rpcEndpoint = (method: string): string => `${RPC_NS}/${method}`

async function rpcCall(method: string, payload: unknown): Promise<any> {
  if (!rpcCallFn) return undefined
  try {
    const res = await rpcCallFn(rpcEndpoint(method), payload)
    if (res && res.ok === true) return res.value
    console.warn(`dsh-any-background: rpc "${method}" failed`, res?.error)
    return undefined
  } catch (e) {
    console.warn(`dsh-any-background: rpc "${method}" threw`, e)
    return undefined
  }
}

/** Move a possibly-absent partial config into the shape the UI reads. */
function adoptConfig(raw: any): void {
  const c = (raw ?? {}) as Partial<ThemeConfig>
  const color = Array.isArray(c.color) && c.color.length === 3
    ? [c.color[0], c.color[1], c.color[2]] as [number, number, number]
    : null
  const bg = (c.bgState ?? {}) as Partial<BgState>
  cfg = {
    color,
    opacity: typeof c.opacity === 'number' ? c.opacity : DEFAULT_CONFIG.opacity,
    settingsOpacity: typeof c.settingsOpacity === 'number' ? c.settingsOpacity : DEFAULT_CONFIG.settingsOpacity,
    wallpaperOpacity: typeof c.wallpaperOpacity === 'number' ? c.wallpaperOpacity : DEFAULT_CONFIG.wallpaperOpacity,
    blur: typeof c.blur === 'number' ? c.blur : DEFAULT_CONFIG.blur,
    bgState: {
      zoom: typeof bg.zoom === 'number' ? bg.zoom : 1,
      x: typeof bg.x === 'number' ? bg.x : 0,
      y: typeof bg.y === 'number' ? bg.y : 0,
      iw: typeof bg.iw === 'number' && bg.iw > 0 ? bg.iw : 0,
      ih: typeof bg.ih === 'number' && bg.ih > 0 ? bg.ih : 0,
    },
  }
}

/** Persist the current in-memory config to the node half (fire-and-forget). */
function saveConfig(): void {
  void rpcCall('writeConfig', { config: cfg })
}

/** Load the persisted theme (config + wallpaper) from the node half. */
async function loadPersisted(): Promise<void> {
  const data = await rpcCall('read', {})
  if (data) {
    if (data.config) adoptConfig(data.config)
    if (typeof data.wallpaper === 'string') wpUrl = data.wallpaper
    else if (data.wallpaper === null) wpUrl = null
  }
}

function rHasColor(): boolean { return cfg.color !== null }
function rColor(): [number, number, number] { return cfg.color ?? [220, 0.55, 0.25] }
function rWp(): string | null { return wpUrl }
function rOp(): number { return typeof cfg.opacity === 'number' ? Math.min(1, Math.max(0, cfg.opacity)) : DEF_OP }
function rWop(): number { return typeof cfg.wallpaperOpacity === 'number' ? Math.min(1, Math.max(0, cfg.wallpaperOpacity)) : 1 }
function rBl(): number { return typeof cfg.blur === 'number' ? Math.min(60, Math.max(0, cfg.blur)) : DEF_BL }
function rSop(): number { return typeof cfg.settingsOpacity === 'number' ? Math.min(1, Math.max(0, cfg.settingsOpacity)) : DEF_SOP }
function rBgState(): BgState { return cfg.bgState }

// ── HSV ↔ HSL ────────────────────────────────────────────────────────────────
// The wheel works in HSV end to end: props and pickSL are HSV, the canvas
// renders the HSV S-V plane directly. Storage and genTokens expect HSL, so
// setColor converts HSV → HSL at the boundary; sectionInject converts stored
// HSL → HSV for the initial wheel props. Conversions never stack.

function hsvToHsl(h: number, s: number, v: number): [number, number, number] {
  const l = v * (1 - s / 2)
  const sl = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l)
  return [h, sl, l]
}

function hslToHsv(h: number, s: number, l: number): [number, number, number] {
  const v = l + s * Math.min(l, 1 - l)
  const sv = v === 0 ? 0 : 2 * (1 - l / v)
  return [h, sv, v]
}

// ── Token generation from HSL ──────────────────────────────────────────────────

function genTokens(hue: number, sat: number, lit: number): { colorScheme: 'light' | 'dark'; tokens: Record<string, string> } {
  const dark = lit < 0.55
  const h = (d: number) => ((hue + d) % 360 + 360) % 360
  const s = (d: number) => Math.max(0, Math.min(1, sat + d))
  const l = (d: number) => Math.max(0, Math.min(1, lit + d))
  const hsl = (hh: number, ss: number, ll: number) => `hsl(${Math.round(hh)},${Math.round(ss * 100)}%,${Math.round(ll * 100)}%)`
  const rgba = (hh: number, ss: number, ll: number, a: number) => {
    const c = `hsl(${Math.round(hh)},${Math.round(ss * 100)}%,${Math.round(ll * 100)}%)`
    void c; return `hsla(${Math.round(hh)},${Math.round(ss * 100)}%,${Math.round(ll * 100)}%,${a})`
  }

  if (dark) {
    return {
      colorScheme: 'dark',
      tokens: {
        '--dsw-alias-bg-base': hsl(h(0), s(0), l(-0.04)),
        '--dsw-alias-bg-layer-1': hsl(h(0), s(0), l(0.02)),
        '--dsw-alias-bg-layer-2': hsl(h(0), s(0), l(0.07)),
        '--dsw-alias-bg-layer-3': hsl(h(0), s(-0.05), l(0.12)),
        '--dsw-alias-bg-overlay': hsl(h(0), s(-0.05), l(0.12)),
        '--dsw-alias-border-l1': rgba(h(0), s(-0.1), l(0.18), 0.12),
        '--dsw-alias-border-l2': rgba(h(0), s(-0.1), l(0.22), 0.22),
        '--dsw-alias-label-primary': hsl(0, 0, 1),
        '--dsw-alias-label-secondary': hsl(0, 0, 1),
        '--dsw-alias-label-tertiary': hsl(0, 0, 1),
        '--dsw-alias-brand-primary': hsl(h(0), s(0.1), Math.max(l(0.2), 0.5)),
        '--dsw-alias-brand-text': l(0.2) > 0.6 ? '#000' : '#fff',
        '--dsw-alias-button-primary-hover': hsl(h(0), s(0.1), Math.max(l(0.28), 0.58)),
        '--dsw-alias-button-primary-dimmed': hsl(h(0), s(0), l(0.07)),
        '--dsw-alias-button-elevated-fill': hsl(h(0), s(0), l(0.04)),
        '--dsw-alias-interactive-bg-hover': rgba(h(0), s(0), Math.max(l(0.15), 0.4), 0.12),
        '--dsw-alias-interactive-bg-active': rgba(h(0), s(0), Math.max(l(0.15), 0.4), 0.2),
        '--dsw-alias-markdown-code-block': hsl(h(0), s(0), l(-0.06)),
        '--dsw-alias-markdown-inline-code': hsl(h(0), s(0), l(0.04)),
        '--dsw-alias-state-error-primary': '#ff5c72',
        '--dsw-alias-state-success-primary': '#3ddc84',
        '--dsw-alias-state-warn-primary': '#ffb347',
        '--dsw-specific-sidebar-fill': hsl(h(0), s(0), l(-0.06)),
        '--dsw-specific-sidebar-nav-item-active': hsl(h(0), s(0), l(0.04)),
        '--dsw-specific-sidebar-nav-item-hover': hsl(h(0), s(0), l(0)),
        '--dsw-specific-input-major': hsl(h(0), s(0), l(0.02)),
        '--dsw-alias-scrollbar-bg-l1': hsl(h(0), s(-0.05), l(0.12)),
        '--dsw-alias-scrollbar-bg-l2': hsl(h(0), s(-0.05), l(0.16)),
        '--dsw-alias-scrollbar-hover-l1': hsl(h(0), s(-0.05), l(0.22)),
        '--dsw-alias-scrollbar-hover-l2': hsl(h(0), s(-0.05), l(0.22)),
      },
    }
  }
  return {
    colorScheme: 'light',
    tokens: {
      // Backgrounds track the picked color at its lightness — theme-colored,
      // with only mild desaturation so the surfaces stay readable.
      '--dsw-alias-bg-base': hsl(h(0), s(-0.08), l(0.03)),
      '--dsw-alias-bg-layer-1': hsl(h(0), s(-0.12), l(0.07)),
      '--dsw-alias-bg-layer-2': hsl(h(0), s(-0.1), l(-0.03)),
      '--dsw-alias-bg-layer-3': hsl(h(0), s(-0.08), l(-0.09)),
      '--dsw-alias-bg-overlay': hsl(h(0), s(-0.12), l(0.08)),
      '--dsw-alias-border-l1': rgba(h(0), s(-0.15), l(-0.35), 0.18),
      '--dsw-alias-border-l2': rgba(h(0), s(-0.15), l(-0.35), 0.3),
      // Text is pure black on light surfaces, pure white on dark.
      '--dsw-alias-label-primary': hsl(0, 0, 0),
      '--dsw-alias-label-secondary': hsl(0, 0, 0),
      '--dsw-alias-label-tertiary': hsl(0, 0, 0),
      '--dsw-alias-brand-primary': hsl(h(0), s(0.05), Math.min(l(-0.18), 0.45)),
      '--dsw-alias-brand-text': '#fff',
      '--dsw-alias-button-primary-hover': hsl(h(0), s(0.05), Math.min(l(-0.12), 0.5)),
      '--dsw-alias-button-primary-dimmed': hsl(h(0), s(-0.1), l(-0.03)),
      '--dsw-alias-button-elevated-fill': hsl(h(0), s(-0.1), l(0.1)),
      '--dsw-alias-interactive-bg-hover': rgba(h(0), s(0), l(-0.3), 0.08),
      '--dsw-alias-interactive-bg-active': rgba(h(0), s(0), l(-0.3), 0.14),
      '--dsw-alias-markdown-code-block': hsl(h(0), s(-0.1), l(-0.03)),
      '--dsw-alias-markdown-inline-code': hsl(h(0), s(-0.08), l(0.04)),
      '--dsw-specific-sidebar-fill': hsl(h(0), s(-0.1), l(-0.03)),
      '--dsw-specific-sidebar-nav-item-active': hsl(h(0), s(-0.08), l(0.05)),
      '--dsw-specific-sidebar-nav-item-hover': hsl(h(0), s(-0.12), l(0)),
      '--dsw-specific-input-major': hsl(h(0), s(-0.12), l(0.1)),
      '--dsw-alias-scrollbar-bg-l1': hsl(h(0), s(-0.1), l(-0.08)),
      '--dsw-alias-scrollbar-bg-l2': hsl(h(0), s(-0.08), l(-0.12)),
      '--dsw-alias-scrollbar-hover-l1': hsl(h(0), s(-0.08), l(-0.16)),
      '--dsw-alias-scrollbar-hover-l2': hsl(h(0), s(-0.08), l(-0.16)),
    },
  }
}

// ── Wallpaper layer (direct DOM) ───────────────────────────────────────────────

let wpEl: HTMLDivElement | null = null
let ctxRef: Ctx = null as any

function toRgba(c: string, a: number): string {
  const hx = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c.trim())
  if (hx) { let d = hx[1]!; if (d.length === 3) d = d.split('').map(x => x + x).join(''); const n = parseInt(d, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})` }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(c.trim())
  if (rgb) return `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${a})`
  const hsl = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i.exec(c.trim())
  if (hsl) return `hsla(${hsl[1]},${hsl[2]}%,${hsl[3]}%,${a})`
  return c.trim()
}

let appliedTokenNames: string[] = []

/** Remove every inline token this plugin wrote (teardown symmetry). */
function clearCustomTokens(): void {
  for (const name of appliedTokenNames) document.body.style.removeProperty(name)
  appliedTokenNames = []
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
function applyCustomTokens(op: number): void {
  const [h, s, l] = rColor()
  const { tokens } = genTokens(h, s, l)
  const sideOp = Math.min(1, op + 0.08)
  clearCustomTokens()
  // Drive the base-palette switch ourselves so tokens the plugin does not
  // override (the input surface, masks, static tokens) follow the picked
  // color's dark/light scheme even while the theme service preference is
  // being adopted/reset.
  if (l < 0.55) document.body.setAttribute('data-ds-dark-theme', '')
  else document.body.removeAttribute('data-ds-dark-theme')
  for (const [name, value] of Object.entries(tokens)) {
    let v = value
    if (name === '--dsw-alias-bg-base') v = toRgba(value, op)
    else if (name === '--dsw-specific-sidebar-fill') v = toRgba(value, sideOp)
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
const SETTINGS_STYLE_RULE = `${SETTINGS_PANEL_SEL}{background:var(--dsh-any-bg-settings-surface,var(--dsw-alias-bg-layer-2))}`

function applySettingsOverrides(op: number): void {
  if (op >= 1) {
    document.documentElement.style.removeProperty('--dsh-any-bg-settings-surface')
    return
  }
  // Derive the panel surface from the saved color's layer-2 token (not a
  // computed-style read), so the settings panel matches the homepage tint
  // without depending on the presenter or theme state.
  const [h, s, l] = rColor()
  const layer2 = genTokens(h, s, l).tokens['--dsw-alias-bg-layer-2']
  if (layer2 !== undefined) {
    document.documentElement.style.setProperty('--dsh-any-bg-settings-surface', toRgba(layer2, op))
  }
}

function applyWp(ctx: Ctx): void {
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
  // Theme color + opacity: write the full token set inline (self-contained),
  // then the settings panel surface.
  const op = rOp()
  applyCustomTokens(op)
  applySettingsOverrides(rSop())
}
function teardownWp(): void {
  wpEl?.remove(); wpEl = null
  clearCustomTokens()
  document.documentElement.style.removeProperty('--dsh-any-bg-settings-surface')
}

// ── Color Wheel (combined hue ring + SL square on single canvas) ───────────────

const WHEEL_SIZE = 220
const CX = WHEEL_SIZE / 2
const RING_OUTER = 106
const RING_INNER = 82
// Square inscribed in the ring's inner circle: half-side = RING_INNER / √2,
// so the four corners sit exactly on the inner edge of the hue ring.
const SQ_HALF = Math.round(RING_INNER / Math.SQRT2)

function drawWheel(cvs: HTMLCanvasElement, hue: number, sat: number, lit: number): void {
  // Wheel coordinates are HSV (the S-V plane); props arrive in HSV from the
  // section. The HSL conversion happens at the setColor boundary.
  const c = cvs.getContext('2d')!
  c.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE)
  // Hue ring
  for (let a = 0; a < 360; a++) {
    const r1 = (a - 90) * Math.PI / 180
    const r2 = (a + 1.5 - 90) * Math.PI / 180
    c.beginPath(); c.arc(CX, CX, RING_OUTER, r1, r2); c.arc(CX, CX, RING_INNER, r2, r1, true); c.closePath()
    c.fillStyle = `hsl(${a},100%,50%)`; c.fill()
  }
  // SL square inside ring (HSV S-V plane)
  const gx = CX - SQ_HALF, gy = CX - SQ_HALF, sz = SQ_HALF * 2
  c.fillStyle = '#fff'; c.fillRect(gx, gy, sz, sz)
  const gh = c.createLinearGradient(gx, 0, gx + sz, 0)
  gh.addColorStop(0, 'rgba(255,255,255,1)'); gh.addColorStop(1, `hsl(${hue},100%,50%)`)
  c.fillStyle = gh; c.fillRect(gx, gy, sz, sz)
  const gv = c.createLinearGradient(0, gy, 0, gy + sz)
  gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(0,0,0,1)')
  c.fillStyle = gv; c.fillRect(gx, gy, sz, sz)
  // Hue marker on ring
  const hRad = (hue - 90) * Math.PI / 180
  const hR = (RING_OUTER + RING_INNER) / 2
  const hmx = CX + Math.cos(hRad) * hR, hmy = CX + Math.sin(hRad) * hR
  c.beginPath(); c.arc(hmx, hmy, 8, 0, Math.PI * 2)
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill()
  c.beginPath(); c.arc(hmx, hmy, 6.5, 0, Math.PI * 2)
  c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke()
  // SL marker (HSV coordinates)
  const smx = gx + sat * sz, smy = gy + (1 - lit) * sz
  c.beginPath(); c.arc(smx, smy, 7, 0, Math.PI * 2)
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill()
  c.beginPath(); c.arc(smx, smy, 5.5, 0, Math.PI * 2)
  c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke()
  c.beginPath(); c.arc(smx, smy, 3.5, 0, Math.PI * 2)
  c.strokeStyle = '#000'; c.lineWidth = 1; c.stroke()
}

function hitTest(x: number, y: number): 'ring' | 'square' | null {
  if (Math.abs(x - CX) <= SQ_HALF && Math.abs(y - CX) <= SQ_HALF) return 'square'
  const dx = x - CX, dy = y - CX
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist >= RING_INNER - 4 && dist <= RING_OUTER + 4) return 'ring'
  return null
}

function pickHue(x: number, y: number): number {
  let angle = Math.atan2(y - CX, x - CX) * 180 / Math.PI + 90
  if (angle < 0) angle += 360
  return angle
}

function pickSL(x: number, y: number): [number, number] {
  const gx = CX - SQ_HALF, gy = CX - SQ_HALF, sz = SQ_HALF * 2
  return [
    Math.max(0, Math.min(1, (x - gx) / sz)),
    Math.max(0.02, Math.min(0.98, 1 - (y - gy) / sz)),
  ]
}

function ColorWheel({ hue, sat, lit, onChange }: {
  hue: number; sat: number; lit: number
  onChange: (h: number, s: number, l: number) => void
}) {
  const cvsRef = useRef<HTMLCanvasElement>(null)
  // Internal HSV state: the slots host caches injected section props once, so
  // the canvas must redraw from interaction state instead of from props.
  const [col, setCol] = useState({ hue, sat, lit })
  const colRef = useRef(col)
  colRef.current = col

  // Adopt external changes (e.g. section remount after theme restore).
  useEffect(() => {
    setCol(c => (c.hue === hue && c.sat === sat && c.lit === lit ? c : { hue, sat, lit }))
  }, [hue, sat, lit])

  useEffect(() => { if (cvsRef.current) drawWheel(cvsRef.current, col.hue, col.sat, col.lit) }, [col])

  const apply = useCallback((nh: number, ns: number, nl: number) => {
    setCol({ hue: nh, sat: ns, lit: nl })
    onChange(nh, ns, nl)
  }, [onChange])

  const onDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = cvsRef.current!.getBoundingClientRect()
    const x = e.clientX - r.left, y = e.clientY - r.top
    const region = hitTest(x, y)
    if (!region) return
    if (region === 'ring') {
      apply(pickHue(x, y), colRef.current.sat, colRef.current.lit)
    } else {
      const [s, l] = pickSL(x, y)
      apply(colRef.current.hue, s, l)
    }
    const onMove = (ev: MouseEvent) => {
      const rr = cvsRef.current!.getBoundingClientRect()
      const mx = ev.clientX - rr.left, my = ev.clientY - rr.top
      if (region === 'ring') {
        const d = Math.sqrt((mx - CX) ** 2 + (my - CX) ** 2)
        if (d >= RING_INNER - 10 && d <= RING_OUTER + 10) apply(pickHue(mx, my), colRef.current.sat, colRef.current.lit)
      } else {
        const [s, l] = pickSL(mx, my)
        apply(colRef.current.hue, s, l)
      }
    }
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
  }, [apply])

  return <canvas ref={cvsRef} width={WHEEL_SIZE} height={WHEEL_SIZE} style={ST.wheelCanvas} onMouseDown={onDown} />
}

// ── Image compression ──────────────────────────────────────────────────────────

function compress(img: HTMLImageElement, side: number, q: number): string {
  const s = Math.min(1, side / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s))
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', q)
}
function readImg(file: File, cb: (url: string | null) => void): void {
  const r = new FileReader()
  r.onerror = () => cb(null)
  r.onload = () => {
    const img = new Image()
    img.onerror = () => cb(null)
    img.onload = () => {
      try { let u = compress(img, 1600, 0.75); if (u.length > 2e6) u = compress(img, 1000, 0.6); if (u.length > 2e6) u = compress(img, 800, 0.5); cb(u) } catch { cb(null) }
    }
    img.src = r.result as string
  }
  r.readAsDataURL(file)
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const ST = {
  root: { display: 'flex', flexDirection: 'column' as const, gap: '20px', padding: '4px 0', maxWidth: '640px' },
  h2: { color: 'var(--dsw-alias-label-primary)', fontSize: '18px', fontWeight: 600, margin: 0 },
  sub: { color: 'var(--dsw-alias-label-tertiary)', fontSize: '13px' },
  hr: { height: '1px', background: 'var(--dsw-alias-border-l2)', border: 'none', margin: '4px 0' },
  label: { color: 'var(--dsw-alias-label-primary)', fontSize: '16px', fontWeight: 600, marginBottom: '8px' },
  hint: { color: 'var(--dsw-alias-label-tertiary)', fontSize: '12px', lineHeight: '18px', marginTop: '4px' },
  colorHint: { color: 'var(--dsw-alias-label-tertiary)', fontSize: '12px', lineHeight: '18px', marginTop: '7px', textAlign: 'center' as const },
  wheelCanvas: { cursor: 'crosshair', borderRadius: '50%' },
  center: { display: 'flex', justifyContent: 'center' },
  btnGroup: { display: 'flex', justifyContent: 'center', marginTop: '10px' },
  row: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const },
  sliderBlock: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  sliderRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  sliderLabel: { color: 'var(--dsw-alias-label-secondary)', fontSize: '13px' },
  smallHint: { color: 'var(--dsw-alias-label-tertiary)', fontSize: '11px', lineHeight: '16px' },
  slider: { flex: 1, accentColor: 'var(--dsw-alias-brand-primary)', minWidth: '160px' },
  sliderVal: { color: 'var(--dsw-alias-label-secondary)', fontSize: '12px', whiteSpace: 'nowrap' as const, width: '44px', textAlign: 'right' as const },
  btn: { height: '32px', padding: '0 14px', borderRadius: '8px', border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-button-elevated-fill)', color: 'var(--dsw-alias-label-primary)', cursor: 'pointer', fontSize: '13px', font: 'inherit', boxSizing: 'border-box' as const },
  btnDanger: { color: 'var(--dsw-alias-state-error-primary)' },
  btnPrimary: { background: 'var(--dsw-alias-brand-primary)', color: 'var(--dsw-alias-brand-text)', border: 'none' },
  preview: { width: '368px', height: '225px', objectFit: 'cover' as const, borderRadius: '6px', border: '1px solid var(--dsw-alias-border-l2)', cursor: 'pointer' },
  sliders: { display: 'flex', flexDirection: 'column' as const, gap: '12px', marginTop: '8px' },
  // Modal
  overlay: { position: 'fixed' as const, inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '12px' },
  modalTitle: { color: '#fff', fontSize: '16px', fontWeight: 500 },
  modalHint: { color: 'rgba(255,255,255,0.6)', fontSize: '12px' },
  previewRect: { position: 'relative' as const, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '8px', background: '#000', cursor: 'grab' },
  previewImg: { position: 'absolute' as const, transformOrigin: '0 0', pointerEvents: 'none' as const },
  modalBtns: { display: 'flex', gap: '10px' },
}

// ── Background Editor Modal ────────────────────────────────────────────────────

function BgEditor({ url, t, onClose, onCommit }: {
  url: string; t: (key: string) => string; onClose: () => void
  onCommit: (zoom: number, x: number, y: number, iw: number, ih: number) => void
}) {
  const pw = Math.min(window.innerWidth * 0.75, 860)
  const ph = Math.round(pw * window.innerHeight / window.innerWidth)
  const saved = rBgState()
  const [zoom, setZoom] = useState(saved.iw > 0 ? saved.zoom : 1)
  const [pos, setPos] = useState(saved.iw > 0 ? { x: saved.x * pw, y: saved.y * ph } : { x: 0, y: 0 })
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef({ active: false, sx: 0, sy: 0, spx: 0, spy: 0 })

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(pw / img.width, ph / img.height)
      const w = img.width * scale, h = img.height * scale
      setImgSize({ w, h })
      const s = rBgState()
      if (s.iw > 0 && s.iw === img.width && s.ih === img.height) {
        setZoom(s.zoom)
        // Saved x, y are CENTER fractions of the preview: the image center
        // lands at (x·pw, y·ph), so the top-left comes from subtracting half
        // the displayed (zoom-scaled) image size.
        setPos({ x: s.x * pw - w * s.zoom / 2, y: s.y * ph - h * s.zoom / 2 })
      } else {
        setZoom(1)
        setPos({ x: (pw - w) / 2, y: (ph - h) / 2 })
      }
    }
    img.src = url
  }, [url, pw, ph])

  const onDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { active: true, sx: e.clientX, sy: e.clientY, spx: pos.x, spy: pos.y }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.active) return
      setPos({ x: dragRef.current.spx + ev.clientX - dragRef.current.sx, y: dragRef.current.spy + ev.clientY - dragRef.current.sy })
    }
    const onUp = () => { dragRef.current.active = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
  }, [pos])

  const onWheelCb = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const rect = containerRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const factor = e.deltaY > 0 ? 0.92 : 1.08
    const nz = Math.max(0.1, Math.min(10, zoom * factor))
    const nx = mx - (mx - pos.x) * (nz / zoom)
    const ny = my - (my - pos.y) * (nz / zoom)
    setZoom(nz); setPos({ x: nx, y: ny })
  }, [zoom, pos])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', onWheelCb, { passive: false })
    return () => el.removeEventListener('wheel', onWheelCb)
  }, [onWheelCb])

  const resetView = useCallback(() => {
    if (imgSize.w === 0) return
    setZoom(1); setPos({ x: (pw - imgSize.w) / 2, y: (ph - imgSize.h) / 2 })
  }, [pw, ph, imgSize])

  return (
    <div style={ST.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={ST.modalTitle}>{t('editorTitle')}</div>
      <div ref={containerRef} style={{ ...ST.previewRect, width: pw, height: ph }} onMouseDown={onDown}>
        <img ref={imgRef} src={url} alt="" draggable={false} style={{
          ...ST.previewImg, width: imgSize.w, height: imgSize.h,
          transform: `translate(${pos.x}px,${pos.y}px) scale(${zoom})`,
        }} />
      </div>
      <div style={ST.modalHint}>{t('editorHint')}</div>
      <div style={ST.modalBtns}>
        <button style={ST.btn} onClick={resetView}>{t('editorReset')}</button>
        <button style={ST.btn} onClick={onClose}>{t('editorCancel')}</button>
        <button style={{ ...ST.btn, ...ST.btnPrimary }} onClick={() => onCommit(zoom, (pos.x + imgSize.w * zoom / 2) / pw, (pos.y + imgSize.h * zoom / 2) / ph, imgRef.current?.naturalWidth ?? 0, imgRef.current?.naturalHeight ?? 0)}>{t('editorCommit')}</button>
      </div>
    </div>
  )
}

// ── Uncontrolled slider ────────────────────────────────────────────────────────

function LiveSlider({ min, max, step, def, fmt, onInput, onChange }: {
  min: number; max: number; step: number; def: number
  fmt: (v: number) => string; onInput: (v: number) => void; onChange: (v: number) => void
}) {
  const valRef = useRef<HTMLSpanElement>(null)
  return (
    <div style={ST.sliderRow}>
      <input type="range" min={min} max={max} step={step} defaultValue={def} style={ST.slider}
        onInput={e => { const v = Number((e.target as HTMLInputElement).value); onInput(v); if (valRef.current) valRef.current.textContent = fmt(v) }}
        onChange={e => onChange(Number((e.target as HTMLInputElement).value))} />
      <span ref={valRef} style={ST.sliderVal}>{fmt(def)}</span>
    </div>
  )
}

// ── Theme Section ──────────────────────────────────────────────────────────────

function ThemeSection(props: any) {
  const { t, hue, sat, lit, setColor, url, setWp, setOp, setWop, setBl, setSop, useStore } = props
  const storeUrl = useStore((s: any) => s.url)
  const fileRef = useRef<HTMLInputElement>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  return (
    <div style={ST.root}>
      <div><h2 style={ST.h2}>{t('nav')}</h2><div style={ST.sub}>{t('subtitle')}</div></div>

      {/* Theme color */}
      <div>
        <div style={ST.label}>{t('colorTitle')}</div>
        <div style={ST.center}><ColorWheel hue={hue} sat={sat} lit={lit} onChange={setColor} /></div>
        <div style={ST.colorHint}>{t('colorHint')}</div>
      </div>

      <hr style={ST.hr} />

      {/* Interface: homepage + settings opacity, each its own slider */}
      <div>
        <div style={ST.label}>{t('uiTitle')}</div>
        <div style={ST.sliders}>
          <div style={ST.sliderBlock}>
            <div style={ST.sliderLabel}>{t('uiOpacity')}</div>
            <div style={ST.smallHint}>{t('uiOpacityHint')}</div>
            <LiveSlider min={0} max={100} step={1} def={Math.round(rOp() * 100)}
              fmt={v => `${v}%`}
              onInput={v => { const op = v / 100; cfg.opacity = op; applyCustomTokens(op); saveConfig() }}
              onChange={v => setOp(v / 100)} />
          </div>
          <div style={ST.sliderBlock}>
            <div style={ST.sliderLabel}>{t('uiSop')}</div>
            <div style={ST.smallHint}>{t('uiSopHint')}</div>
            <LiveSlider min={0} max={100} step={1} def={Math.round(rSop() * 100)}
              fmt={v => `${v}%`}
              onInput={v => { const op = v / 100; cfg.settingsOpacity = op; applySettingsOverrides(op); saveConfig() }}
              onChange={v => setSop(v / 100)} />
          </div>
        </div>
      </div>

      <hr style={ST.hr} />

      {/* Background image */}
      <div>
        <div style={ST.label}>{t('bgTitle')}</div>
        <div style={ST.center}>{storeUrl ? <img src={storeUrl} alt="" style={ST.preview} onClick={() => setEditorOpen(true)} /> : null}</div>
        <div style={ST.btnGroup}>
          <div style={ST.row}>
            <button type="button" style={ST.btn} onClick={() => fileRef.current?.click()}>{t('bgChoose')}</button>
            {storeUrl ? <button type="button" style={ST.btn} onClick={() => setEditorOpen(true)}>{t('bgEdit')}</button> : null}
            {storeUrl ? <button type="button" style={{ ...ST.btn, ...ST.btnDanger }} onClick={() => setWp(null)}>{t('bgRemove')}</button> : null}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
              const f = e.target.files?.[0]; if (!f) return
              readImg(f, d => { if (d) setWp(d); e.target.value = '' })
            }} />
          </div>
        </div>
        <div style={ST.sliders}>
          <div style={ST.sliderBlock}>
            <div style={ST.sliderLabel}>{t('wpOpacity')}</div>
            <LiveSlider min={0} max={100} step={1} def={Math.round(rWop() * 100)}
              fmt={v => `${v}%`}
              onInput={v => { const op = v / 100; cfg.wallpaperOpacity = op; if (wpEl) wpEl.style.opacity = String(op); saveConfig() }}
              onChange={v => setWop(v / 100)} />
          </div>
          <div style={ST.sliderBlock}>
            <div style={ST.sliderLabel}>{t('bgBlur')}</div>
            <LiveSlider min={0} max={60} step={1} def={rBl()}
              fmt={v => `${v}px`}
              onInput={v => { cfg.blur = v; if (wpEl) wpEl.style.filter = v > 0 ? `blur(${v}px)` : 'none'; saveConfig() }}
              onChange={v => setBl(v)} />
          </div>
        </div>
        <div style={ST.hint}>{t('bgHint')}</div>
      </div>

      {/* Background editor modal */}
      {editorOpen && storeUrl ? (
        <BgEditor url={storeUrl} t={t} onClose={() => setEditorOpen(false)}
          onCommit={(z, x, y, iw, ih) => { cfg.bgState = { zoom: z, x, y, iw, ih }; applyWp(ctxRef); saveConfig(); setEditorOpen(false) }} />
      ) : null}
    </div>
  )
}

// ── Plugin entry ───────────────────────────────────────────────────────────────

export function apply(ctx: Ctx): void {
  ctxRef = ctx
  // Bind the shared `/api` RPC caller so the persistence module can reach the
  // node half's file-backed store.
  rpcCallFn = (endpoint: string, payload: unknown) =>
    ctx.connection.rpc.call(RPC_CHANNEL, endpoint, payload).then((res: any) => res as RpcResultLike | undefined)

  // 1. Restore custom color and register as a skin. The saved color's
  // lightness decides the scheme — a dark pick gets white text, a light pick
  // black text — so both the theme color and the dark/light text follow the
  // picked color.
  const [initH, initS, initL] = rColor()
  let customDispose: (() => void) | null = null
  // registerCustom takes HSL (the storage/wheel space and genTokens space).
  const registerCustom = (h: number, s: number, l: number) => {
    customDispose?.()
    try {
      const { colorScheme, tokens } = genTokens(h, s, l)
      customDispose = ctx.theme.register({ id: CUSTOM_ID, colorScheme, tokens })
    } catch {
      // A live registration from an earlier apply pass (HMR swap that could
      // not run this fiber's disposer) cannot be torn down here; keep it and
      // activate it below. Without this the duplicate-id throw would abort
      // apply and skip the wallpaper/opacity restore.
      customDispose = null
    }
    ctx.theme.setTheme(CUSTOM_ID)
  }
  // Restore saved color on boot.
  if (rHasColor()) registerCustom(initH, initS, initL)
  ctx.effect(() => () => { customDispose?.() }, 'dsh-any-background: skin dispose')

  // 2. Gradient CSS (for custom dark themes).
  let styleEl: HTMLStyleElement | undefined
  if (typeof document !== 'undefined') {
    styleEl = document.createElement('style')
    styleEl.dataset.plugin = 'dsh-any-background'
    styleEl.textContent = `body[data-ds-dark-theme="${CUSTOM_ID}"]::before{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(255,255,255,0.03) 0%,transparent 60%)}${SETTINGS_STYLE_RULE}`
    document.head.appendChild(styleEl)
  }
  ctx.effect(() => () => { styleEl?.parentNode?.removeChild(styleEl) }, 'dsh-any-background: gradient')

  // 3. State store.
  let rev = 0
  const store = defineStore({
    init: () => ({ url: null as string | null, rev: -1 }),
    actions: { syncBg: (d: any, url: string | null, r: number) => { if (r <= d.rev) return; d.url = url; d.rev = r } },
  })
  let bound: any
  const syncBg = () => { rev++; bound?.syncBg(rWp(), rev) }

  // 4. Wallpaper.
  applyWp(ctx); syncBg()
  // Load the file-backed theme from the node half and re-apply once it lands
  // (the node store may be absent or unreachable at this instant; defaults are
  // already applied above, and the deferred restore below re-asserts too).
  void loadPersisted().then(() => { applyWp(ctx); syncBg() })
  ctx.effect(() => () => { teardownWp() }, 'dsh-any-background: wp cleanup')
  ctx.effect(() => ctx.on('theme/change', () => {
    // The theme service persists only built-in preferences; the custom theme's
    // preference lives in memory, so a host-scope adoption can silently reset
    // it. While a color is saved, re-assert the custom theme so it stays
    // active. Guard on registry presence — registerCustom disposes the old
    // skin before re-registering, and during that transient the registry lacks
    // CUSTOM_ID, so asserting there would throw.
    if (rHasColor()) {
      const snapshot = ctx.theme.getTheme()
      if (snapshot.preference !== CUSTOM_ID && snapshot.themes.some(t => t.id === CUSTOM_ID)) {
        ctx.theme.setTheme(CUSTOM_ID)
      }
    }
    applyWp(ctx)
  }), 'dsh-any-background: theme change')
  // The wallpaper's inline size/position are absolute pixels computed for the
  // viewport at apply time, so a stale viewport leaves them misplaced.
  // Watch the viewport itself: a fixed inset:0 sentinel's box always equals
  // the viewport, so a ResizeObserver on it fires for ANY viewport change
  // (window resize, moving between monitors, panel splitters, zoom) where
  // window.resize can be missed; a resolution media query catches DPI-only
  // moves between differently scaled screens. All re-applies are coalesced to
  // one per animation frame. Re-running applyWp recomputes the contain-fit
  // scale and the fractional offsets for the new viewport (the editor's model).
  let frame = 0
  const applySoon = (): void => {
    if (frame !== 0) return
    frame = requestAnimationFrame(() => { frame = 0; applyWp(ctx) })
  }
  const sentinel = document.createElement('div')
  sentinel.style.cssText = 'position:fixed;inset:0;pointer-events:none;visibility:hidden'
  document.body.append(sentinel)
  const viewportObserver = new ResizeObserver(applySoon)
  viewportObserver.observe(sentinel)
  const dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
  dprQuery.addEventListener('change', applySoon)
  ctx.effect(() => () => {
    viewportObserver.disconnect()
    dprQuery.removeEventListener('change', applySoon)
    sentinel.remove()
  }, 'dsh-any-background: viewport watch')

  // 5. Locale.
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-any-background: i18n')

  // 6. Section injection.
  const sectionInject = (actions: any) => {
    bound = actions; syncBg()
    const [wh, ws, wl] = rColor()
    const [dh, ds, dv] = hslToHsv(wh, ws, wl)
    return {
      t: ctx.locale.bind(NS),
      hue: dh, sat: ds, lit: dv,
      setColor: (nh: number, ns: number, nl: number) => {
        const [sh, ss, sl] = hsvToHsl(nh, ns, nl)
        cfg.color = [sh, ss, sl]
        registerCustom(sh, ss, sl)
        applyWp(ctx)
        saveConfig()
      },
      setWp: (u: string | null) => {
        wpUrl = u
        cfg.bgState = { ...DEFAULT_CONFIG.bgState }
        applyWp(ctx); syncBg()
        void rpcCall('setWallpaper', { dataUrl: u })
      },
      setOp: (v: number) => { cfg.opacity = v; applyWp(ctx); syncBg(); saveConfig() },
      setWop: (v: number) => { cfg.wallpaperOpacity = v; applyWp(ctx); syncBg(); saveConfig() },
      setBl: (v: number) => { cfg.blur = v; applyWp(ctx); syncBg(); saveConfig() },
      setSop: (v: number) => { cfg.settingsOpacity = v; applySettingsOverrides(v); saveConfig() },
    }
  }
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: 'dsh-any-background', order: 35,
    label: () => ctx.locale.bind(NS)('nav'),
    locale: NS, store, inject: sectionInject,
  }, ThemeSection as any))

  // 7. Deferred boot restore: the theme service and the host settings scope
  // settle asynchronously after this apply, so the synchronous restore can be
  // observed mid-flight — a late host adoption resets the preference, or the
  // presenter re-applies over our overrides. Re-running the saved-color and
  // wallpaper restore a few ticks later guarantees the saved records land.
  const restoreSaved = (): void => {
    if (rHasColor()) {
      const [h, s, l] = rColor()
      registerCustom(h, s, l)
    }
    applyWp(ctx)
  }
  const restoreTimers = [300, 1500].map(delay => window.setTimeout(restoreSaved, delay))
  ctx.effect(() => () => { restoreTimers.forEach(id => window.clearTimeout(id)) }, 'dsh-any-background: boot restore')

  // 8. Theme watchdog: the theme service keeps only built-in preferences in
  // memory, so ANY host-scope adoption can silently drop the custom theme —
  // reverting the label colors (white/black) and the inner surfaces to the
  // system palette. While a color is saved, re-register and re-assert the
  // custom theme on a slow interval so the theme state always matches the
  // saved color and the active scheme, independent of which event resets it.
  const watchdogId = window.setInterval(() => {
    if (!rHasColor()) return
    const snapshot = ctx.theme.getTheme()
    let changed = false
    if (!snapshot.themes.some(t => t.id === CUSTOM_ID)) {
      const [h, s, l] = rColor()
      registerCustom(h, s, l)
      changed = true
    } else if (snapshot.preference !== CUSTOM_ID) {
      ctx.theme.setTheme(CUSTOM_ID)
      changed = true
    }
    if (changed) applyWp(ctx)
  }, 1000)
  ctx.effect(() => () => { window.clearInterval(watchdogId) }, 'dsh-any-background: theme watchdog')
}
