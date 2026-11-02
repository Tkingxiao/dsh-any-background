/**
 * Adapter for the DSH `0.2.2` patch line, verified at `0.2.2-alpha.2`.
 *
 * A second MINOR line opened (`0.2.2-alpha.2` is the `alpha` dist-tag; no `alpha.1`
 * was ever published), and the answer it gives is the `0.2.1` folder's. That is a
 * claim this file has to earn rather than inherit — `0.2.2-alpha.2` is a large
 * release: across the 296 `@deepseek-ai/dsh-*` packages of a `0.2.1-rc.5` install,
 * 1151 shipped files changed, 1709 were added and 57 removed. What matters is that
 * none of them is a fact this plugin speaks for. Every claim below was read out of
 * the published artifacts of `0.2.2-alpha.2` and compared against `0.2.1-rc.5`.
 *
 * Earned (identical, so the same constants are returned):
 *   · The z-index ladder of §2-T is byte-for-byte the load-bearing one:
 *     `ui-layout` still emits `_handle{z-index:11…`, `_leadingSeat{z-index:15…` and
 *     `_overlayLayer{z-index:20…`. So `dab-part-blur-side`'s ceiling of 1 and
 *     `HEADER_BAR_RULE`'s 10 are argued exactly as before. The only `z-index` deltas
 *     on the whole line are local values in `ui-chat` (6), `client-ui-plugin-manager`
 *     (2) and `ui-settings-models` (1), plus one removed in
 *     `ui-sidebar-documentpreview` (2) — none of them a layer the ladder names.
 *   · The menu frost contract is unchanged: `--dsw-menu-surface-fill` still
 *     `#f8f9fa94` / `#43454a73`, `--dsw-specific-menu` still
 *     `var(--dsw-menu-surface-fill)` with the darwin scheme override intact,
 *     `--dsw-alias-menu-group-header-fill` still `#f8f9faf0` / `#303136f0`, and the
 *     same 8 packages still consume `--dsw-menu-backdrop-filter`. That is
 *     `LAYERED_MENU_SURFACE_WITH_GROUP_HEADER`, unchanged.
 *   · `ui-theme` still composes the font token itself on `body`
 *     (`--dsw-font-family: var(--dsh-font-family-text, var(--dsh-font-family-text-default)),
 *     var(--dsh-font-family-text-default)`), which is precisely the competitor
 *     `applyFontFace`'s `!important` assertion was added to beat (§E, same specificity,
 *     order decides). It still has to win, so the rule stays.
 *   · `data-shimmer` still occurs the same number of times → the rc.1 stroke
 *     exemption stands; `data-shell-bottom` / `data-rightbar-col` likewise, so
 *     `discoverParts()` still anchors on the same two children.
 *   · All five `conversation.session.header*` slot keys are unchanged, and
 *     `conversation.session.header.views.actions` is still the one addition — the
 *     tagger's portaled arm already covers it.
 *   · Selector resolution: of the 75 host attribute/class selectors this plugin's
 *     rules name, all 75 still match host output; 13 changed occurrence COUNT
 *     (`_panel` 88→96, `_portal` 4→6, `data-dockkit-host` 8→10,
 *     `data-windows-titlebar` 35→51 …), none reached zero. All nine
 *     `[class*="_…"]` shapes are unchanged.
 *   · `dsh-app-boot`'s peer gate is byte-identical: same
 *     `name !== "@deepseek-ai/dsh" && !name.startsWith("@deepseek-ai/dsh-")` prefix
 *     test, same `satisfies(…, { includePrerelease: true })`. §C's four-place
 *     enumeration means the same thing on this line as on the last.
 *
 * Two host-side deltas did reach this plugin. Neither is a rule change, and both are
 * recorded here because they are the two places a 0.2.2 bug report will land:
 *   1. `--dsw-specific-sidebar-nav-item-hover` is DELETED. Its only consumer was
 *      `ui-settings-general`'s sidebar nav hover, and that rule is gone with it — the
 *      host stopped painting the hover at all. `paletteTokens()` still emits the token
 *      (`utils/color.ts`, both scheme blocks), which on this line writes a custom
 *      property nobody reads. Harmless, still correct on 0.2.0/0.2.1, and NOT a reason
 *      to branch: nothing regressed relative to the host's own default.
 *   2. `ui-plugin-manager` gained a NEW consumer of `--dsw-alias-bg-base` — the token
 *      the 「主界面」 slider takes over:
 *      `.…_pageBar[data-natural]:before{background:var(--dsw-alias-bg-base);pointer-events:none;
 *      inset:0 0 auto}`. This is §2-V's "who reads this token" question, and the
 *      answer now has one more host-side row. At the default (`opacities.bg = 0`) it
 *      paints nothing, which is what the slider intends, and the plugin already frames
 *      that page (`PLUGIN_PAGE_FROST_RULE`), so nothing is pinned. If a 0.2.2 report
 *      says the plugin-manager page header shows a seam or a doubled band, start here.
 *
 * New host tokens on this line that this plugin does NOT claim: the
 * `--dsw-alias-illustration-*` family (6), `--dsw-alias-state-done-primary`,
 * `--dsh-dockkit-float-{x,y,width,height}`, `--dsh-sidebar-{paint-inset,row-padding,
 * label-gap}`, `--dsh-hairline-width`, `--dsh-button-outline-color`,
 * `--dsh-tab-hit-inline`. `--dsh-dockkit-float-top`, which the panel rule does read,
 * is still there. If a future surface stops following the theme colour, check whether
 * it paints from one of these instead.
 *
 * NOT done for this line: no real-host smoke. Only `0.2.1-rc.3` is installed on the
 * machine this folder was written from, so §4.3 is still open for 0.2.2 — the claims
 * above are artifact reads, not screenshots.
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
    // Re-verified at this tag: the dockkit markers are present and the panel wrapper
    // is still a stationary frame with sliding children, so no promotion.
    promotion: '',
    blur: panelBlurRule(DOCKKIT_SLIDERS),
  }
}

export function createAdapter(host: HostInfo): HostAdapter {
  return {
    id: '0.2.2-alpha.2',
    channel: '0.2.2',
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
