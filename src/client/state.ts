import type { BgState, ThemeConfig, PartOpacities, PartBlurs, BgMode, ProfileEntry, RotationConfig, RotationItem, ScheduleConfig, SchemeOverride, ProfileAppearance } from './types'

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
export let cfg: ThemeConfig = { ...DEFAULT_CONFIG, opacities: { ...DEFAULT_CONFIG.opacities }, blurs: { ...DEFAULT_CONFIG.blurs }, bgState: { ...DEFAULT_CONFIG.bgState }, videoBgState: { ...DEFAULT_CONFIG.videoBgState } }
export let wpImageUrl: string | null = null
// Retained across background-type switches so coming back to image/video
// restores the original upload.
export let wpUrl: string | null = null
export let wpVideoUrl: string | null = null
/** Captured video frame standing in for previews/color extraction (still-image APIs). */
export let wpVideoSnapshot: string | null = null
/** Local blob URL backing an in-session video; revoked when replaced or cleared. */
let wpVideoObjectUrl: string | null = null

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

/** Effective interface scheme: a forced override wins; otherwise the active
 *  background's brightness verdict (the text sits on the wallpaper), then the
 *  picked color's lightness. Without any of those, stay light. All genTokens
 *  call sites pass this so the palette and the scheme flag never diverge. */
export function rScheme(): 'light' | 'dark' {
  const o = rSchemeOverride()
  if (o !== 'auto') return o
  const dark = rBgDark() ?? (rHasColor() ? rColor()[2] < 0.55 : false)
  return dark ? 'dark' : 'light'
}

/** Snapshot of the appearance fields a profile/preset restores. */
export function currentAppearance(): ProfileAppearance {
  return {
    color: cfg.color,
    opacities: { ...rOps() },
    blurs: { ...rBlurs() },
    settingsOpacity: rSop(),
    wallpaperOpacity: rWop(),
    blur: rBl(),
    chatTextOpacity: rChatTextOpacity(),
    trajectoryOpacity: rTrajectoryOpacity(),
  }
}

/** Apply an appearance snapshot onto cfg (meta fields untouched). */
export function applyAppearance(ap: ProfileAppearance): void {
  cfg.color = Array.isArray(ap.color) && ap.color.length === 3 ? [...ap.color] as [number, number, number] : null
  cfg.opacities = { ...DEFAULT_CONFIG.opacities, ...(ap.opacities ?? {}) }
  cfg.blurs = { ...DEFAULT_CONFIG.blurs, ...(ap.blurs ?? {}) }
  cfg.settingsOpacity = clamp01(ap.settingsOpacity, DEFAULT_CONFIG.settingsOpacity)
  cfg.wallpaperOpacity = clamp01(ap.wallpaperOpacity, DEFAULT_CONFIG.wallpaperOpacity)
  cfg.blur = typeof ap.blur === 'number' ? Math.min(60, Math.max(0, ap.blur)) : DEFAULT_CONFIG.blur
  cfg.chatTextOpacity = clamp01(ap.chatTextOpacity, DEFAULT_CONFIG.chatTextOpacity)
  cfg.trajectoryOpacity = clamp01(ap.trajectoryOpacity, DEFAULT_CONFIG.trajectoryOpacity)
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
        settingsOpacity: clamp01(ac.settingsOpacity, DEFAULT_CONFIG.settingsOpacity),
        wallpaperOpacity: clamp01(ac.wallpaperOpacity, DEFAULT_CONFIG.wallpaperOpacity),
        blur: num(ac.blur, DEFAULT_CONFIG.blur),
        chatTextOpacity: clamp01(ac.chatTextOpacity, DEFAULT_CONFIG.chatTextOpacity),
        trajectoryOpacity: clamp01(ac.trajectoryOpacity, DEFAULT_CONFIG.trajectoryOpacity),
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
