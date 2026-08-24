import type { BgState, ThemeConfig, PartOpacities, PartBlurs, BgMode } from './types'

export const DEFAULT_CONFIG: ThemeConfig = {
  color: null,
  opacities: { bg: 0.85, sidebar: 0.93, card: 1, input: 1 },
  blurs: { bg: 0, sidebar: 0, card: 0, settings: 0, chat: 0, trajectory: 0, input: 0 },
  settingsOpacity: 1,
  wallpaperOpacity: 1,
  blur: 0,
  bgState: { zoom: 1, x: 0, y: 0, iw: 0, ih: 0 },
  videoBgState: { zoom: 1, x: 0, y: 0, iw: 0, ih: 0 },
  backgroundType: 'image',
  bgMode: 'fit',
  videoMime: null,
  generatedBg: null,
  regenerateOnReload: false,
  chatTextOpacity: 0,
  // 100% = untouched host surface; zero would blank the page by default.
  trajectoryOpacity: 1,
}

const clamp01 = (n: unknown, def: number): number =>
  typeof n === 'number' ? Math.min(1, Math.max(0, n)) : def

// In-memory mirror of the file-backed store; the UI reads and mutates this,
// and it is synced to disk via the RPC layer.
export let cfg: ThemeConfig = { ...DEFAULT_CONFIG, opacities: { ...DEFAULT_CONFIG.opacities }, blurs: { ...DEFAULT_CONFIG.blurs }, bgState: { ...DEFAULT_CONFIG.bgState }, videoBgState: { ...DEFAULT_CONFIG.videoBgState } }
export let wpImageUrl: string | null = null
// Retained across background-type switches so coming back to image/video
// restores the original upload.
export let wpUrl: string | null = null
export let wpVideoUrl: string | null = null
/** Captured video frame standing in for previews/color extraction (still-image APIs). */
export let wpVideoSnapshot: string | null = null

export function setWpImageUrl(url: string | null): void { wpImageUrl = url }
export function setWpUrl(url: string | null): void { wpUrl = url }
// The serve URL is stable, so replacing the stored video needs a query-string
// cache-buster or the player keeps the cached copy.
let videoRev = 0
export function setWpVideoUrl(url: string | null, mime: string | null): void {
  if (url === null) {
    wpVideoUrl = null
    wpVideoSnapshot = null
  } else {
    videoRev++
    wpVideoUrl = `${url}${url.includes('?') ? '&' : '?'}r=${videoRev}`
  }
  cfg.videoMime = url ? mime : null
}
export function setWpVideoSnapshot(url: string | null): void { wpVideoSnapshot = url }
export function setBgState(s: BgState): void { cfg.bgState = s }

// Brightness verdict of the active generated background, analyzed once per
// switch from a captured frame. null = fall back to the picked color's lightness.
export let bgDark: boolean | null = null
export function setBgDark(v: boolean | null): void { bgDark = v }
export function rBgDark(): boolean | null { return bgDark }

export function rHasColor(): boolean { return cfg.color !== null }
export function rColor(): [number, number, number] { return cfg.color ?? [220, 0.55, 0.25] }
export function rWpImage(): string | null { return wpImageUrl }
export function rWpVideo(): string | null { return wpVideoUrl }
export function rBgMode(): BgMode { return cfg.bgMode ?? DEFAULT_CONFIG.bgMode }
export function rChatTextOpacity(): number { return clamp01(cfg.chatTextOpacity, DEFAULT_CONFIG.chatTextOpacity) }
export function rTrajectoryOpacity(): number { return clamp01(cfg.trajectoryOpacity, DEFAULT_CONFIG.trajectoryOpacity) }
/** Display URL: the uploaded image/video snapshot per active type, else the generated snapshot. */
export function rWp(): string | null {
  if (cfg.backgroundType === 'image') return wpImageUrl
  if (cfg.backgroundType === 'video') return wpVideoSnapshot
  return wpUrl
}
export function rOps(): PartOpacities {
  const o = cfg.opacities ?? {}
  const out = {} as PartOpacities
  for (const k of ['bg', 'sidebar', 'card', 'input'] as const) {
    out[k] = clamp01(o[k], DEFAULT_CONFIG.opacities[k])
  }
  return out
}
export function rBlurs(): PartBlurs {
  const b = cfg.blurs ?? {}
  const out = {} as PartBlurs
  for (const k of ['bg', 'sidebar', 'card', 'settings', 'chat', 'trajectory', 'input'] as const) {
    const v = b[k]
    out[k] = typeof v === 'number' ? Math.min(60, Math.max(0, v)) : DEFAULT_CONFIG.blurs[k]
  }
  return out
}
export function rWop(): number { return clamp01(cfg.wallpaperOpacity, DEFAULT_CONFIG.wallpaperOpacity) }
export function rBl(): number {
  return typeof cfg.blur === 'number' ? Math.min(60, Math.max(0, cfg.blur)) : DEFAULT_CONFIG.blur
}
export function rSop(): number { return clamp01(cfg.settingsOpacity, DEFAULT_CONFIG.settingsOpacity) }
export function rBgState(): BgState { return cfg.bgState }
export function rVideoBgState(): BgState { return cfg.videoBgState }

const num = (n: unknown, def: number): number => typeof n === 'number' ? n : def
const cl = (n: unknown, lo: number, hi: number, def: number): number =>
  typeof n === 'number' ? Math.min(hi, Math.max(lo, n)) : def

function adoptBgState(s: Partial<BgState>): BgState {
  return {
    zoom: num(s.zoom, 1),
    x: num(s.x, 0),
    y: num(s.y, 0),
    iw: typeof s.iw === 'number' && s.iw > 0 ? s.iw : 0,
    ih: typeof s.ih === 'number' && s.ih > 0 ? s.ih : 0,
  }
}

/** Move a possibly-absent partial config into the shape the UI reads. */
export function adoptConfig(raw: unknown): void {
  const c = (raw ?? {}) as Partial<ThemeConfig> & { opacity?: unknown }
  const color = Array.isArray(c.color) && c.color.length === 3
    ? [c.color[0], c.color[1], c.color[2]] as [number, number, number]
    : null
  // Migration: the old single main-interface opacity becomes per-part, keeping
  // the sidebar's former +0.08 offset.
  const legacy = typeof c.opacity === 'number' ? c.opacity : null
  const ops = (c.opacities ?? {}) as Partial<PartOpacities>
  const bl = (c.blurs ?? {}) as Partial<PartBlurs>
  const blurs = {} as PartBlurs
  for (const k of ['bg', 'sidebar', 'card', 'settings', 'chat', 'trajectory', 'input'] as const) {
    blurs[k] = num(bl[k], DEFAULT_CONFIG.blurs[k])
  }
  const bgType = ['video', 'mesh', 'shader', 'pattern'].includes(c.backgroundType as string)
    ? (c.backgroundType as ThemeConfig['backgroundType'])
    : DEFAULT_CONFIG.backgroundType
  const bgMode = (['fit', 'fill', 'stretch', 'tile', 'center'] as BgMode[]).includes(c.bgMode as BgMode) ? (c.bgMode as BgMode) : DEFAULT_CONFIG.bgMode
  const gen = c.generatedBg && typeof c.generatedBg === 'object'
    ? (c.generatedBg as { type?: string })
    : null
  const generatedBg = gen && gen.type === bgType ? (c.generatedBg as ThemeConfig['generatedBg']) : null

  cfg = {
    color,
    opacities: {
      bg: num(ops.bg, legacy ?? DEFAULT_CONFIG.opacities.bg),
      sidebar: num(ops.sidebar, legacy !== null ? Math.min(1, legacy + 0.08) : DEFAULT_CONFIG.opacities.sidebar),
      card: num(ops.card, DEFAULT_CONFIG.opacities.card),
      input: num(ops.input, DEFAULT_CONFIG.opacities.input),
    },
    blurs,
    settingsOpacity: num(c.settingsOpacity, DEFAULT_CONFIG.settingsOpacity),
    wallpaperOpacity: num(c.wallpaperOpacity, DEFAULT_CONFIG.wallpaperOpacity),
    blur: num(c.blur, DEFAULT_CONFIG.blur),
    bgState: adoptBgState((c.bgState ?? {}) as Partial<BgState>),
    videoBgState: adoptBgState((c.videoBgState ?? {}) as Partial<BgState>),
    backgroundType: bgType,
    bgMode,
    videoMime: typeof c.videoMime === 'string' ? c.videoMime : null,
    generatedBg: generatedBg ? normalizeGeneratedBg(generatedBg) : null,
    regenerateOnReload: typeof c.regenerateOnReload === 'boolean' ? c.regenerateOnReload : DEFAULT_CONFIG.regenerateOnReload,
    chatTextOpacity: clamp01(c.chatTextOpacity, DEFAULT_CONFIG.chatTextOpacity),
    trajectoryOpacity: clamp01(c.trajectoryOpacity, DEFAULT_CONFIG.trajectoryOpacity),
  }
}

function normalizeGeneratedBg(p: ThemeConfig['generatedBg']): ThemeConfig['generatedBg'] {
  if (!p) return null
  if (p.type === 'mesh') {
    return {
      type: 'mesh',
      seed: num(p.seed, 0),
      scale: cl(p.scale, 0.3, 3, 1),
      intensity: cl(p.intensity, 0, 1, 0.6),
    }
  }
  if (p.type === 'shader') {
    return {
      type: 'shader',
      preset: ['aurora', 'nebula', 'noise'].includes(p.preset) ? p.preset : 'aurora',
      speed: cl(p.speed, 0, 2, 0.3),
      scale: cl(p.scale, 0.3, 3, 1),
      seed: typeof p.seed === 'number' ? Math.floor(p.seed) : 0,
    }
  }
  return {
    type: 'pattern',
    preset: ['dots', 'waves', 'poly'].includes(p.preset) ? p.preset : 'dots',
    density: cl(p.density, 0, 1, 0.5),
    scale: cl(p.scale, 0.3, 3, 1),
    seed: typeof p.seed === 'number' ? Math.floor(p.seed) : 0,
  }
}
