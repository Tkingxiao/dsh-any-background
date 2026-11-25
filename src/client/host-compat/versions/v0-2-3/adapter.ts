/**
 * Adapter for the DSH `0.2.3` patch line, verified at `0.2.3-alpha.2`.
 *
 * A third MINOR line opened, and the answer it gives is the `0.2.2` folder's.
 * As with the previous line boundary, that is a claim this file has to earn
 * rather than inherit: the release diff against `0.2.2-rc.5` touches 348 files
 * in the client/boot packages alone. What matters is that none of them changes a
 * fact this plugin speaks for. Every claim below was read out of the source tree
 * of `dsh-v0.2.3-alpha.2` (source beats installed artifacts — §4 of AGENTS.md).
 *
 * `0.2.3-alpha.1` is the same line with the same answers: the whole alpha.1 →
 * alpha.2 diff in the packages under review is `package.json` version bumps plus
 * a two-line `app-boot/src/profile-resolution/resolver.ts` edit that does not
 * reach the peer gate or any surface.
 *
 * Earned (identical, so the shared constants are returned):
 *   · The z-index ladder of §2-T still carries the same numbers in
 *     `ui-layout/src/client/AppFrame.module.css`: `.leadingSeat{z-index:15}`,
 *     `.handle{z-index:11}`, `.overlayLayer{z-index:20}` (the fullscreen right
 *     panel comment still names 40). So `dab-part-blur-side`'s ceiling of 1 and
 *     `HEADER_BAR_RULE`'s 10 are argued exactly as before; no host rule in
 *     `ui-conversation/src/client/skeleton` claims a `z-index` on the session
 *     header row itself, so the plugin's 10 is not racing a host declaration.
 *   · The menu frost contract is unchanged: `--dsw-menu-surface-fill` is still
 *     declared in `ui-theme/src/styles/design-platform.css:316/467`,
 *     `--dsw-specific-menu` is still its alias (`:318/469`, with the darwin
 *     literal override at `:480/484`), `--dsw-alias-menu-group-header-fill`
 *     still exists (`:317/468`), and `--dsw-menu-backdrop-filter` still has the
 *     same consumer set (23 occurrences). That is
 *     `LAYERED_MENU_SURFACE_WITH_GROUP_HEADER`, unchanged.
 *     The menu PLATE VALUES moved from `#fcfdfeb3`/`#303136a3` to
 *     `rgba(252,253,254,0.7)`/`rgba(48,49,54,0.64)` — the same colors at the
 *     same ~70%/64% alpha. An evidence literal in a comment, never a rule input
 *     (the adapter asks for those token NAMES).
 *   · `ui-theme/src/styles/base.css` still composes the family on `body`
 *     (`:30` — `var(--dsh-font-family-text, …), …`), with the built-in stack
 *     declared on `:root` (`:9`). That body declaration is the competitor
 *     `applyFontFace`'s `!important` was added to beat (§E, same specificity,
 *     order decides), so the rule stays.
 *   · All five base `conversation.session.header*` slot keys are still rendered
 *     by `ui-conversation/src/client/skeleton/ConversationSession.tsx`, plus
 *     `conversation.session.header.views.actions` (`:41`) — the tagger's
 *     portaled arm already covers it.
 *   · Selector resolution: every host attribute/class selector this plugin names
 *     still matches. The class-shape locals the rules depend on are all present
 *     (`sidebarCol` 26, `ioCard` 17, `_menu` 28, `_panel` 9 — the rest of the
 *     list is third-party/self by construction, zero on both tags). The host
 *     `data-*` set still resolves: `data-shimmer` (18), `data-shell-bottom` (2),
 *     `data-rightbar-col` (2), `data-dockkit-host` (22), `data-dockkit-empty` (7),
 *     `data-plugin-panel` (6), `data-plugin-loading` (1), `data-install-registry`
 *     (1), `data-approval-key` (8), `data-plan-review-key` (6),
 *     `data-question-key` (1), `data-ds-dark-theme` (36),
 *     `data-windows-titlebar` (77), `data-platform` (110). Several counts grew
 *     additively (`data-shell-overlay` 1→3, `data-chat-flow` 127→130,
 *     `data-conversation-scroll` 36→40) — occurrences, not semantics.
 *   · The plugin-manager page still emits the anchors `pluginPageRule` matches:
 *     `[data-plugin-panel]` on the page (`PluginManagerPage.tsx:1720`), a
 *     `section[data-plugin-scope="global"]` wrapping a DIRECT `ul.cards` per group
 *     (`:1705`, and the "more" list at `:1891`), and the first-read
 *     `section[data-plugin-loading]` whose `ul` is also a direct child (`:491`).
 *     `data-plugin-scope`'s total occurrence count fell 14→2 only because the
 *     attribute left test files and other packages; the two emitters are exactly
 *     the ones the rule reads.
 *   · `dsh-app-boot`'s peer gate is unchanged:
 *     `packages/boot/app-boot/src/plugin-compatibility.ts` still skips anything
 *     whose name is neither `@deepseek-ai/dsh` nor starts with
 *     `@deepseek-ai/dsh-`, and still uses
 *     `semver.satisfies(…, { includePrerelease: true })`. `engines.dsh` still
 *     decides alone when present.
 *   · `ui-theme`'s public surface, `ui-settings`' launcher contract
 *     (`openSettings(sectionId?)`), `ui-sidebar-right`'s `sidebarRightTabs`, and
 *     the `window.__ModuleLoader__.load({ id, factory })` banner contract are
 *     unchanged (the store/connection/locale/settings/sidebar-right `index.ts`
 *     exports are byte-identical for our calls; the web boot diff only changes
 *     how the shell assembles static modules).
 *
 * Two host-side deltas did reach this plugin. Neither is a rule change, and both
 * are recorded here because they are where a 0.2.3 report will land:
 *   1. STYLESHEET PIPELINE. `ui-theme/src/client/styles.ts` no longer creates
 *      `<style data-plugin data-plugin-css>` tags per file; it imports its CSS as
 *      module resources, and `ui-renderer`'s `DocumentStyles` mounts them as
 *      `<style data-plugin="<owner>" data-path="<path>">`. The two attributes our
 *      third-party scanner reads are therefore still present in BOTH generations;
 *      `data-path` is additive, and `data-plugin` still carries the owning package
 *      name, so `isSelf`/`isHost`/`pluginKey` keep working. The installed host now
 *      appends module styles to `<head>` on module-record changes, which can put a
 *      host sheet AFTER our static one; the plugin's contested paint declarations
 *      are `!important` (tokens / overlays), and the two additions that are not
 *      (`HEADER_BAR_RULE` z-10, `SIDEBAR_ONE_LAYER_RULE`'s transparent token) are
 *      declarations the host does not make on those elements. If a future 0.2.3
 *      report shows a host token overriding ours, look here first.
 *   2. NEW `--dsw-alias-bg-base` CONSUMERS — the token 「主界面」 takes over.
 *      Three files joined and one left: `ui-session-panel/SessionPanelToggle.module.css`
 *      (a 1.5px box-shadow ring around the panel toggle dot),
 *      `ui-subagent/src/client/sidebar-chat/SessionDropZone.module.css` (a
 *      transient drop overlay: `color-mix(…72%, transparent)` + `blur(6px)`),
 *      and `experimental/timeline/src/client/timeline.css` (select / overview /
 *      progress surfaces). Removed: `ui-chat/MessageItem.module.css`. None is
 *      pinned: these are host surfaces the slider is meant to fade, the ring is a
 *      shadow rather than a plate, and the drop zone is only visible during a drag.
 *      At the default (`opacities.bg = 0`) they paint nothing over the wallpaper,
 *      which is the slider's contract. The timeline package is experimental, so
 *      it is not part of the required boot set; it is recorded for triage only.
 *
 * New host tokens on this line that this plugin does NOT claim: the timeline
 * surface's new tokens (`--timeline-status` and friends, package-local), and
 * whatever the broader 1620-file diff added outside the packages this plugin
 * speaks for. `--dsh-dockkit-float-top`, which the panel rule reads on some
 * lines, is present again (8 hits) — but this folder emits NO promotion, so it
 * is not a rule input here. `--dsw-specific-sidebar-nav-item-hover` is still
 * absent (0 hits), and `paletteTokens()` still emits it: a custom property nobody
 * reads, harmless on every supported line, and not a reason to branch.
 *
 * RE-CHECKED FROM THE SOURCE TREE at `0.2.3-alpha.1` and `0.2.3-alpha.2`
 * (tags `dsh-v0.2.3-alpha.1`, `dsh-v0.2.3-alpha.2`). The counts above were taken
 * at alpha.2; the alpha.1 → alpha.2 diff in the packages under review is the
 * `package.json` versions plus the two-line resolver edit named in the header, so
 * no input can differ between the two rows. No rule input reached zero. This is
 * an artifact/source read only: no 0.2.3 host is installed in the launcher here,
 * so "the plugin loads and answers `read`" is NOT verified on a real process for
 * this line. State that plainly in any issue reply instead of implying a
 * real-host smoke ran.
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
    // `[data-sidebar-right-panel]` is still the stationary frame
    // (`ui-sidebar-right`), and its dockkit children still carry
    // `[data-dockkit-host="dock"]` / `[data-dockkit-empty]` (verified above), so
    // the blur belongs on the sliders and no promotion is emitted.
    promotion: '',
    blur: panelBlurRule(DOCKKIT_SLIDERS),
  }
}

export function createAdapter(host: HostInfo): HostAdapter {
  return {
    id: '0.2.3-alpha.1…alpha.2',
    channel: '0.2.3',
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