/**
 * dsh-any-background — native right-Sidebar integration (DSH 0.1.6+).
 *
 * DSH 0.1.6 ships an official right Sidebar (`dsh-client-ui-sidebar-right`)
 * with a public two-stage extension path: a static tab type into
 * `ctx.sidebarRightTabs` — whose `guide` entry draws a card on the Sidebar's
 * guide page — and a body under the keyed `sidebar.right.pane.tab` seat. This
 * module registers the plugin's appearance pages through that path, so the
 * official Sidebar gains a "主题" card that opens the very same five pages the
 * settings panel shows (one implementation, one state store; editing in either
 * place shows up in the other).
 *
 * The dependency is optional at every level, mirroring `sidebar/tab.tsx`:
 *   · the registry is waited on with `ctx.inject`, so a host without the
 *     right Sidebar (or an older DSH) silently registers nothing, and a
 *     Sidebar that initializes after this plugin still gets the card;
 *   · the service shape is restated as a minimal local contract instead of
 *     imported — a value import would be rejected by the host's client-bundle
 *     purity gate, and even a type-only import would make the package a
 *     build-time dependency for everyone who does not run it.
 *
 * When dsh-better-sidebar is installed it brings its own "主题" page (registered
 * by `sidebar/tab.tsx`), which would duplicate this card on the same guide
 * page. The native card therefore yields: it is not registered while
 * better-sidebar is detected, and it withdraws itself if better-sidebar mounts
 * later (the presence verdict is sticky-true, so no re-registration path is
 * needed). The Interface page's panel slider follows the same split:
 * "右方侧边栏" natively, "bettersidebar" when that plugin is present.
 */
import { createElement } from 'react'
import type { Ctx, ThemeSectionProps, ThemeStoreState } from '../types'
import { NS } from '../i18n'
import { ThemeTab } from './tab'
import { SunIcon } from '../components/icons'
import { createStoreHook, type ObservableStore } from './store-hook'
import { rBetterSidebar, subscribe as subscribeBetterSidebar, markNativeSidebarTabs } from '../env'
import { subscribeHostInfo, suppressesBetterSidebar } from '../host'

/** Minimal restatement of the slice of `ctx.sidebarRightTabs` used here. */
interface SidebarRightTabsService {
  /** Register one tab type for the caller's effect lifetime; returns an idempotent disposer. */
  register(definition: {
    /** Unique implementation identity; also the key the body registers under. */
    id: string
    /** Type discriminator — what `openTab` names. */
    kind: string
    /** The tab chip's text, captured when the tab opens. */
    title: (address: string) => string
    /** Entry boxes for the guide page; picking one opens this type as a page. */
    guide?: readonly {
      id: string
      order: number
      title: () => string
      description?: () => string
      /** A React component receiving `{ size?, className? }`. */
      icon?: unknown
    }[]
  }): () => void
}

/** The client context, plus the optional service this module waits for. */
type CtxWithTabs = Ctx & { sidebarRightTabs?: SidebarRightTabsService }

/** The tab implementation's identity, and the key the body registers under. */
export const NATIVE_TAB_ID = 'dsh-any-background:theme'

/** The page kind: what `openTab` names and the guide entry opens. */
const NATIVE_TAB_KIND = 'danybg-theme'

/**
 * Register the appearance pages with the native right Sidebar, if one exists.
 *
 * Call from the client `apply`. Both registrations sit inside the injected
 * scope's effects, so unloading the plugin (or HMR) withdraws them — without
 * that, the next activation would throw on the duplicate id.
 * @param ctx - client context.
 * @param opts.face - lazy accessor for the shared business face.
 * @param opts.store - the plugin's store instance, or null on a host where the
 *   store module never resolved (in that case there is nothing to bind and no
 *   page is registered).
 */
export function registerNativeSidebarTab(ctx: Ctx, opts: {
  face: () => Omit<ThemeSectionProps, 'useStore'>
  store: ObservableStore<ThemeStoreState> | null
}): void {
  const { store } = opts
  // Same guard as the better-sidebar path: `defineStore` has shipped two return
  // shapes across host builds, and binding a hook to the wrong one throws on
  // every render. Registering nothing leaves the settings panel working.
  if (store === null || typeof store.getSnapshot !== 'function' || typeof store.subscribe !== 'function') {
    console.warn('dsh-any-background: no observable store instance on this host; the native sidebar page stays unregistered')
    return
  }
  const locale = ctx.locale
  const t = locale.bind(NS)
  const useStore = createStoreHook(store)
  ctx.inject?.(['sidebarRightTabs'], (scope: Ctx) => {
    const tabs = (scope as CtxWithTabs).sidebarRightTabs
    if (tabs === undefined || typeof tabs.register !== 'function') return
    // This host ships its own right Sidebar (0.1.6+): record the capability so
    // the better-sidebar page can stand down — see env.markNativeSidebarTabs.
    markNativeSidebarTabs()
    // The face is materialized HERE, once, before the host can render the page:
    // its first build warms the store (syncBg/syncMetaNow), and a store write
    // issued from inside a render is exactly the impurity that turns into a
    // "setState while rendering" warning later.
    const face = opts.face()
    // The tab body needs no tab info of its own — the page polls nothing and
    // its only subscription is the plugin's shared store — so the slot
    // framework's props are ignored wholesale.
    const ThemeBody = () => createElement(ThemeTab, { face, useStore, locale })
    scope.effect(() => {
      // Which page owns the guide surface is decided by the SAME predicate the
      // better-sidebar module uses, so the two can never both stand down and
      // leave the Surface with no appearance card at all:
      //   · 0.1.6+                → better-sidebar page suppressed, native wins
      //   · 0.1.5 / unknown host  → better-sidebar page registers, native yields
      // `suppressesBetterSidebar()` returns null until the release verdict lands
      // (a Node round-trip), so during that window the native card registers and
      // is withdrawn once the verdict says better-sidebar owns the surface.
      const yieldTo = (): boolean =>
        suppressesBetterSidebar() === false && rBetterSidebar()
      if (yieldTo()) return
      let disposeTab: (() => void) | null = null
      const withdraw = (): void => {
        disposeTab?.()
        disposeTab = null
      }
      const unsubscribeBetter = subscribeBetterSidebar(() => { if (yieldTo()) withdraw() })
      const unsubscribeHost = subscribeHostInfo(() => { if (yieldTo()) withdraw() })
      disposeTab = tabs.register({
        id: NATIVE_TAB_ID,
        kind: NATIVE_TAB_KIND,
        title: () => t('nav'),
        guide: [{
          id: 'theme',
          // Past the shipped pages (files 10 / terminal 40 / browser 50): the
          // appearance card trails the tools instead of displacing them.
          order: 55,
          title: () => t('nav'),
          description: () => t('guideDesc'),
          icon: SunIcon,
        }],
      })
      return () => {
        unsubscribeBetter()
        unsubscribeHost()
        withdraw()
      }
    }, 'dsh-any-background: native sidebar theme tab')
    // Stage two: the body under the keyed seat, dispatched by the type's id.
    scope.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register(
      { name: 'sidebar.right.pane.tab', key: NATIVE_TAB_ID },
      ThemeBody,
    )), 'dsh-any-background: native sidebar theme body')
  })
}
