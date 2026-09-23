/**
 * Selector + declaration vocabulary shared by every per-version adapter.
 *
 * These are the ANCHORS, not the decisions. What varies between releases (which
 * element slides, whether the panel needs promoting, which header slot keys
 * exist) is answered in the version folders; what is stable across all of them
 * lives here so no adapter has to re-type a host selector and get it subtly wrong.
 *
 * Verified against the harness release tags (dsh-v0.1.5-rc.2 … dsh-v0.1.7-rc.1),
 * not inferred:
 *   · `[data-sidebar-right-panel]` — emitted by `ui-sidebar-right/shell/SidebarRight.tsx`
 *     on every release in range, with values `push` | `fullscreen`.
 *   · `[data-dockkit-host]` / `[data-dockkit-empty]` — emitted ONLY by
 *     `ui-dockkit/components/TabLayout.tsx`, a file that first appears at
 *     0.1.7-alpha.1. Dockkit itself EXISTS earlier (its `TabMenu` carries
 *     `[data-dockkit-tab-menu]` on every release), so only these two attributes
 *     are the 0.1.7 marker — never test "is dockkit installed".
 *   · `[data-dsh-bottom-panel]` — the optional dsh-better-sidebar workbench, not
 *     a host element at all. It is a single element on every release, which is
 *     why it needs no version arm.
 *   · `[data-plugin-panel]` / `[data-plugin-scope] > ul` — emitted by
 *     `ui-plugin-manager/src/client/PluginManagerPage.tsx`. That package is NEW AT
 *     0.1.6-alpha.2: `git ls-tree` shows it absent from 0.1.5-rc.2, 0.1.5-rc.3 and
 *     0.1.6-alpha.1, where the plugin list lived in `ui-settings-plugin-inventory`
 *     under `[data-plugin-scope]` alone — no `[data-plugin-panel]`, and no card
 *     `ul` in that group either. From alpha.2 on, the group markup (`section` →
 *     `div.groupHead` + `ul.cards`) is byte-identical through 0.1.7-rc.1, so the
 *     ONE rule below serves all four tags that emit the page.
 *
 * @module
 */

/** The host's own right Sidebar wrapper. */
export const PANEL_WRAPPER = '[data-sidebar-right-panel]'

/** The same wrapper in its fullscreen state; the host raises its own z-index to 40. */
export const PANEL_FULLSCREEN = '[data-sidebar-right-panel="fullscreen"]'

/** The docked children a 0.1.7+ panel slides — the panel itself stays put. */
export const DOCKKIT_SLIDERS =
  '[data-sidebar-right-panel] [data-dockkit-host="dock"],[data-sidebar-right-panel] [data-dockkit-empty]'

/** The third-party workbench panel, one element on every release. */
export const BETTER_SIDEBAR_PANEL = '[data-dsh-bottom-panel]'

/** Every surface the panel opacity slider owns. Layout-neutral token re-scope. */
export const PANEL_SURFACES = `${BETTER_SIDEBAR_PANEL},${PANEL_WRAPPER}`

/** DOM-shape test for "this is NOT a 0.1.7-style frame". Used ONLY by the
 *  unresolved adapter, where the DOM is the authority because the release is not. */
export const WITHOUT_DOCKKIT_FRAME = ':not(:has([data-dockkit-host],[data-dockkit-empty]))'

/** The panel blur declaration pair. Both prefixes because Safari needs the
 *  `-webkit-` one and the cascade must not let them disagree. */
export function panelBlurRule(selectors: string): string {
  return `${selectors}{` +
    '-webkit-backdrop-filter:var(--dsh-any-blur-panel,none);' +
    'backdrop-filter:var(--dsh-any-blur-panel,none)}'
}

/**
 * The plugin-manager page's frosted card block, for the releases that ship it.
 *
 * `设置 → 插件` lists each group's plugins in a `ul` that has NO surface of its
 * own — measured live on 0.1.7-alpha.1: a transparent flex column, 2px gaps, each
 * `li` transparent with a 12px radius. With the settings surfaces faded, the whole
 * table floats straight on the wallpaper. This frames each group's list the way the
 * composer capsule is framed: a rounded block on an `::before` underlay.
 *
 * Which releases emit the page decides who gets this string — see `pluginPageRule`
 * in each version folder.
 *
 * BINDING, and why it is not just "put it in the dialog": the block paints from
 * `--dsh-any-bg-settings-surface` and frosts from `--dsh-any-blur-settings`, i.e.
 * the settings-opacity / settings-blur pair. On 0.1.7 the page is a child of
 * `centerCol`, NOT of the settings dialog, so `SETTINGS_STYLE_RULE`'s token
 * re-scope never reaches it and the list would otherwise follow the homepage card
 * alpha; reading the plugin-owned variables off `:root` puts them under the slider
 * that owns this page. The `var(--dsw-alias-bg-layer-2)` fallback covers the window
 * before the first `applySettingsOverrides` write.
 *
 * The frost rides an underlay because backdrop-filter must never sit directly on a
 * host part (containing block + backdrop root), and the `isolation` is what keeps
 * the underlay's `z-index:-1` inside the block instead of escaping behind the frame.
 * The `:has([role="dialog"])` valve matters here more than anywhere else: every row
 * carries a `plugins.item` slot that third-party plugins fill with their own
 * controls, so a dialog can legitimately open inside the list.
 */
export const PLUGIN_PAGE_FROST_RULE =
  '[data-plugin-panel] [data-plugin-scope]>ul{position:relative;isolation:isolate;padding:8px;border-radius:14px}' +
  '[data-plugin-panel] [data-plugin-scope]>ul:has([role="dialog"]){isolation:auto}' +
  '[data-plugin-panel] [data-plugin-scope]>ul::before{' +
  'content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;border-radius:inherit;' +
  'background:var(--dsh-any-bg-settings-surface,var(--dsw-alias-bg-layer-2));' +
  '-webkit-backdrop-filter:var(--dsh-any-blur-settings,none);' +
  'backdrop-filter:var(--dsh-any-blur-settings,none)}'

/** Session-header slot anchors present on EVERY release in range. The slot
 *  renderer stamps `data-slot="<key>"` unconditionally (`ui-renderer/scoped-slots.tsx`),
 *  and all five keys are registered from 0.1.5-rc.2 through 0.1.7-rc.1 —
 *  verified per tag. Adapters append the keys their own release adds. */
export const BASE_HEADER_SLOT_KEYS = [
  'conversation.session.header',
  'conversation.session.header.actions',
  'conversation.session.header.utilities',
  'conversation.session.header.corner',
  'conversation.session.header.lineage',
] as const
