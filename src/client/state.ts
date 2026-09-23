import type { BgState, ThemeConfig, PartOpacities, PartBlurs, PartStrokes, StrokeConfig, BgMode, ProfileEntry, RotationConfig, RotationItem, ScheduleConfig, SchemeOverride, ProfileAppearance } from './types'

export const DEFAULT_CONFIG: ThemeConfig = {
  color: null,
  // Defaults sit at mid-scale rather than at "no visible change" (was 0.85 /
  // 0.93 / 1 / 1 with every blur at 0): a fresh install then shows right away
  // that the controls are live, instead of looking inert until each slider is
  // dragged once. Only affects installs with no persisted config.
  // The main background is the deliberate exception: with no persisted config it
  // now paints nothing over the wallpaper (opacity 0) and frosts nothing (blur 0),
  // so a first launch shows the picture as uploaded.
  opacities: { bg: 0, sidebar: 0.5, card: 0.5, input: 0.5 },
  // Blur sliders are px-based (0–60), so 50% of their range is 30px — except the
  // bg pair above and below, which start untouched.
  blurs: { bg: 0, sidebar: 30, card: 30, settings: 30, chat: 30, trajectory: 30, input: 30, panel: 30, produced: 30, header: 30 },
  strokes: {
    bg: { width: 0, color: 'auto', customColor: '#808080' },
    sidebar: { width: 0, color: 'auto', customColor: '#808080' },
    card: { width: 0, color: 'auto', customColor: '#808080' },
    settings: { width: 0, color: 'auto', customColor: '#808080' },
    chat: { width: 0, color: 'auto', customColor: '#808080' },
    trajectory: { width: 0, color: 'auto', customColor: '#808080' },
    input: { width: 0, color: 'auto', customColor: '#808080' },
    panel: { width: 0, color: 'auto', customColor: '#808080' },
    produced: { width: 0, color: 'auto', customColor: '#808080' },
    header: { width: 0, color: 'auto', customColor: '#808080' },
  },
  settingsOpacity: 0.5,
  // 100% = the background picture untouched. Deliberately NOT part of the
  // 50% default batch: halving the wallpaper's own alpha would wash out a
  // freshly uploaded picture — the other surface sliders above are mid-scale,
  // this one stays opaque.
  wallpaperOpacity: 1,
  // The 背景 page's own wallpaper blur, 0 for the same reason: a first install
  // shows the wallpaper exactly as uploaded.
  blur: 0,
  bgState: { zoom: 1, x: 0, y: 0, iw: 0, ih: 0 },
  videoBgState: { zoom: 1, x: 0, y: 0, iw: 0, ih: 0 },
  backgroundType: 'image',
  bgMode: 'fit',
  videoMime: null,
  fontMime: null,
  fontEnabled: true,
  generatedBg: null,
  regenerateOnReload: false,
  chatTextOpacity: 0.5,
  // 100% = untouched host surface; these all default to mid-scale too.
  trajectoryOpacity: 0.5,
  panelOpacity: 0.5,
  producedOpacity: 0.5,
  headerOpacity: 0.5,
  profiles: [],
  rotation: { enabled: false, mode: 'shuffle', interval: 'daily', current: 0, items: [], lastRotate: null },
  schedule: { enabled: false, mode: 'time', dayProfile: null, nightProfile: null, dayStart: '07:00', nightStart: '19:00' },
  schemeOverride: 'auto',
  activeProfile: null,
}

const clamp01 = (n: unknown, def: number): number =>
  typeof n === 'number' ? Math.min(1, Math.max(0, n)) : def

// In-memory mirror of the file-backed store; the UI reads and mutates this,
// and it is synced to disk via the RPC layer.
export let cfg: ThemeConfig = { ...DEFAULT_CONFIG, opacities: { ...DEFAULT_CONFIG.opacities }, blurs: { ...DEFAULT_CONFIG.blurs }, strokes: structuredClone(DEFAULT_CONFIG.strokes), bgState: { ...DEFAULT_CONFIG.bgState }, videoBgState: { ...DEFAULT_CONFIG.videoBgState } }
export let wpImageUrl: string | null = null
// Retained across background-type switches so coming back to image/video
// restores the original upload.
export let wpUrl: string | null = null
export let wpVideoUrl: string | null = null
/** Captured video frame standing in for previews/color extraction (still-image APIs). */
export let wpVideoSnapshot: string | null = null
/** Local blob URL backing an in-session video; revoked when replaced or cleared. */
let wpVideoObjectUrl: string | null = null

export function setWpUrl(url: string | null): void { wpUrl = url }
// The serve URL is stable across in-place replacements (upload / URL download /
// rotation), so every swap needs a query-string cache-buster or the URL-keyed
// caches — the layer re-set guard, loadImage decode cache, brightness verdict,
// low-res drag copy, intrinsic-size lookup — all keep the old pixels.
let imageRev = 0
export function bumpImageRev(url: string | null): string | null {
  if (url === null) return url
  // The serve URL is a same-origin relative path (/dsh-any-background/…); the
  // rev query must reach those too, or an in-place replacement keeps the same
  // backgroundImage string and applyImageWp skips the swap. blob:/data: stay
  // intact (a query can break blob resolution).
  if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) return url
  imageRev++
  return `${url}${url.includes('?') ? '&' : '?'}r=${imageRev}`
}
export function setWpImageUrl(url: string | null): void { wpImageUrl = bumpImageRev(url) }
// The serve URL is stable, so replacing the stored video needs a query-string
// cache-buster or the player keeps the cached copy.
let videoRev = 0
export function setWpVideoUrl(url: string | null, mime: string | null): void {
  if (url === null) {
    wpVideoUrl = null
    wpVideoSnapshot = null
  } else {
    videoRev++
    // Blob URLs are unique per object; a query string can break their
    // resolution in some engines, so they skip the cache-buster.
    wpVideoUrl = url.startsWith('blob:') ? url : `${url}${url.includes('?') ? '&' : '?'}r=${videoRev}`
  }
  // Release the previous in-session object URL when replaced or cleared.
  if (wpVideoObjectUrl !== null && wpVideoObjectUrl !== url) {
    URL.revokeObjectURL(wpVideoObjectUrl)
    wpVideoObjectUrl = null
  }
  if (url !== null && url.startsWith('blob:')) wpVideoObjectUrl = url
  cfg.videoMime = url ? mime : null
}
export function setWpVideoSnapshot(url: string | null): void { wpVideoSnapshot = url }

/** Release the in-session video object URL (plugin teardown). */
export function disposeVideoObjectUrl(): void {
  if (wpVideoObjectUrl !== null) {
    URL.revokeObjectURL(wpVideoObjectUrl)
    wpVideoObjectUrl = null
  }
}
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
  for (const k of ['bg', 'sidebar', 'card', 'settings', 'chat', 'trajectory', 'input', 'panel', 'produced', 'header'] as const) {
    const v = b[k]
    out[k] = typeof v === 'number' ? Math.min(60, Math.max(0, v)) : DEFAULT_CONFIG.blurs[k]
  }
  return out
}

const STROKE_GROUPS = ['bg', 'sidebar', 'card', 'settings', 'chat', 'trajectory', 'input', 'panel', 'produced', 'header'] as const
const STROKE_COLOR_KEYS = ['auto', 'gray', 'black', 'white', 'theme', 'custom'] as const
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const DEFAULT_STROKE: StrokeConfig = { width: 0, color: 'auto', customColor: '#808080' }

function adoptStroke(raw: unknown): StrokeConfig {
  const s = (raw ?? {}) as Partial<StrokeConfig>
  return {
    width: typeof s.width === 'number' && isFinite(s.width) ? Math.min(4, Math.max(0, s.width)) : DEFAULT_STROKE.width,
    color: STROKE_COLOR_KEYS.includes(s.color as StrokeConfig['color']) ? s.color as StrokeConfig['color'] : DEFAULT_STROKE.color,
    customColor: typeof s.customColor === 'string' && HEX_RE.test(s.customColor) ? s.customColor : DEFAULT_STROKE.customColor,
  }
}

/** Move a possibly-partial strokes map into the full shape the UI reads. */
function strokesFrom(raw: unknown): PartStrokes {
  const s = (raw ?? {}) as Partial<PartStrokes>
  const out = {} as PartStrokes
  for (const k of STROKE_GROUPS) out[k] = adoptStroke(s[k])
  return out
}

export function rStrokes(): PartStrokes {
  return strokesFrom(cfg.strokes)
}
export function rWop(): number { return clamp01(cfg.wallpaperOpacity, DEFAULT_CONFIG.wallpaperOpacity) }
export function rBl(): number {
  return typeof cfg.blur === 'number' ? Math.min(60, Math.max(0, cfg.blur)) : DEFAULT_CONFIG.blur
}
export function rSop(): number { return clamp01(cfg.settingsOpacity, DEFAULT_CONFIG.settingsOpacity) }
export function rPanelOpacity(): number { return clamp01(cfg.panelOpacity, DEFAULT_CONFIG.panelOpacity) }
export function rProducedOpacity(): number { return clamp01(cfg.producedOpacity, DEFAULT_CONFIG.producedOpacity) }
export function rHeaderOpacity(): number { return clamp01(cfg.headerOpacity, DEFAULT_CONFIG.headerOpacity) }
export function rBgState(): BgState { return cfg.bgState }
export function rVideoBgState(): BgState { return cfg.videoBgState }

// ── Profiles / rotation / schedule / scheme ──────────────────────────────────
export function rProfiles(): ProfileEntry[] { return Array.isArray(cfg.profiles) ? cfg.profiles : [] }
export function rRotation(): RotationConfig {
  const r = cfg.rotation
  return r && typeof r === 'object'
    ? { ...DEFAULT_CONFIG.rotation, ...r, items: Array.isArray(r.items) ? r.items : [] }
    : { ...DEFAULT_CONFIG.rotation, items: [] }
}
export function rSchedule(): ScheduleConfig {
  return cfg.schedule && typeof cfg.schedule === 'object' ? { ...DEFAULT_CONFIG.schedule, ...cfg.schedule } : { ...DEFAULT_CONFIG.schedule }
}
export function rSchemeOverride(): SchemeOverride {
  return cfg.schemeOverride === 'light' || cfg.schemeOverride === 'dark' ? cfg.schemeOverride : 'auto'
}
export function rActiveProfile(): string | null { return cfg.activeProfile }

/** Effective interface scheme (drives data-ds-dark-theme / color-scheme): a
 *  forced override wins; in auto a picked color decides through its palette
 *  direction (keeps native controls aligned with the drawn surfaces), and
 *  without a pick the background's brightness verdict does. Stay light as the
 *  last fallback. */
export function rScheme(): 'light' | 'dark' {
  const o = rSchemeOverride()
  if (o !== 'auto') return o
  if (rHasColor()) return rColorScheme()
  return rBgDark() ? 'dark' : 'light'
}

/** Direction the color palette itself is built in: a forced override wins; in
 *  auto the theme color's own lightness decides (0.2.4 behavior) so surfaces
 *  always contrast with the palette's label fonts — the wallpaper verdict must
 *  not drag a dark color's surfaces into a light build (and vice versa) or
 *  text and surfaces converge. */
export function rColorScheme(): 'light' | 'dark' {
  const o = rSchemeOverride()
  if (o !== 'auto') return o
  return rHasColor() && rColor()[2] < 0.55 ? 'dark' : 'light'
}

/** Snapshot of the appearance fields a profile/preset restores. */
export function currentAppearance(): ProfileAppearance {
  return {
    color: cfg.color,
    opacities: { ...rOps() },
    blurs: { ...rBlurs() },
    strokes: rStrokes(),
    settingsOpacity: rSop(),
    wallpaperOpacity: rWop(),
    blur: rBl(),
    chatTextOpacity: rChatTextOpacity(),
    trajectoryOpacity: rTrajectoryOpacity(),
    panelOpacity: rPanelOpacity(),
    producedOpacity: rProducedOpacity(),
    headerOpacity: rHeaderOpacity(),
  }
}

/** Apply an appearance snapshot onto cfg (meta fields untouched). */
export function applyAppearance(ap: ProfileAppearance): void {
  cfg.color = Array.isArray(ap.color) && ap.color.length === 3 ? [...ap.color] as [number, number, number] : null
  cfg.opacities = { ...DEFAULT_CONFIG.opacities, ...(ap.opacities ?? {}) }
  cfg.blurs = { ...DEFAULT_CONFIG.blurs, ...(ap.blurs ?? {}) }
  cfg.strokes = strokesFrom(ap.strokes)
  cfg.settingsOpacity = clamp01(ap.settingsOpacity, DEFAULT_CONFIG.settingsOpacity)
  cfg.wallpaperOpacity = clamp01(ap.wallpaperOpacity, DEFAULT_CONFIG.wallpaperOpacity)
  cfg.blur = typeof ap.blur === 'number' ? Math.min(60, Math.max(0, ap.blur)) : DEFAULT_CONFIG.blur
  cfg.chatTextOpacity = clamp01(ap.chatTextOpacity, DEFAULT_CONFIG.chatTextOpacity)
  cfg.trajectoryOpacity = clamp01(ap.trajectoryOpacity, DEFAULT_CONFIG.trajectoryOpacity)
  cfg.panelOpacity = clamp01(ap.panelOpacity, DEFAULT_CONFIG.panelOpacity)
  cfg.producedOpacity = clamp01(ap.producedOpacity, DEFAULT_CONFIG.producedOpacity)
  cfg.headerOpacity = clamp01(ap.headerOpacity, DEFAULT_CONFIG.headerOpacity)
}

const num = (n: unknown, def: number): number => typeof n === 'number' ? n : def
const cl = (n: unknown, lo: number, hi: number, def: number): number =>
  typeof n === 'number' ? Math.min(hi, Math.max(lo, n)) : def

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function adoptProfiles(raw: unknown): ProfileEntry[] {
  if (!Array.isArray(raw)) return []
  const out: ProfileEntry[] = []
  for (const item of raw.slice(0, 20)) {
    const p = (item ?? {}) as Partial<ProfileEntry>
    if (typeof p.id !== 'string' || p.id.length === 0 || p.id.length > 64) continue
    if (out.some(e => e.id === p.id)) continue
    const ac = (p.config ?? {}) as Partial<ProfileAppearance>
    out.push({
      id: p.id,
      name: typeof p.name === 'string' && p.name.trim() ? p.name.slice(0, 60) : 'Profile',
      createdAt: typeof p.createdAt === 'string' ? p.createdAt : '',
      config: {
        color: Array.isArray(ac.color) && ac.color.length === 3 ? [...ac.color] as [number, number, number] : null,
        opacities: { ...DEFAULT_CONFIG.opacities, ...(ac.opacities ?? {}) },
        blurs: { ...DEFAULT_CONFIG.blurs, ...(ac.blurs ?? {}) },
        strokes: strokesFrom(ac.strokes),
        settingsOpacity: clamp01(ac.settingsOpacity, DEFAULT_CONFIG.settingsOpacity),
        wallpaperOpacity: clamp01(ac.wallpaperOpacity, DEFAULT_CONFIG.wallpaperOpacity),
        blur: num(ac.blur, DEFAULT_CONFIG.blur),
        chatTextOpacity: clamp01(ac.chatTextOpacity, DEFAULT_CONFIG.chatTextOpacity),
        trajectoryOpacity: clamp01(ac.trajectoryOpacity, DEFAULT_CONFIG.trajectoryOpacity),
        panelOpacity: clamp01(ac.panelOpacity, DEFAULT_CONFIG.panelOpacity),
        producedOpacity: clamp01(ac.producedOpacity, DEFAULT_CONFIG.producedOpacity),
        headerOpacity: clamp01(ac.headerOpacity, DEFAULT_CONFIG.headerOpacity),
      },
    })
  }
  return out
}

function adoptRotation(raw: unknown): RotationConfig {
  const r = (raw ?? {}) as Partial<RotationConfig>
  const items: RotationItem[] = Array.isArray(r.items)
    ? r.items
      .filter((it): it is RotationItem => {
        const i = (it ?? {}) as Partial<RotationItem>
        return typeof i?.file === 'string' && /^[\w-]+\.(jpg|jpeg|png|gif|webp)$/i.test(i.file)
      })
      .slice(0, 30)
      .map(it => ({ file: it.file, thumb: typeof it.thumb === 'string' && it.thumb.startsWith('data:image/') && it.thumb.length <= 65536 ? it.thumb : '' }))
    : []
  return {
    enabled: r.enabled === true,
    mode: r.mode === 'order' ? 'order' : 'shuffle',
    interval: r.interval === 'reload' || r.interval === 'weekly' ? r.interval : 'daily',
    current: num(r.current, 0),
    items,
    lastRotate: typeof r.lastRotate === 'string' ? r.lastRotate : null,
  }
}

function adoptSchedule(raw: unknown): ScheduleConfig {
  const r = (raw ?? {}) as Partial<ScheduleConfig>
  return {
    enabled: r.enabled === true,
    mode: r.mode === 'system' ? 'system' : 'time',
    dayProfile: typeof r.dayProfile === 'string' ? r.dayProfile : null,
    nightProfile: typeof r.nightProfile === 'string' ? r.nightProfile : null,
    dayStart: typeof r.dayStart === 'string' && HHMM_RE.test(r.dayStart) ? r.dayStart : DEFAULT_CONFIG.schedule.dayStart,
    nightStart: typeof r.nightStart === 'string' && HHMM_RE.test(r.nightStart) ? r.nightStart : DEFAULT_CONFIG.schedule.nightStart,
  }
}

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
  for (const k of ['bg', 'sidebar', 'card', 'settings', 'chat', 'trajectory', 'input', 'panel', 'produced', 'header'] as const) {
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
    strokes: strokesFrom(c.strokes),
    settingsOpacity: num(c.settingsOpacity, DEFAULT_CONFIG.settingsOpacity),
    wallpaperOpacity: num(c.wallpaperOpacity, DEFAULT_CONFIG.wallpaperOpacity),
    blur: num(c.blur, DEFAULT_CONFIG.blur),
    bgState: adoptBgState((c.bgState ?? {}) as Partial<BgState>),
    videoBgState: adoptBgState((c.videoBgState ?? {}) as Partial<BgState>),
    backgroundType: bgType,
    bgMode,
    videoMime: typeof c.videoMime === 'string' ? c.videoMime : null,
    fontMime: typeof c.fontMime === 'string' ? c.fontMime : null,
    fontEnabled: typeof c.fontEnabled === 'boolean' ? c.fontEnabled : DEFAULT_CONFIG.fontEnabled,
    generatedBg: generatedBg ? normalizeGeneratedBg(generatedBg) : null,
    regenerateOnReload: typeof c.regenerateOnReload === 'boolean' ? c.regenerateOnReload : DEFAULT_CONFIG.regenerateOnReload,
    chatTextOpacity: clamp01(c.chatTextOpacity, DEFAULT_CONFIG.chatTextOpacity),
    trajectoryOpacity: clamp01(c.trajectoryOpacity, DEFAULT_CONFIG.trajectoryOpacity),
    panelOpacity: clamp01(c.panelOpacity, DEFAULT_CONFIG.panelOpacity),
    producedOpacity: clamp01(c.producedOpacity, DEFAULT_CONFIG.producedOpacity),
    headerOpacity: clamp01(c.headerOpacity, DEFAULT_CONFIG.headerOpacity),
    profiles: adoptProfiles(c.profiles),
    rotation: adoptRotation(c.rotation),
    schedule: adoptSchedule(c.schedule),
    schemeOverride: c.schemeOverride === 'light' || c.schemeOverride === 'dark' ? c.schemeOverride : 'auto',
    activeProfile: typeof c.activeProfile === 'string' ? c.activeProfile : null,
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
      preset: ['aurora', 'nebula', 'noise', 'starfield'].includes(p.preset) ? p.preset : 'aurora',
      speed: cl(p.speed, 0, 2, 0.3),
      scale: cl(p.scale, 0.3, 3, 1),
      seed: typeof p.seed === 'number' ? Math.floor(p.seed) : 0,
    }
  }
  return {
    type: 'pattern',
    preset: ['dots', 'waves', 'poly', 'rain', 'contour', 'meta'].includes(p.preset) ? p.preset : 'dots',
    density: cl(p.density, 0, 1, 0.5),
    scale: cl(p.scale, 0.3, 3, 1),
    seed: typeof p.seed === 'number' ? Math.floor(p.seed) : 0,
  }
}
