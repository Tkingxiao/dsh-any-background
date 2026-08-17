/**
 * Node half of the dsh-any-background plugin: file-backed theme persistence.
 *
 * The browser client cannot touch the filesystem, so this half owns the
 * `.dsh-any-background-data/` store under the DSH data home and exposes a
 * small RPC surface over the dedicated `/dsh-any-background` channel (never
 * the shared `/api`, so slash commands stay intact). The client reads the
 * persisted theme on boot and writes it back on every setting change.
 *
 * Storage layout:
 *   ~/.dsh/.dsh-any-background-data/
 *     ├── theme-config.json   settings (color, opacities, blur, bg state)
 *     └── wallpaper.jpg       the chosen background image (deleted on remove)
 *
 * @module dsh-any-background
 */
import { mkdir, readFile, writeFile, rm, access } from 'node:fs/promises'
import { dshHomePath } from '@deepseek-ai/dsh-home-paths'

export const name = 'dsh-any-background'
export const inject = ['connection']

// ── Storage layout ────────────────────────────────────────────────────────────

const DATA_DIR = '.dsh-any-background-data'
const CONFIG_FILE = 'theme-config.json'
const WALLPAPER_FILE = 'wallpaper.jpg'

interface BgState {
  zoom: number; x: number; y: number; iw: number; ih: number
}
interface PartOpacities {
  bg: number; sidebar: number; card: number
}
interface PartBlurs {
  bg: number; sidebar: number; card: number; settings: number
}
type BackgroundType = 'image' | 'mesh' | 'shader' | 'pattern'
type GeneratedBgParams =
  | { type: 'mesh'; seed: number; scale: number; intensity: number }
  | { type: 'shader'; preset: 'aurora' | 'nebula' | 'noise'; speed: number; scale: number; seed: number }
  | { type: 'pattern'; preset: 'dots' | 'waves' | 'poly'; density: number; scale: number; seed: number }

interface ThemeConfig {
  /** Saved HSL theme color; null means "use the system theme". */
  color: [number, number, number] | null
  /** Per-part main interface opacities. */
  opacities: PartOpacities
  /** Per-part interface blur (px, 0..60). */
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
  /** Whether to regenerate generated backgrounds on page reload. */
  regenerateOnReload: boolean
}

const DEFAULT_CONFIG: ThemeConfig = {
  color: null,
  opacities: { bg: 0.85, sidebar: 0.93, card: 1 },
  blurs: { bg: 0, sidebar: 0, card: 0, settings: 0 },
  settingsOpacity: 1,
  wallpaperOpacity: 1,
  blur: 0,
  bgState: { zoom: 1, x: 0, y: 0, iw: 0, ih: 0 },
  backgroundType: 'image',
  generatedBg: null,
  regenerateOnReload: false,
}

const dataDir = (): string => dshHomePath(DATA_DIR)
const configPath = (): string => dshHomePath(DATA_DIR, CONFIG_FILE)
const wallpaperPath = (): string => dshHomePath(DATA_DIR, WALLPAPER_FILE)

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number, def: number): number {
  return typeof n === 'number' && isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def
}

/** Coerce an unknown persisted value into a valid ThemeConfig, falling back per-field. */
function normalizeConfig(raw: unknown): ThemeConfig {
  const r = (raw ?? {}) as Partial<ThemeConfig> & { opacity?: unknown }
  const c = r.color
  const color: [number, number, number] | null =
    Array.isArray(c) && c.length === 3 && c.every(x => typeof x === 'number' && isFinite(x))
      ? [clamp(c[0] as number, 0, 360, 220), clamp(c[1] as number, 0, 1, 0.55), clamp(c[2] as number, 0, 1, 0.25)]
      : null
  const bg = (r.bgState ?? {}) as Partial<BgState>
  const bgType: BackgroundType = ['image', 'mesh', 'shader', 'pattern'].includes(r.backgroundType as string)
    ? (r.backgroundType as BackgroundType)
    : DEFAULT_CONFIG.backgroundType
  const gen = r.generatedBg && typeof r.generatedBg === 'object'
    ? (r.generatedBg as { type?: string })
    : null
  const generatedBg: ThemeConfig['generatedBg'] = gen && gen.type === bgType
    ? normalizeGeneratedBg(r.generatedBg as GeneratedBgParams)
    : null
  // Migration: the old single main-interface opacity becomes per-part, keeping
  // the sidebar's former +0.08 offset and leaving cards opaque as before.
  const legacy = typeof r.opacity === 'number' ? r.opacity : null
  const ops = (r.opacities ?? {}) as Partial<PartOpacities>
  const bl = (r.blurs ?? {}) as Partial<PartBlurs>
  return {
    color,
    opacities: {
      bg: clamp(ops.bg as number, 0, 1, legacy ?? DEFAULT_CONFIG.opacities.bg),
      sidebar: clamp(ops.sidebar as number, 0, 1, legacy !== null ? Math.min(1, legacy + 0.08) : DEFAULT_CONFIG.opacities.sidebar),
      card: clamp(ops.card as number, 0, 1, DEFAULT_CONFIG.opacities.card),
    },
    blurs: {
      bg: clamp(bl.bg as number, 0, 60, DEFAULT_CONFIG.blurs.bg),
      sidebar: clamp(bl.sidebar as number, 0, 60, DEFAULT_CONFIG.blurs.sidebar),
      card: clamp(bl.card as number, 0, 60, DEFAULT_CONFIG.blurs.card),
      settings: clamp(bl.settings as number, 0, 60, DEFAULT_CONFIG.blurs.settings),
    },
    settingsOpacity: clamp(r.settingsOpacity as number, 0, 1, DEFAULT_CONFIG.settingsOpacity),
    wallpaperOpacity: clamp(r.wallpaperOpacity as number, 0, 1, DEFAULT_CONFIG.wallpaperOpacity),
    blur: clamp(r.blur as number, 0, 60, DEFAULT_CONFIG.blur),
    bgState: {
      zoom: clamp(bg.zoom as number, 0.1, 10, 1),
      x: typeof bg.x === 'number' && isFinite(bg.x) ? bg.x : 0,
      y: typeof bg.y === 'number' && isFinite(bg.y) ? bg.y : 0,
      iw: typeof bg.iw === 'number' && (bg.iw as number) > 0 ? bg.iw : 0,
      ih: typeof bg.ih === 'number' && (bg.ih as number) > 0 ? bg.ih : 0,
    },
    backgroundType: bgType,
    generatedBg,
    regenerateOnReload: typeof r.regenerateOnReload === 'boolean' ? r.regenerateOnReload : DEFAULT_CONFIG.regenerateOnReload,
  }
}

function normalizeGeneratedBg(p: GeneratedBgParams): GeneratedBgParams | null {
  if (p.type === 'mesh') {
    return {
      type: 'mesh',
      seed: typeof p.seed === 'number' ? p.seed : 0,
      scale: clamp(p.scale, 0.3, 3, 1),
      intensity: clamp(p.intensity, 0, 1, 0.6),
    }
  }
  if (p.type === 'shader') {
    return {
      type: 'shader',
      preset: ['aurora', 'nebula', 'noise'].includes(p.preset) ? p.preset : 'aurora',
      speed: clamp(p.speed, 0, 2, 0.3),
      scale: clamp(p.scale, 0.3, 3, 1),
      seed: typeof p.seed === 'number' ? Math.floor(p.seed) : 0,
    }
  }
  if (p.type === 'pattern') {
    return {
      type: 'pattern',
      preset: ['dots', 'waves', 'poly'].includes(p.preset) ? p.preset : 'dots',
      density: clamp(p.density, 0, 1, 0.5),
      scale: clamp(p.scale, 0.3, 3, 1),
      seed: typeof p.seed === 'number' ? Math.floor(p.seed) : 0,
    }
  }
  return null
}

// ── File operations ───────────────────────────────────────────────────────────

async function ensureDir(): Promise<void> {
  try {
    await mkdir(dataDir(), { recursive: true })
  } catch (e) {
    console.warn(`dsh-any-background: cannot create data dir "${dataDir()}"`, e)
  }
}

async function readConfig(): Promise<ThemeConfig> {
  await ensureDir()
  // First run (or an intentionally removed store) has no config file yet —
  // that is not an error, just fall back to defaults silently.
  try {
    await access(configPath())
  } catch {
    return { ...DEFAULT_CONFIG }
  }
  try {
    const raw = await readFile(configPath(), 'utf8')
    return normalizeConfig(JSON.parse(raw))
  } catch (e) {
    // File exists but is malformed or unreadable: use defaults and warn.
    console.warn(`dsh-any-background: cannot read "${CONFIG_FILE}", using defaults`, e)
    return { ...DEFAULT_CONFIG }
  }
}

async function writeConfig(config: ThemeConfig): Promise<boolean> {
  await ensureDir()
  try {
    await writeFile(configPath(), JSON.stringify(normalizeConfig(config), null, 2), 'utf8')
    return true
  } catch (e) {
    console.error(`dsh-any-background: failed to write "${CONFIG_FILE}"`, e)
    return false
  }
}

/** Read the wallpaper file and return it as a JPEG data URL (null when absent). */
async function readWallpaper(): Promise<string | null> {
  try {
    const buf = await readFile(wallpaperPath())
    return `data:image/jpeg;base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

/**
 * Persist a wallpaper. Passing null removes the stored file; otherwise the
 * data URL is decoded and written to wallpaper.jpg. Returns false (and keeps
 * the previous file) when the payload is invalid or the write fails.
 */
async function writeWallpaper(dataUrl: string | null): Promise<boolean> {
  await ensureDir()
  try {
    if (dataUrl === null) {
      await rm(wallpaperPath(), { force: true })
      return true
    }
    const m = /^data:image\/[a-zA-Z0-9.+-]+;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
    if (!m) return false
    await writeFile(wallpaperPath(), Buffer.from(m[1]!, 'base64'))
    return true
  } catch (e) {
    console.error(`dsh-any-background: failed to write "${WALLPAPER_FILE}"`, e)
    return false
  }
}

// ── RPC surface ───────────────────────────────────────────────────────────────

const NS = 'dshAnyBackground'

export function apply(ctx: any): void {
  // Use a dedicated RPC channel (never the shared `/api`) so the plugin never
  // hogs the harness's message channel and breaks DSH slash commands.
  const dispose = ctx.connection.rpc.handle(
    '/dsh-any-background',
    async (ep: string, payload: any) => {
      const method = ep.slice(`${NS}/`.length)
      try {
        switch (method) {
          case 'read':
            return { ok: true, value: { config: await readConfig(), wallpaper: await readWallpaper() } }
          case 'writeConfig':
            return { ok: true, value: await writeConfig((payload?.config ?? {}) as ThemeConfig) }
          case 'setWallpaper':
            return { ok: true, value: await writeWallpaper((payload?.dataUrl ?? null) as string | null) }
          default:
            return { ok: false, error: { code: 'bad-request', message: `unknown endpoint ${ep}`, details: { issues: [] } } }
        }
      } catch (e) {
        return { ok: false, error: { code: 'internal', message: e instanceof Error ? e.message : String(e), details: {} } }
      }
    },
    { authority: 'trusted-host' },
  )
  ctx.on('dispose', () => {
    void dispose()
  })
}