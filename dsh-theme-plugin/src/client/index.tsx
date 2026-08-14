/**
 * dsh-any-background — browser half.
 *
 * Appearance plugin with:
 * 1. PS-style color wheel (hue ring + saturation/lightness square) for
 *    real-time theme color selection with dynamic token generation.
 * 2. Background image editor modal with drag-to-pan and scroll-to-zoom
 *    inside a viewport-proportional preview rectangle.
 * 3. Opacity / blur sliders with zero-lag direct DOM manipulation.
 *
 * The color wheel uses two stacked canvases: a hue ring and an SL square.
 * Mouse interaction on either canvas regenerates the full theme token set
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
export const inject = ['slots', 'locale', 'theme']

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
interface Ctx {
  effect(cb: () => unknown, label?: string): void
  on(event: string, cb: (...a: any[]) => void): () => void
  locale: LocaleService; slots: SlotsService; theme: ThemeService
}

// ── Constants ──────────────────────────────────────────────────────────────────

const NS = 'settings.anyBg'
const LS_COLOR = 'dsh-any-background:color'
const LS_WP = 'dsh-any-background:wallpaper'
const LS_OP = 'dsh-any-background:opacity'
const LS_BL = 'dsh-any-background:blur'
const LS_BG = 'dsh-any-background:bgState'
const DEF_OP = 0.85; const DEF_BL = 0
const CUSTOM_ID = 'custom-color'

// ── i18n ───────────────────────────────────────────────────────────────────────

const zh: Record<string, string> = {
  nav: '主题', subtitle: '自定义界面外观',
  colorTitle: '主题色', colorHint: '在色轮上选择色相，在方形中调整饱和度和明度',
  bgTitle: '背景图片', bgChoose: '选择图片', bgRemove: '移除',
  bgEdit: '编辑位置', bgOpacity: '透明度', bgBlur: '模糊',
  bgHint: '拖动滑块实时调整。点击背景图可打开编辑器调整位置和大小',
  editorTitle: '背景编辑器', editorHint: '拖动移动图片，滚轮缩放大小',
  editorCommit: '确认', editorCancel: '取消', editorReset: '重置',
}
const en: Record<string, string> = {
  nav: 'Theme', subtitle: 'Customize appearance',
  colorTitle: 'Theme color', colorHint: 'Pick hue on the ring, adjust saturation & lightness in the square',
  bgTitle: 'Wallpaper', bgChoose: 'Choose image', bgRemove: 'Remove',
  bgEdit: 'Edit position', bgOpacity: 'Opacity', bgBlur: 'Blur',
  bgHint: 'Drag sliders for real-time adjustment. Click the image to open the editor',
  editorTitle: 'Background editor', editorHint: 'Drag to move, scroll to zoom',
  editorCommit: 'Confirm', editorCancel: 'Cancel', editorReset: 'Reset',
}

// ── localStorage ───────────────────────────────────────────────────────────────

function rLS(k: string): string | null {
  try { const v = localStorage.getItem(k); return typeof v === 'string' ? v : null } catch { return null }
}
function wLS(k: string, v: string | null): void {
  try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* */ }
}
function rColor(): [number, number, number] {
  try { const v = JSON.parse(rLS(LS_COLOR) || ''); if (Array.isArray(v) && v.length === 3) return v as [number, number, number] } catch { /* */ }
  return [220, 0.55, 0.25]
}
function rWp(): string | null { const v = rLS(LS_WP); return v?.length ? v : null }
function rOp(): number { const v = rLS(LS_OP); if (!v) return DEF_OP; const n = +v; return isFinite(n) ? Math.min(1, Math.max(0, n)) : DEF_OP }
function rBl(): number { const v = rLS(LS_BL); if (!v) return DEF_BL; const n = +v; return isFinite(n) ? Math.min(60, Math.max(0, n)) : DEF_BL }
function rBgState(): { zoom: number; px: number; py: number } {
  try { const v = JSON.parse(rLS(LS_BG) || ''); if (v && typeof v.zoom === 'number') return v } catch { /* */ }
  return { zoom: 1, px: 0, py: 0 }
}

// ── HSV ↔ HSL ────────────────────────────────────────────────────────────────
// The color wheel canvas renders an HSV S-V plane (white → hue → black),
// and pickSL returns HSV (H, S_hsv, V). genTokens expects HSL (H, S_hsl, L).
// These helpers convert at the boundary so the two halves stay consistent.

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
        '--dsw-alias-label-primary': hsl(h(0), s(-0.35), 0.92),
        '--dsw-alias-label-secondary': hsl(h(0), s(-0.3), 0.65),
        '--dsw-alias-label-tertiary': hsl(h(0), s(-0.3), 0.48),
        '--dsw-alias-brand-primary': hsl(h(0), s(0.1), Math.max(l(0.2), 0.5)),
        '--dsw-alias-brand-text': l(0.2) > 0.6 ? '#000' : '#fff',
        '--dsw-alias-button-primary-hover': hsl(h(0), s(0.1), Math.max(l(0.28), 0.58)),
        '--dsw-alias-button-primary-dimmed': hsl(h(0), s(0), l(0.07)),
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
      '--dsw-alias-bg-base': hsl(h(0), s(-0.2), l(0.04)),
      '--dsw-alias-bg-layer-1': hsl(h(0), s(-0.3), l(0.08)),
      '--dsw-alias-bg-layer-2': hsl(h(0), s(-0.2), l(-0.02)),
      '--dsw-alias-bg-layer-3': hsl(h(0), s(-0.15), l(-0.08)),
      '--dsw-alias-bg-overlay': hsl(h(0), s(-0.3), l(0.09)),
      '--dsw-alias-border-l1': rgba(h(0), s(-0.2), l(-0.2), 0.1),
      '--dsw-alias-border-l2': rgba(h(0), s(-0.2), l(-0.2), 0.18),
      '--dsw-alias-label-primary': hsl(h(0), s(-0.2), l(-0.35)),
      '--dsw-alias-label-secondary': hsl(h(0), s(-0.15), l(-0.15)),
      '--dsw-alias-label-tertiary': hsl(h(0), s(-0.1), l(-0.08)),
      '--dsw-alias-brand-primary': hsl(h(0), s(0.05), l(-0.15)),
      '--dsw-alias-brand-text': '#fff',
      '--dsw-alias-button-primary-hover': hsl(h(0), s(0.05), l(-0.1)),
      '--dsw-alias-button-primary-dimmed': hsl(h(0), s(-0.2), l(-0.02)),
      '--dsw-alias-interactive-bg-hover': rgba(h(0), s(0), l(-0.15), 0.08),
      '--dsw-alias-interactive-bg-active': rgba(h(0), s(0), l(-0.15), 0.14),
      '--dsw-alias-markdown-code-block': hsl(h(0), s(-0.2), l(-0.02)),
      '--dsw-alias-markdown-inline-code': hsl(h(0), s(-0.15), l(-0.04)),
      '--dsw-specific-sidebar-fill': hsl(h(0), s(-0.2), l(-0.02)),
      '--dsw-specific-sidebar-nav-item-active': hsl(h(0), s(-0.15), l(-0.06)),
      '--dsw-specific-sidebar-nav-item-hover': hsl(h(0), s(-0.18), l(-0.03)),
      '--dsw-alias-scrollbar-bg-l1': hsl(h(0), s(-0.15), l(-0.1)),
      '--dsw-alias-scrollbar-bg-l2': hsl(h(0), s(-0.12), l(-0.12)),
      '--dsw-alias-scrollbar-hover-l1': hsl(h(0), s(-0.1), l(-0.16)),
      '--dsw-alias-scrollbar-hover-l2': hsl(h(0), s(-0.1), l(-0.16)),
    },
  }
}

// ── Wallpaper layer (direct DOM) ───────────────────────────────────────────────

let wpEl: HTMLDivElement | null = null
let ovEl: HTMLStyleElement | null = null
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
function resolveBase(scheme: 'light' | 'dark', active: { colorScheme: string; tokens: Record<string, string> }): string {
  if (active.colorScheme === scheme && active.tokens['--dsw-alias-bg-base']) return active.tokens['--dsw-alias-bg-base']
  return scheme === 'light' ? 'rgb(255,255,255)' : 'rgb(21,21,23)'
}

/** Clear the direct CSS-variable overrides. */
function clearOv(): void {
  if (ovEl) { ovEl.remove(); ovEl = null }
}

/**
 * Apply semi-transparent overrides to bg-base and sidebar-fill via a dedicated
 * `<style>` element on `<html>`.  This bypasses the theme service's
 * `overrideTokens` mechanism so the overrides survive `setTheme` race
 * conditions — inline styles on `:root` always win over stylesheet rules.
 */
function applyBgOverrides(op: number): void {
  clearOv()
  const sideOp = Math.min(1, op + 0.08)
  const snap = ctxRef.theme.getTheme()
  const bgBase = toRgba(resolveBase('light', snap.active), op)
  const bgBaseDark = toRgba(resolveBase('dark', snap.active), op)
  const sideBase = toRgba(resolveBase('light', snap.active), sideOp)
  const sideBaseDark = toRgba(resolveBase('dark', snap.active), sideOp)
  ovEl = document.createElement('style')
  ovEl.dataset.plugin = 'dsh-any-background-ov'
  ovEl.textContent =
    `:root{` +
    `--dsw-alias-bg-base:${bgBase};` +
    `--dsw-specific-sidebar-fill:${sideBase}` +
    `}` +
    `@media(prefers-color-scheme:dark){:root{` +
    `--dsw-alias-bg-base:${bgBaseDark};` +
    `--dsw-specific-sidebar-fill:${sideBaseDark}` +
    `}}`
  // When the active theme explicitly declares a colorScheme, also force that
  // scheme's override regardless of system preference.
  if (snap.active.colorScheme === 'dark') {
    ovEl.textContent += `:root[data-ds-dark-theme]{--dsw-alias-bg-base:${bgBaseDark};--dsw-specific-sidebar-fill:${sideBaseDark}}`
  } else if (snap.active.colorScheme === 'light') {
    ovEl.textContent += `:root[data-ds-light-theme]{--dsw-alias-bg-base:${bgBase};--dsw-specific-sidebar-fill:${sideBase}}`
  }
  document.documentElement.appendChild(ovEl)
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
    wpEl.style.backgroundSize = `${Math.round(bg.zoom * 100)}%`
    wpEl.style.backgroundPosition = `${bg.px}px ${bg.py}px`
    const blur = rBl()
    wpEl.style.filter = blur > 0 ? `blur(${blur}px)` : 'none'
  }
  // Background transparency — applied via direct <style> on :root so it
  // survives theme switches regardless of overrideTokens lifecycle.
  const op = rOp()
  applyBgOverrides(op)
}
function teardownWp(): void { wpEl?.remove(); wpEl = null; clearOv() }

// ── Color Wheel (combined hue ring + SL square on single canvas) ───────────────

const WHEEL_SIZE = 220
const CX = WHEEL_SIZE / 2
const RING_OUTER = 106
const RING_INNER = 82
const SQ_HALF = 74

function drawWheel(cvs: HTMLCanvasElement, hue: number, sat: number, lit: number): void {
  // genTokens stores HSL; the canvas renders HSV S-V plane — convert back.
  const [hv, sv, vv] = hslToHsv(hue, sat, lit)
  const c = cvs.getContext('2d')!
  c.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE)
  // Hue ring
  for (let a = 0; a < 360; a++) {
    const r1 = (a - 90) * Math.PI / 180
    const r2 = (a + 1.5 - 90) * Math.PI / 180
    c.beginPath(); c.arc(CX, CX, RING_OUTER, r1, r2); c.arc(CX, CX, RING_INNER, r2, r1, true); c.closePath()
    c.fillStyle = `hsl(${a},100%,50%)`; c.fill()
  }
  // SL square inside ring (HSV S-V plane for the converted values)
  const gx = CX - SQ_HALF, gy = CX - SQ_HALF, sz = SQ_HALF * 2
  c.fillStyle = '#fff'; c.fillRect(gx, gy, sz, sz)
  const gh = c.createLinearGradient(gx, 0, gx + sz, 0)
  gh.addColorStop(0, 'rgba(255,255,255,1)'); gh.addColorStop(1, `hsl(${hv},100%,50%)`)
  c.fillStyle = gh; c.fillRect(gx, gy, sz, sz)
  const gv = c.createLinearGradient(0, gy, 0, gy + sz)
  gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(0,0,0,1)')
  c.fillStyle = gv; c.fillRect(gx, gy, sz, sz)
  // Hue marker on ring
  const hRad = (hv - 90) * Math.PI / 180
  const hR = (RING_OUTER + RING_INNER) / 2
  const hmx = CX + Math.cos(hRad) * hR, hmy = CX + Math.sin(hRad) * hR
  c.beginPath(); c.arc(hmx, hmy, 8, 0, Math.PI * 2)
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill()
  c.beginPath(); c.arc(hmx, hmy, 6.5, 0, Math.PI * 2)
  c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke()
  // SL marker (HSV coordinates)
  const smx = gx + sv * sz, smy = gy + (1 - vv) * sz
  c.beginPath(); c.arc(smx, smy, 7, 0, Math.PI * 2)
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill()
  c.beginPath(); c.arc(smx, smy, 5.5, 0, Math.PI * 2)
  c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke()
  c.beginPath(); c.arc(smx, smy, 3.5, 0, Math.PI * 2)
  c.strokeStyle = '#000'; c.lineWidth = 1; c.stroke()
}

function hitTest(x: number, y: number): 'ring' | 'square' | null {
  const dx = x - CX, dy = y - CX
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist >= RING_INNER - 4 && dist <= RING_OUTER + 4) return 'ring'
  if (Math.abs(x - CX) <= SQ_HALF && Math.abs(y - CX) <= SQ_HALF) return 'square'
  return null
}

function pickHue(x: number, y: number): number {
  let angle = Math.atan2(y - CX, x - CX) * 180 / Math.PI + 90
  if (angle < 0) angle += 360
  return angle
}

function pickSL(x: number, y: number): [number, number] {
  const gx = CX - SQ_HALF, sz = SQ_HALF * 2
  return [
    Math.max(0, Math.min(1, (x - gx) / sz)),
    Math.max(0.02, Math.min(0.98, 1 - (y - gx) / sz)),
  ]
}

function ColorWheel({ hue, sat, lit, onChange }: {
  hue: number; sat: number; lit: number
  onChange: (h: number, s: number, l: number) => void
}) {
  const cvsRef = useRef<HTMLCanvasElement>(null)
  const st = useRef({ hue, sat, lit })
  st.current = { hue, sat, lit }

  useEffect(() => { if (cvsRef.current) drawWheel(cvsRef.current, hue, sat, lit) }, [hue, sat, lit])

  const onDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = cvsRef.current!.getBoundingClientRect()
    const x = e.clientX - r.left, y = e.clientY - r.top
    const region = hitTest(x, y)
    if (!region) return
    if (region === 'ring') {
      onChange(pickHue(x, y), st.current.sat, st.current.lit)
    } else {
      const [s, l] = pickSL(x, y)
      onChange(st.current.hue, s, l)
    }
    const onMove = (ev: MouseEvent) => {
      const rr = cvsRef.current!.getBoundingClientRect()
      const mx = ev.clientX - rr.left, my = ev.clientY - rr.top
      if (region === 'ring') {
        const d = Math.sqrt((mx - CX) ** 2 + (my - CX) ** 2)
        if (d >= RING_INNER - 10 && d <= RING_OUTER + 10) onChange(pickHue(mx, my), st.current.sat, st.current.lit)
      } else {
        const [s, l] = pickSL(mx, my)
        onChange(st.current.hue, s, l)
      }
    }
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
  }, [onChange])

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
  label: { color: 'var(--dsw-alias-label-primary)', fontSize: '14px', fontWeight: 500, marginBottom: '8px' },
  hint: { color: 'var(--dsw-alias-label-tertiary)', fontSize: '12px', lineHeight: '18px', marginTop: '4px' },
  wheelCanvas: { cursor: 'crosshair', borderRadius: '50%' },
  row: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const },
  sliderRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  sliderLabel: { color: 'var(--dsw-alias-label-secondary)', fontSize: '13px', whiteSpace: 'nowrap' as const, width: '52px' },
  slider: { flex: 1, accentColor: 'var(--dsw-alias-brand-primary)', minWidth: '160px' },
  sliderVal: { color: 'var(--dsw-alias-label-secondary)', fontSize: '12px', whiteSpace: 'nowrap' as const, width: '44px', textAlign: 'right' as const },
  btn: { height: '32px', padding: '0 14px', borderRadius: '8px', border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-button-elevated-fill)', color: 'var(--dsw-alias-label-primary)', cursor: 'pointer', fontSize: '13px', font: 'inherit', boxSizing: 'border-box' as const },
  btnDanger: { color: 'var(--dsw-alias-state-error-primary)' },
  btnPrimary: { background: 'var(--dsw-alias-brand-primary)', color: 'var(--dsw-alias-brand-text)', border: 'none' },
  preview: { width: '72px', height: '44px', objectFit: 'cover' as const, borderRadius: '6px', border: '1px solid var(--dsw-alias-border-l2)', cursor: 'pointer' },
  sliders: { display: 'flex', flexDirection: 'column' as const, gap: '8px', marginTop: '12px' },
  // Modal
  overlay: { position: 'fixed' as const, inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '12px' },
  modalTitle: { color: '#fff', fontSize: '16px', fontWeight: 500 },
  modalHint: { color: 'rgba(255,255,255,0.6)', fontSize: '12px' },
  previewRect: { position: 'relative' as const, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '8px', background: '#000', cursor: 'grab' },
  previewImg: { position: 'absolute' as const, transformOrigin: '0 0', pointerEvents: 'none' as const },
  modalBtns: { display: 'flex', gap: '10px' },
}

// ── Background Editor Modal ────────────────────────────────────────────────────

function BgEditor({ url, onClose, onCommit }: {
  url: string; onClose: () => void
  onCommit: (zoom: number, px: number, py: number) => void
}) {
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef({ active: false, sx: 0, sy: 0, spx: 0, spy: 0 })

  const pw = Math.min(window.innerWidth * 0.75, 860)
  const ph = Math.round(pw * window.innerHeight / window.innerWidth)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(pw / img.width, ph / img.height)
      const w = img.width * scale, h = img.height * scale
      setImgSize({ w, h })
      setPos({ x: (pw - w) / 2, y: (ph - h) / 2 })
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
    if (!imgRef.current) return
    const scale = Math.min(pw / imgSize.w, ph / imgSize.h)
    const w = imgSize.w * scale, h = imgSize.h * scale
    setZoom(1); setPos({ x: (pw - w) / 2, y: (ph - h) / 2 })
  }, [pw, ph, imgSize])

  return (
    <div style={ST.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={ST.modalTitle}>{/* t */ '背景编辑器'}</div>
      <div ref={containerRef} style={{ ...ST.previewRect, width: pw, height: ph }} onMouseDown={onDown}>
        <img ref={imgRef} src={url} alt="" draggable={false} style={{
          ...ST.previewImg, width: imgSize.w, height: imgSize.h,
          transform: `translate(${pos.x}px,${pos.y}px) scale(${zoom})`,
        }} />
      </div>
      <div style={ST.modalHint}>{/* t */ '拖动移动图片，滚轮缩放大小'}</div>
      <div style={ST.modalBtns}>
        <button style={ST.btn} onClick={resetView}>{/* t */ '重置'}</button>
        <button style={ST.btn} onClick={onClose}>{/* t */ '取消'}</button>
        <button style={{ ...ST.btn, ...ST.btnPrimary }} onClick={() => onCommit(zoom, pos.x / pw, pos.y / ph)}>{/* t */ '确认'}</button>
      </div>
    </div>
  )
}

// ── Uncontrolled slider ────────────────────────────────────────────────────────

function LiveSlider({ label, min, max, step, def, fmt, onInput, onChange }: {
  label: string; min: number; max: number; step: number; def: number
  fmt: (v: number) => string; onInput: (v: number) => void; onChange: (v: number) => void
}) {
  const valRef = useRef<HTMLSpanElement>(null)
  return (
    <div style={ST.sliderRow}>
      <span style={ST.sliderLabel}>{label}</span>
      <input type="range" min={min} max={max} step={step} defaultValue={def} style={ST.slider}
        onInput={e => { const v = Number((e.target as HTMLInputElement).value); onInput(v); if (valRef.current) valRef.current.textContent = fmt(v) }}
        onChange={e => onChange(Number((e.target as HTMLInputElement).value))} />
      <span ref={valRef} style={ST.sliderVal}>{fmt(def)}</span>
    </div>
  )
}

// ── Theme Section ──────────────────────────────────────────────────────────────

function ThemeSection(props: any) {
  const { t, hue, sat, lit, setColor, url, setWp, setOp, setBl, useStore } = props
  const storeUrl = useStore((s: any) => s.url)
  const fileRef = useRef<HTMLInputElement>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  return (
    <div style={ST.root}>
      <div><h2 style={ST.h2}>{t('nav')}</h2><div style={ST.sub}>{t('subtitle')}</div></div>

      {/* Color wheel */}
      <div>
        <div style={ST.label}>{t('colorTitle')}</div>
        <ColorWheel hue={hue} sat={sat} lit={lit} onChange={setColor} />
        <div style={ST.hint}>{t('colorHint')}</div>
      </div>

      <hr style={ST.hr} />

      {/* Background image */}
      <div>
        <div style={ST.label}>{t('bgTitle')}</div>
        <div style={ST.row}>
          {storeUrl ? <img src={storeUrl} alt="" style={ST.preview} onClick={() => setEditorOpen(true)} /> : null}
          <button type="button" style={ST.btn} onClick={() => fileRef.current?.click()}>{t('bgChoose')}</button>
          {storeUrl ? <button type="button" style={ST.btn} onClick={() => setEditorOpen(true)}>{t('bgEdit')}</button> : null}
          {storeUrl ? <button type="button" style={{ ...ST.btn, ...ST.btnDanger }} onClick={() => setWp(null)}>{t('bgRemove')}</button> : null}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
            const f = e.target.files?.[0]; if (!f) return
            readImg(f, d => { if (d) setWp(d); e.target.value = '' })
          }} />
        </div>
        <div style={ST.sliders}>
          <LiveSlider label={t('bgOpacity')} min={0} max={100} step={1} def={Math.round(rOp() * 100)}
            fmt={v => `${v}%`}
            onInput={v => { const op = v / 100; wLS(LS_OP, String(op)); if (wpEl) wpEl.style.opacity = String(op); applyBgOverrides(op) }}
            onChange={v => setOp(v / 100)} />
          <LiveSlider label={t('bgBlur')} min={0} max={60} step={1} def={rBl()}
            fmt={v => `${v}px`}
            onInput={v => { wLS(LS_BL, String(v)); if (wpEl) wpEl.style.filter = v > 0 ? `blur(${v}px)` : 'none' }}
            onChange={v => setBl(v)} />
        </div>
        <div style={ST.hint}>{t('bgHint')}</div>
      </div>

      {/* Background editor modal */}
      {editorOpen && storeUrl ? (
        <BgEditor url={storeUrl} onClose={() => setEditorOpen(false)}
          onCommit={(z, px, py) => { wLS(LS_BG, JSON.stringify({ zoom: z, px, py })); applyWp(ctxRef); setEditorOpen(false) }} />
      ) : null}
    </div>
  )
}

// ── Plugin entry ───────────────────────────────────────────────────────────────

export function apply(ctx: Ctx): void {
  ctxRef = ctx

  // 1. Restore custom color and register as a skin.
  const [initH, initS, initL] = rColor()
  let customDispose: (() => void) | null = null
  const registerCustom = (h: number, s: number, l: number) => {
    customDispose?.()
    const [hh, ss, ll] = hsvToHsl(h, s, l)
    const { colorScheme, tokens } = genTokens(hh, ss, ll)
    customDispose = ctx.theme.register({ id: CUSTOM_ID, colorScheme, tokens })
    ctx.theme.setTheme(CUSTOM_ID)
  }
  // Restore saved color on boot.
  if (rLS(LS_COLOR)) registerCustom(initH, initS, initL)
  ctx.effect(() => () => { customDispose?.() }, 'dsh-any-background: skin dispose')

  // 2. Gradient CSS (for custom dark themes).
  let styleEl: HTMLStyleElement | undefined
  if (typeof document !== 'undefined') {
    styleEl = document.createElement('style')
    styleEl.dataset.plugin = 'dsh-any-background'
    styleEl.textContent = `body[data-ds-dark-theme="${CUSTOM_ID}"]::before{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(255,255,255,0.03) 0%,transparent 60%)}`
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
  ctx.effect(() => () => { teardownWp() }, 'dsh-any-background: wp cleanup')
  ctx.on('theme/change', () => applyWp(ctx))

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
        wLS(LS_COLOR, JSON.stringify([sh, ss, sl]))
        registerCustom(nh, ns, nl)
        applyWp(ctx)
      },
      setWp: (u: string | null) => { wLS(LS_WP, u); applyWp(ctx); syncBg() },
      setOp: (v: number) => { wLS(LS_OP, String(v)); applyWp(ctx); syncBg() },
      setBl: (v: number) => { wLS(LS_BL, String(v)); applyWp(ctx); syncBg() },
    }
  }
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: 'dsh-any-background', order: 35,
    label: () => ctx.locale.bind(NS)('nav'),
    locale: NS, store, inject: sectionInject,
  }, ThemeSection as any))
}
