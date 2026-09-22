/**
 * Host release detection + feature classification.
 *
 * WHY THIS EXISTS
 * The client context exposes no host version: there is no `hostVersion` /
 * `dshVersion` field on `ctx`, and `window.__DSH_BOOT__.version` is the
 * module-table format tag (`'client'`), not a release. Capability probing alone
 * is also not sufficient, because the obvious probes do not separate the
 * generations — `ctx.sidebarRightTabs` and the native `[data-sidebar-right-panel]`
 * marker both exist on 0.1.5-rc.2 already, so using either as a "0.1.6+" test
 * mis-classifies 0.1.5 as newer.
 *
 * So the release is resolved on the Node half (where the launcher's on-disk
 * layout is visible) and handed to this half through the `read` RPC payload.
 * This module stores that verdict and turns it into the feature flags the rest
 * of the plugin gates on. When the release cannot be determined the flags fall
 * back to capability probing, never to a guess.
 *
 * @module
 */

import { useSyncExternalStore } from 'react'

/** Generation buckets the plugin can distinguish. */
export type HostGeneration = '0.1.5' | '0.1.6' | '0.1.7' | 'unknown'
/** Resolved host facts, as delivered by the Node half. */
export interface HostInfo {
  /** Detected release string, or null when undetermined. */
  version: string | null
  /** Generation bucket derived from `version`. */
  generation: HostGeneration
}

const UNKNOWN: HostInfo = { version: null, generation: 'unknown' }

let current: HostInfo = UNKNOWN
/** False until the server verdict lands; feature gates must not treat "not
 *  asked yet" as "old host". */
let resolved = false
const subs = new Set<() => void>()

/** Adopt the verdict delivered by the server's `read` payload. */
export function adoptHostInfo(raw: unknown): void {
  if (raw === null || typeof raw !== 'object') return
  const h = raw as { version?: unknown; generation?: unknown }
  const version = typeof h.version === 'string' && h.version.trim() !== '' ? h.version.trim() : null
  const generation: HostGeneration =
    h.generation === '0.1.5' || h.generation === '0.1.6' || h.generation === '0.1.7'
      ? h.generation
      : 'unknown'
  const changed = !resolved || current.version !== version || current.generation !== generation
  current = { version, generation }
  resolved = true
  if (changed) subs.forEach(cb => cb())
}

/** Subscribe to a verdict landing (or changing). */
export function subscribeHostInfo(cb: () => void): () => void {
  subs.add(cb)
  return () => { subs.delete(cb) }
}

/** Whether the server verdict has landed at all. */
export function rHostInfoResolved(): boolean {
  return resolved
}

/** The detected host release + generation. */
export function rHostInfo(): HostInfo {
  return current
}

/** Detected release string, or null when it could not be determined. */
export function rHostVersion(): string | null {
  return current.version
}

/** Generation bucket, or 'unknown' when the release could not be determined. */
export function rHostGeneration(): HostGeneration {
  return current.generation
}

/** Ordered generation rank, for "at least this generation" tests. `unknown`
 *  has no rank and must be handled by the caller's fallback. */
const RANK: Record<Exclude<HostGeneration, 'unknown'>, number> = {
  '0.1.5': 5,
  '0.1.6': 6,
  '0.1.7': 7,
}

/**
 * Whether the host is at least `gen`. An unknown generation answers `false`:
 * callers treat that as "do not assume the newer behaviour" and use whatever
 * capability probe they own, which is the safe direction for every gate here.
 */
export function hostAtLeast(gen: Exclude<HostGeneration, 'unknown'>): boolean {
  const rank = RANK[current.generation as Exclude<HostGeneration, 'unknown'>]
  return rank !== undefined && rank >= RANK[gen]
}

/**
 * Whether this host's own right Sidebar already carries the appearance page,
 * which makes the plugin's dsh-better-sidebar page a duplicate entry on the same
 * guide surface.
 *
 * `true`  — 0.1.6 or newer: the better-sidebar page stands down.
 * `false` — 0.1.5 or an undetermined-but-answered generation: keep it.
 * `null`  — the verdict has not landed yet (the probe is a Node round-trip).
 *
 * Callers must treat `null` as "not yet known": register nothing eagerly on a
 * `true`, and arm a withdrawal for a later `true` rather than blocking on it.
 *
 * NOTE: 0.1.5-rc.2 ALSO ships the native right Sidebar (verified: the
 * `ui-sidebar-right` entry is in that release's `dsh-web-app/cordis.patch.yml`),
 * so this gate deliberately keys off the release rather than off the presence of
 * the native sidebar service — the two are not the same fact.
 */
export function suppressesBetterSidebar(): boolean | null {
  if (!resolved) return null
  if (current.generation === 'unknown') return false
  return hostAtLeast('0.1.6')
}

/** React hook: re-renders when the host verdict lands or changes. */
export function useHostGeneration(): HostGeneration {
  return useSyncExternalStore(subscribeHostInfo, rHostGeneration)
}
