/**
 * Adapter for the DSH 0.1.6-alpha channel (`0.1.6-alpha.1`, `0.1.6-alpha.2`).
 *
 * Facts checked per tag against `dsh-v0.1.6-alpha.1` / `dsh-v0.1.6-alpha.2` —
 * deliberately not copied over from the 0.1.5 folder, even where the two lines
 * turned out to agree. If a future 0.1.6 patch diverges, only this file moves.
 *
 * Host shape this line presents:
 *   `SidebarRight.module.css` is unchanged from the 0.1.5 line for the parts that
 *   matter: `.panel` still carries `position:absolute` + `transform:translateX(100%)`,
 *   `data-sidebar-right-open` still clears it with `transform:none`, and the panel
 *   width is still an inline `width` with no `--dsh-sidebar-width` variable.
 *   alpha.2 appends fullscreen window chrome (`.63` windows / `.77` darwin), which
 *   does not move the blur target, AND the `ui-plugin-manager` package — so the
 *   plugin-page frost below is prerelease-gated rather than channel-wide.
 *   `ui-dockkit` still has no `TabLayout.tsx`, so no `[data-dockkit-host]` /
 *   `[data-dockkit-empty]` on this line either.
 *
 * So the panel mechanics match 0.1.5: the wrapper slides, the wrapper takes the
 * blur, and the wrapper needs promoting.
 *
 * @module
 */
import {
  BASE_HEADER_SLOT_KEYS,
  BETTER_SIDEBAR_PANEL,
  PANEL_FULLSCREEN,
  PANEL_WRAPPER,
  PLUGIN_PAGE_FROST_RULE,
  panelBlurRule,
} from '../shared'
import { prereleaseOf } from '../../../../host-compat/channel'
import type { HostAdapter, HostInfo, PanelFragments } from '../types'

/** The extra session-header anchor this line introduces: the macOS titlebar work
 *  added `conversation.session.header.leading`. It was deleted again at
 *  0.1.7-alpha.1 with no shim, so it is unique to this line — which is why the
 *  channel alone is not enough to answer it and the prerelease is read.
 *  `alpha.1` predates it.
 *
 * Erring toward "included": a slot key the host never emits simply matches
 *  nothing, whereas a key we omit hides a header area from the plugin for the
 *  whole session. */
function hasLeadingHeaderSlot(version: string | null): boolean {
  const pre = prereleaseOf(version)
  if (pre === null) return true
  const m = /^alpha\.(\d+)$/.exec(pre)
  return m === null || Number(m[1]) >= 2
}

/** The other thing this line splits on: `ui-plugin-manager` — the package that
 *  renders `设置 → 插件` and stamps `[data-plugin-panel]` — was CREATED at
 *  alpha.2. Until then the plugin list was a settings tab in
 *  `ui-settings-plugin-inventory`, which carries `[data-plugin-scope]` but no
 *  card list to frame, so alpha.1 has nothing for the frost rule to apply to.
 *
 *  Same erring-toward-included convention as `hasLeadingHeaderSlot`: the rule's
 *  own `[data-plugin-panel]` prefix means an over-broad arm cannot paint, while
 *  an over-narrow one leaves a page bare for the whole session. */
function hasPluginManagerPage(version: string | null): boolean {
  const pre = prereleaseOf(version)
  if (pre === null) return true
  const m = /^alpha\.(\d+)$/.exec(pre)
  return m === null || Number(m[1]) >= 2
}

function panelFragments(): PanelFragments {
  return {
    // Same treatment as the 0.1.5 line: the wrapper is transformed inside an
    // animated track, so the frost needs it lifted out to have wallpaper to
    // sample. This is the arrangement the 0.1.6 report confirmed working.
    promotion:
      `${PANEL_WRAPPER}{position:fixed!important;z-index:26!important}` +
      `${PANEL_FULLSCREEN}{z-index:40!important}`,
    blur:
      panelBlurRule(PANEL_WRAPPER) +
      panelBlurRule(BETTER_SIDEBAR_PANEL),
  }
}

export function createAdapter(host: HostInfo): HostAdapter {
  return {
    id: '0.1.6-alpha.1/alpha.2',
    channel: '0.1.6-alpha',
    host,
    panelFragments,
    pluginPageRule: hasPluginManagerPage(host.version) ? PLUGIN_PAGE_FROST_RULE : '',
    surface: {
      // From this line the host's own right Sidebar carries an appearance page,
      // so the plugin's dsh-better-sidebar page would double the guide surface
      // and stands down. NOT derived from the sidebar service existing — it
      // already ships on 0.1.5-rc.2 — this is the release's own behaviour.
      ownsSidebarGuideSurface: true,
      headerSlotKeys: hasLeadingHeaderSlot(host.version)
        ? [...BASE_HEADER_SLOT_KEYS, 'conversation.session.header.leading']
        : BASE_HEADER_SLOT_KEYS,
    },
  }
}
