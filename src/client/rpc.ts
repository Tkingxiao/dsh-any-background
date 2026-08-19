import type { RpcResultLike } from './types'
import { cfg, adoptConfig, setWpUrl, setWpImageUrl, setWpVideoUrl } from './state'

export const RPC_CHANNEL = '/dsh-any-background'
/** Same-origin serve URL of the persisted video (enough for <video src>/fetch). */
export const VIDEO_SERVE_URL = '/dsh-any-background/video'
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

/** Load the persisted theme (config + wallpaper + video URL) from the node half. */
export async function loadPersisted(): Promise<void> {
  const data = await rpcCall('read', {})
  if (data && typeof data === 'object') {
    const d = data as { config?: unknown; wallpaper?: unknown; videoUrl?: unknown }
    if (d.config) adoptConfig(d.config)
    // Uploaded image and video keep their own slots so type switches never
    // discard them; in image mode the caller points wpUrl at it.
    if (typeof d.wallpaper === 'string') setWpImageUrl(d.wallpaper)
    else if (d.wallpaper === null) setWpImageUrl(null)
    // The video travels as a serve URL; the frame snapshot is re-captured by
    // the boot restore in index.tsx when needed.
    if (typeof d.videoUrl === 'string') setWpVideoUrl(d.videoUrl, cfg.videoMime)
    else if (d.videoUrl === null) setWpVideoUrl(null, null)
    if (cfg.backgroundType === 'image') setWpUrl(d.wallpaper === null ? null : d.wallpaper as string | null)
  }
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
