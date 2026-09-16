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
  /** Cards/panels (--dsw-alias-bg-layer-1/2/3, --dsw-specific-menu). */
  card: number
  /** Input/control surfaces (--dsw-specific-input-major). */
  input: number
}

/** Per-part interface blur (px, 0..60), applied via backdrop-filter. */
export interface PartBlurs {
  /** Main background (AppFrame grid). */
  bg: number
  /** Sidebar column. */
  sidebar: number
  /** Cards/panels (the center column's option boxes inside the settings dialog). */
  card: number
  /** Settings panel. */
  settings: number
  /** Conversation text region (message column of the chat view). */
  chat: number
  /** Trajectory view surface. */
  trajectory: number
  /** Input/control surfaces ([data-composer-card], [data-cordis-panel]). */
  input: number
  /** Third-party workbench panel (dsh-better-sidebar bottom panel). */
  panel: number
  /** Produced/artifact surfaces (highlighted code blocks + produced chips). */
  produced: number
}

/** Text-stroke color of one surface group. A preset key plus the free color
 *  used when the key is 'custom' — presets ('theme', 'auto') re-derive from
 *  the live theme so they follow scheme/color changes without a rewrite. */
export interface StrokeConfig {
  /** Stroke width in px (0 = off, 0.5 steps). */
  width: number
  /** 'auto' (contrast the font color) | 'gray' | 'black' | 'white' | 'theme' | 'custom'. */
  color: 'auto' | 'gray' | 'black' | 'white' | 'theme' | 'custom'
  /** Free hex color consumed only when color === 'custom'. */
  customColor: string
}

/** Per-part text stroke (-webkit-text-stroke), same group keys as PartBlurs. */
export type PartStrokes = Record<keyof PartBlurs, StrokeConfig>

export type BackgroundType = 'image' | 'video' | 'mesh' | 'shader' | 'pattern'

/** Adaptive placement of a static (image/video) background. */
export type BgMode = 'fit' | 'fill' | 'stretch' | 'tile' | 'center'

/** Forced interface scheme: 'auto' derives light/dark from the color's lightness. */
export type SchemeOverride = 'auto' | 'light' | 'dark'

/** Appearance-only snapshot a saved profile (or built-in preset) restores.
 *  Wallpaper files are machine-local and deliberately excluded. */
export interface ProfileAppearance {
  color: [number, number, number] | null
  opacities: PartOpacities
  blurs: PartBlurs
  strokes: PartStrokes
  settingsOpacity: number
  wallpaperOpacity: number
  blur: number
  chatTextOpacity: number
  trajectoryOpacity: number
  panelOpacity: number
  /** Opacity of produced/artifact surfaces (0 = none, 1 = solid). */
  producedOpacity: number
}

/** A named, saved appearance profile. */
export interface ProfileEntry {
  id: string
  name: string
  createdAt: string
  config: ProfileAppearance
}

/** One candidate wallpaper in the rotation pool (server-side file + thumbnail). */
export interface RotationItem {
  file: string
  thumb: string
}

/** Wallpaper rotation pool + cadence. Advancing copies the chosen file into
 *  the active wallpaper slot, so the rest of the pipeline is untouched. */
export interface RotationConfig {
  enabled: boolean
  mode: 'shuffle' | 'order'
  interval: 'reload' | 'daily' | 'weekly'
  /** Index of the item currently active. */
  current: number
  items: RotationItem[]
  /** ISO timestamp of the last automatic advance (drives daily/weekly cadence). */
  lastRotate: string | null
}

/** Day/night profile auto-switch schedule. */
export interface ScheduleConfig {
  enabled: boolean
  /** 'time' switches at fixed clock times; 'system' follows prefers-color-scheme. */
  mode: 'time' | 'system'
  dayProfile: string | null
  nightProfile: string | null
  /** HH:MM — the day profile applies from dayStart until nightStart. */
  dayStart: string
  nightStart: string
}

export interface MeshGradientParams {
  type: 'mesh'
  seed: number
  scale: number
  intensity: number
}

export interface ShaderParams {
  type: 'shader'
  preset: 'aurora' | 'nebula' | 'noise' | 'starfield'
  speed: number
  scale: number
  /** Visual random seed; changing it regenerates the same preset with new variation. */
  seed: number
}

export interface PatternParams {
  type: 'pattern'
  preset: 'dots' | 'waves' | 'poly' | 'rain' | 'contour' | 'meta'
  density: number
  scale: number
  /** Visual random seed; changing it regenerates the same preset with new variation. */
  seed: number
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
  /** Per-part text stroke (width + color). */
  strokes: PartStrokes
  /** Settings-panel opacity (0..1). */
  settingsOpacity: number
  /** Wallpaper opacity (0..1). */
  wallpaperOpacity: number
  /** Wallpaper blur (px, 0..60). */
  blur: number
  /** Wallpaper placement state (zoom + fractional center + intrinsic size). */
  bgState: BgState
  /** Video placement state — a separate slot so editing the video framing
   *  never clobbers the image framing and vice versa. */
  videoBgState: BgState
  /** Current background source type. */
  backgroundType: BackgroundType
  /** Placement mode for image/video backgrounds (default: editor-driven fit). */
  bgMode: BgMode
  /** MIME type of the persisted video background (null when none stored). */
  videoMime: string | null
  /** MIME type of the persisted custom font (null when none stored). */
  fontMime: string | null
  /** Whether the stored custom font is applied to the interface. */
  fontEnabled: boolean
  /** Parameters for generated backgrounds (not used for images). */
  generatedBg: GeneratedBgParams | null
  /** Whether to regenerate generated backgrounds on page reload. */
  regenerateOnReload: boolean
  /** Translucent tint over the conversation text region (0 = none, 1 = solid). */
  chatTextOpacity: number
  /** Translucent tint over the trajectory view surface (0 = none, 1 = solid). */
  trajectoryOpacity: number
  /** Opacity of the dsh-better-sidebar workbench panel (0 = none, 1 = solid). */
  panelOpacity: number
  /** Opacity of produced/artifact surfaces (0 = none, 1 = solid). */
  producedOpacity: number
  /** Saved appearance profiles. */
  profiles: ProfileEntry[]
  /** Wallpaper rotation pool + cadence. */
  rotation: RotationConfig
  /** Day/night profile auto-switch schedule. */
  schedule: ScheduleConfig
  /** Forced interface scheme. */
  schemeOverride: SchemeOverride
  /** Id of the profile last applied. */
  activeProfile: string | null
}

/** State shape of the section's reactive store (URL, color, background type). */
export interface ThemeStoreState {
  url: string | null
  rev: number
  colorRev: number
  color: [number, number, number] | null
  backgroundType: BackgroundType
  generatedBg: GeneratedBgParams | null
  bgRev: number
  regenerateOnReload: boolean
  /** Config metadata snapshot (profiles / rotation / schedule / scheme). */
  profiles: ProfileEntry[]
  rotation: RotationConfig
  schedule: ScheduleConfig
  schemeOverride: SchemeOverride
  activeProfile: string | null
  metaRev: number
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
  /** Point the wallpaper at a serve URL whose bytes are already persisted
   *  (raw upload / URL download / rotation). null removes the stored image. */
  setWpFromServer: (url: string | null) => void
  /** Set/remove the background video. Prefers the raw Blob (streamed to
   *  disk over the binary upload route); a data URL string is the small-file
   *  legacy path through RPC. */
  setVideo: (source: Blob | string | null, mime: string | null) => void
  setOps: (ops: PartOpacities) => void
  setBlurs: (blurs: PartBlurs) => void
  setStrokes: (strokes: PartStrokes) => void
  /** Upload a font file (raw bytes stream to disk); resolves once stored. */
  setFont: (file: File) => Promise<boolean>
  /** Remove the stored custom font. */
  removeFont: () => void
  /** Toggle the stored custom font on/off without deleting it. */
  setFontEnabled: (v: boolean) => void
  setWop: (v: number) => void
  setBl: (v: number) => void
  setSop: (v: number) => void
  setPanelOp: (v: number) => void
  setBgType: (type: BackgroundType) => void
  setGeneratedBg: (params: GeneratedBgParams) => void
  regenerateBg: () => void
  setRegenerateOnReload: (v: boolean) => void
  extractColor: () => Promise<boolean>
  /** Save the current appearance as a named profile. */
  saveProfile: (name: string) => boolean
  /** Apply a saved profile by id. */
  applyProfile: (id: string) => boolean
  /** Delete a saved profile by id. */
  deleteProfile: (id: string) => boolean
  /** Apply a built-in preset's appearance bundle. */
  applyPreset: (appearance: ProfileAppearance) => void
  /** Force the interface scheme ('auto' derives it from the color lightness). */
  setSchemeOverride: (v: SchemeOverride) => void
  /** Patch the day/night schedule config. */
  setSchedule: (patch: Partial<ScheduleConfig>) => void
  /** Patch the wallpaper rotation config (mode/interval/enabled). */
  setRotation: (patch: Partial<RotationConfig>) => void
  /** Add image files to the rotation pool. */
  addRotationItems: (files: File[]) => Promise<boolean>
  /** Remove a rotation item by index. */
  removeRotationItem: (index: number) => Promise<boolean>
  /** Immediately advance the rotation to the next item. */
  rotateNow: () => Promise<boolean>
  /** Download a background video from a network URL and activate it. */
  setVideoFromUrl: (url: string) => Promise<boolean>
  /** Download the current theme (config + wallpaper data URL) as JSON. */
  exportTheme: () => void
  /** Import a theme JSON: applies config + wallpaper and persists to disk. */
  importTheme: (file: File) => Promise<boolean>
  useStore: <T>(selector: (s: ThemeStoreState) => T) => T
}

/** The store's bound actions the slots host hands to sectionInject. */
export interface BoundActions {
  syncBg: (url: string | null, rev: number, backgroundType?: BackgroundType, generatedBg?: GeneratedBgParams | null, bgRev?: number, regenerateOnReload?: boolean) => void
  syncColor: (hsv: [number, number, number], rev: number) => void
  syncMeta: (profiles: ProfileEntry[], rotation: RotationConfig, schedule: ScheduleConfig, schemeOverride: SchemeOverride, activeProfile: string | null, rev: number) => void
}

export interface RpcResultLike { ok: boolean; value?: any; error?: any }
