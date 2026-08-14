/**
 * Deep Midnight — a reference appearance plugin for the DeepSeek Harness web UI.
 *
 * Registers a custom dark theme with a curated palette inspired by the reference
 * `pluginexample/any-background/index.js` concepts: deep backgrounds, adapted
 * text colors, and a layered gradient that echoes the reference's overlay/blur
 * compositing model.
 *
 * The plugin demonstrates three harness theme APIs:
 * 1. `ctx.theme.register()` — adding a selectable theme to the registry.
 * 2. `ctx.theme.overrideTokens()` — stacking partial token layers.
 * 3. `ctx.effect()` — lifecycle-managed CSS injection for the gradient overlay.
 */
import type { Context } from '@deepseek-ai/cordis'

export const name = 'dsh-theme-plugin'
export const inject = ['theme']

/**
 * Token palette for the Deep Midnight theme.
 * Each value is a CSS color applied over the dark base palette.
 * Inspired by the reference code's luminance-adapted color model:
 * deep navy backgrounds with cool-toned accents and high-contrast text.
 */
const MIDNIGHT_TOKENS: Record<string, string> = {
  // ── Backgrounds (reference: bg-layer compositing) ──────────────────────
  '--dsw-alias-bg-base':            '#060c18',
  '--dsw-alias-bg-layer-1':         '#0b1529',
  '--dsw-alias-bg-layer-2':         '#101d38',
  '--dsw-alias-bg-overlay':         '#162040',

  // ── Borders (reference: overlay opacity model) ─────────────────────────
  '--dsw-alias-border-l1':          '#1a2d52',
  '--dsw-alias-border-l2':          '#253d6a',

  // ── Brand accent ───────────────────────────────────────────────────────
  '--dsw-alias-brand-primary':      '#4f8cff',

  // ── Text (reference: luminance-based text color adaptation) ────────────
  '--dsw-alias-label-primary':      '#e4eaf6',
  '--dsw-alias-label-secondary':    '#8899bb',

  // ── State colors ───────────────────────────────────────────────────────
  '--dsw-alias-state-error-primary':   '#ff5c72',
  '--dsw-alias-state-success-primary': '#3ddc84',
  '--dsw-alias-state-warn-primary':    '#ffb347',

  // ── Sidebar (reference: bg-layer distinction) ──────────────────────────
  '--dsw-specific-sidebar-fill':    '#081020',
}

/**
 * CSS for the gradient background overlay.
 * Applied only when the midnight theme is active via `body[data-ds-dark-theme]`.
 * The gradient composes two layers (reference: overlay opacity + blur model):
 * a deep radial glow and a subtle top-down gradient for depth.
 */
const MIDNIGHT_GRADIENT_CSS = `
/* Deep Midnight gradient background — active only on the midnight theme */
body[data-ds-dark-theme="midnight"]::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, rgba(79, 140, 255, 0.08) 0%, transparent 60%),
    linear-gradient(180deg, #060c18 0%, #0b1529 40%, #0f1b35 100%);
  opacity: 0.95;
}
`

/**
 * Plugin entry: register the Deep Midnight theme and inject its gradient CSS.
 * @param ctx - client Cordis context with the theme service available.
 */
export function apply(ctx: Context): void {
  const theme = ctx.theme

  // 1. Register the theme so it appears in the Appearance settings picker.
  const disposeTheme = theme.register({
    id: 'midnight',
    colorScheme: 'dark',
    tokens: MIDNIGHT_TOKENS,
  })

  // 2. Inject the gradient background CSS as a <style> tag.
  //    The tag is removed when the plugin unloads (ctx.effect disposer).
  let styleEl: HTMLStyleElement | undefined
  if (typeof document !== 'undefined') {
    styleEl = document.createElement('style')
    styleEl.dataset.plugin = 'dsh-theme-plugin'
    styleEl.textContent = MIDNIGHT_GRADIENT_CSS
    document.head.appendChild(styleEl)
  }

  // 3. Lifecycle cleanup: dispose the theme registration and remove the style tag.
  ctx.effect(() => {
    return () => {
      disposeTheme()
      if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl)
      }
    }
  }, 'dsh-theme-plugin: midnight theme cleanup')
}
