import type { RpcResultLike } from './types'
import { cfg, adoptConfig, setWpUrl } from './state'

export const RPC_CHANNEL = '/dsh-any-background'
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

// ── Debounced persistence ─────────────────────────────────────────────────────
// Slider drags fire onInput (and React's onChange) dozens of times per second;
// each saveConfig() would trigger an RPC write. Coalesce writes to a trailing
// debounce so the disk is only touched after the user pauses or releases, and
// flush the last pending write on pagehide so a quick close never loses it.

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

/** Load the persisted theme (config + wallpaper) from the node half. */
export async function loadPersisted(): Promise<void> {
  const data = await rpcCall('read', {})
  if (data && typeof data === 'object') {
    const d = data as { config?: unknown; wallpaper?: unknown }
    if (d.config) adoptConfig(d.config)
    if (typeof d.wallpaper === 'string') setWpUrl(d.wallpaper)
    else if (d.wallpaper === null) setWpUrl(null)
  }
}

/** Persist a wallpaper (null removes it). One-shot large payload, no debounce. */
export function persistWallpaper(dataUrl: string | null): void {
  void rpcCall('setWallpaper', { dataUrl })
}
