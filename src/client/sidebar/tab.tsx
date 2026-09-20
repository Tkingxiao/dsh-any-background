/**
 * dsh-any-background — dsh-better-sidebar integration.
 *
 * Publishes the plugin's appearance controls as a sidebar page ("主题") in
 * better-sidebar's tab registry. The page renders the SAME five-page tree as
 * the settings section — `ThemeSection` takes a `surface` variant — so there is
 * one UI to maintain, not two forks of it.
 *
 * The dependency is optional at every level, which is why nothing here imports
 * the package:
 *   · the service is read off the client context at runtime, so a DSH install
 *     without better-sidebar silently registers nothing, and a better-sidebar
 *     that mounts *after* this plugin still gets the page (`ctx.inject` fires
 *     whenever the service shows up, never when it never does);
 *   · the plugin's own types are restated in the minimal local contract below
 *     instead of imported — a value import would be rejected by the host's
 *     client-bundle purity gate, and even a type-only import would make the
 *     package a build-time dependency for everyone who does not run it.
 */
import { createElement, useCallback, useMemo, useSyncExternalStore } from 'react'
import type { Ctx, LocaleService, ThemeSectionProps, ThemeStoreState } from '../types'
import { NS } from '../i18n'
import { ThemeSection } from '../components/ThemeSection'
import { SunIcon } from '../components/icons'
import { createStoreHook, type ObservableStore } from './store-hook'

/** Minimal restatement of the slice of `ctx.betterSidebar` used here. */
interface BetterSidebarService {
  /** Register a page type; the returned disposer withdraws it. */
  registerTab(descriptor: {
    id: string
    title: string | (() => string)
    icon?: unknown
    order?: number
    /** Focus an already-open page instead of stacking duplicates. */
    single?: boolean
    component: () => unknown
  }): () => void
}

/** The client context, plus the optional service this module probes for. */
type CtxWithSidebar = Ctx & { betterSidebar?: BetterSidebarService }

/**
 * The active locale id, used as a re-render signal: page labels are resolved by
 * calling `t(...)` at render time, so the props object (and with it the memoized
 * page tree) has to be rebuilt when the language flips — otherwise the page
 * would keep painting the previous language until some unrelated store write
 * happened to re-render it.
 * @param locale - host locale service.
 * @returns the active locale id (a stable string, safe for `Object.is`).
 */
function useActiveLocale(locale: LocaleService): string {
  const subscribe = useCallback((onChange: () => void) => locale.subscribe(onChange), [locale])
  const read = useCallback(() => locale.getSnapshot().active, [locale])
  return useSyncExternalStore(subscribe, read, read)
}

/** Rendered inside a sidebar tab: the five pages, `surface: 'sidebar'` shell.
 *  Shared by the better-sidebar page and the native right-Sidebar tab — both
 *  hand a full-height column that owns its own scroll. */
export function ThemeTab({ face, useStore, locale }: {
  /** The plugin's business face, built once and shared with the settings section. */
  face: Omit<ThemeSectionProps, 'useStore'>
  useStore: ThemeSectionProps['useStore']
  locale: LocaleService
}) {
  const active = useActiveLocale(locale)
  // Unlike the settings slot — whose kit rebuilds the props object on every
  // render — every input here is stable, so the pages keep stable element
  // identities and only re-render when the store tells them to (or the language
  // changes). That is exactly the property the settings path has to fake.
  const props = useMemo<ThemeSectionProps>(() => ({ ...face, useStore }), [face, useStore, active])
  return createElement(ThemeSection, { ...props, surface: 'sidebar' })
}

/**
 * Register the appearance page with better-sidebar, if it is installed.
 *
 * Call from the client `apply`. The registration is owned by the injected
 * scope's effect, so unloading the plugin (or HMR) withdraws it — without that,
 * the next activation would throw on the duplicate id.
 * @param ctx - client context.
 * @param opts.face - lazy accessor for the shared business face.
 * @param opts.store - the plugin's store instance, or null on a host where the
 *   store module never resolved (in that case there is nothing to bind and no
 *   page is registered).
 */
export function registerThemeSidebarTab(ctx: Ctx, opts: {
  face: () => Omit<ThemeSectionProps, 'useStore'>
  store: ObservableStore<ThemeStoreState> | null
}): void {
  const { store } = opts
  // Fail soft on an unexpected store shape. `defineStore` has already shipped
  // two different return shapes (an instance on newer builds, a
  // `{ spec, create }` declaration on dsh-client-store 0.1.2-alpha.x), and
  // binding a hook to the wrong one throws on every render — which the section's
  // error boundary turns into a dead panel. Registering nothing leaves the
  // settings panel working, which is the right trade.
  if (store === null || typeof store.getSnapshot !== 'function' || typeof store.subscribe !== 'function') {
    console.warn('dsh-any-background: no observable store instance on this host; the sidebar page stays unregistered')
    return
  }
  const locale = ctx.locale
  const t = locale.bind(NS)
  const useStore = createStoreHook(store)
  // A fixed order slot past the built-ins (terminal 40 / browser 50) keeps the
  // page at the end of the + menu instead of displacing the tools above it.
  const ORDER = 55
  ctx.inject?.(['betterSidebar'], (scope: Ctx) => {
    const service = (scope as CtxWithSidebar).betterSidebar
    if (service === undefined) return
    // The face is materialized HERE, once, before the host can render the page.
    // Its first build warms the store (syncBg/syncMetaNow), and a store write
    // issued from inside a render is exactly the kind of impurity that turns
    // into a "setState while rendering" warning later.
    const face = opts.face()
    scope.effect(() => service.registerTab({
      id: 'dsh-any-background:theme',
      title: () => t('nav'),
      icon: (size: number) => createElement(SunIcon, { size }),
      order: ORDER,
      single: true,
      // The tab props carry better-sidebar's own store/scope/visible seats and
      // are not needed: this page polls nothing, and its only subscription is
      // the plugin store, shared with the settings section.
      component: () => createElement(ThemeTab, { face, useStore, locale }),
    }))
  })
}
