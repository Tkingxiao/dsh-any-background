/**
 * Adapter for the DSH 0.1.7-alpha channel (`0.1.7-alpha.1`, `0.1.7-alpha.2`),
 * re-verified unchanged at `0.1.7-rc.1`.
 *
 * This is the line the panel mechanics actually changed on — verified against
 * `dsh-v0.1.6-alpha.2` → `dsh-v0.1.7-alpha.1`, where `SidebarRight.module.css`
 * was rewritten (116 lines changed) and `ui-dockkit/src/components/TabLayout.tsx`
 * was ADDED. Both facts were checked, not assumed.
 *
 * `0.1.7-rc.1` was checked the same way, by diffing every package that emits an
 * anchor this plugin matches (the panel CSS, dockkit, the plugin-manager page, the
 * slot renderer, the theme tokens): no anchor line moved, and the two UI changes it
 * carries do not reach us —
 *   · `ui-plugin-manager`: a new `InstallDialog` failure screen plus compatibility
 *     wording. The card block (`section` → `div.groupHead` + `ul.cards`) is
 *     untouched, and the dialog is a body-level `Modal`, so the `:has()` valve of
 *     `PLUGIN_PAGE_FROST_RULE` never even has to fire for it.
 *   · `ui-conversation`: `.titleRow` gains `container-type:inline-size`, which makes
 *     it a stacking context and a containing block. Header slots sit inside that
 *     row, but this plugin reaches them through background/blur tokens, and the
 *     dropdowns they trigger portal to `document.body` (see `header-tag.ts`), so
 *     nothing of ours lands inside the new containment.
 *
 * Host shape this line presents:
 *   .panel { position:absolute; --dsh-dockkit-dock-layer:10; pointer-events:none }
 *     — no transform, no visibility, and no z-index of its own any more.
 *   .panel :global([data-dockkit-host='dock']),
 *   .panel :global([data-dockkit-empty]),
 *   .panel :global([data-dockkit-divider]) { transform:translateX(var(--dsh-sidebar-width)); visibility:hidden }
 *   .panel[data-sidebar-right-open] :global(…) { transform:none }
 *     — the DOCKED CHILDREN are what slide.
 *   .panel[data-sidebar-right-panel='fullscreen'] { --dsh-dockkit-dock-layer:40 }
 *     — fullscreen no longer flips the panel to `position:fixed`; it raises a
 *       layer variable, and the width becomes `100vw` on the absolute panel.
 *
 * Consequences encoded below:
 *   1. The blur belongs on the children. On the wrapper it frosted a stationary
 *      frame — "the blur stays put while the sidebar moves".
 *   2. The promotion must NOT be emitted. `position:fixed` detaches the panel from
 *      the track the host animates, which is the whole reason 2 the blur stopped
 *      travelling. The host's own sheet documents the content root as owning "no
 *      stacking context or transform", so `backdrop-filter` resolves against the
 *      page and samples the wallpaper unaided.
 *   3. `[data-dockkit-empty]` must be included alongside `[data-dockkit-host]`: a
 *      pane with no tabs renders the empty host instead, and keying on `host`
 *      alone mis-detects that (transient) shape.
 *
 * Also true of this line, recorded so the next reader does not re-derive it:
 *   · `conversation.session.header.leading` was DELETED here with no shim, so this
 *     folder deliberately does not list it (see the 0.1.6 folder).
 *   · `--dsw-specific-menu` was severed from `--dsw-alias-bg-layer-3` and became a
 *     literal translucent rgba, plus a `html[data-platform='darwin']` re-override.
 *     The plugin already samples and writes that token directly, so the severance
 *     needs no adapter of its own — but note the consequence: `toRgba()` REPLACES
 *     alpha, so the header slider now overrides the host's own 0.58 rather than
 *     fading an opaque layer. Intended (the slider means "this opacity"), worth
 *     knowing if the 0.1.7 header ever looks too thin.
 *   · `[data-chat-flow]` is stamped on a nested `ChatGroupSeat` content element
 *     too. Checked against every use in this plugin: the stroke group is inherited
 *     so a second match changes nothing, and the view-card discovery takes the
 *     first match, which is still the real flow root. No arm needed.
 *
 * @module
 */
import {
  BASE_HEADER_SLOT_KEYS,
  BETTER_SIDEBAR_PANEL,
  DOCKKIT_SLIDERS,
  PLUGIN_PAGE_FROST_RULE,
  panelBlurRule,
} from '../shared'
import type { HostAdapter, HostInfo, PanelFragments } from '../types'

function panelFragments(): PanelFragments {
  return {
    // Consequence 2: nothing to promote. The panel resolves against the page on
    // its own here, so the pre-0.1.7 lift is pure downside.
    promotion: '',
    blur:
      panelBlurRule(DOCKKIT_SLIDERS) +
      panelBlurRule(BETTER_SIDEBAR_PANEL),
  }
}

export function createAdapter(host: HostInfo): HostAdapter {
  return {
    id: '0.1.7-alpha.1/alpha.2/rc.1',
    channel: '0.1.7-alpha',
    host,
    panelFragments,
    // Every build this folder covers ships the plugin-manager page, and
    // `renderGroup` is byte-identical to 0.1.6-alpha.2's, so the same string
    // serves the whole line — rc.1 changed only the install dialog around it.
    pluginPageRule: PLUGIN_PAGE_FROST_RULE,
    surface: {
      ownsSidebarGuideSurface: true,
      headerSlotKeys: BASE_HEADER_SLOT_KEYS,
    },
  }
}
