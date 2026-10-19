/**
 * Selector + declaration vocabulary shared by every per-version adapter.
 *
 * These are the ANCHORS, not the decisions. What varies between releases (which
 * element slides, whether the panel needs promoting, which header slot keys
 * exist) is answered in the version folders; what is stable across all of them
 * lives here so no adapter has to re-type a host selector and get it subtly wrong.
 *
 * Verified against the harness release tags this table speaks for (dsh-v0.2.0-rc.1 …
 * dsh-v0.2.1-alpha.2). Where an anchor's first appearance is EARLIER than that, the
 * note says so, because it is what makes the marker a version test at all:
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
 *     `ul` in that group either. The three anchors this rule matches — `section
 *     [data-plugin-panel]`, `section[data-plugin-scope] > ul.cards` and
 *     `section[data-plugin-loading] > ul.cards` — are re-emitted unchanged at
 *     `0.2.0-rc.2`, `0.2.1-alpha.1` and `0.2.1-alpha.2` (checked per tag in
 *     `PluginManagerPage.tsx`), and alpha.2 only ADDS a third `[data-plugin-scope]`
 *     group (`data-plugin-group="more"`, its own `ul.cards`) inside the same panel —
 *     a name the selector already reaches, so the ONE rule below serves every tag
 *     that emits the page.
 *
 * @module
 */

import type { MenuSurfaceFacts } from './types'

/** The host's own right Sidebar wrapper. */
export const PANEL_WRAPPER = '[data-sidebar-right-panel]'

/** The same wrapper in its fullscreen state; the host raises its own z-index to 40. */
export const PANEL_FULLSCREEN = '[data-sidebar-right-panel="fullscreen"]'

/** The docked children a 0.1.7+ panel slides — the panel itself stays put. */
export const DOCKKIT_SLIDERS =
  '[data-sidebar-right-panel] [data-dockkit-host="dock"],[data-sidebar-right-panel] [data-dockkit-empty]'

/** The third-party workbench panel, one element on every release. Owned by the
 *  PRODUCED slider (0.3.2): a conversation artifact that happens to open in a
 *  panel, not a page column — so it fades and frosts with the produced surfaces. */
export const BETTER_SIDEBAR_PANEL = '[data-dsh-bottom-panel]'

/** The cards that take the composer seat away from the input bar: approval
 *  (`ui-approval`), plan review and the question composer (`ui-user-questions`).
 *  They are siblings of `[data-composer-card]`, not its children — the seat
 *  renders the elected takeover beside the fallback bar (verified per tag in
 *  `ConversationContent.tsx` and both packages' `slots.inject('conversation.composer')`)
 *  — and each paints the capsule's own `--dsw-specific-input-major`, from
 *  `dsh-v0.1.5-rc.2` through `dsh-v0.2.1-alpha.2`.
 *
 *  The marker sits on the wrapper, the fill on its child card:
 *  `[data-approval-key] > div`, `[data-plan-review-key] > section`,
 *  `[data-question-key] > section`.
 *
 *  One more fact these three share, and it is the reason the input-frost
 *  treatment for them lives in a runtime pass instead of a stylesheet rule:
 *  NO release in range declares `position` on any of the three cards (checked
 *  per tag — 0 hits for `position:` in `ApprovalPanel.module.css`,
 *  `PlanReviewPanel.module.css` and `QuestionComposer.module.css`), so unlike
 *  the fallback capsule — whose `.card` is `position:relative` on every tag —
 *  the host does not hand the plugin a containing block to mount a
 *  `z-index:-1` underlay on. Writing that `position` from the plugin's own
 *  stylesheet turns the card's box into a cascade race with anything else that
 *  positions it: a host build that caps the card with a percentage
 *  `max-height` loses its absolute containing block the moment a plugin rule
 *  wins that race, and the whole chain collapses — content outside the card,
 *  buttons off the viewport (dsh-any-background issue #24). The consumer that
 *  needs the containing block (`applyTakeoverFrost`) therefore probes each card
 *  at runtime and only anchors a box whose computed position is `static`; see
 *  `inputBlurRule`. */
export const COMPOSER_TAKEOVER_CARD =
  '[data-approval-key]>div,[data-plan-review-key]>section,[data-question-key]>section'

/** The takeover cards' free-text answer field — only the question composer has
 *  one (approval and plan review are button rows). Form controls do not inherit
 *  text properties, so the stroke group needs the editor spelled out; appending
 *  a suffix to `COMPOSER_TAKEOVER_CARD` would bind to its LAST arm only. */
export const COMPOSER_TAKEOVER_EDITOR = '[data-question-key]>section textarea'

/** Every surface the panel opacity slider owns — the host's own right Sidebar.
 *  Layout-neutral token re-scope. (The dsh-better-sidebar workbench used to be
 *  listed here; it moved to the produced group, see `PRODUCED_RULE`.) */
export const PANEL_SURFACES = PANEL_WRAPPER

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
 * The card `ul` is matched through TWO scopes. `0.2.0-rc.1` added a first-read
 * `ListSkeleton` that reuses `.cards` under `section[data-plugin-loading]`, so a
 * rule keyed on `[data-plugin-scope]` alone would show the real list frosted and
 * the loading list bare, then re-frost the block when the data lands. Hosts before
 * that never emit the attribute, so the extra selector is inert rather than a
 * version branch.
 *
 * BINDING, and why it is not just "put it in the dialog": the block paints from
 * `--dsh-any-bg-settings-surface` and frosts from `--dsh-any-blur-settings`, i.e.
 * the settings-opacity / settings-blur pair. On 0.1.7 the page is a child of
 * `centerCol`, NOT of the settings dialog (and from `0.1.7-rc.2` the dialog is a
 * `createPortal` beside `#root`, so it is further away still), therefore
 * `SETTINGS_STYLE_RULE`'s token
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
  '[data-plugin-panel] [data-plugin-scope]>ul,[data-plugin-panel] [data-plugin-loading]>ul{' +
  'position:relative;isolation:isolate;padding:8px;border-radius:14px}' +
  '[data-plugin-panel] [data-plugin-scope]>ul:has([role="dialog"]),' +
  '[data-plugin-panel] [data-plugin-loading]>ul:has([role="dialog"]){isolation:auto}' +
  '[data-plugin-panel] [data-plugin-scope]>ul::before,' +
  '[data-plugin-panel] [data-plugin-loading]>ul::before{' +
  'content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;border-radius:inherit;' +
  'background:var(--dsh-any-bg-settings-surface,var(--dsw-alias-bg-layer-2));' +
  '-webkit-backdrop-filter:var(--dsh-any-blur-settings,none);' +
  'backdrop-filter:var(--dsh-any-blur-settings,none)}'

/** The host's own `ui-theme` name for "dropdowns, popovers, suggestion lists", and
 *  the token the plugin has always remapped onto the card slider. Whether it still
 *  reaches a menu's paint is the question `MenuSurfaceFacts` below answers — from
 *  `0.1.7-rc.2` the host aliases it AWAY from the menu layer, so declaring it alone
 *  fades the non-`MenuSurface` overlays and nothing else. */
export const MENU_FILL_TOKEN = '--dsw-specific-menu'

/** Frost by filtering the element itself — the only option where the element is the
 *  thing that paints. Both prefixes because Safari needs the `-webkit-` one and the
 *  cascade must not let them disagree. */
export function elementFrostDecl(value: string): string {
  return `-webkit-backdrop-filter:${value};backdrop-filter:${value}`
}

/**
 * ── Where a menu's paint lives ────────────────────────────────────────────────
 * Verified by reading the emitting source at each tag, not inferred from a changelog.
 * The era this table now starts in (`0.2.0-rc.1`) already presents the shape below;
 * the 0.1.5 / 0.1.6 / 0.1.7-alpha line, where the menu ELEMENT painted itself and the
 * host frosted nothing at all before `0.1.7-alpha.1`, is recorded in
 * `LAYERED_MENU_SURFACE`'s first bullet rather than in an adapter, because no adapter
 * answers for it any more.
 *
 * `0.1.7-rc.2` and `dsh-v0.2.0-rc.1`: `TabMenu`, `MenuView`, `PopupSelectView`,
 *   `ModelSelect` and `Menu` all render through the new
 *   `ui-primitives/src/MenuSurface.tsx` (byte-identical between the two tags),
 *   which leaves the element unpainted and draws on a `z-index:-1` child instead
 *   (`MenuSurface.module.css` `.material`: `background:var(--dsw-menu-surface-fill)`
 *   + `backdrop-filter:var(--dsw-menu-backdrop-filter)`). The four menu stylesheets
 *   that used to paint the old token (Menu/MenuView/PopupSelectView/dockkit TabMenu)
 *   drop it at rc.2, which is why the painter count goes 16 → 14.
 *   Two consequences, both measured from those files:
 *     · the host FLIPPED ITS ALIAS — `design-platform.css` now declares
 *       `--dsw-specific-menu:var(--dsw-menu-surface-fill)` where every earlier
 *       release declared the reverse. So a plugin that retints only the old token
 *       writes a value nothing on a menu any longer reads, and the card / header
 *       opacity sliders go inert on exactly the surfaces they were built for.
 *     · that child layer exists on purpose: its comment says filtering only the
 *       background "keeps nested menus and fixed overlays free of an ancestor
 *       backdrop root", and the surface sets `isolation:isolate`. Filtering the
 *       element anyway installs the backdrop root the layer was written to avoid.
 *   The frost therefore rides `--dsw-menu-backdrop-filter`, whose consumer set is
 *   the same 14 stylesheets at every tag in the table (stat dialog, queue dock,
 *   context meter, todo panel, goal bar, job list, `HoverCard`, `PickerPopover`/
 *   `TaskMenu`/`ScheduleCatalogAction`, the subagent lineage, `TeamAction`,
 *   `CordisPanel`, `MenuSurface` itself) — re-declaring the token reaches the frost
 *   whoever ends up applying it, and does not depend on any element being the
 *   painting element. A 15th file names the same token without consuming it:
 *   `ui-theme/src/styles/gradient-shadow-text.css` DECLARES it on `body` —
 *   `blur(40px) saturate(150%)`, no media query — which is exactly why writing the
 *   token on a menu with a `none` fallback deletes a frost the host always had.
 *   That is now the intended reading of a 0 on the menu blur sliders — see the note
 *   above `popoverBlurRule` in `wallpaper.ts`. `MenuSurface.tsx` / `.module.css` are
 *   byte-identical from rc.2 through `0.2.1-alpha.2`, and the consumer set moved only
 *   in line numbers (the same 15 files at every tag in the table, checked per tag).
 *
 * `dsh-v0.2.0-rc.2` … `dsh-v0.2.1-alpha.2`: the sticky GROUP HEADING inside those
 *   menus changed owner. Through rc.1 the only grouped menu was `ModelSelect`, whose
 *   own stylesheet painted that heading from the menu token
 *   (`ModelSelect.module.css` `.groupTitle{position:sticky;
 *   background:var(--dsw-specific-menu)}`), so the card slider drove it and a picked
 *   wallpaper color tinted it. At rc.2 the rule is deleted and both grouped popups
 *   (`ModelSelect`, `PopupSelectView`) render the new `ui-primitives/MenuGroup.tsx`,
 *   whose heading stays transparent until `data-stuck` and then paints
 *   `--dsw-alias-menu-group-header-fill` (light `rgba(248,249,250,.94)`, dark
 *   `rgba(48,49,54,.94)`, declared in the `body` blocks of `design-platform.css`).
 *   The surface did not go away — its token was RENAMED, and `ModelSelect.module.css`
 *   is the one `--dsw-specific-menu` consumer that disappears at rc.2. Left alone, it
 *   is the single menu element the fade no longer reaches: an untinted, near-opaque
 *   band sitting on top of every row in the list the moment that list scrolls.
 */
/** The answer for `0.2.0-rc` and for `0.2.1-alpha`. The old token
 *  stays in the list on purpose: 14 surfaces in the same claim set still paint their
 *  fill from it — the lineage tree, `CordisPanel`, the stat dialog, `QueueDock`,
 *  `TodoPanel`, `ContextMeter`, `GoalBar`, `JobListAction`, `HoverCard`, `TeamAction`,
 *  `ModelSelect`'s own card and the schedule trio (`PickerPopover`, `TaskMenu`,
 *  `ScheduleCatalogAction`) — while the shared menus moved to
 *  `--dsw-menu-surface-fill`. Dropping either name fades one half of that set. */
export const LAYERED_MENU_SURFACE: MenuSurfaceFacts = {
  fillTokens: [MENU_FILL_TOKEN, '--dsw-menu-surface-fill'],
  frostDecl: value => `--dsw-menu-backdrop-filter:${value}`,
}

/** The fill the sticky group heading of a shared menu paints from — `MenuGroup`'s
 *  own contribution to the menu's look, first emitted at `0.2.0-rc.2`. */
export const MENU_GROUP_HEADER_FILL_TOKEN = '--dsw-alias-menu-group-header-fill'

/** The answer for `0.2.0-rc` from `0.2.0-rc.2` and for `0.2.1-alpha`: everything
 *  `LAYERED_MENU_SURFACE` says, plus the heading `MenuGroup` renamed.
 *
 *  Riding `fillTokens` rather than being left out is a decision with evidence on
 *  both sides, so state it: the host's README calls this token "independent of the
 *  menu material" and gives it a 94% fill while the surface layer sits at 58%/45%.
 *  That is a choice about an OPAQUE menu. This plugin's whole product is a menu the
 *  wallpaper shows through, and one release earlier the very same heading read the
 *  very same token as the card it sits on — so following it keeps rc.1's contract
 *  ("the card slider owns every layer of a menu, in the picked color") instead of
 *  leaving an untinted stock band inside a tinted, faded card.
 *  Compositing is on its side too: the heading stacks on the surface layer it sticks
 *  to, so a heading and a card at the same alpha still read as a band roughly
 *  twice-as-dense as the card (1-(1-a)²) — occluding, at the slider's level, exactly
 *  as it did when both came from one token. */
export const LAYERED_MENU_SURFACE_WITH_GROUP_HEADER: MenuSurfaceFacts = {
  fillTokens: [...LAYERED_MENU_SURFACE.fillTokens, MENU_GROUP_HEADER_FILL_TOKEN],
  frostDecl: LAYERED_MENU_SURFACE.frostDecl,
}

/** The answer when the release could not be resolved, and neither of the two
 *  verified shapes can be asserted. Each half is chosen so that being on the
 *  wrong line costs an inert declaration rather than a wrong pixel:
 *    · BOTH fill tokens. A custom property nothing reads costs nothing, so this
 *      half always lands: the fade reaches a self-painting menu through the old
 *      token and a `MenuSurface` layer through the new one.
 *    · the ELEMENT's frost, and not the host's blur token, because on `0.1.5` and
 *      `0.1.6` `--dsw-menu-backdrop-filter` has no consumer at all (verified: zero
 *      files before 0.1.7-alpha.1) — the token arm would leave those hosts with no
 *      menu frost whatsoever, while filtering the element frosts every release.
 *      On a `MenuSurface` host it does not stack: the surface root IS the element
 *      that carries `role="menu"`, so our filter makes it a backdrop root, and the
 *      `z-index:-1` layer inside it then has only the (unpainted) surface to sample
 *      and its own default `blur(40px)` becomes inert. One frost — ours — plus a
 *      `position:relative` element that hosts nested menus the way the layer was
 *      written not to. Accepted for a bucket that by definition cannot know. */
export const UNRESOLVED_MENU_SURFACE: MenuSurfaceFacts = {
  fillTokens: LAYERED_MENU_SURFACE.fillTokens,
  frostDecl: elementFrostDecl,
}

/** Session-header slot anchors present on EVERY release in range. The slot
 *  renderer stamps `data-slot="<key>"` unconditionally (`ui-renderer/scoped-slots.tsx`),
 *  and all five keys are registered from 0.1.5-rc.2 through 0.2.1-alpha.1 —
 *  verified per tag. Adapters append the keys their own release adds. */
export const BASE_HEADER_SLOT_KEYS = [
  'conversation.session.header',
  'conversation.session.header.actions',
  'conversation.session.header.utilities',
  'conversation.session.header.corner',
  'conversation.session.header.lineage',
] as const
