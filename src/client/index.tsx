/**
 * dsh-any-background — browser half entry.
 *
 * Wires the plugin lifecycle: theme registration, wallpaper layer, viewport
 * watch, i18n, settings-section injection, boot restore, watchdog. The heavy
 * lifting lives in the sibling modules (state/rpc/wallpaper/utils/components).
 */
import { defineStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { Ctx, RpcResultLike, BoundActions, ThemeSectionProps, PartOpacities, PartBlurs, BackgroundType, GeneratedBgParams } from './types'
import { NS, zh, en } from './i18n'
import { cfg, rHasColor, rColor, rWp, rWpImage, rWpVideo, rBgState, rVideoBgState, setWpUrl, setWpImageUrl, setWpVideoUrl, setWpVideoSnapshot, setBgState, adoptConfig, DEFAULT_CONFIG, setBgDark } from './state'
import { RPC_CHANNEL, VIDEO_SERVE_URL, initRpc, saveConfig, flushSave, loadPersisted, persistWallpaper, persistVideo, persistConfig, uploadVideo } from './rpc'
import { applyWp, teardownWp, applySettingsOverrides, SETTINGS_STYLE_RULE, TRAJECTORY_STYLE_RULE, INPUT_BLUR_RULE, watchParts, regenerateGeneratedBg, setBackgroundType, updateGeneratedBg, applyThemeColor, onGeneratedSnapshot, watchWallpaperDragQuality } from './wallpaper'
import { genTokens, hslToHsv, hsvToHsl, extractWallpaperColor } from './utils/color'
import { captureVideoSnapshot } from './utils/video'
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
  // lightness decides the scheme (dark pick → white text, light → black).
  const [initH, initS, initL] = rColor()
  let customDispose: (() => void) | null = null
  // registerCustom takes HSL (the storage/wheel space and genTokens space).
  const registerCustom = (h: number, s: number, l: number) => {
    customDispose?.()
    try {
      const { colorScheme, tokens } = genTokens(h, s, l)
      customDispose = ctx.theme.register({ id: CUSTOM_ID, colorScheme, tokens })
    } catch {
      // A live registration from an earlier HMR apply pass cannot be torn down
      // here; keep it and activate it below. Without this the duplicate-id
      // throw would abort apply and skip the wallpaper/opacity restore.
      customDispose = null
    }
    // Only activate the custom theme if it is actually registered.
    if (ctx.theme.getTheme().themes.some(t => t.id === CUSTOM_ID)) {
      ctx.theme.setTheme(CUSTOM_ID)
    }
  }
  // Restore saved color on boot.
  if (rHasColor()) registerCustom(initH, initS, initL)
  ctx.effect(() => () => {
    customDispose?.()
    if (colorTimerRef.current !== null) window.clearTimeout(colorTimerRef.current)
  }, 'dsh-any-background: skin dispose')

  // 2. Gradient CSS (for custom dark themes).
  const styleEl = document.createElement('style')
  styleEl.dataset.plugin = 'dsh-any-background'
  // Only applies while applyCustomTokens marks the body with the plugin's
  // own dark-mode value, avoiding matches against the host's theme attribute.
  styleEl.textContent = `body[data-ds-dark-theme="dsh-any-background"]::before{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(255,255,255,0.03) 0%,transparent 60%)}${SETTINGS_STYLE_RULE}${TRAJECTORY_STYLE_RULE}${INPUT_BLUR_RULE}`
  document.head.appendChild(styleEl)
  ctx.effect(() => () => { styleEl?.parentNode?.removeChild(styleEl) }, 'dsh-any-background: gradient')

  // Wallpaper downscales to a low-res copy during slider drags, restored on release.
  const disposeDragQuality = watchWallpaperDragQuality()
  ctx.effect(() => () => disposeDragQuality(), 'dsh-any-background: drag quality')

  // 3. State store.
  let rev = 0
  let colorRev = 0
  let bgRev = 0
  const colorTimerRef: { current: number | null } = { current: null }
  const store = defineStore({
    init: () => ({
      url: null as string | null,
      rev: -1,
      colorRev: -1,
      color: null as [number, number, number] | null,
      backgroundType: cfg.backgroundType,
      generatedBg: cfg.generatedBg,
      bgRev: -1,
      regenerateOnReload: cfg.regenerateOnReload,
    }),
    actions: {
      syncBg: (d: any, url: string | null, r: number, bgType?: BackgroundType, genBg?: GeneratedBgParams | null, bgr?: number, reload?: boolean) => {
        if (r > d.rev) { d.url = url; d.rev = r }
        if (bgr !== undefined && bgr > d.bgRev) { d.backgroundType = bgType!; d.generatedBg = genBg ?? null; d.bgRev = bgr }
        if (reload !== undefined) { d.regenerateOnReload = reload }
      },
      syncColor: (d: any, hsv: [number, number, number], r: number) => { if (r > d.colorRev) { d.color = hsv; d.colorRev = r } },
    },
  })
  let bound: BoundActions | null = null
  const syncBg = () => {
    rev++; bgRev++
    bound?.syncBg(rWp(), rev, cfg.backgroundType, cfg.generatedBg, bgRev, cfg.regenerateOnReload)
  }
  // When a generated background finishes its first frame, its snapshot becomes
  // the display/preview URL — re-sync the store so the preview follows.
  onGeneratedSnapshot(syncBg)

  // 4. Wallpaper.
  applyWp(); syncBg()
  // The AppFrame mounts after this apply; watch for it so persisted per-part
  // blurs land as soon as the shell renders.
  watchParts()
  // Load the file-backed theme and re-apply once it lands (defaults are already
  // applied above; the deferred restore below re-asserts too).
  void loadPersisted().then(() => {
    // Re-register the skin with the restored color so UI and theme never diverge.
    if (rHasColor()) {
      const [h, s, l] = rColor()
      registerCustom(h, s, l)
    }
    // Regenerate on reload if enabled, else reconstruct from saved params.
    if (cfg.backgroundType === 'video') {
      const v = rWpVideo()
      if (v) {
        // The frame snapshot is not persisted: re-capture it for previews.
        void captureVideoSnapshot(v).then(snap => {
          if (rWpVideo() !== v) return
          setWpVideoSnapshot(snap)
          applyThemeColor()
          syncBg()
        })
        applyWp()
      } else {
        // Stored video missing: fall back to the retained image slot.
        cfg.backgroundType = 'image'
        setWpUrl(rWpImage())
        applyThemeColor()
      }
    } else if (cfg.backgroundType !== 'image') {
      if (cfg.regenerateOnReload) {
        regenerateGeneratedBg()
      } else if (cfg.generatedBg) {
        updateGeneratedBg(cfg.generatedBg)
      }
      // Persist the normalized config so the seed and flag land on disk.
      persistConfig()
    } else {
      // Saved pick wins; otherwise extract from the uploaded wallpaper.
      applyThemeColor()
    }
    syncBg()
    if (rHasColor()) { colorRev++; bound?.syncColor(hslToHsv(...rColor()), colorRev) }
  })
  ctx.effect(() => () => { teardownWp() }, 'dsh-any-background: wp cleanup')
  ctx.effect(() => ctx.on('theme/change', () => {
    // The custom theme's preference lives in memory, so a host adoption can
    // silently reset it; re-assert it while a color is saved. Guard on registry
    // presence — registerCustom disposes the old skin first, so during that
    // transient the registry lacks CUSTOM_ID.
    if (rHasColor()) {
      const snapshot = ctx.theme.getTheme()
      if (snapshot.preference !== CUSTOM_ID && snapshot.themes.some(t => t.id === CUSTOM_ID)) {
        ctx.theme.setTheme(CUSTOM_ID)
      }
    }
    applyWp()
  }), 'dsh-any-background: theme change')
  // Wallpaper placement is computed in absolute viewport pixels, so watch the
  // viewport itself: a fixed inset:0 sentinel's box always equals the viewport,
  // so a ResizeObserver on it catches any viewport change (window resize,
  // monitor moves, panel splitters, zoom); a resolution media query catches
  // DPI-only moves. Re-applies are coalesced to one per animation frame.
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
    // Play a picked/imported video instantly from a local object URL while its
    // raw bytes stream to disk in the background — no upload + first-buffer
    // wait after import. The serve URL takes over on the next reload.
    const playVideoFromBlob = (blob: Blob, mime: string | null): void => {
      const localUrl = URL.createObjectURL(blob)
      cfg.backgroundType = 'video'
      setWpUrl(null)
      cfg.videoBgState = { ...DEFAULT_CONFIG.bgState }
      setWpVideoUrl(localUrl, mime ?? blob.type ?? 'video/mp4')
      applyWp()
      syncBg()
      const applied = rWpVideo()
      void captureVideoSnapshot(localUrl).then(snap => {
        if (rWpVideo() !== applied) return
        setWpVideoSnapshot(snap)
        applyThemeColor()
        syncBg()
      })
      void uploadVideo(blob, mime ?? blob.type ?? 'video/mp4').then(ok => {
        if (ok) persistConfig()
      })
    }
    const [wh, ws, wl] = rColor()
    const [dh, ds, dv] = hslToHsv(wh, ws, wl)
    return {
      t: ctx.locale.bind(NS),
      hue: dh, sat: ds, lit: dv,
      setColor: (nh: number, ns: number, nl: number) => {
        const [sh, ss, sl] = hsvToHsl(nh, ns, nl)
        cfg.color = [sh, ss, sl]
        // Preview UI stays synchronous for instant feedback; the expensive work
        // (theme registration + token writes + persist) is debounced by 80ms.
        if (colorTimerRef.current !== null) window.clearTimeout(colorTimerRef.current)
        colorTimerRef.current = window.setTimeout(() => {
          colorTimerRef.current = null
          registerCustom(sh, ss, sl)
          applyWp()
          saveConfig()
        }, 80)
        // Keep the canonical color in the store so programmatic changes and
        // remounts share one source.
        colorRev++
        bound?.syncColor([nh, ns, nl], colorRev)
      },
      setWp: (u: string | null) => {
        cfg.backgroundType = 'image'
        // Retain the upload in its own slot so type switches never lose it.
        // The generated-background brightness verdict stops applying here.
        setBgDark(null)
        setWpImageUrl(u)
        setWpUrl(u)
        setBgState({ ...DEFAULT_CONFIG.bgState })
        persistWallpaper(u)
        if (u === null) {
          // Removing the background clears the stored video as well.
          setWpVideoUrl(null, null)
          void persistVideo(null)
        }
        applyThemeColor()
        syncBg()
      },
      setVideo: async (u: Blob | string | null, mime: string | null) => {
        setBgDark(null)
        if (u === null) {
          // Removing: clear the stored video and return to the image slot.
          setWpVideoUrl(null, null)
          cfg.backgroundType = 'image'
          setWpUrl(rWpImage())
          void persistVideo(null)
          applyThemeColor()
          syncBg()
          saveConfig()
          return
        }
        if (typeof u !== 'string') {
          // A picked file plays instantly from a local object URL while its raw
          // bytes stream to disk in the background — no upload + buffer wait.
          playVideoFromBlob(u, mime)
          return
        }
        // Legacy data-URL string path: persist, then play from the serve URL.
        const ok = await persistVideo(u)
        const live = ok ? VIDEO_SERVE_URL : u
        cfg.backgroundType = 'video'
        setWpUrl(null)
        cfg.videoBgState = { ...DEFAULT_CONFIG.bgState }
        setWpVideoUrl(live, mime ?? null)
        applyWp()
        saveConfig()
        syncBg()
        const applied = rWpVideo()
        void captureVideoSnapshot(live).then(snap => {
          if (rWpVideo() !== applied) return
          setWpVideoSnapshot(snap)
          applyThemeColor()
          syncBg()
        })
      },
      setBgType: (type: BackgroundType) => {
        setBackgroundType(type)
        // Keep the uploaded wallpaper on disk so it can be restored when the
        // user returns to the image type; it is only removed via setWp(null).
        saveConfig()
        syncBg()
      },
      setGeneratedBg: (params) => {
        updateGeneratedBg(params)
        saveConfig()
        syncBg()
      },
      regenerateBg: () => {
        regenerateGeneratedBg()
        // Immediate (non-debounced) write so the new seed survives a refresh
        // fired right after the click.
        persistConfig()
        syncBg()
      },
      setRegenerateOnReload: (v: boolean) => {
        cfg.regenerateOnReload = v
        // Immediate (non-debounced) write: a debounced save can be cut off by
        // page unload, which would revert the toggle on the next refresh.
        persistConfig()
        syncBg()
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
        // Video mode extracts from the frame snapshot through the video's
        // placement state (rWp already returns the snapshot there).
        const st = cfg.backgroundType === 'video' ? rVideoBgState() : rBgState()
        const hsl = await extractWallpaperColor(url, st)
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
      // wallpaper data URL only when it is an uploaded image, and the video
      // bytes copied in as a data URL when a video background is active.
      // Generated backgrounds are reconstructed from the saved params on
      // import, so their exports stay small.
      exportTheme: async () => {
        let videoPayload: string | null = null
        if (cfg.backgroundType === 'video') {
          const vurl = rWpVideo()
          if (vurl) {
            try {
              const blob = await fetch(vurl).then(r => r.blob())
              videoPayload = await new Promise<string>((resolve, reject) => {
                const fr = new FileReader()
                fr.onload = () => resolve(fr.result as string)
                fr.onerror = () => reject(fr.error)
                fr.readAsDataURL(blob)
              })
              // The serve route may report a generic Content-Type; pin the
              // recorded MIME so the import detector sees data:video/….
              if (videoPayload && !/^data:video\//.test(videoPayload)) {
                videoPayload = videoPayload.replace(/^data:[^;,]*/, `data:${cfg.videoMime ?? 'video/mp4'}`)
              }
            } catch {
              videoPayload = null
            }
          }
        }
        const payload = {
          version: 2,
          exportedAt: new Date().toISOString(),
          config: cfg,
          wallpaper: cfg.backgroundType === 'image' ? rWp() : null,
          video: videoPayload,
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
      // base64 → wallpaper.jpg (decoded on the node half). For generated
      // backgrounds the image is reconstructed from params instead of persisted.
      importTheme: async (file: File): Promise<boolean> => {
        try {
          const data: unknown = JSON.parse(await file.text())
          if (!data || typeof data !== 'object') return false
          const d = data as { version?: number; config?: unknown; wallpaper?: unknown; video?: unknown }
          if (typeof d.config !== 'object' || d.config === null) return false
          adoptConfig(d.config)
          if (cfg.backgroundType === 'video') {
            const video = typeof d.video === 'string' && /^data:video\//.test(d.video) ? d.video : null
            if (video !== null) {
              // Decode the embedded data URL to a blob and play it instantly
              // from a local object URL while the bytes stream to disk in the
              // background (the data-URL RPC path stays as the small fallback).
              let blob: Blob | null = null
              try { blob = await fetch(video).then(r => r.blob()) } catch { blob = null }
              if (blob !== null) {
                playVideoFromBlob(blob, cfg.videoMime)
              } else {
                const ok = await persistVideo(video)
                const live = ok ? VIDEO_SERVE_URL : video
                setWpVideoUrl(live, cfg.videoMime)
                applyWp()
                const applied = rWpVideo()
                void captureVideoSnapshot(live).then(snap => {
                  if (rWpVideo() !== applied) return
                  setWpVideoSnapshot(snap)
                  applyThemeColor()
                  syncBg()
                })
              }
            } else {
              // Export lacked the video payload: fall back to no background.
              setWpVideoUrl(null, null)
              void persistVideo(null)
              cfg.backgroundType = 'image'
              setWpImageUrl(null)
              setWpUrl(null)
              persistWallpaper(null)
              applyThemeColor()
            }
          } else if (cfg.backgroundType === 'image') {
            const wallpaper = typeof d.wallpaper === 'string' && /^data:image\//.test(d.wallpaper) ? d.wallpaper : null
            setWpImageUrl(wallpaper)
            setWpUrl(wallpaper)
            persistWallpaper(wallpaper)
            applyThemeColor()
          } else {
            setWpImageUrl(null)
            setWpUrl(null)
            persistWallpaper(null)
            // Reconstruct the imported dynamic background from its saved params.
            // Import means "restore what I exported", so the seed/params must be
            // preserved exactly; only regenerate a fresh look when the user has
            // that preference enabled — mirroring the boot-restore branch.
            if (cfg.regenerateOnReload) regenerateGeneratedBg()
            else if (cfg.generatedBg) updateGeneratedBg(cfg.generatedBg)
          }
          persistConfig()
          if (rHasColor()) {
            const [h, s, l] = rColor()
            registerCustom(h, s, l)
          }
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
      const snapshot = ctx.theme.getTheme()
      if (!snapshot.themes.some(t => t.id === CUSTOM_ID)) {
        // Theme missing (host adoption dropped it): re-register + activate.
        const [h, s, l] = rColor()
        registerCustom(h, s, l)
      } else if (snapshot.preference !== CUSTOM_ID) {
        // Theme present but inactive: just re-assert the preference. Calling
        // registerCustom here would dispose + re-create the skin, flashing the
        // interface back to the system theme for a frame on every boot.
        ctx.theme.setTheme(CUSTOM_ID)
      }
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
