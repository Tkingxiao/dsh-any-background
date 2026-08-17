export interface ThemeSnapshot {
  preference: string; revision: number
  active: { colorScheme: string; tokens: Record<string, string> }
  themes: Array<{ id: string; colorScheme: string; tokens: Record<string, string> }>
}
export interface ThemeService {
  getTheme(): ThemeSnapshot; setTheme(id: string): void
  register(def: { id: string; colorScheme: string; tokens: Record<string, string> }): () => void
  overrideTokens(source: string, overrides: Record<string, Record<string, string>>): () => void
}
export interface LocaleService {
  register(ns: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): unknown
  bind(ns: string): (key: string) => string
  subscribe(cb: () => void): () => void; getSnapshot(): { active: string }
}
export interface SlotsService {
  inject(slot: string, register: () => unknown): void
  register(meta: Record<string, unknown>, component: () => unknown): unknown
}
export interface ConnectionService {
  rpc: { call(channel: string, endpoint: string, payload: unknown): Promise<unknown> }
}
export interface Ctx {
  effect(cb: () => unknown, label?: string): void
  on(event: string, cb: (...a: any[]) => void): () => void
  locale: LocaleService; slots: SlotsService; theme: ThemeService; connection: ConnectionService
}

export interface BgState { zoom: number; x: number; y: number; iw: number; ih: number }

/** Per-part main interface opacities (0..1). */
export interface PartOpacities {
  /** Main background (--dsw-alias-bg-base). */
  bg: number
  /** Sidebar (--dsw-specific-sidebar-fill). */
  sidebar: number
  /** Cards/panels (--dsw-alias-bg-layer-1/2/3). */
  card: number
}

/** Per-part interface blur (px, 0..60), applied via backdrop-filter. */
export interface PartBlurs {
  /** Main background (AppFrame grid). */
  bg: number
  /** Sidebar column. */
  sidebar: number
  /** Cards/panels (center + details columns). */
  card: number
  /** Settings panel. */
  settings: number
}

export type BackgroundType = 'image' | 'mesh' | 'shader' | 'pattern'

export interface MeshGradientParams {
  type: 'mesh'
  seed: number
  scale: number
  intensity: number
}

export interface ShaderParams {
  type: 'shader'
  preset: 'aurora' | 'nebula' | 'noise'
  speed: number
  scale: number
}

export interface PatternParams {
  type: 'pattern'
  preset: 'dots' | 'waves' | 'poly'
  density: number
  scale: number
}

export type GeneratedBgParams = MeshGradientParams | ShaderParams | PatternParams

/** Material-You-style palette extracted from a wallpaper or generated background. */
export interface ColorPalette {
  /** Dominant / primary hue (HSL). */
  primary: [number, number, number]
  /** Secondary / analogous hue. */
  secondary: [number, number, number]
  /** Tertiary / complementary accent. */
  tertiary: [number, number, number]
  /** Neutral surface used for backgrounds. */
  surface: [number, number, number]
  /** Average lightness of the source image (0..1) for auto light/dark. */
  luminance: number
}

export interface ThemeConfig {
  /** Saved HSL theme color; null means "use the system theme". */
  color: [number, number, number] | null
  /** Per-part main interface opacities. */
  opacities: PartOpacities
  /** Per-part interface blur (px). */
  blurs: PartBlurs
  /** Settings-panel opacity (0..1). */
  settingsOpacity: number
  /** Wallpaper opacity (0..1). */
  wallpaperOpacity: number
  /** Wallpaper blur (px, 0..60). */
  blur: number
  /** Wallpaper placement state (zoom + fractional center + intrinsic size). */
  bgState: BgState
  /** Current background source type. */
  backgroundType: BackgroundType
  /** Parameters for generated backgrounds (not used for images). */
  generatedBg: GeneratedBgParams | null
}

/** State shape of the section's store (wallpaper URL + programmatic color). */
export interface ThemeStoreState {
  url: string | null
  rev: number
  colorRev: number
  color: [number, number, number] | null
}

/** Props the slots host injects into the theme section. */
export interface ThemeSectionProps {
  t: (key: string) => string
  /** Wheel/input color in HSV space. */
  hue: number
  sat: number
  lit: number
  /** Commit a new color (HSV); the section converts to HSL for storage. */
  setColor: (h: number, s: number, l: number) => void
  setWp: (url: string | null) => void
  setOps: (ops: PartOpacities) => void
  setBlurs: (blurs: PartBlurs) => void
  setWop: (v: number) => void
  setBl: (v: number) => void
  setSop: (v: number) => void
  backgroundType: BackgroundType
  generatedBg: GeneratedBgParams | null
  setBgType: (type: BackgroundType) => void
  setGeneratedBg: (params: GeneratedBgParams) => void
  regenerateBg: () => void
  extractColor: () => Promise<boolean>
  /** Download the current theme (config + wallpaper data URL) as JSON. */
  exportTheme: () => void
  /** Import a theme JSON: applies config + wallpaper and persists to disk. */
  importTheme: (file: File) => Promise<boolean>
  useStore: <T>(selector: (s: ThemeStoreState) => T) => T
}

/** The store's bound actions the slots host hands to sectionInject. */
export interface BoundActions {
  syncBg: (url: string | null, rev: number) => void
  syncColor: (hsv: [number, number, number], rev: number) => void
}

export interface RpcResultLike { ok: boolean; value?: any; error?: any }
