/**
 * Adapter for the DSH 0.1.5-rc channel (`0.1.5-rc.2`, `0.1.5-rc.3`).
 *
 * Nothing here is inferred from a neighbouring release — each fact below was
 * checked against the harness tags `dsh-v0.1.5-rc.2` / `dsh-v0.1.5-rc.3`.
 *
 * Host shape this line presents:
 *   `ui-sidebar-right/shell/SidebarRight.module.css`
 *     .panel { position:absolute; z-index:10; transform:translateX(100%); visibility:hidden }
 *     .panel[data-sidebar-right-open] { transform:none }
 *     .panel[data-sidebar-right-panel='fullscreen'] { position:fixed; inset:0; z-index:40 }
 *   `ui-dockkit` ships WITHOUT `TabLayout.tsx`, so `[data-dockkit-host]` and
 *   `[data-dockkit-empty]` are never rendered on this line.
 *   `ui-plugin-manager` (the page behind `PLUGIN_PAGE_FROST_RULE`) is not a package
 *   on this line at all, and neither tag emits `[data-plugin-panel]`.
 *
 * Consequence for the panel slider: the WRAPPER is what slides, so the
 * `backdrop-filter` belongs on the wrapper — and because the wrapper sits inside
 * an animated track with its own stacking context, it must be promoted out of it
 * or the filter has no wallpaper to sample.
 *
 * @module
 */
import {
  BASE_HEADER_SLOT_KEYS,
  BETTER_SIDEBAR_PANEL,
  PANEL_FULLSCREEN,
  PANEL_WRAPPER,
  panelBlurRule,
} from '../shared'
import type { HostAdapter, HostInfo, PanelFragments } from '../types'

/** The wrapper carries the slide transform on this line, so it carries the blur. */
function panelFragments(): PanelFragments {
  return {
    // Lift the panel clear of the rightbar column's stacking context. Fullscreen
    // re-asserts the host's own z-index 40 (the modal dialog stack lives at 100+,
    // above both), so the promotion above cannot drag it under the frame chrome.
    promotion:
      `${PANEL_WRAPPER}{position:fixed!important;z-index:26!important}` +
      `${PANEL_FULLSCREEN}{z-index:40!important}`,
    // No selector-list bundling across the two owners: an engine that cannot
    // parse one entry drops only that block.
    blur:
      panelBlurRule(PANEL_WRAPPER) +
      panelBlurRule(BETTER_SIDEBAR_PANEL),
  }
}

export function createAdapter(host: HostInfo): HostAdapter {
  return {
    id: '0.1.5-rc.2/rc.3',
    channel: '0.1.5-rc',
    host,
    panelFragments,
    // No plugin-manager page to frost. Emitting the rule would be harmless — the
    // selector cannot match — but a resolved adapter's job is to say what THIS
    // release has, and this one does not.
    pluginPageRule: '',
    surface: {
      // This line's own right Sidebar does NOT carry the appearance page, so the
      // plugin's dsh-better-sidebar page owns the guide surface and must register.
      ownsSidebarGuideSurface: false,
      // All five header slot anchors are registered on both 0.1.5 releases.
      headerSlotKeys: BASE_HEADER_SLOT_KEYS,
    },
  }
}
