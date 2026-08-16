import type { BgState, ThemeConfig, PartOpacities, PartBlurs } from './types'

export const DEFAULT_CONFIG: ThemeConfig = {
  color: null,
  opacities: { bg: 0.85, sidebar: 0.93, card: 1 },
  blurs: { bg: 0, sidebar: 0, card: 0, settings: 0 },
  settingsOpacity: 1,
  wallpaperOpacity: 1,
  blur: 0,
  bgState: { zoom: 1, x: 0, y: 0, iw: 0, ih: 0 },
}

// In-memory mirror of the file-backed store. The node half owns the disk; this
// module is the single source of truth the UI reads from and mutates, synced
// to disk via the RPC layer.
export let cfg: ThemeConfig = { ...DEFAULT_CONFIG, opacities: { ...DEFAULT_CONFIG.opacities }, blurs: { ...DEFAULT_CONFIG.blurs }, bgState: { ...DEFAULT_CONFIG.bgState } }
export let wpUrl: string | null = null

export function setWpUrl(url: string | null): void { wpUrl = url }
export function setBgState(s: BgState): void { cfg.bgState = s }

export function rHasColor(): boolean { return cfg.color !== null }
export function rColor(): [number, number, number] { return cfg.color ?? [220, 0.55, 0.25] }
export function rWp(): string | null { return wpUrl }
export function rOps(): PartOpacities {
  const o = cfg.opacities ?? {}
  return {
    bg: typeof o.bg === 'number' ? Math.min(1, Math.max(0, o.bg)) : DEFAULT_CONFIG.opacities.bg,
    sidebar: typeof o.sidebar === 'number' ? Math.min(1, Math.max(0, o.sidebar)) : DEFAULT_CONFIG.opacities.sidebar,
    card: typeof o.card === 'number' ? Math.min(1, Math.max(0, o.card)) : DEFAULT_CONFIG.opacities.card,
  }
}
export function rBlurs(): PartBlurs {
  const b = cfg.blurs ?? {}
  return {
    bg: typeof b.bg === 'number' ? Math.min(60, Math.max(0, b.bg)) : DEFAULT_CONFIG.blurs.bg,
    sidebar: typeof b.sidebar === 'number' ? Math.min(60, Math.max(0, b.sidebar)) : DEFAULT_CONFIG.blurs.sidebar,
    card: typeof b.card === 'number' ? Math.min(60, Math.max(0, b.card)) : DEFAULT_CONFIG.blurs.card,
    settings: typeof b.settings === 'number' ? Math.min(60, Math.max(0, b.settings)) : DEFAULT_CONFIG.blurs.settings,
  }
}
export function rWop(): number { return typeof cfg.wallpaperOpacity === 'number' ? Math.min(1, Math.max(0, cfg.wallpaperOpacity)) : DEFAULT_CONFIG.wallpaperOpacity }
export function rBl(): number { return typeof cfg.blur === 'number' ? Math.min(60, Math.max(0, cfg.blur)) : DEFAULT_CONFIG.blur }
export function rSop(): number { return typeof cfg.settingsOpacity === 'number' ? Math.min(1, Math.max(0, cfg.settingsOpacity)) : DEFAULT_CONFIG.settingsOpacity }
export function rBgState(): BgState { return cfg.bgState }

/** Move a possibly-absent partial config into the shape the UI reads. */
export function adoptConfig(raw: unknown): void {
  const c = (raw ?? {}) as Partial<ThemeConfig> & { opacity?: unknown }
  const color = Array.isArray(c.color) && c.color.length === 3
    ? [c.color[0], c.color[1], c.color[2]] as [number, number, number]
    : null
  const bg = (c.bgState ?? {}) as Partial<BgState>
  // Migration: the old single main-interface opacity becomes per-part, keeping
  // the sidebar's former +0.08 offset and leaving cards opaque as before.
  const legacy = typeof c.opacity === 'number' ? c.opacity : null
  const ops = (c.opacities ?? {}) as Partial<PartOpacities>
  const bl = (c.blurs ?? {}) as Partial<PartBlurs>
  cfg = {
    color,
    opacities: {
      bg: typeof ops.bg === 'number' ? ops.bg : (legacy ?? DEFAULT_CONFIG.opacities.bg),
      sidebar: typeof ops.sidebar === 'number' ? ops.sidebar : (legacy !== null ? Math.min(1, legacy + 0.08) : DEFAULT_CONFIG.opacities.sidebar),
      card: typeof ops.card === 'number' ? ops.card : DEFAULT_CONFIG.opacities.card,
    },
    blurs: {
      bg: typeof bl.bg === 'number' ? bl.bg : DEFAULT_CONFIG.blurs.bg,
      sidebar: typeof bl.sidebar === 'number' ? bl.sidebar : DEFAULT_CONFIG.blurs.sidebar,
      card: typeof bl.card === 'number' ? bl.card : DEFAULT_CONFIG.blurs.card,
      settings: typeof bl.settings === 'number' ? bl.settings : DEFAULT_CONFIG.blurs.settings,
    },
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
