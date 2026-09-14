import type { RpcResultLike } from './types'
import { cfg, adoptConfig, setWpUrl, setWpImageUrl, setWpVideoUrl, rWpImage } from './state'

export const RPC_CHANNEL = '/dsh-any-background'
/** Same-origin serve URL of the persisted video (enough for <video src>/fetch). */
export const VIDEO_SERVE_URL = '/dsh-any-background/video'
/** Same-origin serve URL of the persisted wallpaper (native <img> loading). */
export const WALLPAPER_SERVE_URL = '/dsh-any-background/wallpaper'
/** Raw-bytes upload endpoint for the wallpaper slot (no base64 inflation). */
const WALLPAPER_UPLOAD_URL = '/dsh-any-background/wallpaper/upload'
/** HTTP route new videos are POSTed to as raw bytes (see uploadVideo). */
export const VIDEO_UPLOAD_URL = '/dsh-any-background/video/upload'
const RPC_NS = 'dshAnyBackground'
const rpcEndpoint = (method: string): string => `${RPC_NS}/${method}`

let rpcCallFn: ((endpoint: string, payload: unknown) => Promise<RpcResultLike | undefined>) | null = null

export function initRpc(call: (endpoint: string, payload: unknown) => Promise<RpcResultLike | undefined>): void {
  rpcCallFn = call
}

async function rpcCall(method: string, payload: unknown): Promise<unknown> {
  if (!rpcCallFn) return undefined
  try {
    const res = await rpcCallFn(rpcEndpoint(method), payload)
    if (res && res.ok === true) return res.value
    console.warn(`dsh-any-background: rpc "${method}" failed`, res?.error)
    return undefined
  } catch (e) {
    console.warn(`dsh-any-background: rpc "${method}" threw`, e)
    return undefined
  }
}

// Slider drags fire dozens of events per second; coalesce writes to a trailing
// debounce and flush the last pending write on pagehide so a quick close never
// loses it.
const SAVE_DEBOUNCE_MS = 250
let saveTimer: number | undefined

export function saveConfig(): void {
  if (saveTimer !== undefined) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    saveTimer = undefined
    void rpcCall('writeConfig', { config: cfg })
  }, SAVE_DEBOUNCE_MS)
}

export function flushSave(): void {
  if (saveTimer === undefined) return
  window.clearTimeout(saveTimer)
  saveTimer = undefined
  void rpcCall('writeConfig', { config: cfg })
}

/** Persist the current config immediately (import path — no debounce). */
export function persistConfig(): void {
  void rpcCall('writeConfig', { config: cfg })
}

/** Load the persisted theme (config + wallpaper URL + video URL) from the node
 *  half. Image and video both travel as serve URLs — never bytes — so this RPC
 *  stays tiny. Resolves true when the server advanced a due wallpaper rotation
 *  during the read — the restored wallpaper is then already the new pick. */
export async function loadPersisted(): Promise<boolean> {
  const data = await rpcCall('read', {})
  if (data && typeof data === 'object') {
    const d = data as { config?: unknown; wallpaperUrl?: unknown; videoUrl?: unknown; rotated?: unknown }
    if (d.config) adoptConfig(d.config)
    // Uploaded image and video keep their own slots so type switches never
    // discard them; in image mode the caller points wpUrl at it.
    if (typeof d.wallpaperUrl === 'string') setWpImageUrl(d.wallpaperUrl)
    else if (d.wallpaperUrl === null) setWpImageUrl(null)
    // The video travels as a serve URL; the frame snapshot is re-captured by
    // the boot restore in index.tsx when needed.
    if (typeof d.videoUrl === 'string') setWpVideoUrl(d.videoUrl, cfg.videoMime)
    else if (d.videoUrl === null) setWpVideoUrl(null, null)
    // Mirror the same rev'd URL setWpImageUrl stored, so wpUrl never diverges.
    if (cfg.backgroundType === 'image') setWpUrl(rWpImage())
    return d.rotated === true
  }
  return false
}

/** Persist a wallpaper (null removes it); one-shot, no debounce. */
export function persistWallpaper(dataUrl: string | null): void {
  void rpcCall('setWallpaper', { dataUrl })
}

/** Persist a background video (null removes it); resolves true once on disk,
 *  so callers only switch playback to the serve URL after acceptance. */
export async function persistVideo(dataUrl: string | null): Promise<boolean> {
  const res = await rpcCall('setVideo', { dataUrl })
  return res === true
}

/** Download a wallpaper from a network URL and persist it into the local slot
 *  (the host replaces wallpaper.jpg). Returns the freshly stored serve URL on
 *  success, or the host's failure message. */
export async function setWallpaperFromUrl(url: string): Promise<{ ok: boolean; wallpaperUrl?: string | null; error?: string }> {
  if (!rpcCallFn) return { ok: false, error: 'rpc not ready' }
  let res: RpcResultLike | undefined
  try {
    res = await rpcCallFn(rpcEndpoint('setWallpaperUrl'), { url })
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
  if (!res) return { ok: false, error: 'no response' }
  if (res.ok !== true) {
    const err = (res as { error?: { message?: string } }).error
    return { ok: false, error: err?.message ?? 'request failed' }
  }
  const v = res.value as { ok?: boolean; wallpaperUrl?: string | null; error?: string }
  return v?.ok === true
    ? { ok: true, wallpaperUrl: v.wallpaperUrl ?? null }
    : { ok: false, error: v?.error ?? 'failed' }
}

/** Download a background video from a network URL. The server streams it into
 *  the video slot and returns the resolved MIME for playback via the serve URL. */
export async function setVideoFromUrl(url: string): Promise<{ ok: boolean; mime?: string; error?: string }> {
  if (!rpcCallFn) return { ok: false, error: 'rpc not ready' }
  let res: RpcResultLike | undefined
  try {
    res = await rpcCallFn(rpcEndpoint('setVideoUrl'), { url })
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
  if (!res) return { ok: false, error: 'no response' }
  if (res.ok !== true) {
    const err = (res as { error?: { message?: string } }).error
    return { ok: false, error: err?.message ?? 'request failed' }
  }
  const v = res.value as { ok?: boolean; mime?: string; error?: string }
  return v?.ok === true
    ? { ok: true, mime: v.mime ?? 'video/mp4' }
    : { ok: false, error: v?.error ?? 'failed' }
}

/** Upload a video's raw bytes over HTTP (MIME in Content-Type, body untouched
 *  — no base64 inflation that would blow the RPC body limit on large clips). */
export async function uploadVideo(blob: Blob, mime: string): Promise<boolean> {
  try {
    const res = await fetch(VIDEO_UPLOAD_URL, {
      method: 'POST',
      headers: { 'Content-Type': mime || 'application/octet-stream' },
      body: blob,
    })
    return res.ok
  } catch (e) {
    console.warn('dsh-any-background: video upload failed', e)
    return false
  }
}

/** Upload a wallpaper's raw bytes over HTTP — same streaming model as videos,
 *  original pixels preserved, zero base64 round-trips. */
export async function uploadWallpaper(blob: Blob): Promise<boolean> {
  try {
    const res = await fetch(WALLPAPER_UPLOAD_URL, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'image/jpeg' },
      body: blob,
    })
    return res.ok
  } catch (e) {
    console.warn('dsh-any-background: wallpaper upload failed', e)
    return false
  }
}

// ── Wallpaper rotation RPCs ──────────────────────────────────────────────────

export interface RotationAddResult { ok: boolean; index?: number; items?: Array<{ file: string; thumb: string }>; error?: string }

/** Add an image (data URL + small thumbnail) to the server-side rotation pool. */
export async function rotationAdd(dataUrl: string, thumb: string): Promise<RotationAddResult> {
  if (!rpcCallFn) return { ok: false, error: 'rpc not ready' }
  try {
    const res = await rpcCallFn(rpcEndpoint('rotationAdd'), { dataUrl, thumb })
    if (res && res.ok === true) return (res.value ?? { ok: false, error: 'no value' }) as RotationAddResult
    return { ok: false, error: (res as { error?: { message?: string } })?.error?.message ?? 'request failed' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Remove a rotation item by index. Returns the updated items list. */
export async function rotationRemove(index: number): Promise<{ ok: boolean; items?: Array<{ file: string; thumb: string }>; error?: string }> {
  if (!rpcCallFn) return { ok: false, error: 'rpc not ready' }
  try {
    const res = await rpcCallFn(rpcEndpoint('rotationRemove'), { index })
    if (res && res.ok === true) return (res.value ?? { ok: false, error: 'no value' }) as { ok: boolean; items?: Array<{ file: string; thumb: string }>; error?: string }
    return { ok: false, error: (res as { error?: { message?: string } })?.error?.message ?? 'request failed' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Activate a rotation item: the server copies its bytes into the wallpaper
 *  slot and returns the serve URL for immediate display. */
export async function rotationActivate(index: number): Promise<{ ok: boolean; wallpaperUrl?: string; error?: string }> {
  if (!rpcCallFn) return { ok: false, error: 'rpc not ready' }
  try {
    const res = await rpcCallFn(rpcEndpoint('rotationSet'), { index })
    if (res && res.ok === true) return (res.value ?? { ok: false, error: 'no value' }) as { ok: boolean; wallpaperUrl?: string; error?: string }
    return { ok: false, error: (res as { error?: { message?: string } })?.error?.message ?? 'request failed' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
