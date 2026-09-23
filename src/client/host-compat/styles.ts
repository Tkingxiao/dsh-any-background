/**
 * Assembly of the plugin's one static stylesheet.
 *
 * Until now the sheet was a single template literal in the client entry with
 * thirteen constants bolted together in whatever order they were added. That
 * order is load-bearing and was documented in three separate comment blocks in
 * `wallpaper.ts` — so it is encoded here instead, in one list, with the reason
 * next to each entry.
 *
 * What the release can change lives in one contiguous slot: the panel group
 * (which element carries the frost) and the plugin-manager page (whether this
 * release ships that page at all). Everything outside the slot is host-agnostic by
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
  EXEMPT_DEFAULT_RULE,
  FRAME_CLEAR_RULE,
  HEADER_POPOVER_RULE,
  INPUT_BLUR_RULE,
  MOBILE_HEADER_RULE,
  PANEL_TOKEN_RULE,
  PLACEHOLDER_RULE,
  POPOVER_BLUR_RULE,
  PRODUCED_RULE,
  SETTINGS_STYLE_RULE,
  STROKE_RULE,
  TRAJECTORY_STYLE_RULE,
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
 *   · HEADER_POPOVER_RULE after POPOVER_BLUR_RULE — a surface moving from the card
 *     group to the header group must win, not merely be listed twice.
 *   · PRODUCED_RULE / STROKE_RULE after the blur groups — they shield their
 *     surfaces from an inherited slider.
 *   · EXEMPT_DEFAULT_RULE last of the token groups — an exemption has to land
 *     after whatever it exempts.
 *   · PLACEHOLDER_RULE genuinely last — `::placeholder` resets must survive every
 *     group above.
 */
export function buildStaticStyles(): string {
  const adapter = rHostAdapter()
  const panel = adapter.panelFragments()
  return DARK_GRADIENT
    // First, not because anything competes with it, but because every surface
    // group below assumes the frame behind them is clear.
    + FRAME_CLEAR_RULE
    + SETTINGS_STYLE_RULE
    + POPOVER_BLUR_RULE
    + TRAJECTORY_STYLE_RULE
    + INPUT_BLUR_RULE
    + MOBILE_HEADER_RULE
    + PANEL_TOKEN_RULE
    // ── version slot 1: panel opacity + blur, whose target element changed ─────
    + panel.promotion
    + panel.blur
    // ── version slot 2: the plugin-manager card block, absent on older lines ───
    + adapter.pluginPageRule
    // ── everything below is host-agnostic ────────────────────────────────────
    + PRODUCED_RULE
    + STROKE_RULE
    + HEADER_POPOVER_RULE
    + EXEMPT_DEFAULT_RULE
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
