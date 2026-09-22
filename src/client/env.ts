/**
 * Host capability detection — which third-party plugins are actually present.
 *
 * The host exposes no plugin registry on the client context, so presence is
 * inferred from the stable DOM markers those plugins mount. Detection runs
 * once (plugin boot) and is re-armed by a cheap body-level MutationObserver so
 * a plugin that mounts after this one still flips the cached verdict. The
 * verdict is sticky-true for the session: whether a detected plugin's surface
 * is currently collapsed must not hide the settings that govern it.
 */

import { useSyncExternalStore } from 'react'

/** Persistent container + surfaces dsh-better-sidebar mounts when loaded.
 *  `[data-dsh-better-sidebar]` is the plugin's host wrapper — always appended
 *  to document.body on mount — so it is the authoritative "plugin is loaded"
 *  signal and the body childList observer fires exactly when it appears. The
 *  panel surfaces we actually style are listed only as reinforcement: they are
 *  conditionally rendered (collapsed panels drop them), so they must never be
 *  the sole signal.
 *
 *  `[data-sidebar-right-panel]` is deliberately ABSENT: on every host generation
 *  it marks the host's own right Sidebar (always present once a session opens),
 *  so counting it would make the better-sidebar verdict permanently true and the
 *  panel slider could never drop back to its native "右方侧边栏" identity. */
export const BETTER_SIDEBAR_MARKERS = [
  '[data-dsh-better-sidebar]',
  '[data-dsh-panel-host]',
  '[data-dsh-bottom-panel]',
] as const

let betterSidebar = false
const subs = new Set<() => void>()

/** Read snapshot of whether the better-sidebar plugin is present. */
export function rBetterSidebar(): boolean {
  return betterSidebar
}

function emit(): void {
  subs.forEach(cb => cb())
}

function sync(): void {
  const present = document.querySelector(BETTER_SIDEBAR_MARKERS.join(',')) !== null
  if (present && !betterSidebar) {
    betterSidebar = true
    emit()
  }
  // Sticky on purpose: a collapsed/detached panel must not untick the verdict.
}

/** React hook: re-renders the caller when better-sidebar presence changes. */
export function useBetterSidebar(): boolean {
  return useSyncExternalStore(subscribe, rBetterSidebar)
}

/** Subscribe to verdict changes. */
export function subscribe(cb: () => void): () => void {
  subs.add(cb)
  return () => { subs.delete(cb) }
}

/** Start detection (probe once, then watch body mounts). Returns an
 *  unsubscribe for plugin teardown. */
export function startBetterSidebarWatch(): () => void {
  sync()
  const observer = new MutationObserver(sync)
  observer.observe(document.body, { childList: true })
  return () => observer.disconnect()
}

// ── Native right-Sidebar capability ───────────────────────────────────────────
// CORRECTION: the native right Sidebar is NOT a 0.1.6+ introduction. It ships and
// is enabled on 0.1.5-rc.2 already — `@deepseek-ai/dsh-client-ui-sidebar-right`
// is a `dsh-web-app` dependency and its `ui-sidebar-right` entry is in that
// release's `cordis.patch.yml`, and `ctx.sidebarRightTabs` is provided there
// too. An earlier revision of this module treated the service as a "0.1.6+"
// probe, which wrongly suppressed the better-sidebar page on 0.1.5.
//
// The real release comes from `host.ts` (resolved on the Node half, where the
// launcher's on-disk layout is readable). This flag now only records whether the
// native registry service was actually CONFIRMED on this host — a runtime
// availability fact used to decide whether the native tab can be registered at
// all — while the better-sidebar suppression is driven by the host generation.

let nativeTabs = false
const nativeSubs = new Set<() => void>()

/** Whether the native right-Sidebar tab registry service was confirmed present. */
export function rNativeSidebarTabs(): boolean {
  return nativeTabs
}

/** Mark the native right-Sidebar service as confirmed. Sticky — the service
 *  never goes away within a session. */
export function markNativeSidebarTabs(): void {
  if (nativeTabs) return
  nativeTabs = true
  nativeSubs.forEach(cb => cb())
}

/** Subscribe to the native-Sidebar verdict. */
export function subscribeNativeTabs(cb: () => void): () => void {
  nativeSubs.add(cb)
  return () => { nativeSubs.delete(cb) }
}