import type { BgState, ColorPalette } from '../types'

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
 *
 * When a Material-You-style palette is provided, primary/secondary/tertiary
 * hues are used for brand and accent tokens; the surface and label colors still
 * follow the primary hue so the scheme stays readable.
 */
export function genTokens(hue: number, sat: number, lit: number, palette?: ColorPalette | null): { colorScheme: 'light' | 'dark'; tokens: Record<string, string> } {
  const key = `${hue}|${sat}|${lit}|${palette ? hslKey(palette.primary) + '/' + hslKey(palette.secondary) + '/' + hslKey(palette.tertiary) + '/' + hslKey(palette.surface) : ''}`
  if (tokensCacheKey === key && tokensCache) return tokensCache
  tokensCacheKey = key
  tokensCache = buildTokens(hue, sat, lit, palette)
  return tokensCache
}

function hslKey([h, s, l]: [number, number, number]): string {
  return `${Math.round(h)}:${Math.round(s * 100)}:${Math.round(l * 100)}`
}

function buildTokens(hue: number, sat: number, lit: number, palette?: ColorPalette | null): { colorScheme: 'light' | 'dark'; tokens: Record<string, string> } {
  const dark = lit < 0.55
  const h = (d: number) => ((hue + d) % 360 + 360) % 360
  const s = (d: number) => Math.max(0, Math.min(1, sat + d))
  const l = (d: number) => Math.max(0, Math.min(1, lit + d))
  const hsl = (hh: number, ss: number, ll: number) => `hsl(${Math.round(hh)},${Math.round(ss * 100)}%,${Math.round(ll * 100)}%)`
  const rgba = (hh: number, ss: number, ll: number, a: number) =>
    `hsla(${Math.round(hh)},${Math.round(ss * 100)}%,${Math.round(ll * 100)}%,${a})`

  // Material-You-style accent hues from the extracted/generated palette.
  const accentHue = palette ? palette.tertiary[0] : h(180)
  const secondaryHue = palette ? palette.secondary[0] : h(30)
  const surfaceHue = palette ? palette.surface[0] : hue
  const surfaceSat = palette ? Math.min(0.08, palette.surface[1]) : 0

  if (dark) {
    return {
      colorScheme: 'dark',
      tokens: {
        '--dsw-alias-bg-base': hsl(surfaceHue, surfaceSat, l(-0.04)),
        '--dsw-alias-bg-layer-1': hsl(surfaceHue, surfaceSat, l(0.02)),
        '--dsw-alias-bg-layer-2': hsl(surfaceHue, Math.min(1, surfaceSat + 0.03), l(0.07)),
        '--dsw-alias-bg-layer-3': hsl(surfaceHue, Math.min(1, surfaceSat + 0.05), l(0.12)),
        '--dsw-alias-bg-overlay': hsl(surfaceHue, Math.min(1, surfaceSat + 0.05), l(0.12)),
        '--dsw-alias-border-l1': rgba(surfaceHue, s(-0.1), l(0.18), 0.12),
        '--dsw-alias-border-l2': rgba(surfaceHue, s(-0.1), l(0.22), 0.22),
        '--dsw-alias-label-primary': hsl(0, 0, 1),
        '--dsw-alias-label-secondary': hsl(0, 0, 1),
        '--dsw-alias-label-tertiary': hsl(0, 0, 1),
        // The harness's dimmer label tiers (placeholder text, model/permission
        // chevrons, disabled rows) must follow the dark scheme's light font
        // instead of staying neutral gray, or they read as "always gray".
        '--dsw-alias-label-caption': hsl(0, 0, 1),
        '--dsw-alias-label-dimmed': hsl(0, 0, 1),
        '--dsw-alias-label-quaternary': hsl(0, 0, 1),
        '--dsw-alias-brand-primary': hsl(secondaryHue, Math.min(1, s(0.15) + 0.05), Math.max(l(0.15), 0.5)),
        '--dsw-alias-brand-text': l(0.15) > 0.6 ? '#000' : '#fff',
        '--dsw-alias-button-primary-hover': hsl(secondaryHue, Math.min(1, s(0.15) + 0.05), Math.max(l(0.25), 0.58)),
        '--dsw-alias-button-primary-dimmed': hsl(secondaryHue, Math.min(1, s(0.05) + 0.02), l(0.07)),
        '--dsw-alias-button-elevated-fill': hsl(surfaceHue, surfaceSat, l(0.04)),
        '--dsw-alias-interactive-bg-hover': rgba(accentHue, Math.min(1, s(0.05) + 0.05), Math.max(l(0.15), 0.4), 0.12),
        '--dsw-alias-interactive-bg-active': rgba(accentHue, Math.min(1, s(0.05) + 0.05), Math.max(l(0.15), 0.4), 0.2),
        '--dsw-alias-markdown-code-block': hsl(h(0), s(0), l(-0.06)),
        '--dsw-alias-markdown-inline-code': hsl(h(0), s(0), l(0.04)),
        '--dsw-alias-state-error-primary': '#ff5c72',
        '--dsw-alias-state-success-primary': '#3ddc84',
        '--dsw-alias-state-warn-primary': '#ffb347',
        '--dsw-specific-sidebar-fill': hsl(surfaceHue, surfaceSat, l(-0.06)),
        '--dsw-specific-sidebar-nav-item-active': hsl(surfaceHue, Math.min(1, surfaceSat + 0.02), l(0.04)),
        '--dsw-specific-sidebar-nav-item-hover': hsl(surfaceHue, surfaceSat, l(0)),
        '--dsw-specific-input-major': hsl(surfaceHue, surfaceSat, l(0.02)),
        '--dsw-alias-scrollbar-bg-l1': hsl(surfaceHue, Math.min(1, surfaceSat + 0.02), l(0.12)),
        '--dsw-alias-scrollbar-bg-l2': hsl(surfaceHue, Math.min(1, surfaceSat + 0.04), l(0.16)),
        '--dsw-alias-scrollbar-hover-l1': hsl(surfaceHue, Math.min(1, surfaceSat + 0.04), l(0.22)),
        '--dsw-alias-scrollbar-hover-l2': hsl(surfaceHue, Math.min(1, surfaceSat + 0.06), l(0.22)),
      },
    }
  }
  return {
    colorScheme: 'light',
    tokens: {
      // Backgrounds track the picked color at its lightness — theme-colored,
      // with only mild desaturation so the surfaces stay readable.
      '--dsw-alias-bg-base': hsl(surfaceHue, surfaceSat, l(0.03)),
      '--dsw-alias-bg-layer-1': hsl(surfaceHue, Math.min(1, surfaceSat + 0.03), l(0.07)),
      '--dsw-alias-bg-layer-2': hsl(surfaceHue, Math.min(1, surfaceSat + 0.05), l(-0.03)),
      '--dsw-alias-bg-layer-3': hsl(surfaceHue, Math.min(1, surfaceSat + 0.08), l(-0.09)),
      '--dsw-alias-bg-overlay': hsl(surfaceHue, surfaceSat, l(0.08)),
      '--dsw-alias-border-l1': rgba(surfaceHue, s(-0.15), l(-0.35), 0.18),
      '--dsw-alias-border-l2': rgba(surfaceHue, s(-0.15), l(-0.35), 0.3),
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
      '--dsw-alias-brand-primary': hsl(secondaryHue, Math.min(1, s(0.1) + 0.05), Math.min(l(-0.18), 0.45)),
      '--dsw-alias-brand-text': '#fff',
      '--dsw-alias-button-primary-hover': hsl(secondaryHue, Math.min(1, s(0.1) + 0.05), Math.min(l(-0.12), 0.5)),
      '--dsw-alias-button-primary-dimmed': hsl(secondaryHue, Math.min(1, s(0.05) + 0.02), l(-0.03)),
      '--dsw-alias-button-elevated-fill': hsl(surfaceHue, Math.min(1, surfaceSat + 0.02), l(0.1)),
      '--dsw-alias-interactive-bg-hover': rgba(accentHue, Math.min(1, s(0.05) + 0.05), l(-0.3), 0.08),
      '--dsw-alias-interactive-bg-active': rgba(accentHue, Math.min(1, s(0.05) + 0.05), l(-0.3), 0.14),
      '--dsw-alias-markdown-code-block': hsl(h(0), s(-0.1), l(-0.03)),
      '--dsw-alias-markdown-inline-code': hsl(h(0), s(-0.08), l(0.04)),
      '--dsw-specific-sidebar-fill': hsl(surfaceHue, Math.min(1, surfaceSat + 0.02), l(-0.03)),
      '--dsw-specific-sidebar-nav-item-active': hsl(surfaceHue, Math.min(1, surfaceSat + 0.05), l(0.05)),
      '--dsw-specific-sidebar-nav-item-hover': hsl(surfaceHue, surfaceSat, l(0)),
      '--dsw-specific-input-major': hsl(surfaceHue, Math.min(1, surfaceSat + 0.02), l(0.1)),
      '--dsw-alias-scrollbar-bg-l1': hsl(surfaceHue, Math.min(1, surfaceSat + 0.02), l(-0.08)),
      '--dsw-alias-scrollbar-bg-l2': hsl(surfaceHue, Math.min(1, surfaceSat + 0.04), l(-0.12)),
      '--dsw-alias-scrollbar-hover-l1': hsl(surfaceHue, Math.min(1, surfaceSat + 0.04), l(-0.16)),
      '--dsw-alias-scrollbar-hover-l2': hsl(surfaceHue, Math.min(1, surfaceSat + 0.06), l(-0.16)),
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
//
// The extraction now returns a Material-You-style palette: primary (dominant),
// secondary (second-most vivid), tertiary (complementary accent), surface
// (neutralized dominant), and the average luminance of the sampled image for
// automatic light/dark decisions.

const EXTRACT_SIDE = 64

interface Bucket { count: number; r: number; g: number; b: number; s: number }

function bucketsToHsl(b: Bucket): [number, number, number] {
  return rgbToHsl(b.r / b.count, b.g / b.count, b.b / b.count)
}

export function extractWallpaperPalette(dataUrl: string, bgState: BgState): Promise<ColorPalette | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.onerror = () => resolve(null)
    img.onload = () => {
      try {
        const iw = img.naturalWidth || img.width
        const ih = img.naturalHeight || img.height
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
        const counts = new Uint32Array(4096)
        const sums = new Float64Array(4096 * 3)
        let totalLum = 0
        let sampled = 0
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i], gg = px[i + 1], b = px[i + 2]
          const max = Math.max(r, gg, b), min = Math.min(r, gg, b)
          const v = max / 255
          const s = max === 0 ? 0 : (max - min) / max
          // Include all non-extreme pixels in luminance; only vivid pixels in
          // palette buckets so we don't theme around gray/black/white.
          totalLum += v
          sampled++
          if (s < 0.08 || v < 0.12 || v > 0.97) continue
          const key = ((r >> 4) << 8) | ((gg >> 4) << 4) | (b >> 4)
          counts[key]++
          sums[key * 3] += r; sums[key * 3 + 1] += gg; sums[key * 3 + 2] += b
        }
        const buckets: Bucket[] = []
        for (let k = 0; k < 4096; k++) {
          if (counts[k] === 0) continue
          buckets.push({
            count: counts[k],
            r: sums[k * 3],
            g: sums[k * 3 + 1],
            b: sums[k * 3 + 2],
            s: (Math.max(sums[k * 3], sums[k * 3 + 1], sums[k * 3 + 2]) - Math.min(sums[k * 3], sums[k * 3 + 1], sums[k * 3 + 2])) / Math.max(sums[k * 3], sums[k * 3 + 1], sums[k * 3 + 2]) || 0,
          })
        }
        if (buckets.length === 0) { resolve(null); return }
        // Sort by vivid-weighted count.
        buckets.sort((a, b) => b.count * (0.5 + b.s) - a.count * (0.5 + a.s))
        const primary = bucketsToHsl(buckets[0]!)
        const primaryHue = primary[0]
        // Secondary: next bucket that is reasonably separated from primary.
        let secondary = primary
        for (const b of buckets.slice(1)) {
          const [h] = bucketsToHsl(b)
          const sep = Math.abs(((h - primaryHue + 540) % 360) - 180)
          if (sep > 30) { secondary = bucketsToHsl(b); break }
        }
        // Tertiary: complementary-ish hue based on primary if no good secondary.
        let tertiary: [number, number, number] = [((primaryHue + 180) % 360), Math.min(0.7, primary[1]), Math.min(0.7, primary[2])]
        for (const b of buckets.slice(1)) {
          const [h] = bucketsToHsl(b)
          const sep = Math.abs(((h - primaryHue + 540) % 360) - 180)
          if (sep > 90 && sep < 150) { tertiary = bucketsToHsl(b); break }
        }
        // Surface: neutralized primary (very low saturation).
        const surface: [number, number, number] = [primaryHue, Math.min(0.06, primary[1] * 0.3), primary[2]]
        // Auto light/dark: use the average luminance of the whole image so a
        // bright wallpaper naturally drives a light scheme and vice-versa.
        const luminance = sampled > 0 ? totalLum / sampled : primary[2]
        // Snap primary lightness out of the ambiguous middle band.
        const autoDark = luminance < 0.5
        const lc = autoDark ? Math.min(0.44, Math.max(0.2, primary[2])) : Math.max(0.6, Math.min(0.82, primary[2]))
        primary[2] = lc
        resolve({
          primary: [primary[0], Math.min(0.9, Math.max(0.15, primary[1])), primary[2]],
          secondary: [secondary[0], Math.min(0.85, Math.max(0.2, secondary[1])), Math.min(0.75, Math.max(0.35, secondary[2]))],
          tertiary: [tertiary[0], Math.min(0.8, Math.max(0.2, tertiary[1])), Math.min(0.7, Math.max(0.35, tertiary[2]))],
          surface,
          luminance,
        })
      } catch {
        resolve(null)
      }
    }
    img.src = dataUrl
  })
}

/** Fallback palette when only a seed HSL color is known (no wallpaper). */
export function paletteFromHsl([h, s, l]: [number, number, number]): ColorPalette {
  const autoDark = l < 0.55
  const lc = autoDark ? Math.min(0.44, Math.max(0.2, l)) : Math.max(0.6, Math.min(0.82, l))
  const hue = ((h % 360) + 360) % 360
  return {
    primary: [hue, Math.min(0.9, Math.max(0.15, s)), lc],
    secondary: [((hue + 30) % 360), Math.min(0.8, Math.max(0.2, s)), Math.min(0.75, Math.max(0.35, l))],
    tertiary: [((hue + 180) % 360), Math.min(0.7, Math.max(0.2, s)), Math.min(0.7, Math.max(0.35, l))],
    surface: [hue, Math.min(0.06, s * 0.3), l],
    luminance: l,
  }
}

/** Backward-compatible single-color extraction: returns the primary HSL. */
export async function extractWallpaperColor(dataUrl: string, bgState: BgState): Promise<[number, number, number] | null> {
  const palette = await extractWallpaperPalette(dataUrl, bgState)
  return palette ? palette.primary : null
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
