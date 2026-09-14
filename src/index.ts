/**
 * Node half of dsh-any-background: file-backed theme persistence.
 *
 * Owns the `~/.dsh/.dsh-any-background-data/` store and exposes a small RPC
 * surface on the dedicated `/dsh-any-background` channel (never the shared
 * `/api`, so slash commands stay intact).
 *
 *   theme-config.json   settings
 *   wallpaper.jpg       background image
 *   wallpaper.<ext>     background video, named by MIME (mp4/webm/ogv/mov/mkv);
 *                       played over HTTP route /dsh-any-background/video and
 *                       uploaded to /dsh-any-background/video/upload as raw
 *                       bytes — never base64 through the RPC channel.
 */
import { access, mkdir, readFile, writeFile, rm, rename, stat } from 'node:fs/promises'
import { createReadStream, createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { dshHomePath } from '@deepseek-ai/dsh-home-paths'

export const name = 'dsh-any-background'
export const inject = ['connection', 'webServer']

const DATA_DIR = '.dsh-any-background-data'
const CONFIG_FILE = 'theme-config.json'
const WALLPAPER_FILE = 'wallpaper.jpg'
// Rotation pool: each candidate wallpaper lives here as its own file; the
// config index stores { file, thumb } entries pointing into this directory.
const ROTATION_DIR = 'rotation'
const VIDEO_ROUTE = '/dsh-any-background/video'
const UPLOAD_ROUTE = '/dsh-any-background/video/upload'
const WALLPAPER_ROUTE = '/dsh-any-background/wallpaper'
const WALLPAPER_UPLOAD_ROUTE = '/dsh-any-background/wallpaper/upload'
const UPLOAD_TMP = 'wallpaper.upload.tmp'
const VIDEO_UPLOAD_TMP = 'video.upload.tmp'
const WALLPAPER_UPLOAD_MAX = 100 * 1024 * 1024
const VIDEO_UPLOAD_MAX = 2 * 1024 * 1024 * 1024
// Network-URL wallpaper fetch: cap the download and time it out so a bad link
// can't stall the UI or fill the drive. The video variant streams (never
// buffered whole) with its own, larger caps.
const WALLPAPER_FETCH_MAX = 25 * 1024 * 1024
const WALLPAPER_FETCH_TIMEOUT = 20_000
const VIDEO_FETCH_MAX = 2 * 1024 * 1024 * 1024
const VIDEO_FETCH_TIMEOUT = 60_000
// Once streaming, a hard total-time budget would reject a 2 GB download on
// slower links; watch for inactivity instead (no bytes for this long = dead).
const VIDEO_FETCH_IDLE_TIMEOUT = 60_000

function videoFileName(mime: string | null): string {
  switch (mime) {
    case 'video/mp4': return 'wallpaper.mp4'
    case 'video/webm': return 'wallpaper.webm'
    case 'video/ogg': return 'wallpaper.ogv'
    case 'video/quicktime': return 'wallpaper.mov'
    case 'video/x-matroska': return 'wallpaper.mkv'
    default: return 'wallpaper.video'
  }
}
const VIDEO_CANDIDATES = ['wallpaper.mp4', 'wallpaper.webm', 'wallpaper.ogv', 'wallpaper.mov', 'wallpaper.mkv', 'wallpaper.video']

interface BgState {
  zoom: number; x: number; y: number; iw: number; ih: number
}
interface PartOpacities {
  bg: number; sidebar: number; card: number; input: number
}
interface PartBlurs {
  bg: number; sidebar: number; card: number; settings: number; chat: number; trajectory: number; input: number; panel: number; produced: number
}
type BackgroundType = 'image' | 'video' | 'mesh' | 'shader' | 'pattern'
type BgMode = 'fit' | 'fill' | 'stretch' | 'tile' | 'center'
type SchemeOverride = 'auto' | 'light' | 'dark'
type GeneratedBgParams =
  | { type: 'mesh'; seed: number; scale: number; intensity: number }
  | { type: 'shader'; preset: 'aurora' | 'nebula' | 'noise'; speed: number; scale: number; seed: number }
  | { type: 'pattern'; preset: 'dots' | 'waves' | 'poly'; density: number; scale: number; seed: number }

/** Appearance-only snapshot a saved profile restores (wallpaper files are
 *  machine-local and deliberately excluded). */
interface ProfileAppearance {
  color: [number, number, number] | null
  opacities: PartOpacities
  blurs: PartBlurs
  settingsOpacity: number
  wallpaperOpacity: number
  blur: number
  chatTextOpacity: number
  trajectoryOpacity: number
  panelOpacity: number
  producedOpacity: number
}
interface ProfileEntry { id: string; name: string; createdAt: string; config: ProfileAppearance }
interface RotationItem { file: string; thumb: string }
interface RotationConfig {
  enabled: boolean
  mode: 'shuffle' | 'order'
  interval: 'reload' | 'daily' | 'weekly'
  current: number
  items: RotationItem[]
  lastRotate: string | null
}
interface ScheduleConfig {
  enabled: boolean
  mode: 'time' | 'system'
  dayProfile: string | null
  nightProfile: string | null
  dayStart: string
  nightStart: string
}

interface ThemeConfig {
  /** Saved HSL theme color; null means "use the system theme". */
  color: [number, number, number] | null
  opacities: PartOpacities
  blurs: PartBlurs
  settingsOpacity: number
  wallpaperOpacity: number
  blur: number
  bgState: BgState
  videoBgState: BgState
  backgroundType: BackgroundType
  bgMode: BgMode
  videoMime: string | null
  generatedBg: GeneratedBgParams | null
  regenerateOnReload: boolean
  chatTextOpacity: number
  trajectoryOpacity: number
  /** Opacity of the dsh-better-sidebar workbench panel. */
  panelOpacity: number
  /** Opacity of produced/artifact surfaces (code blocks + highlight chips). */
  producedOpacity: number
  /** Saved appearance profiles (name + appearance snapshot). */
  profiles: ProfileEntry[]
  /** Wallpaper rotation pool + cadence. */
  rotation: RotationConfig
  /** Day/night profile auto-switch schedule. */
  schedule: ScheduleConfig
  /** Forced interface scheme ('auto' derives from the color's lightness). */
  schemeOverride: SchemeOverride
  /** Id of the profile last applied (drives schedule no-op detection). */
  activeProfile: string | null
}

const DEFAULT_CONFIG: ThemeConfig = {
  color: null,
  opacities: { bg: 0.85, sidebar: 0.93, card: 1, input: 1 },
  blurs: { bg: 0, sidebar: 0, card: 0, settings: 0, chat: 0, trajectory: 0, input: 0, panel: 0, produced: 0 },
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
  trajectoryOpacity: 1,
  panelOpacity: 1,
  producedOpacity: 1,
  profiles: [],
  rotation: { enabled: false, mode: 'shuffle', interval: 'daily', current: 0, items: [], lastRotate: null },
  schedule: { enabled: false, mode: 'time', dayProfile: null, nightProfile: null, dayStart: '07:00', nightStart: '19:00' },
  schemeOverride: 'auto',
  activeProfile: null,
}

const dataDir = (): string => dshHomePath(DATA_DIR)
const configPath = (): string => dshHomePath(DATA_DIR, CONFIG_FILE)
const wallpaperPath = (): string => dshHomePath(DATA_DIR, WALLPAPER_FILE)
const videoPathFor = (mime: string | null): string => dshHomePath(DATA_DIR, videoFileName(mime))

const exists = async (p: string): Promise<boolean> => { try { await access(p); return true } catch { return false } }

/** Locate the stored video: the recorded MIME decides the expected name; a
 *  legacy extensionless wallpaper.video is renamed on first access. */
async function findVideoFile(): Promise<{ path: string; mime: string | null } | null> {
  const cfg = await readConfig()
  const expected = videoPathFor(cfg.videoMime)
  if (await exists(expected)) return { path: expected, mime: cfg.videoMime }
  for (const name of VIDEO_CANDIDATES) {
    const p = dshHomePath(DATA_DIR, name)
    if (!(await exists(p))) continue
    if (cfg.videoMime !== null && name !== videoFileName(cfg.videoMime)) {
      // Stray file from a lost config write: adopt it via rename.
      try { await rename(p, expected); return { path: expected, mime: cfg.videoMime } } catch { return null }
    }
    return { path: p, mime: cfg.videoMime }
  }
  return null
}

function clamp(n: unknown, lo: number, hi: number, def: number): number {
  return typeof n === 'number' && isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def
}

function normalizeBgState(s: Partial<BgState>): BgState {
  return {
    zoom: clamp(s.zoom, 0.1, 10, 1),
    x: typeof s.x === 'number' && isFinite(s.x) ? s.x : 0,
    y: typeof s.y === 'number' && isFinite(s.y) ? s.y : 0,
    iw: typeof s.iw === 'number' && s.iw > 0 ? s.iw : 0,
    ih: typeof s.ih === 'number' && s.ih > 0 ? s.ih : 0,
  }
}

/** Coerce an unknown persisted value into a valid ThemeConfig, falling back per-field. */
function normalizeConfig(raw: unknown): ThemeConfig {
  const r = (raw ?? {}) as Partial<ThemeConfig> & { opacity?: unknown }
  const c = r.color
  const color: [number, number, number] | null =
    Array.isArray(c) && c.length === 3 && c.every(x => typeof x === 'number' && isFinite(x))
      ? [clamp(c[0], 0, 360, 220), clamp(c[1], 0, 1, 0.55), clamp(c[2], 0, 1, 0.25)]
      : null
  const bgType: BackgroundType = ['image', 'video', 'mesh', 'shader', 'pattern'].includes(r.backgroundType as string)
    ? (r.backgroundType as BackgroundType)
    : DEFAULT_CONFIG.backgroundType
  const bgMode: BgMode = ['fit', 'fill', 'stretch', 'tile', 'center'].includes(r.bgMode as string)
    ? (r.bgMode as BgMode)
    : DEFAULT_CONFIG.bgMode
  const gen = r.generatedBg && typeof r.generatedBg === 'object'
    ? (r.generatedBg as { type?: string })
    : null
  const generatedBg: ThemeConfig['generatedBg'] = gen && gen.type === bgType
    ? normalizeGeneratedBg(r.generatedBg as GeneratedBgParams)
    : null
  // Migration: the legacy single main-interface opacity becomes per-part,
  // keeping the sidebar's former +0.08 offset.
  const legacy = typeof r.opacity === 'number' ? r.opacity : null
  const ops = (r.opacities ?? {}) as Partial<PartOpacities>
  const bl = (r.blurs ?? {}) as Partial<PartBlurs>
  const blurs = {} as PartBlurs
  for (const k of ['bg', 'sidebar', 'card', 'settings', 'chat', 'trajectory', 'input', 'panel', 'produced'] as const) {
    blurs[k] = clamp(bl[k], 0, 60, DEFAULT_CONFIG.blurs[k])
  }
  return {
    color,
    opacities: {
      bg: clamp(ops.bg, 0, 1, legacy ?? DEFAULT_CONFIG.opacities.bg),
      sidebar: clamp(ops.sidebar, 0, 1, legacy !== null ? Math.min(1, legacy + 0.08) : DEFAULT_CONFIG.opacities.sidebar),
      card: clamp(ops.card, 0, 1, DEFAULT_CONFIG.opacities.card),
      input: clamp(ops.input, 0, 1, DEFAULT_CONFIG.opacities.input),
    },
    blurs,
    settingsOpacity: clamp(r.settingsOpacity, 0, 1, DEFAULT_CONFIG.settingsOpacity),
    wallpaperOpacity: clamp(r.wallpaperOpacity, 0, 1, DEFAULT_CONFIG.wallpaperOpacity),
    blur: clamp(r.blur, 0, 60, DEFAULT_CONFIG.blur),
    bgState: normalizeBgState((r.bgState ?? {}) as Partial<BgState>),
    videoBgState: normalizeBgState((r.videoBgState ?? {}) as Partial<BgState>),
    backgroundType: bgType,
    bgMode,
    videoMime: typeof r.videoMime === 'string' ? r.videoMime : null,
    generatedBg,
    regenerateOnReload: typeof r.regenerateOnReload === 'boolean' ? r.regenerateOnReload : DEFAULT_CONFIG.regenerateOnReload,
    chatTextOpacity: clamp(r.chatTextOpacity, 0, 1, DEFAULT_CONFIG.chatTextOpacity),
    trajectoryOpacity: clamp(r.trajectoryOpacity, 0, 1, DEFAULT_CONFIG.trajectoryOpacity),
    panelOpacity: clamp(r.panelOpacity, 0, 1, DEFAULT_CONFIG.panelOpacity),
    producedOpacity: clamp(r.producedOpacity, 0, 1, DEFAULT_CONFIG.producedOpacity),
    profiles: normalizeProfiles(r.profiles),
    rotation: normalizeRotation(r.rotation),
    schedule: normalizeSchedule(r.schedule),
    schemeOverride: r.schemeOverride === 'light' || r.schemeOverride === 'dark' ? r.schemeOverride : 'auto',
    activeProfile: typeof r.activeProfile === 'string' ? r.activeProfile : null,
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
      preset: ['aurora', 'nebula', 'noise', 'starfield'].includes(p.preset) ? p.preset : 'aurora',
      speed: clamp(p.speed, 0, 2, 0.3),
      scale: clamp(p.scale, 0.3, 3, 1),
      seed: typeof p.seed === 'number' ? Math.floor(p.seed) : 0,
    }
  }
  if (p.type === 'pattern') {
    return {
      type: 'pattern',
      preset: ['dots', 'waves', 'poly', 'rain', 'contour', 'meta'].includes(p.preset) ? p.preset : 'dots',
      density: clamp(p.density, 0, 1, 0.5),
      scale: clamp(p.scale, 0.3, 3, 1),
      seed: typeof p.seed === 'number' ? Math.floor(p.seed) : 0,
    }
  }
  return null
}

// ── Profiles / rotation / schedule normalization ──────────────────────────────
const MAX_PROFILES = 20
const MAX_ROTATION_ITEMS = 30
const MAX_THUMB_BYTES = 64 * 1024
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/

/** Coerce an unknown value into a ProfileAppearance (appearance subset only). */
function normalizeProfileAppearance(raw: unknown): ProfileAppearance {
  const a = (raw ?? {}) as Partial<ProfileAppearance>
  const c = a.color
  const ops = (a.opacities ?? {}) as Partial<PartOpacities>
  const bl = (a.blurs ?? {}) as Partial<PartBlurs>
  const blurs = {} as PartBlurs
  for (const k of ['bg', 'sidebar', 'card', 'settings', 'chat', 'trajectory', 'input', 'panel', 'produced'] as const) {
    blurs[k] = clamp(bl[k], 0, 60, DEFAULT_CONFIG.blurs[k])
  }
  return {
    color: Array.isArray(c) && c.length === 3 && c.every(x => typeof x === 'number' && isFinite(x))
      ? [clamp(c[0], 0, 360, 220), clamp(c[1], 0, 1, 0.55), clamp(c[2], 0, 1, 0.25)]
      : null,
    opacities: {
      bg: clamp(ops.bg, 0, 1, DEFAULT_CONFIG.opacities.bg),
      sidebar: clamp(ops.sidebar, 0, 1, DEFAULT_CONFIG.opacities.sidebar),
      card: clamp(ops.card, 0, 1, DEFAULT_CONFIG.opacities.card),
      input: clamp(ops.input, 0, 1, DEFAULT_CONFIG.opacities.input),
    },
    blurs,
    settingsOpacity: clamp(a.settingsOpacity, 0, 1, DEFAULT_CONFIG.settingsOpacity),
    wallpaperOpacity: clamp(a.wallpaperOpacity, 0, 1, DEFAULT_CONFIG.wallpaperOpacity),
    blur: clamp(a.blur, 0, 60, DEFAULT_CONFIG.blur),
    chatTextOpacity: clamp(a.chatTextOpacity, 0, 1, DEFAULT_CONFIG.chatTextOpacity),
    trajectoryOpacity: clamp(a.trajectoryOpacity, 0, 1, DEFAULT_CONFIG.trajectoryOpacity),
    panelOpacity: clamp(a.panelOpacity, 0, 1, DEFAULT_CONFIG.panelOpacity),
    producedOpacity: clamp(a.producedOpacity, 0, 1, DEFAULT_CONFIG.producedOpacity),
  }
}

function normalizeProfiles(raw: unknown): ProfileEntry[] {
  if (!Array.isArray(raw)) return []
  const out: ProfileEntry[] = []
  for (const item of raw.slice(0, MAX_PROFILES)) {
    const p = (item ?? {}) as Partial<ProfileEntry>
    if (typeof p.id !== 'string' || p.id.length === 0 || p.id.length > 64) continue
    if (out.some(e => e.id === p.id)) continue
    out.push({
      id: p.id,
      name: typeof p.name === 'string' && p.name.trim() ? p.name.slice(0, 60) : 'Profile',
      createdAt: typeof p.createdAt === 'string' ? p.createdAt : '',
      config: normalizeProfileAppearance(p.config),
    })
  }
  return out
}

/** Rotation items live as files under the rotation dir; only the server
 *  creates those names, so a stored `file` is accepted only when it is a bare
 *  filename with a known image extension (no path traversal). */
function safeRotationFile(name: unknown): string | null {
  if (typeof name !== 'string' || !/^[\w-]+\.(jpg|jpeg|png|gif|webp)$/i.test(name)) return null
  return name
}

function normalizeRotation(raw: unknown): RotationConfig {
  const r = (raw ?? {}) as Partial<RotationConfig>
  const items: RotationItem[] = []
  if (Array.isArray(r.items)) {
    for (const item of r.items.slice(0, MAX_ROTATION_ITEMS)) {
      const it = (item ?? {}) as Partial<RotationItem>
      const file = safeRotationFile(it.file)
      if (file === null) continue
      items.push({
        file,
        thumb: typeof it.thumb === 'string' && it.thumb.startsWith('data:image/') && it.thumb.length <= MAX_THUMB_BYTES ? it.thumb : '',
      })
    }
  }
  return {
    enabled: r.enabled === true,
    mode: r.mode === 'order' ? 'order' : 'shuffle',
    interval: r.interval === 'reload' || r.interval === 'weekly' ? r.interval : 'daily',
    current: typeof r.current === 'number' && isFinite(r.current) && r.current >= 0 ? Math.floor(r.current) : 0,
    items,
    lastRotate: typeof r.lastRotate === 'string' ? r.lastRotate : null,
  }
}

function normalizeSchedule(raw: unknown): ScheduleConfig {
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

async function ensureDir(): Promise<void> {
  try {
    await mkdir(dataDir(), { recursive: true })
  } catch (e) {
    console.warn(`dsh-any-background: cannot create data dir "${dataDir()}"`, e)
  }
}

async function readConfig(): Promise<ThemeConfig> {
  await ensureDir()
  try {
    const raw = await readFile(configPath(), 'utf8')
    return normalizeConfig(JSON.parse(raw))
  } catch {
    // First run (no file yet) or unreadable config — fall back to defaults.
    return { ...DEFAULT_CONFIG }
  }
}

// The config shape is declared twice — once here (persistence sanitizer) and
// once in the browser half (the UI's own view of it). A field added to only one
// side is silently dropped by the sanitizer, which makes the matching slider
// look like it "saved" (it stays live in memory) and then revert on the next
// load. Warn once per unknown key so that drift shows up in the host log
// instead of quietly discarding a setting.
const LEGACY_CONFIG_KEYS = new Set(['opacity'])
const warnedConfigKeys = new Set<string>()

function warnUnknownConfigKeys(raw: unknown, normalized: ThemeConfig): void {
  if (raw === null || typeof raw !== 'object') return
  const r = raw as Record<string, unknown>
  const warn = (id: string): void => {
    if (warnedConfigKeys.has(id)) return
    warnedConfigKeys.add(id)
    console.warn(`dsh-any-background: ignoring unknown config field "${id}" (declared in one half only?)`)
  }
  const known = new Set(Object.keys(normalized))
  for (const key of Object.keys(r)) {
    if (known.has(key) || LEGACY_CONFIG_KEYS.has(key)) continue
    warn(key)
  }
  // Nested appearance maps drift the same way (e.g. blurs.produced).
  for (const group of ['blurs', 'opacities'] as const) {
    const got = r[group]
    if (got === null || typeof got !== 'object') continue
    const have = new Set(Object.keys(normalized[group] as unknown as Record<string, unknown>))
    for (const key of Object.keys(got as Record<string, unknown>)) {
      if (!have.has(key)) warn(`${group}.${key}`)
    }
  }
}

async function writeConfig(config: ThemeConfig): Promise<boolean> {
  await ensureDir()
  try {
    const normalized = normalizeConfig(config)
    warnUnknownConfigKeys(config, normalized)
    await writeFile(configPath(), JSON.stringify(normalized, null, 2), 'utf8')
    return true
  } catch (e) {
    console.error(`dsh-any-background: failed to write "${CONFIG_FILE}"`, e)
    return false
  }
}

/** The wallpaper slot is served over HTTP (never shipped as base64 inside the
 *  read RPC): the browser decodes it natively through the same pipeline as any
 *  <img>, so boot only transfers a tiny URL instead of the whole image. */
async function wallpaperServeUrl(): Promise<string | null> {
  try {
    return (await stat(wallpaperPath())).size > 0 ? WALLPAPER_ROUTE : null
  } catch {
    return null
  }
}

/** Persist a wallpaper (null removes it); false keeps the previous file. */
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

/** Sniff an image's MIME from its leading magic bytes (defaults to JPEG). */
function sniffImageMime(buf: Buffer): string {
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif'
  if (buf.length >= 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return 'image/webp'
  return 'image/jpeg'
}

/** Download a wallpaper from a network URL and persist it into the local
 *  wallpaper.jpg slot (replacing whatever was stored), so type switches and
 *  rotation keep working through the single active slot. The response carries
 *  the serve URL, never the bytes. null removes the wallpaper.
 *  Returns { ok, wallpaperUrl?, error? }. */
async function writeWallpaperFromUrl(url: string | null): Promise<{ ok: boolean; wallpaperUrl?: string | null; error?: string }> {
  if (url === null) {
    const ok = await writeWallpaper(null)
    return { ok, wallpaperUrl: null, error: ok ? undefined : 'remove failed' }
  }
  let u: URL
  try { u = new URL(url) } catch { return { ok: false, error: 'invalid url' } }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return { ok: false, error: 'unsupported scheme' }
  let res: Response
  try {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), WALLPAPER_FETCH_TIMEOUT)
    try { res = await fetch(url, { redirect: 'follow', signal: ctl.signal }) }
    finally { clearTimeout(timer) }
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.name === 'AbortError' ? 'timeout' : 'network error' }
  }
  if (!res.ok) return { ok: false, error: `http ${res.status}` }
  const ct = res.headers.get('content-type') ?? ''
  if (ct && !/^image\//.test(ct)) return { ok: false, error: 'not an image' }
  let buf: Buffer
  try {
    const arr = await res.arrayBuffer()
    if (arr.byteLength === 0) return { ok: false, error: 'empty response' }
    if (arr.byteLength > WALLPAPER_FETCH_MAX) return { ok: false, error: 'too large' }
    buf = Buffer.from(arr)
  } catch {
    return { ok: false, error: 'read failed' }
  }
  // Write the downloaded bytes straight to disk — no base64 string round-trip.
  await ensureDir()
  try {
    await writeFile(wallpaperPath(), buf)
  } catch (e) {
    console.error('dsh-any-background: failed to write the downloaded wallpaper', e)
    return { ok: false, error: 'write failed' }
  }
  return { ok: true, wallpaperUrl: WALLPAPER_ROUTE }
}

// ── Wallpaper rotation pool ───────────────────────────────────────────────────
// Each candidate wallpaper is its own file under rotation/; the config's
// rotation.items holds { file, thumb } entries. Advancing copies the chosen
// file over wallpaper.jpg, so every downstream path (boot restore, theme
// export, color extraction) keeps working through the single active slot.

const rotationDir = (): string => dshHomePath(DATA_DIR, ROTATION_DIR)

async function ensureRotationDir(): Promise<void> {
  try { await mkdir(rotationDir(), { recursive: true }) } catch { /* read paths tolerate absence */ }
}

function imageExtFor(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/gif') return 'gif'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

/** Accept only an inline base64 image data URL (same fence as writeWallpaper). */
function decodeImageDataUrl(dataUrl: unknown): Buffer | null {
  if (typeof dataUrl !== 'string') return null
  const m = /^data:image\/[a-zA-Z0-9.+-]+;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!m) return null
  const buf = Buffer.from(m[1]!, 'base64')
  return buf.length > 0 ? buf : null
}

/** Persist a thumbnail string only when it is a small inline image data URL. */
function sanitizeThumb(thumb: unknown): string {
  return typeof thumb === 'string' && thumb.startsWith('data:image/') && thumb.length <= MAX_THUMB_BYTES ? thumb : ''
}

async function handleRotationAdd(payload: unknown): Promise<{ ok: boolean; index?: number; items?: RotationItem[]; error?: string }> {
  const buf = decodeImageDataUrl((payload as { dataUrl?: unknown } | null)?.dataUrl)
  if (buf === null) return { ok: false, error: 'invalid image' }
  const thumb = sanitizeThumb((payload as { thumb?: unknown } | null)?.thumb)
  await ensureDir()
  await ensureRotationDir()
  const cfg = await readConfig()
  if (cfg.rotation.items.length >= MAX_ROTATION_ITEMS) return { ok: false, error: 'too many items' }
  const file = `wp-${Date.now().toString(36)}.${imageExtFor(sniffImageMime(buf))}`
  try {
    await writeFile(dshHomePath(DATA_DIR, ROTATION_DIR, file), buf)
  } catch (e) {
    console.error('dsh-any-background: failed to write a rotation wallpaper', e)
    return { ok: false, error: 'write failed' }
  }
  // Read-modify-write so a concurrent client config write cannot drop the item.
  const fresh = await readConfig()
  fresh.rotation.items.push({ file, thumb })
  if (!(await writeConfig(fresh))) return { ok: false, error: 'config write failed' }
  return { ok: true, index: fresh.rotation.items.length - 1, items: fresh.rotation.items }
}

async function handleRotationRemove(payload: unknown): Promise<{ ok: boolean; items?: RotationItem[]; error?: string }> {
  const idx = (payload as { index?: unknown } | null)?.index
  if (typeof idx !== 'number' || !isFinite(idx)) return { ok: false, error: 'invalid index' }
  const cfg = await readConfig()
  const i = Math.floor(idx)
  if (i < 0 || i >= cfg.rotation.items.length) return { ok: false, error: 'not found' }
  const [removed] = cfg.rotation.items.splice(i, 1)
  cfg.rotation.current = Math.max(0, Math.min(cfg.rotation.current >= i ? cfg.rotation.current - 1 : cfg.rotation.current, Math.max(0, cfg.rotation.items.length - 1)))
  if (removed !== undefined) {
    try { await rm(dshHomePath(DATA_DIR, ROTATION_DIR, removed.file), { force: true }) } catch { /* already gone */ }
  }
  if (!(await writeConfig(cfg))) return { ok: false, error: 'config write failed' }
  return { ok: true, items: cfg.rotation.items }
}

/** Activate a rotation item: copy its bytes over the active wallpaper slot and
 *  return the serve URL so the client applies it live (bytes never round-trip
 *  through the RPC response). */
async function handleRotationSet(payload: unknown): Promise<{ ok: boolean; wallpaperUrl?: string; error?: string }> {
  const idx = (payload as { index?: unknown } | null)?.index
  if (typeof idx !== 'number' || !isFinite(idx)) return { ok: false, error: 'invalid index' }
  const cfg = await readConfig()
  const i = Math.floor(idx)
  const item = cfg.rotation.items[i]
  if (item === undefined) return { ok: false, error: 'not found' }
  let buf: Buffer
  try {
    buf = await readFile(dshHomePath(DATA_DIR, ROTATION_DIR, item.file))
  } catch {
    return { ok: false, error: 'file missing' }
  }
  try {
    await writeFile(wallpaperPath(), buf)
  } catch (e) {
    console.error('dsh-any-background: failed to activate a rotation wallpaper', e)
    return { ok: false, error: 'write failed' }
  }
  return { ok: true, wallpaperUrl: WALLPAPER_ROUTE }
}

async function videoUrl(): Promise<string | null> {
  return (await findVideoFile()) ? VIDEO_ROUTE : null
}

/** Guess a video MIME from the URL's path extension (fallback for servers that
 *  send no precise Content-Type). */
function videoMimeFromUrl(u: URL): string | null {
  const p = u.pathname.toLowerCase()
  if (/\.(mp4|m4v)$/.test(p)) return 'video/mp4'
  if (/\.webm$/.test(p)) return 'video/webm'
  if (/\.(ogg|ogv)$/.test(p)) return 'video/ogg'
  if (/\.(mov|qt)$/.test(p)) return 'video/quicktime'
  if (/\.(mkv|mk3d|mka)$/.test(p)) return 'video/x-matroska'
  return null
}

/** Download a background video from a network URL and store it in the video
 *  slot (streamed to a temp file — never buffered whole), then record the MIME
 *  in the config so findVideoFile/serve resolve immediately. */
async function writeVideoFromUrl(url: string | null): Promise<{ ok: boolean; mime?: string; error?: string }> {
  if (url === null) return { ok: false, error: 'invalid url' }
  let u: URL
  try { u = new URL(url) } catch { return { ok: false, error: 'invalid url' } }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return { ok: false, error: 'unsupported scheme' }
  let res: Response
  try {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), VIDEO_FETCH_TIMEOUT)
    try { res = await fetch(url, { redirect: 'follow', signal: ctl.signal }) }
    finally { clearTimeout(timer) }
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.name === 'AbortError' ? 'timeout' : 'network error' }
  }
  if (!res.ok) return { ok: false, error: `http ${res.status}` }
  let mime = (res.headers.get('content-type') ?? '').split(';')[0]!.trim().toLowerCase()
  if (mime === '' || mime === 'application/octet-stream' || mime === 'binary/octet-stream') {
    mime = videoMimeFromUrl(u) ?? 'video/mp4'
  }
  if (!mime.startsWith('video/')) return { ok: false, error: 'not a video' }
  const declared = Number(res.headers.get('content-length') ?? '')
  if (Number.isFinite(declared) && declared > VIDEO_FETCH_MAX) return { ok: false, error: 'too large' }
  await ensureDir()
  const tmp = dshHomePath(DATA_DIR, 'video.download.tmp')
  const target = videoPathFor(mime)
  try {
    if (res.body === null) return { ok: false, error: 'empty response' }
    const out = createWriteStream(tmp)
    let received = 0
    let failed = false
    const fail = (): void => {
      if (failed) return
      failed = true
      out.destroy()
      void rm(tmp, { force: true })
    }
    const nodeStream = Readable.fromWeb(res.body as any)
    // The 2 GB cap makes a hard total-time budget meaningless on slower links;
    // arm an inactivity watchdog that refreshes on every chunk instead.
    let idle: NodeJS.Timeout | null = null
    const pokeIdle = (): void => {
      if (idle) clearTimeout(idle)
      idle = setTimeout(() => { nodeStream.destroy(); fail() }, VIDEO_FETCH_IDLE_TIMEOUT)
    }
    nodeStream.on('data', (chunk: Buffer) => {
      pokeIdle()
      received += chunk.byteLength
      if (received > VIDEO_FETCH_MAX) {
        nodeStream.destroy()
        fail()
      }
    })
    nodeStream.on('end', () => { if (idle) clearTimeout(idle); idle = null })
    nodeStream.on('aborted', fail)
    nodeStream.on('error', fail)
    out.on('error', fail)
    pokeIdle()
    await new Promise<void>((resolve, reject) => {
      nodeStream.pipe(out)
      out.on('finish', () => resolve())
      out.on('close', () => { if (failed) reject(new Error('download failed')) })
      nodeStream.on('error', () => reject(new Error('download failed')))
    })
    if (failed) return { ok: false, error: 'read failed' }
    // One video owns the slot: clear every other variant, then promote.
    for (const name of VIDEO_CANDIDATES) {
      const p = dshHomePath(DATA_DIR, name)
      if (p !== target) await rm(p, { force: true })
    }
    await rm(target, { force: true }) // Windows rename refuses to overwrite
    await rename(tmp, target)
    // Record the MIME server-side so the serve route resolves the correct
    // file even before the client's next config write lands.
    const cfg = await readConfig()
    if (cfg.videoMime !== mime) {
      cfg.videoMime = mime
      await writeConfig(cfg)
    }
    return { ok: true, mime }
  } catch (e) {
    console.error('dsh-any-background: failed to download the background video', e)
    void rm(tmp, { force: true })
    return { ok: false, error: e instanceof Error && e.message === 'download failed' ? 'read failed' : 'write failed' }
  }
}

/** Persist a video from a data URL (null removes every variant); only used
 *  for removal and small legacy/import payloads. */
async function writeVideo(dataUrl: string | null): Promise<boolean> {
  await ensureDir()
  try {
    if (dataUrl === null) {
      for (const name of VIDEO_CANDIDATES) await rm(dshHomePath(DATA_DIR, name), { force: true })
      return true
    }
    const m = /^data:(video\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
    if (!m) return false
    const target = videoPathFor(m[1]!)
    for (const name of VIDEO_CANDIDATES) {
      const p = dshHomePath(DATA_DIR, name)
      if (p !== target) await rm(p, { force: true })
    }
    await writeFile(target, Buffer.from(m[2]!, 'base64'))
    return true
  } catch (e) {
    console.error('dsh-any-background: failed to write the background video', e)
    return false
  }
}

/** Stream the stored video: correct MIME, no caching, Range answers so the
 *  browser can seek (snapshot capture does). */
async function serveVideo(req: any, res: any): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    // A POST here means the exact-matched upload route is missing from this
    // process (old build): tell the user to restart instead of a bare 405.
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: false, error: 'video route only serves GET/HEAD; uploads need the plugin upload route — restart the web server to load it' }))
    return
  }
  try {
    const found = await findVideoFile()
    if (found === null) {
      res.writeHead(404)
      res.end('no background video stored')
      return
    }
    const st = await stat(found.path)
    const mime = found.mime ?? 'application/octet-stream'
    const baseHeaders = { 'Content-Type': mime, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' }
    const range = typeof req.headers.range === 'string' ? req.headers.range.trim() : ''
    const m = /^bytes=(\d*)-(\d*)$/.exec(range)
    if (m !== null && (m[1] !== '' || m[2] !== '')) {
      let start: number
      let end: number
      if (m[1] === '') {
        const suffix = parseInt(m[2]!, 10)
        start = Math.max(0, st.size - suffix)
        end = st.size - 1
      } else {
        start = parseInt(m[1]!, 10)
        end = m[2] !== '' ? Math.min(parseInt(m[2]!, 10), st.size - 1) : st.size - 1
      }
      if (start >= st.size || start > end) {
        res.writeHead(416, { 'Content-Range': `bytes */${st.size}` })
        res.end()
        return
      }
      res.writeHead(206, { ...baseHeaders, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 })
      if (req.method === 'HEAD') { res.end(); return }
      createReadStream(found.path, { start, end }).pipe(res)
      return
    }
    res.writeHead(200, { ...baseHeaders, 'Content-Length': st.size })
    if (req.method === 'HEAD') { res.end(); return }
    createReadStream(found.path).pipe(res)
  } catch (e) {
    console.error('dsh-any-background: failed to serve the background video', e)
    try { res.writeHead(500); res.end() } catch { /* response already sent */ }
  }
}

/** Accept a raw video upload (POST): pipe the body into a temp file, then
 *  rename it into the MIME-derived slot. Aborted transfers clean up. */
async function handleVideoUpload(req: any, res: any): Promise<void> {
  if (req.method !== 'POST') {
    res.writeHead(405)
    res.end()
    return
  }
  const contentType = typeof req.headers['content-type'] === 'string' ? req.headers['content-type'] : ''
  const mime = contentType.split(';')[0]!.trim()
  if (!mime.startsWith('video/')) {
    req.resume()
    res.writeHead(415, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: false, error: 'unsupported media type, expected video/*' }))
    return
  }
  try {
    await ensureDir()
    // Own temp file: a concurrent wallpaper upload must not corrupt this one.
    const tmp = dshHomePath(DATA_DIR, VIDEO_UPLOAD_TMP)
    const target = videoPathFor(mime)
    const out = createWriteStream(tmp)
    let received = 0
    let failed = false
    const fail = () => {
      if (failed) return
      failed = true
      out.destroy()
      void rm(tmp, { force: true })
    }
    req.on('aborted', fail)
    req.on('error', fail)
    req.on('data', (chunk: Buffer) => {
      received += chunk.byteLength
      if (received > VIDEO_UPLOAD_MAX) {
        req.destroy()
        fail()
      }
    })
    out.on('error', () => {
      fail()
      try { res.writeHead(500); res.end() } catch { /* response already sent */ }
    })
    req.pipe(out)
    out.on('finish', async () => {
      if (failed) return
      try {
        // One video owns the slot: clear every other variant, then promote.
        for (const name of VIDEO_CANDIDATES) {
          const p = dshHomePath(DATA_DIR, name)
          if (p !== target) await rm(p, { force: true })
        }
        // Windows rename refuses to overwrite (EEXIST): drop the old one first.
        await rm(target, { force: true })
        await rename(tmp, target)
        // Record the MIME server-side right away (mirrors writeVideoFromUrl), so
        // a reload between this response and the client's next config write
        // still resolves the correct file instead of renaming it by the old MIME.
        const cfg = await readConfig()
        if (cfg.videoMime !== mime) {
          cfg.videoMime = mime
          await writeConfig(cfg)
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        console.error('dsh-any-background: failed to finalize the uploaded video', e)
        void rm(tmp, { force: true })
        try { res.writeHead(500); res.end() } catch { /* response already sent */ }
      }
    })
  } catch (e) {
    console.error('dsh-any-background: failed to accept the video upload', e)
    try { res.writeHead(500); res.end() } catch { /* response already sent */ }
  }
}

/** Stream the stored wallpaper: sniffed MIME, no caching (uploads and rotation
 *  replace the file in place). */
async function serveWallpaper(req: any, res: any): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: false, error: 'wallpaper route only serves GET/HEAD' }))
    return
  }
  try {
    const st = await stat(wallpaperPath())
    if (st.size === 0) {
      res.writeHead(404)
      res.end()
      return
    }
    // readFile has no length option; stream just the first 16 bytes so MIME
    // sniffing never pulls a multi-MB wallpaper into memory.
    const head = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      const s = createReadStream(wallpaperPath(), { start: 0, end: 15 })
      s.on('data', (c: Buffer) => chunks.push(c))
      s.on('end', () => resolve(Buffer.concat(chunks)))
      s.on('error', reject)
    })
    const mime = sniffImageMime(head)
    res.writeHead(200, { 'Content-Type': mime, 'Content-Length': st.size, 'Cache-Control': 'no-store' })
    if (req.method === 'HEAD') { res.end(); return }
    createReadStream(wallpaperPath()).pipe(res)
  } catch {
    res.writeHead(404)
    res.end('no wallpaper stored')
  }
}

/** Accept a raw wallpaper upload (POST): pipe the body straight into the
 *  wallpaper slot — no base64 inflation, original pixels preserved. */
async function handleWallpaperUpload(req: any, res: any): Promise<void> {
  if (req.method !== 'POST') {
    res.writeHead(405)
    res.end()
    return
  }
  const contentType = typeof req.headers['content-type'] === 'string' ? req.headers['content-type'] : ''
  const mime = contentType.split(';')[0]!.trim()
  if (!mime.startsWith('image/')) {
    req.resume()
    res.writeHead(415, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: false, error: 'unsupported media type, expected image/*' }))
    return
  }
  try {
    await ensureDir()
    const tmp = dshHomePath(DATA_DIR, UPLOAD_TMP)
    const out = createWriteStream(tmp)
    let received = 0
    let failed = false
    const fail = () => {
      if (failed) return
      failed = true
      out.destroy()
      void rm(tmp, { force: true })
    }
    req.on('aborted', fail)
    req.on('error', fail)
    out.on('error', () => {
      fail()
      try { res.writeHead(500); res.end() } catch { /* response already sent */ }
    })
    req.on('data', (chunk: Buffer) => {
      received += chunk.byteLength
      if (received > WALLPAPER_UPLOAD_MAX) {
        req.destroy()
        fail()
      }
    })
    req.pipe(out)
    out.on('finish', async () => {
      if (failed) return
      try {
        if (received === 0) {
          fail()
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: 'empty upload' }))
          return
        }
        // Windows rename refuses to overwrite (EEXIST): drop the old one first.
        await rm(wallpaperPath(), { force: true })
        await rename(tmp, wallpaperPath())
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, wallpaperUrl: WALLPAPER_ROUTE }))
      } catch (e) {
        console.error('dsh-any-background: failed to finalize the wallpaper upload', e)
        void rm(tmp, { force: true })
        try { res.writeHead(500); res.end() } catch { /* response already sent */ }
      }
    })
  } catch (e) {
    console.error('dsh-any-background: failed to accept the wallpaper upload', e)
    try { res.writeHead(500); res.end() } catch { /* response already sent */ }
  }
}

const NS = 'dshAnyBackground'
const RPC_CHANNEL = '/dsh-any-background'
const RPC_BODY_MAX = 300 * 1024 * 1024

/** ISO week key — mirrors the client's rotationDue so daily/weekly cadence
 *  decisions agree across both halves. */
function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${t.getUTCFullYear()}-W${week}`
}

/** Advance the rotation pool when its cadence is due: pick the next item,
 *  copy it over the active wallpaper slot, and persist the rotation state.
 *  Runs inside `read` so a reload restores the NEW wallpaper directly — the
 *  old one never reaches the screen. The client's maybeRotate stays as a
 *  fallback and skips when this already advanced (the `rotated` flag). */
async function advanceRotationIfDue(): Promise<boolean> {
  const cfg = await readConfig()
  const rot = cfg.rotation
  if (!rot.enabled || rot.items.length === 0) return false
  const now = new Date()
  const last = rot.lastRotate !== null ? new Date(rot.lastRotate) : null
  const due = rot.interval === 'reload'
    || last === null || isNaN(last.getTime())
    || (rot.interval === 'daily'
      ? last.toDateString() !== now.toDateString()
      : isoWeekKey(last) !== isoWeekKey(now))
  if (!due) return false
  const n = rot.items.length
  let idx = rot.current
  if (rot.mode === 'shuffle' && n > 1) {
    while (idx === rot.current) idx = Math.floor(Math.random() * n)
  } else {
    idx = (rot.current + 1) % n
  }
  const item = rot.items[idx]
  if (item === undefined) return false
  try {
    const buf = await readFile(dshHomePath(DATA_DIR, ROTATION_DIR, item.file))
    await writeFile(wallpaperPath(), buf)
  } catch (e) {
    console.error('dsh-any-background: failed to advance the rotation pool', e)
    return false
  }
  cfg.rotation = { ...rot, current: idx, lastRotate: now.toISOString() }
  // A failed write means lastRotate/current never land on disk — report "not
  // advanced" so the client-side fallback performs (and persists) the switch.
  if (!(await writeConfig(cfg))) return false
  return true
}

/** Dispatch one decoded RPC method to the matching persistence routine and
 *  return the wire `result` half of the server-response envelope. */
async function handleRpcMethod(
  endpoint: string,
  payload: unknown,
): Promise<{ ok: boolean; value?: unknown; error?: { code: string; message: string; details: object } }> {
  const method = endpoint.slice(`${NS}/`.length)
  try {
    switch (method) {
      case 'read': {
        // Advance a due rotation BEFORE reading the wallpaper slot, so the
        // restore on (re)load paints the new picture from the first apply.
        const rotated = await advanceRotationIfDue()
        // Image and video both travel as serve URLs, never as bytes.
        return { ok: true, value: { config: await readConfig(), wallpaperUrl: await wallpaperServeUrl(), videoUrl: await videoUrl(), rotated } }
      }
      case 'writeConfig':
        return { ok: true, value: await writeConfig((payload as { config?: unknown } | null)?.config as ThemeConfig ?? {}) }
      case 'setWallpaper':
        return { ok: true, value: await writeWallpaper(((payload as { dataUrl?: unknown } | null)?.dataUrl ?? null) as string | null) }
      case 'setVideo':
        return { ok: true, value: await writeVideo(((payload as { dataUrl?: unknown } | null)?.dataUrl ?? null) as string | null) }
      case 'setWallpaperUrl':
        return { ok: true, value: await writeWallpaperFromUrl(((payload as { url?: unknown } | null)?.url ?? null) as string | null) }
      case 'setVideoUrl':
        return { ok: true, value: await writeVideoFromUrl(((payload as { url?: unknown } | null)?.url ?? null) as string | null) }
      case 'rotationAdd':
        return { ok: true, value: await handleRotationAdd(payload) }
      case 'rotationRemove':
        return { ok: true, value: await handleRotationRemove(payload) }
      case 'rotationSet':
        return { ok: true, value: await handleRotationSet(payload) }
      default:
        return { ok: false, error: { code: 'dsh-any-background/bad-request', message: `unknown endpoint ${endpoint}`, details: { issues: [] } } }
    }
  } catch (e) {
    return { ok: false, error: { code: 'dsh-any-background/internal', message: e instanceof Error ? e.message : String(e), details: {} } }
  }
}

export function apply(ctx: any): void {
  // Register every route inside a connection+webServer-injected scope, exactly
  // as the connection plugin mounts its own `/api` transport. Doing this
  // synchronously in `apply` fails with "cannot get property webServer without
  // inject" on hosts where webServer is not yet resolvable at apply time.
  // The RPC channel is mounted here directly through `webServer.register`
  // (rather than `connection.rpc.handle`, whose effect binds to the connection
  // service's own context and never mounts on some 0.1.5 hosts), mirroring the
  // working `/api` route: keep the Host/Origin fence + browser auth via
  // `requestRejection`, then bridge the JSON envelope inline.
  ctx.inject(['connection', 'webServer'], (webCtx: any) => {
    webCtx.effect(
      () => webCtx.webServer.register({
        kind: 'prefix',
        path: RPC_CHANNEL,
        handler: async (req: any, res: any) => {
          const rejection = webCtx.connection.requestRejection(req)
          if (rejection !== undefined) {
            res.writeHead(rejection)
            res.end(rejection === 401 ? 'unauthorized' : 'forbidden')
            return
          }
          if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: false, error: { code: 'dsh-any-background/bad-request', message: 'expected POST', details: {} } }))
            return
          }
          const pathname = new URL(req.url ?? '/', 'http://dsh.internal').pathname
          const endpoint = pathname.startsWith(`${RPC_CHANNEL}/`) ? pathname.slice(RPC_CHANNEL.length + 1) : undefined
          if (endpoint === undefined || endpoint.length === 0) {
            res.writeHead(404)
            res.end()
            return
          }
          const chunks: Buffer[] = []
          let received = 0
          for await (const chunk of req) {
            const buf = chunk as Buffer
            received += buf.byteLength
            if (received > RPC_BODY_MAX) {
              res.writeHead(413, { connection: 'close' })
              res.end()
              req.destroy()
              return
            }
            chunks.push(buf)
          }
          let env: { type?: unknown; rpcId?: unknown; method?: unknown; payload?: unknown }
          try {
            env = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: false, error: { code: 'dsh-any-background/bad-request', message: 'body is not JSON', details: {} } }))
            return
          }
          if (env === null || typeof env !== 'object' || env.type !== 'client-request' || typeof env.rpcId !== 'string' || typeof env.method !== 'string') {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: false, error: { code: 'dsh-any-background/bad-request', message: 'invalid client-request envelope', details: {} } }))
            return
          }
          if (env.method !== endpoint) {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ type: 'server-response', rpcId: env.rpcId, result: { ok: false, error: { code: 'dsh-any-background/bad-request', message: `method ${env.method} does not match endpoint ${endpoint}`, details: { issues: [] } } } }))
            return
          }
          const result = await handleRpcMethod(endpoint, env.payload)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ type: 'server-response', rpcId: env.rpcId, result }))
        },
      }),
      'dsh-any-background: rpc channel',
    )
    // Longest prefix wins over the RPC channel's shorter one; exact beats
    // prefix, so uploads land in the upload handler even though UPLOAD_ROUTE
    // sits inside VIDEO_ROUTE. Effects auto-dispose with the injected scope.
    // The GET/HEAD serve routes stay open (the browser's <img>/<video> fetches
    // carry no auth headers); the POST upload routes get the same Host/Origin
    // fence as the RPC channel so a stray cross-origin page cannot write files.
    const fenceUpload = (handler: (req: any, res: any) => Promise<void>) => (req: any, res: any): void => {
      const rejection = webCtx.connection.requestRejection(req)
      if (rejection !== undefined) {
        res.writeHead(rejection)
        res.end(rejection === 401 ? 'unauthorized' : 'forbidden')
        return
      }
      void handler(req, res)
    }
    webCtx.effect(
      () => webCtx.webServer.register({ kind: 'prefix', path: VIDEO_ROUTE, handler: serveVideo }),
      'dsh-any-background: video route',
    )
    webCtx.effect(
      () => webCtx.webServer.register({ kind: 'exact', path: UPLOAD_ROUTE, handler: fenceUpload(handleVideoUpload) }),
      'dsh-any-background: upload route',
    )
    webCtx.effect(
      () => webCtx.webServer.register({ kind: 'prefix', path: WALLPAPER_ROUTE, handler: serveWallpaper }),
      'dsh-any-background: wallpaper route',
    )
    webCtx.effect(
      () => webCtx.webServer.register({ kind: 'exact', path: WALLPAPER_UPLOAD_ROUTE, handler: fenceUpload(handleWallpaperUpload) }),
      'dsh-any-background: wallpaper upload route',
    )
  })
}
