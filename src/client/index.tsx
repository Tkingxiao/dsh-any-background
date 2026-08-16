/**
 * dsh-any-background — browser half entry.
 *
 * Appearance plugin with:
 * 1. PS-style color wheel (hue ring + saturation/lightness square) for
 *    real-time theme color selection with dynamic token generation.
 * 2. Background image editor modal with drag-to-pan and scroll-to-zoom
 *    inside a viewport-proportional preview rectangle.
 * 3. Opacity / blur sliders with zero-lag direct DOM manipulation: the
 *    homepage background opacity (主界面) and the settings panel opacity
 *    (设置界面透明度) are separate sliders.
 *
 * This file wires the plugin lifecycle (theme registration, wallpaper layer,
 * viewport watch, i18n, settings-section injection, boot restore, watchdog).
 * The heavy lifting lives in the sibling modules:
 *   state.ts       in-memory config mirror + getters
 *   rpc.ts         file-backed persistence over the /dsh-any-background channel
 *   wallpaper.ts   wallpaper DOM layer + inline token writes
 *   utils/         color math, token generation, image compression
 *   components/    ColorWheel, BgEditor, LiveSlider, ThemeSection
 *   i18n.ts        zh/en dictionaries
 *   styles.ts      shared inline styles
 */
import { defineStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { Ctx, RpcResultLike, BoundActions, ThemeSectionProps, PartOpacities, PartBlurs } from './types'
import { NS, zh, en } from './i18n'
import { cfg, rHasColor, rColor, rWp, rBgState, setWpUrl, setBgState, adoptConfig, DEFAULT_CONFIG } from './state'
import { RPC_CHANNEL, initRpc, saveConfig, flushSave, loadPersisted, persistWallpaper, persistConfig } from './rpc'
import { applyWp, teardownWp, applySettingsOverrides, SETTINGS_STYLE_RULE, watchParts } from './wallpaper'
import { genTokens, hslToHsv, hsvToHsl, extractWallpaperColor } from './utils/color'
import { ThemeSection } from './components/ThemeSection'
import { SUN_PATHS } from './components/icons'

export const name = 'dsh-any-background'
export const inject = ['slots', 'locale', 'theme', 'connection']

const CUSTOM_ID = 'custom-color'

export function apply(ctx: Ctx): void {
  // Bind the dedicated `/dsh-any-background` RPC caller so the persistence
  // module can reach the node half's file-backed store.
  initRpc((endpoint, payload) =>
    ctx.connection.rpc.call(RPC_CHANNEL, endpoint, payload).then((res: any) => res as RpcResultLike | undefined)
  )

  // 1. Restore custom color and register as a skin. The saved color's
  // lightness decides the scheme — a dark pick gets white text, a light pick
  // black text — so both the theme color and the dark/light text follow the
  // picked color.
  const [initH, initS, initL] = rColor()
  let customDispose: (() => void) | null = null
  // registerCustom takes HSL (the storage/wheel space and genTokens space).
  const registerCustom = (h: number, s: number, l: number) => {
    customDispose?.()
    try {
      const { colorScheme, tokens } = genTokens(h, s, l)
      customDispose = ctx.theme.register({ id: CUSTOM_ID, colorScheme, tokens })
    } catch {
      // A live registration from an earlier apply pass (HMR swap that could
      // not run this fiber's disposer) cannot be torn down here; keep it and
      // activate it below. Without this the duplicate-id throw would abort
      // apply and skip the wallpaper/opacity restore.
      customDispose = null
    }
    // Only activate the custom theme if it is actually registered. This keeps
    // the HMR fallback above safe and avoids a crash when registration fails
    // for any other reason.
    if (ctx.theme.getTheme().themes.some(t => t.id === CUSTOM_ID)) {
      ctx.theme.setTheme(CUSTOM_ID)
    }
  }
  // Restore saved color on boot.
  if (rHasColor()) registerCustom(initH, initS, initL)
  ctx.effect(() => () => { customDispose?.() }, 'dsh-any-background: skin dispose')

  // 2. Gradient CSS (for custom dark themes).
  let styleEl: HTMLStyleElement | undefined
  if (typeof document !== 'undefined') {
    styleEl = document.createElement('style')
    styleEl.dataset.plugin = 'dsh-any-background'
    // This gradient only applies while applyCustomTokens has marked the body
    // with the plugin's own dark-mode value, avoiding accidental matches against
    // the host harness's theme attribute.
    styleEl.textContent = `body[data-ds-dark-theme="dsh-any-background"]::before{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(255,255,255,0.03) 0%,transparent 60%)}${SETTINGS_STYLE_RULE}`
    document.head.appendChild(styleEl)
  }
  ctx.effect(() => () => { styleEl?.parentNode?.removeChild(styleEl) }, 'dsh-any-background: gradient')

  // 3. State store.
  let rev = 0
  let colorRev = 0
  const store = defineStore({
    init: () => ({ url: null as string | null, rev: -1, colorRev: -1, color: null as [number, number, number] | null }),
    actions: {
      syncBg: (d: any, url: string | null, r: number) => { if (r <= d.rev) return; d.url = url; d.rev = r },
      syncColor: (d: any, hsv: [number, number, number], r: number) => { if (r <= d.colorRev) return; d.color = hsv; d.colorRev = r },
    },
  })
  let bound: BoundActions | null = null
  const syncBg = () => { rev++; bound?.syncBg(rWp(), rev) }

  // 4. Wallpaper.
  applyWp(); syncBg()
  // The AppFrame mounts after this apply; watch for it so persisted per-part
  // blurs land as soon as the shell renders.
  watchParts()
  // Load the file-backed theme from the node half and re-apply once it lands
  // (the node store may be absent or unreachable at this instant; defaults are
  // already applied above, and the deferred restore below re-asserts too).
  void loadPersisted().then(() => {
    // The file-backed store may land after the section mounted with defaults:
    // re-register the skin with the restored color and push it to the wheel
    // through the store so UI and theme never diverge.
    if (rHasColor()) {
      const [h, s, l] = rColor()
      registerCustom(h, s, l)
    }
    applyWp(); syncBg()
    if (rHasColor()) { colorRev++; bound?.syncColor(hslToHsv(...rColor()), colorRev) }
  })
  ctx.effect(() => () => { teardownWp() }, 'dsh-any-background: wp cleanup')
  ctx.effect(() => ctx.on('theme/change', () => {
    // The theme service persists only built-in preferences; the custom theme's
    // preference lives in memory, so a host-scope adoption can silently reset
    // it. While a color is saved, re-assert the custom theme so it stays
    // active. Guard on registry presence — registerCustom disposes the old
    // skin before re-registering, and during that transient the registry lacks
    // CUSTOM_ID, so asserting there would throw.
    if (rHasColor()) {
      const snapshot = ctx.theme.getTheme()
      if (snapshot.preference !== CUSTOM_ID && snapshot.themes.some(t => t.id === CUSTOM_ID)) {
        ctx.theme.setTheme(CUSTOM_ID)
      }
    }
    applyWp()
  }), 'dsh-any-background: theme change')
  // The wallpaper's inline size/position are absolute pixels computed for the
  // viewport at apply time, so a stale viewport leaves them misplaced.
  // Watch the viewport itself: a fixed inset:0 sentinel's box always equals
  // the viewport, so a ResizeObserver on it fires for ANY viewport change
  // (window resize, moving between monitors, panel splitters, zoom) where
  // window.resize can be missed; a resolution media query catches DPI-only
  // moves between differently scaled screens. All re-applies are coalesced to
  // one per animation frame. Re-running applyWp recomputes the contain-fit
  // scale and the fractional offsets for the new viewport (the editor's model).
  let frame = 0
  const applySoon = (): void => {
    if (frame !== 0) return
    frame = requestAnimationFrame(() => { frame = 0; applyWp() })
  }
  const sentinel = document.createElement('div')
  sentinel.style.cssText = 'position:fixed;inset:0;pointer-events:none;visibility:hidden'
  document.body.append(sentinel)
  const viewportObserver = new ResizeObserver(applySoon)
  viewportObserver.observe(sentinel)
  const dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
  dprQuery.addEventListener('change', applySoon)
  ctx.effect(() => () => {
    viewportObserver.disconnect()
    dprQuery.removeEventListener('change', applySoon)
    sentinel.remove()
  }, 'dsh-any-background: viewport watch')

  // 5. Locale.
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-any-background: i18n')

  // 6. Section injection.
  const sectionInject = (actions: BoundActions): Omit<ThemeSectionProps, 'useStore'> => {
    bound = actions; syncBg()
    const [wh, ws, wl] = rColor()
    const [dh, ds, dv] = hslToHsv(wh, ws, wl)
    return {
      t: ctx.locale.bind(NS),
      hue: dh, sat: ds, lit: dv,
      setColor: (nh: number, ns: number, nl: number) => {
        const [sh, ss, sl] = hsvToHsl(nh, ns, nl)
        cfg.color = [sh, ss, sl]
        registerCustom(sh, ss, sl)
        applyWp()
        saveConfig()
        // Keep the wheel's canonical color in the store so programmatic
        // changes (wallpaper extraction) and remounts share one source.
        colorRev++
        bound?.syncColor([nh, ns, nl], colorRev)
      },
      setWp: (u: string | null) => {
        setWpUrl(u)
        setBgState({ ...DEFAULT_CONFIG.bgState })
        applyWp(); syncBg()
        persistWallpaper(u)
      },
      setOps: (ops: PartOpacities) => { cfg.opacities = ops; applyWp(); syncBg(); saveConfig() },
      setBlurs: (blurs: PartBlurs) => { cfg.blurs = blurs; applyWp(); syncBg(); saveConfig() },
      setWop: (v: number) => { cfg.wallpaperOpacity = v; applyWp(); syncBg(); saveConfig() },
      setBl: (v: number) => { cfg.blur = v; applyWp(); syncBg(); saveConfig() },
      setSop: (v: number) => { cfg.settingsOpacity = v; applySettingsOverrides(v); saveConfig() },
      // One-click: derive a theme color from the current wallpaper. Purely
      // client-side — no RPC traffic; the sample is a 64×64 canvas.
      extractColor: async (): Promise<boolean> => {
        const url = rWp()
        if (!url) return false
        const hsl = await extractWallpaperColor(url, rBgState())
        if (!hsl) return false
        cfg.color = hsl
        registerCustom(hsl[0], hsl[1], hsl[2])
        applyWp()
        saveConfig()
        const hsv = hslToHsv(hsl[0], hsl[1], hsl[2])
        colorRev++
        bound?.syncColor(hsv, colorRev)
        return true
      },
      // Download the whole theme as dsh-any-theme.json: the config plus the
      // wallpaper as its original data URL, so the file is self-contained.
      exportTheme: () => {
        const payload = {
          version: 1,
          exportedAt: new Date().toISOString(),
          config: cfg,
          wallpaper: rWp(),
        }
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'dsh-any-theme.json'
        a.click()
        URL.revokeObjectURL(url)
      },
      // Import a theme JSON: apply the config to memory, then persist through
      // the same paths as manual edits — config → theme-config.json, wallpaper
      // base64 → wallpaper.jpg (decoded on the node half). The client keeps the
      // data URL from the file, so nothing is re-encoded on every load.
      importTheme: async (file: File): Promise<boolean> => {
        try {
          const data: unknown = JSON.parse(await file.text())
          if (!data || typeof data !== 'object') return false
          const d = data as { config?: unknown; wallpaper?: unknown }
          if (typeof d.config !== 'object' || d.config === null) return false
          adoptConfig(d.config)
          const wallpaper = typeof d.wallpaper === 'string' && /^data:image\//.test(d.wallpaper) ? d.wallpaper : null
          setWpUrl(wallpaper)
          persistConfig()
          persistWallpaper(wallpaper)
          if (rHasColor()) {
            const [h, s, l] = rColor()
            registerCustom(h, s, l)
          }
          applyWp()
          syncBg()
          if (rHasColor()) {
            colorRev++
            bound?.syncColor(hslToHsv(...rColor()), colorRev)
          }
          return true
        } catch {
          return false
        }
      },
    }
  }
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: 'dsh-any-background', order: 35,
    label: () => ctx.locale.bind(NS)('nav'),
    locale: NS, store, inject: sectionInject,
  }, ThemeSection as any))

  // 6.5. Settings-nav icon: the harness derives the nav glyph from the section
  // id (unknown ids fall back to the settings gear) with no plugin hook, so
  // patch the mounted nav cell in place — find the cell whose label matches
  // this section's nav text and swap its svg for the sun glyph.
  const navLabel = (): string => ctx.locale.bind(NS)('nav')
  const applyNavIcon = (): void => {
    const panel = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"][aria-labelledby]')
    const nav = panel?.querySelector('nav')
    if (!nav) return
    const target = navLabel()
    for (const cell of Array.from(nav.querySelectorAll('button'))) {
      const label = cell.querySelector('span')
      if (label && label.textContent?.trim() === target) {
        const svg = cell.querySelector('svg')
        if (svg && svg.dataset.dshAnyIcon !== '1') {
          const sun = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
          sun.setAttribute('width', '16')
          sun.setAttribute('height', '16')
          sun.setAttribute('viewBox', '0 0 16 16')
          sun.setAttribute('fill', 'none')
          sun.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
          sun.dataset.dshAnyIcon = '1'
          sun.innerHTML = SUN_PATHS
          svg.replaceWith(sun)
        }
        return
      }
    }
  }
  let navIconObserver: MutationObserver | null = null
  const watchNavIcon = (): void => {
    if (navIconObserver !== null || typeof MutationObserver === 'undefined') return
    navIconObserver = new MutationObserver(records => {
      // React only when the settings panel (or its nav) is (re)created, so
      // chat-content mutations don't trigger a scan.
      const relevant = records.some(r => {
        for (const n of r.addedNodes) {
          if (n.nodeType !== 1) continue
          const el = n as Element
          if (el.matches?.('[role="dialog"][aria-modal="true"][aria-labelledby]') || el.querySelector?.('[role="dialog"][aria-modal="true"][aria-labelledby]')) return true
        }
        return false
      })
      if (relevant) applyNavIcon()
    })
    navIconObserver.observe(document.body, { childList: true, subtree: true })
    applyNavIcon()
  }
  watchNavIcon()
  ctx.effect(() => () => { navIconObserver?.disconnect(); navIconObserver = null }, 'dsh-any-background: nav icon watch')

  // 7. Deferred boot restore: the theme service and the host settings scope
  // settle asynchronously after this apply, so the synchronous restore can be
  // observed mid-flight — a late host adoption resets the preference, or the
  // presenter re-applies over our overrides. Re-running the saved-color and
  // wallpaper restore a few ticks later guarantees the saved records land.
  const restoreSaved = (): void => {
    if (rHasColor()) {
      const [h, s, l] = rColor()
      registerCustom(h, s, l)
    }
    applyWp()
  }
  const restoreTimers = [300, 1500].map(delay => window.setTimeout(restoreSaved, delay))
  ctx.effect(() => () => { restoreTimers.forEach(id => window.clearTimeout(id)) }, 'dsh-any-background: boot restore')

  // 8. Theme watchdog: the theme service keeps only built-in preferences in
  // memory, so ANY host-scope adoption can silently drop the custom theme —
  // reverting the label colors (white/black) and the inner surfaces to the
  // system palette. While a color is saved, re-register and re-assert the
  // custom theme on a slow interval so the theme state always matches the
  // saved color and the active scheme, independent of which event resets it.
  const watchdogId = window.setInterval(() => {
    if (!rHasColor()) return
    const snapshot = ctx.theme.getTheme()
    let changed = false
    if (!snapshot.themes.some(t => t.id === CUSTOM_ID)) {
      const [h, s, l] = rColor()
      registerCustom(h, s, l)
      changed = true
    } else if (snapshot.preference !== CUSTOM_ID) {
      ctx.theme.setTheme(CUSTOM_ID)
      changed = true
    }
    if (changed) applyWp()
  }, 1000)
  ctx.effect(() => () => { window.clearInterval(watchdogId) }, 'dsh-any-background: theme watchdog')

  // 9. Flush any pending debounced config write when the page is hidden or
  // closed, so the last slider position is never lost to the debounce window.
  const onPageHide = (): void => flushSave()
  window.addEventListener('pagehide', onPageHide)
  ctx.effect(() => () => window.removeEventListener('pagehide', onPageHide), 'dsh-any-background: pagehide flush')
}
