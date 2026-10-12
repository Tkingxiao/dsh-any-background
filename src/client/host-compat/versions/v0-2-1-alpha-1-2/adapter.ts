/**
 * Adapter for the DSH `0.2.1-alpha` line, verified at `0.2.1-alpha.1` AND
 * `0.2.1-alpha.2`.
 *
 * A new MINOR line opened with a prerelease, and the answer is the `0.2.0-rc.2`
 * folder's — which is a statement this file has to earn, because "same as the
 * release before" is exactly the reasoning that went wrong when `0.1.7-rc.2` moved
 * the menu paint. Read at the tag instead:
 *   · `ui-theme/src/styles/design-platform.css` is BYTE-IDENTICAL to `0.2.0-rc.2`
 *     (`git diff --numstat` empty), so every token this plugin writes — the menu
 *     pair, the specific-menu alias, the turn-trigger chain — resolves to the same
 *     values.
 *   · `MenuGroup.tsx`, `MenuGroup.module.css`, `MenuSurface.tsx` and
 *     `MenuSurface.module.css` are byte-identical too, and `MenuGroup` is still the
 *     only consumer of `--dsw-alias-menu-group-header-fill`. That is why the menus
 *     here answer with `LAYERED_MENU_SURFACE_WITH_GROUP_HEADER`, the same facts the
 *     rc.2 folder checked, and not by re-typing them.
 *   · `ui-sidebar-right/shell/SidebarRight.module.css` and
 *     `ui-dockkit/src/components/TabLayout.tsx` unchanged (only `.tsx` service
 *     wiring moved), so the panel stays a stationary frame with sliding dockkit
 *     children and no promotion.
 *   · the five `conversation.session.header*` slot keys, still no `…leading`.
 *   · `PluginManagerPage.tsx` still emits the three anchors of the card list.
 *   · `TextShimmer` still marks its root `data-shimmer`, so the stroke exemption
 *     written for rc.1 stands.
 *
 * Re-checked at `0.2.1-alpha.2`, same list: `design-platform.css` still byte-identical
 * (`--dsw-menu-surface-fill` / `--dsw-specific-menu` / `--dsw-alias-menu-group-header-fill`
 * on both scheme blocks); `MenuSurface.tsx`/`.module.css` byte-identical (blob hashes
 * match); the `--dsw-specific-menu` and `--dsw-menu-backdrop-filter` file sets are the
 * same 15 at both tags (the frost side being 14 consumers plus the `body` declaration
 * in `gradient-shadow-text.css`);
 * `[data-sidebar-right-panel]` and the dockkit slide unchanged; the five header slot
 * keys unchanged; `AppFrame.tsx` / `AppFrame.module.css` untouched. The plugin-manager
 * page gained a third `[data-plugin-scope]` group (`data-plugin-group="more"`) inside
 * the same `[data-plugin-panel]`, which the existing rule already frames, so no new
 * fact lands here.
 *
 * What did move, and why none of it needs a fact from this folder:
 *
 *  1. `ui-layout/AppFrame` gains a second grid row, `div.bottomRow[data-shell-bottom]`
 *     holding the new `shell.bottom` slot, and it paints `--dsw-alias-bg-base` —
 *     the main-background token, which `applyCustomTokensNow` already re-emits on
 *     `body`, so the strip follows the main-bg slider with no new binding. The row
 *     is `min-height:0` and empty unless a plugin fills the slot, so an untouched
 *     install shows nothing. It also sits AFTER `RightbarColumn` in the frame's
 *     children, which is the side `discoverParts()` does not count from: it anchors
 *     on `data-rightbar-col` and reads `rightIdx-2` / `rightIdx-1`, so the sidebar
 *     and center column are still the same two children.
 *  2. `ui-primitives/InlineEditor.module.css` is the new home of the inline editor's
 *     `.editor{background:var(--dsw-alias-bg-base)}`. Same token, so the same slider
 *     reaches it wherever the component moved to.
 *  3. `modules/system.ts` narrowed `claimStyles` to the tags a factory itself added
 *     (see `ensureUiCss` for what that changed about our own sheet).
 *  4. `@deepseek-ai/dsh-invariants` is DELETED at this tag — `git ls-tree` shows no
 *     `packages/runtime-diagnostics/invariants`, and the boot/app plugin loader never
 *     looked for a plugin's `invariant` export. This plugin's no-op companion was
 *     therefore already dead weight here, and it goes rather than claiming a peer
 *     version for a package the host no longer ships.
 *  5. `ui-theme/src/styles/base.css` restructured the font tokens: the built-in stacks
 *     moved to `--dsh-font-family-text-default` / `-code-default`, and the host now
 *     composes the tokens itself on `body` —
 *     `--dsw-font-family: var(--dsh-font-family-text, …), …` — fed by the per-role user
 *     font lists `ThemePresenter` publishes (`--dsh-font-family-text` / `-code` /
 *     `-terminal`, new at this tag). That is a NEW `body`-level declaration of the very
 *     token this plugin's custom-font feature writes, at the same specificity as its
 *     rule — so which one wins became a question of stylesheet order. `applyFontFace`
 *     now asserts its `--dsw-font-family` with `!important`, the way the token sheet
 *     already does, so a host re-injecting its base styles cannot quietly drop the
 *     picked font. Code typography (`--ds-font-family-code`, plus the new
 *     `--dsh-code-font-size` axis) stays untouched — this plugin never owned it.
 *  6. AT `0.2.1-alpha.2`, `ui-jobs/JobListAction` moved its background-task list out of
 *     the header row and into a `createPortal(…, document.body)` painted
 *     `position:fixed; z-index:100` — and the list is a bare `<ul>` with NO `role`, so
 *     `header-tag.ts`'s `[role="menu"|"tree"|"dialog"]` probe can never claim it and the
 *     `ul[class*="_menu"]` class shape is the only thing that still styles it.
 *     Through `0.2.1-alpha.1` the same list is IN-PLACE — `{open ? <ul className={css.menu}
 *     style={{left: menuShift}}/> : null}` with `.menu{position:absolute; top:calc(100% +
 *     5px); z-index:100}` under a `.root{position:relative}` — which is the exact DOM the
 *     reported bug was captured from (`style="left: 0px;"`, no `top`, no role). The portal
 *     is therefore what HID the bug on the newest tag, not what fixed it: an absolutely
 *     positioned `z-index:100` child of the header row is only buried by the page once
 *     something makes that row a stacking context, and the thing that did was this
 *     plugin's own 「标题栏」 frost. Nothing here is a per-release fact to route on —
 *     `0.2.1-alpha.2` merely swapped which header component gets caught by it, because
 *     `ui-schedule/TaskMenu` (registered into `…header.utilities` on every release in
 *     range) is `role="menu"` + `position:absolute; z-index:100` in place whenever the
 *     Menu primitive is not in portal mode. The compensation lives with the injury: see
 *     the `z-index` note on `HEADER_BAR_RULE` in `wallpaper.ts`. (Checked and rejected:
 *     `ui-conversation/ContextMeter`'s `position:fixed` panel is NOT row chrome —
 *     `InputBar.tsx` mounts it in the composer, so the row never re-anchored it.)
 *
 * @module
 */
import {
  BASE_HEADER_SLOT_KEYS,
  DOCKKIT_SLIDERS,
  LAYERED_MENU_SURFACE_WITH_GROUP_HEADER,
  PLUGIN_PAGE_FROST_RULE,
  panelBlurRule,
} from '../shared'
import type { HostAdapter, HostInfo, PanelFragments } from '../types'

function panelFragments(): PanelFragments {
  return {
    promotion: '',
    blur: panelBlurRule(DOCKKIT_SLIDERS),
  }
}

export function createAdapter(host: HostInfo): HostAdapter {
  return {
    id: '0.2.1-alpha.1/alpha.2',
    channel: '0.2.1-alpha',
    host,
    panelFragments,
    pluginPageRule: PLUGIN_PAGE_FROST_RULE,
    menus: LAYERED_MENU_SURFACE_WITH_GROUP_HEADER,
    surface: {
      ownsSidebarGuideSurface: true,
      headerSlotKeys: BASE_HEADER_SLOT_KEYS,
    },
  }
}
