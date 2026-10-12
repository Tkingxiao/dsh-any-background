/**
 * The contract every per-version adapter folder implements.
 *
 * Business code reads THESE, never a release string. That is the isolation rule:
 * `0.2.0-rc` / `0.2.0-rc.2` / `0.2.1-alpha` may appear inside `versions/` and in the
 * front-door detector, and nowhere else in the plugin. Adding a new DSH line
 * then means adding one folder and one registry row — no `if` scattered through
 * the styling code.
 *
 * Tri-state fields (`null`) are not optionality, they are an answer: "the release
 * could not be resolved, so do not assert either way". The consumer then falls
 * back to a DOM-shape probe, which is how this plugin worked before any release
 * detection existed — and why an unresolved host still renders correctly.
 *
 * @module
 */
import type { HostChannel, HostInfo, KnownChannel } from '../../../host-compat/channel'

export type { HostChannel, HostInfo, KnownChannel }

/** Which element carries the right-Sidebar slide transform — and therefore which
 *  one a `backdrop-filter` must sit on for the frost to travel with the panel. */
export type PanelSlideOwner =
  /** The `[data-sidebar-right-panel]` wrapper itself is transformed. */
  | 'panel'
  /** The wrapper is a stationary frame; its dockkit children slide. */
  | 'dockkit'
  /** Not resolved: emit both arms gated on DOM shape, so the DOM arbitrates. */
  | null

/** The CSS the panel group contributes for this host, already ordered: whatever
 *  the wrapper needs, then whatever slides, then the third-party panel. */
export interface PanelFragments {
  /** Lift the panel out of its subtree's stacking context so the blur can sample
   *  the wallpaper. Emitted only where the wrapper carries the slide transform. */
  readonly promotion: string
  /** The `backdrop-filter` declarations for every surface the panel slider owns. */
  readonly blur: string
}

/** What a release paints a SHARED MENU (dropdown / popover / suggestion list /
 *  stat dialog) with, and where its frost belongs.
 *
 *  Two shapes are verified, and they differ in which element carries the paint:
 *    · the menu element itself declares `background` + `backdrop-filter`, so the
 *      plugin retints the element's token and filters the element.
 *    · `ui-primitives/src/MenuSurface.tsx` leaves the element unpainted and draws
 *      the fill plus the frost on a `z-index:-1` child layer instead. That layer's
 *      own comment states why it exists: filtering only the background "keeps
 *      nested menus and fixed overlays free of an ancestor backdrop root". Put a
 *      `backdrop-filter` on the element anyway and the plugin adds exactly the
 *      ancestor backdrop root the layer was built to avoid — and the fill token the
 *      layer reads is no longer the one the element used to read.
 *
 *  Stated as facts rather than as a branch in the styling code because both halves
 *  move together: which token a fill comes from, and whose job the frost is. */
export interface MenuSurfaceFacts {
  /** EVERY host custom property the plugin must declare with the menu's faded
   *  color for the fade to land — the token a menu's fill is read from, which is
   *  not always the one the element used to paint with. The consumer writes each of
   *  them wherever it already writes a menu fill (the body-level alpha re-scope,
   *  the header retint, the exempt pins), so one slider still produces one value and
   *  every layer a menu can paint from follows it. */
  readonly fillTokens: readonly string[]
  /** The declaration that sets a menu set's frost to a given CSS value: filtering
   *  the element where the element paints, re-declaring the host's menu-blur token
   *  where a child layer does. Takes a VALUE rather than a variable name because two
   *  consumers need it — the owning slider's `var(…)`, and the exempt surfaces'
   *  `none`. A declaration, not a rule, so the selector lists stay with the surfaces
   *  that own them and cannot drift out of sync. */
  readonly frostDecl: (value: string) => string
}

/** What the host's own chrome gives us, as facts rather than as a version. */
export interface SurfaceAdapter {
  /** The host's own right Sidebar already carries an appearance page, so the
   *  plugin's dsh-better-sidebar page would be a duplicate entry on the same
   *  guide surface and stands down. Driven by the resolved release, NOT by the
   *  presence of the native sidebar service — that service ships on 0.1.5-rc.2
   *  too, where the better-sidebar page must still register. */
  readonly ownsSidebarGuideSurface: boolean
  /** `[data-slot="<key>"]` anchors marking the session header's own surfaces.
   *  Header dropdowns portal away from their trigger, so these anchors are what
   *  lets the plugin notice a header menu opening. A key absent on a release is
   *  a header area the plugin cannot observe. */
  readonly headerSlotKeys: readonly string[]
}

/** The adapter for one host release — or the stand-in for "unknown". */
export interface HostAdapter {
  /** The exact release tags this folder's facts were checked against, as a range
   *  (`0.1.6-alpha.1/alpha.2`). `channel` is the bucket key the adapter was routed
   *  by; `id` says what ground truth behind it is — for logs and diagnostics, and
   *  so a reader who only sees the verdict knows how far the table reaches. */
  readonly id: string
  /** The channel the adapter was chosen by. */
  readonly channel: HostChannel
  /** The full resolved release facts, kept for diagnostics and for an adapter that
   *  would need finer grain than a channel. */
  readonly host: HostInfo
  readonly surface: SurfaceAdapter
  /** Resolve the panel CSS for this host. A function, not a string, because the
   *  unresolved case has to emit both DOM-gated arms. */
  readonly panelFragments: () => PanelFragments
  /** CSS for a host PAGE that only some releases ship — today the plugin-manager
   *  list block (see `PLUGIN_PAGE_FROST_RULE` in `shared.ts`). A release with no
   *  such page ships `''` so the stylesheet never carries a selector that host
   *  cannot match; the UNRESOLVED adapter still ships it, because there the page's
   *  own attribute is the test and a missing page simply never matches. */
  readonly pluginPageRule: string
  /** Where this release's shared menus get their fill and their frost. */
  readonly menus: MenuSurfaceFacts
}
