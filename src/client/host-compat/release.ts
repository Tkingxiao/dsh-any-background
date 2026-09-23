/**
 * The client-side half of the front door: where the release verdict lands.
 *
 * The browser cannot detect the host release — the client context exposes no
 * version field, and the app manifest that states it is only readable on the node
 * half. So `src/host-compat/detect.ts` resolves it there and the verdict travels
 * in the `read` RPC payload (see `client/rpc.ts`, which calls `adoptHostInfo`).
 *
 * This module only HOLDS the verdict and tells subscribers when it changes. It
 * deliberately answers no feature questions — that is `capabilities.ts`, so the
 * version → behaviour mapping stays in one place.
 *
 * @module
 */
import { useSyncExternalStore } from 'react'
import {
  channelOf,
  looksLikeVersion,
  UNKNOWN_HOST_INFO,
  type HostInfo,
} from '../../host-compat/channel'
import { buildAdapter } from './versions/registry'
import type { HostAdapter } from './versions/types'

let current: HostInfo = UNKNOWN_HOST_INFO
/** False until the server verdict lands. Feature gates must not read "not asked
 *  yet" as "an old host" — see `adapterResolved()`. */
let resolved = false

const subs = new Set<() => void>()

/** Cached adapter, keyed by the verdict it was built from. Held because React's
 *  `useSyncExternalStore` requires a stable snapshot between notifications. */
let adapterCache: HostAdapter | null = null

/** Adopt the verdict delivered by the server's `read` payload.
 *
 *  The payload's `channel` is IGNORED and re-derived from `version` here: the
 *  two halves are built together, so a disagreeing pair can only mean one of them
 *  is stale, and re-deriving keeps `channelOf` the single definition of what a
 *  channel means. */
export function adoptHostInfo(raw: unknown): void {
  if (raw === null || typeof raw !== 'object') return
  const h = raw as { version?: unknown }
  const version =
    typeof h.version === 'string' && looksLikeVersion(h.version.trim()) ? h.version.trim() : null
  const next: HostInfo = { version, channel: channelOf(version) }
  const changed = !resolved || current.version !== next.version || current.channel !== next.channel
  current = next
  resolved = true
  if (changed) {
    adapterCache = null
    subs.forEach(cb => cb())
  }
}

/** Subscribe to the verdict landing (or changing). */
export function subscribeHostInfo(cb: () => void): () => void {
  subs.add(cb)
  return () => { subs.delete(cb) }
}

/** Whether the server verdict has landed at all. */
export function adapterResolved(): boolean {
  return resolved
}

/** The detected host release + channel. */
export function rHostInfo(): HostInfo {
  return current
}

/** The adapter chosen for the current verdict — `unknown`'s stand-in until the
 *  verdict lands, which is the safe answer: it asserts nothing and lets the DOM
 *  arbitrate. */
export function rHostAdapter(): HostAdapter {
  adapterCache ??= buildAdapter(current)
  return adapterCache
}

/** React hook: re-renders when the host verdict lands or changes. */
export function useHostAdapter(): HostAdapter {
  return useSyncExternalStore(subscribeHostInfo, rHostAdapter)
}
