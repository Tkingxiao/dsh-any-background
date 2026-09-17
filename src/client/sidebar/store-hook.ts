/**
 * dsh-any-background — selector hook over a host store instance.
 *
 * The settings slot kit hands the pages a `useStore(selector)` hook that is
 * bound to this plugin's store instance by the host renderer. A better-sidebar
 * page gets no such kit — its tab props carry `ctx`/`store`/`scope` for
 * better-sidebar's own store — so the same contract is rebuilt here from the
 * store instance itself, which already IS an observable source
 * (`getSnapshot`/`subscribe`, see `defineStore` in the host's client store).
 *
 * Semantics match the host binding on purpose: reduce the published snapshot
 * through the selector and compare with `Object.is`, so a page subscribing to
 * one field does not re-render on unrelated writes.
 */
import { useCallback, useRef, useSyncExternalStore } from 'react'

/** The observable slice of a store instance this module relies on. */
export interface ObservableStore<S> {
  getSnapshot: () => S
  subscribe: (onChange: () => void) => () => void
}

/**
 * Bind a store instance to a `useStore(selector)` hook. Call once per store and
 * share the result: the returned hook keeps one subscription identity for its
 * whole lifetime.
 * @param store - observable store instance (`defineStore` handle).
 * @returns a selector hook reading that instance.
 */
export function createStoreHook<S>(store: ObservableStore<S>): <T>(selector: (snapshot: S) => T) => T {
  // Bound once: `subscribe` must keep its identity across renders or React
  // re-subscribes on every one of them.
  const subscribe = (onChange: () => void): (() => void) => store.subscribe(onChange)
  const { getSnapshot } = store
  return function useStoreSelector<T>(selector: (snapshot: S) => T): T {
    // Cache the selected value per snapshot identity. Two reasons, both load
    // bearing: React demands a referentially stable result for an unchanged
    // snapshot (otherwise it re-renders forever), and callers pass inline
    // arrows whose identity changes every render, so the selector itself can
    // never provide that stability. Caching per snapshot also makes a selector
    // that derives a fresh object safe.
    const cache = useRef<{ snapshot: S; value: T } | null>(null)
    const read = useCallback(() => {
      const snapshot = getSnapshot()
      const hit = cache.current
      if (hit !== null && hit.snapshot === snapshot) return hit.value
      const value = selector(snapshot)
      cache.current = { snapshot, value }
      return value
    }, [selector])
    return useSyncExternalStore(subscribe, read, read)
  }
}
