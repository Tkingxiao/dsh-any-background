/**
 * Assembly of the plugin's one static stylesheet.
 *
 * Until now the sheet was a single template literal in the client entry with
 * thirteen constants bolted together in whatever order they were added. That
 * order is load-bearing and was documented in three separate comment blocks in
 * `wallpaper.ts` — so it is encoded here instead, in one list, with the reason
 * next to each entry.
 *
 * What the release can change lives in the slots marked below: the panel group
 * (which element carries the frost), the plugin-manager page (whether this release
 * ships that page at all), and the menu groups (which token a menu's fill comes
 * from and whose job its frost is). Everything outside a slot is host-agnostic by
 * construction — it targets attributes every release in range emits.
 *
 * The sheet is rebuilt when the release verdict lands. It has to be: `apply` runs
 * synchronously while the verdict is a Node round-trip, so the FIRST sheet is
 * always the unresolved, DOM-arbitrated one. That is the correct interim state,
 * and swapping in the resolved arm a moment later is what removes the `:has()`
 * dependency from hosts we do know the answer for.
 *
 * @module
 */
import {
  FRAME_CLEAR_RULE,
  HEADER_BAR_RULE,
  MOBILE_HEADER_RULE,
  PANEL_TOKEN_RULE,
  PLACEHOLDER_RULE,
  PRODUCED_RULE,
  SETTINGS_STYLE_RULE,
  SIDEBAR_ONE_LAYER_RULE,
  STROKE_RULE,
  TRAJECTORY_STYLE_RULE,
  exemptDefaultRule,
  headerPopoverRule,
  inputBlurRule,
  popoverBlurRule,
} from '../wallpaper'
import { rHostAdapter, subscribeHostInfo } from './release'

/** The plugin's own dark-mode value on the body attribute the host sets. Scoping
 *  the gradient to it avoids matching the host's own theme attribute. */
const DARK_GRADIENT =
  'body[data-ds-dark-theme="dsh-any-background"]::before{' +
  "content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;" +
  'background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(255,255,255,0.03) 0%,transparent 60%)}'

/**
 * The order contract. Later entries override earlier ones at equal specificity,
 * which several groups rely on:
 *   · headerPopoverRule() after popoverBlurRule() — a surface moving from the card
 *     group to the header group must win, not merely be listed twice.
 *   · PRODUCED_RULE / STROKE_RULE after the blur groups — they shield their
 *     surfaces from an inherited slider.
 *   · exemptDefaultRule() last of the token groups — an exemption has to land
 *     after whatever it exempts.
 *   · PLACEHOLDER_RULE genuinely last — `::placeholder` resets must survive every
 *     group above.
 *
 * Three of these are FUNCTIONS, not constants, and they are version slots like
 * `panel.blur`: which declaration frosts a menu, and which token a menu's fill
 * comes from, is the current adapter's answer (`adapter.menus`). They stay in
 * place rather than moving next to the other slots because the contract above is
 * about position — a slot is only safe if it does not have to relocate.
 */
export function buildStaticStyles(): string {
  const adapter = rHostAdapter()
  const panel = adapter.panelFragments()
  // `← adapter` marks a version slot: the string it concatenates is chosen by the
  // resolved release. Everything else is host-agnostic by construction.
  return DARK_GRADIENT
    // First, not because anything competes with it, but because every surface
    // group below assumes the frame behind them is clear.
    + FRAME_CLEAR_RULE
    // Same job one row down: the sidebar's fill is declared by three nested elements,
    // and a translucent token stacked three times is not one surface. See
    // `SIDEBAR_ONE_LAYER_RULE` for why the column is the one that keeps it.
    + SIDEBAR_ONE_LAYER_RULE
    + SETTINGS_STYLE_RULE
    + popoverBlurRule() // ← adapter: a menu's frost + fill token
    + TRAJECTORY_STYLE_RULE
    + inputBlurRule() // ← adapter: the same fill tokens scoped to the input slider
    + MOBILE_HEADER_RULE
    // The session header bar's paint: the class is claimed at runtime, the
    // variables by applyHeaderBar (see HEADER_BAR_RULE).
    + HEADER_BAR_RULE
    + PANEL_TOKEN_RULE
    + panel.promotion // ← adapter: panel geometry, whose target element changed
    + panel.blur // ← adapter: ditto
    + adapter.pluginPageRule // ← adapter: the plugin-manager block, absent on old lines
    + PRODUCED_RULE
    + STROKE_RULE
    + headerPopoverRule() // ← adapter: same frost answer, header's own blur var
    + exemptDefaultRule() // ← adapter: the exemptions clear frost through it too
    // (No third-party accommodation lives here. This sheet is the plugin's contract
    // with the HOST; another plugin's pin has to be able to vanish entirely — paint,
    // frost and merged-box geometry alike — when its switch is turned off, so it rides
    // its own sheet: see `applyReaderLanes` in `wallpaper.ts`.)
    + PLACEHOLDER_RULE
}

/** Append the plugin's stylesheet and keep it matched to the host.
 *  Returns a teardown for the plugin's effect scope. */
export function mountStaticStyles(): () => void {
  const el = document.createElement('style')
  el.dataset.plugin = 'dsh-any-background'
  el.textContent = buildStaticStyles()
  document.head.appendChild(el)
  // Re-resolve only when the verdict actually changes; the write is a full sheet
  // swap, so it must not run on unrelated notifications.
  let last = el.textContent
  const unsubscribe = subscribeHostInfo(() => {
    const next = buildStaticStyles()
    if (next !== last) {
      last = next
      el.textContent = next
    }
  })
  return () => {
    unsubscribe()
    el.parentNode?.removeChild(el)
  }
}
