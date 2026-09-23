/**
 * Stand-in for "we could not resolve the release".
 *
 * This is a REAL case, not a theoretical one: a plain `~/.dsh` install has no
 * launcher layout, so the front-door probe finds neither a manifest nor a
 * version-shaped directory name. It must not degrade into a guessed channel —
 * a wrong guess silently restyles the window.
 *
 * Instead, the DOM arbitrates. Both panel arms ship, each gated on the shape that
 * only one release family can present, which is exactly how this plugin behaved
 * before release detection existed. It is why an unresolved host still gets a
 * working panel blur.
 *
 * The one concession this costs: an engine without `:has()` cannot parse a gated
 * selector and drops that block, so such a host loses the promotion. A resolved
 * host does not have that problem — its arm is unconditional.
 *
 * @module
 */
import {
  BASE_HEADER_SLOT_KEYS,
  BETTER_SIDEBAR_PANEL,
  DOCKKIT_SLIDERS,
  PANEL_FULLSCREEN,
  PANEL_WRAPPER,
  PLUGIN_PAGE_FROST_RULE,
  panelBlurRule,
  WITHOUT_DOCKKIT_FRAME,
} from '../shared'
import type { HostAdapter, HostInfo, PanelFragments } from '../types'

function panelFragments(): PanelFragments {
  const wrapper = `${PANEL_WRAPPER}${WITHOUT_DOCKKIT_FRAME}`
  return {
    // The promotion can only be claimed conditionally here: on a 0.1.7-style
    // frame it is actively wrong, and the frame's presence is all we can test.
    promotion:
      `${wrapper}{position:fixed!important;z-index:26!important}` +
      `${PANEL_FULLSCREEN}${WITHOUT_DOCKKIT_FRAME}{z-index:40!important}`,
    // Each owner in its OWN block — a selector list is not forgiving, so bundling
    // them would let one unparseable entry void the better-sidebar arm too.
    blur:
      panelBlurRule(DOCKKIT_SLIDERS) +
      panelBlurRule(wrapper) +
      panelBlurRule(BETTER_SIDEBAR_PANEL),
  }
}

export function createAdapter(host: HostInfo): HostAdapter {
  return {
    id: 'unknown',
    channel: 'unknown',
    host,
    panelFragments,
    // Unlike the panel arms this needs no DOM gate: the page's own
    // `[data-plugin-panel]` prefix IS the test, so on a release with no plugin
    // manager the rule is simply inert. No `:has()` cost either.
    pluginPageRule: PLUGIN_PAGE_FROST_RULE,
    surface: {
      // Asserting `true` here would withdraw the plugin's sidebar page on a host
      // that may not have an appearance page of its own — a missing page is worse
      // than a duplicate, and the duplicate is what the resolved adapters prevent.
      ownsSidebarGuideSurface: false,
      headerSlotKeys: BASE_HEADER_SLOT_KEYS,
    },
  }
}
