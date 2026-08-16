import type { BgState } from '../types'

// ── HSV ↔ HSL ────────────────────────────────────────────────────────────────
// The wheel works in HSV end to end: props and pickSL are HSV, the canvas
// renders the HSV S-V plane directly. Storage and genTokens expect HSL, so
// setColor converts HSV → HSL at the boundary; sectionInject converts stored
// HSL → HSV for the initial wheel props. Conversions never stack.

export function hsvToHsl(h: number, s: number, v: number): [number, number, number] {
  const l = v * (1 - s / 2)
  const sl = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l)
  return [h, sl, l]
}

export function hslToHsv(h: number, s: number, l: number): [number, number, number] {
  const v = l + s * Math.min(l, 1 - l)
  const sv = v === 0 ? 0 : 2 * (1 - l / v)
  return [h, sv, v]
}

// ── Token generation from HSL ──────────────────────────────────────────────────

let tokensCacheKey = ''
let tokensCache: { colorScheme: 'light' | 'dark'; tokens: Record<string, string> } | null = null

/**
 * Memoized token generation: the same (hue, sat, lit) input always yields the
 * same token set, and applyWp / applyCustomTokens / applySettingsOverrides call
 * this repeatedly (slider drags, viewport re-applies), so cache the last result
 * and skip the 30+ hsl() string builds when nothing changed.
 */
export function genTokens(hue: number, sat: number, lit: number): { colorScheme: 'light' | 'dark'; tokens: Record<string, string> } {
  const key = `${hue}|${sat}|${lit}`
  if (tokensCacheKey === key && tokensCache) return tokensCache
  tokensCacheKey = key
  tokensCache = buildTokens(hue, sat, lit)
  return tokensCache
}

function buildTokens(hue: number, sat: number, lit: number): { colorScheme: 'light' | 'dark'; tokens: Record<string, string> } {
  const dark = lit < 0.55
  const h = (d: number) => ((hue + d) % 360 + 360) % 360
  const s = (d: number) => Math.max(0, Math.min(1, sat + d))
  const l = (d: number) => Math.max(0, Math.min(1, lit + d))
  const hsl = (hh: number, ss: number, ll: number) => `hsl(${Math.round(hh)},${Math.round(ss * 100)}%,${Math.round(ll * 100)}%)`
  const rgba = (hh: number, ss: number, ll: number, a: number) =>
    `hsla(${Math.round(hh)},${Math.round(ss * 100)}%,${Math.round(ll * 100)}%,${a})`

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
        // The harness's dimmer label tiers (placeholder text, model/permission
        // chevrons, disabled rows) must follow the dark scheme's light font
        // instead of staying neutral gray, or they read as "always gray".
        '--dsw-alias-label-caption': hsl(0, 0, 1),
        '--dsw-alias-label-dimmed': hsl(0, 0, 1),
        '--dsw-alias-label-quaternary': hsl(0, 0, 1),
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
      // Same as above but for the light scheme: dimmer tiers go black so the
      // placeholder, chevrons, category captions and disabled rows follow the
      // theme's dark font instead of staying gray.
      '--dsw-alias-label-caption': hsl(0, 0, 0),
      '--dsw-alias-label-dimmed': hsl(0, 0, 0),
      '--dsw-alias-label-quaternary': hsl(0, 0, 0),
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

export function toRgba(c: string, a: number): string {
  const hx = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c.trim())
  if (hx) { let d = hx[1]!; if (d.length === 3) d = d.split('').map(x => x + x).join(''); const n = parseInt(d, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})` }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(c.trim())
  if (rgb) return `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${a})`
  const hsl = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i.exec(c.trim())
  if (hsl) return `hsla(${hsl[1]},${hsl[2]}%,${hsl[3]}%,${a})`
  return c.trim()
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === rn) h = ((gn - bn) / d) % 6
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  h *= 60
  if (h < 0) h += 360
  return [h, s, l]
}

// ── Wallpaper color extraction ─────────────────────────────────────────────────
// Full chain: decode the cached data URL → crop the visible (framed) region →
// downsample to a 64×64 canvas → quantize pixels into 4-bit RGB buckets →
// discard near-gray / near-black / near-white pixels → pick the most populous
// vivid bucket (count × saturation bias) → average its members → RGB→HSL →
// clamp lightness into a band that keeps the light/dark scheme decision
// unambiguous. Purely client-side: no RPC traffic, and memory is bounded by
// one 64×64 canvas + one ImageData + two small typed arrays.

const EXTRACT_SIDE = 64

export function extractWallpaperColor(dataUrl: string, bgState: BgState): Promise<[number, number, number] | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.onerror = () => resolve(null)
    img.onload = () => {
      try {
        const iw = img.naturalWidth || img.width
        const ih = img.naturalHeight || img.height
        // Sample what the user framed: reuse the wallpaper placement model
        // (contain-fit at zoom with the center pinned to the committed
        // fractional point) to crop the visible region in image coordinates.
        const bg = bgState
        let sx = 0, sy = 0, sw = iw, sh = ih
        if (bg.iw === iw && bg.ih === ih && bg.iw > 0) {
          const fit = Math.min(window.innerWidth / iw, window.innerHeight / ih)
          const w = iw * fit * bg.zoom
          const h = ih * fit * bg.zoom
          sx = Math.max(0, bg.x * window.innerWidth - w / 2)
          sy = Math.max(0, bg.y * window.innerHeight - h / 2)
          sw = Math.min(iw - sx, w)
          sh = Math.min(ih - sy, h)
          if (sw <= 0 || sh <= 0) { sx = 0; sy = 0; sw = iw; sh = ih }
        }
        const c = document.createElement('canvas')
        c.width = EXTRACT_SIDE; c.height = EXTRACT_SIDE
        const g = c.getContext('2d', { willReadFrequently: true })!
        g.drawImage(img, sx, sy, sw, sh, 0, 0, EXTRACT_SIDE, EXTRACT_SIDE)
        const px = g.getImageData(0, 0, EXTRACT_SIDE, EXTRACT_SIDE).data
        // 4-bit RGB quantization → 4096 buckets with pixel counts and sums.
        const counts = new Uint32Array(4096)
        const sums = new Float64Array(4096 * 3)
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i], gg = px[i + 1], b = px[i + 2]
          const max = Math.max(r, gg, b), min = Math.min(r, gg, b)
          const v = max / 255
          const s = max === 0 ? 0 : (max - min) / max
          // Skip achromatic and nearly black/white pixels — they would yield
          // dull gray themes.
          if (s < 0.08 || v < 0.12 || v > 0.97) continue
          const key = ((r >> 4) << 8) | ((gg >> 4) << 4) | (b >> 4)
          counts[key]++
          sums[key * 3] += r; sums[key * 3 + 1] += gg; sums[key * 3 + 2] += b
        }
        // Winner: the most populous vivid bucket (vividness breaks near ties).
        let best = -1, bestW = 0
        for (let k = 0; k < 4096; k++) {
          if (counts[k] === 0) continue
          const r = sums[k * 3] / counts[k]
          const gg = sums[k * 3 + 1] / counts[k]
          const b = sums[k * 3 + 2] / counts[k]
          const max = Math.max(r, gg, b), min = Math.min(r, gg, b)
          const s = max === 0 ? 0 : (max - min) / max
          const w = counts[k] * (0.5 + s)
          if (w > bestW) { bestW = w; best = k }
        }
        if (best < 0) { resolve(null); return }
        const r = sums[best * 3] / counts[best]
        const gg = sums[best * 3 + 1] / counts[best]
        const b = sums[best * 3 + 2] / counts[best]
        const [h, s, l] = rgbToHsl(r, gg, b)
        // Keep hue and saturation, snap lightness out of the ambiguous middle
        // (genTokens decides the scheme at l < 0.55): dark picks land in
        // [0.2, 0.44], light picks in [0.6, 0.82].
        const lc = l < 0.5 ? Math.min(0.44, Math.max(0.2, l)) : Math.max(0.6, Math.min(0.82, l))
        resolve([h, Math.min(0.9, Math.max(0.15, s)), lc])
      } catch {
        resolve(null)
      }
    }
    img.src = dataUrl
  })
}

/** HSL (h 0-360, s/l 0-1) → RGB (0-255 integers). */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = h / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0, g = 0, b = 0
  if (hp < 1) { r = c; g = x }
  else if (hp < 2) { r = x; g = c }
  else if (hp < 3) { g = c; b = x }
  else if (hp < 4) { g = x; b = c }
  else if (hp < 5) { r = x; b = c }
  else { r = c; b = x }
  const m = l - c / 2
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}
