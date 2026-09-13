/**
 * dsh-any-background — browser half entry.
 *
 * Wires the plugin lifecycle: theme registration, wallpaper layer, viewport
 * watch, i18n, settings-section injection, boot restore, watchdog. The heavy
 * lifting lives in the sibling modules (state/rpc/wallpaper/utils/components).
 */
import { defineStore } from './runtime'
import type { Ctx, RpcResultLike, BoundActions, ThemeSectionProps, PartOpacities, PartBlurs, BackgroundType, GeneratedBgParams, ProfileAppearance, ProfileEntry, RotationItem, ScheduleConfig, SchemeOverride } from './types'
import { NS, zh, en } from './i18n'
import { cfg, rHasColor, rColor, rWp, rWpImage, rWpVideo, rBgState, rVideoBgState, setWpUrl, setWpImageUrl, setWpVideoUrl, setWpVideoSnapshot, setBgState, adoptConfig, DEFAULT_CONFIG, setBgDark, rBgDark, rProfiles, rRotation, rSchedule, rScheme, rColorScheme, rSchemeOverride, currentAppearance, applyAppearance } from './state'
import { RPC_CHANNEL, VIDEO_SERVE_URL, initRpc, saveConfig, flushSave, loadPersisted, persistWallpaper, persistVideo, persistConfig, uploadVideo, rotationAdd, rotationRemove, rotationActivate } from './rpc'
import { applyWp, teardownWp, applySettingsOverrides, SETTINGS_STYLE_RULE, TRAJECTORY_STYLE_RULE, INPUT_BLUR_RULE, PLACEHOLDER_RULE, watchParts, watchThemeResets, regenerateGeneratedBg, setBackgroundType, updateGeneratedBg, applyThemeColor, onGeneratedSnapshot, watchWallpaperDragQuality, clearThemeTokens, onVerdictApplied, onColorAdopted, LABEL_TOKENS } from './wallpaper'
import { genTokens, hslToHsv, hsvToHsl, extractWallpaperColor } from './utils/color'
import { captureVideoSnapshot } from './utils/video'
import { readImgAsync, makeThumb } from './utils/image'
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

  // 1. Restore custom color and register as a skin. The skin MUST go through
  // the host theme service — the host presenter paints fonts from the
  // registered theme, so a stylesheet-only override loses to it.
  //   · picked color  → genTokens in the effective scheme;
  //   · forced scheme → neutral palette in the forced direction;
  //   · auto, no color→ adopt the host's own palette in the background
  //                     brightness verdict's direction, fonts flipped to match
  //                     the wallpaper (perceptual luma, threshold 0.5).
  const [initH, initS, initL] = rColor()
  let customDispose: (() => void) | null = null
  // registerCustom takes HSL (the storage/wheel space and genTokens space).
  const registerCustom = (h?: number, s?: number, l?: number): boolean => {
    customDispose?.()
    try {
      let colorScheme: 'light' | 'dark'
      let tokens: Record<string, string>
      if (rHasColor()) {
        ;({ colorScheme, tokens } = genTokens(h ?? rColor()[0], s ?? rColor()[1], l ?? rColor()[2], rColorScheme()))
      } else if (rSchemeOverride() !== 'auto') {
        const dark = rScheme() === 'dark'
        ;({ colorScheme, tokens } = genTokens(220, 0.04, dark ? 0.14 : 0.92, dark ? 'dark' : 'light'))
      } else {
        const verdict = rBgDark()
        if (verdict === null) { customDispose = null; return false }
        const snap = ctx.theme.getTheme()
        const wantScheme = verdict ? 'dark' : 'light'
        const source = snap.themes.find(t => t.id !== CUSTOM_ID && t.colorScheme === wantScheme)
          ?? snap.themes.find(t => t.id !== CUSTOM_ID)
        if (source === undefined) { customDispose = null; return false }
        colorScheme = wantScheme
        tokens = { ...source.tokens }
        const font = verdict ? '#fff' : '#000'
        for (const name of LABEL_TOKENS) tokens[name] = font
      }
      customDispose = ctx.theme.register({ id: CUSTOM_ID, colorScheme, tokens })
    } catch {
      // A live registration from an earlier HMR apply pass cannot be torn down
      // here; keep it and activate it below. Without this the duplicate-id
      // throw would abort apply and skip the wallpaper/opacity restore.
      customDispose = null
    }
    // Only activate the custom theme if it is actually registered.
    const present = ctx.theme.getTheme().themes.some(t => t.id === CUSTOM_ID)
    if (present) ctx.theme.setTheme(CUSTOM_ID)
    return present
  }
  // Restore saved color on boot.
  if (rHasColor()) registerCustom(initH, initS, initL)
  // A fresh background brightness verdict (wallpaper swapped in, generated bg
  // regenerated) re-registers the skin: without a picked color the adopted
  // skin must be rebuilt so its fonts follow the new wallpaper.
  onVerdictApplied(() => {
    if (!rHasColor()) registerCustom()
  })
  // A wallpaper-extracted color adopted by the auto path (applyThemeColor's
  // no-saved-pick branch) must finish the full adaptation here: register the
  // skin in the color's direction, persist, and sync the editor wheel — the
  // bare cfg.color write in wallpaper.ts cannot reach any of those.
  onColorAdopted(hsl => {
    registerCustom(hsl[0], hsl[1], hsl[2])
    saveConfig()
    colorRev++
    bound?.syncColor(hslToHsv(hsl[0], hsl[1], hsl[2]), colorRev)
  })
  ctx.effect(() => () => {
    customDispose?.()
    if (colorTimerRef.current !== null) window.clearTimeout(colorTimerRef.current)
  }, 'dsh-any-background: skin dispose')

  // 2. Gradient CSS (for custom dark themes).
  const styleEl = document.createElement('style')
  styleEl.dataset.plugin = 'dsh-any-background'
  // Only applies while applyCustomTokens marks the body with the plugin's
  // own dark-mode value, avoiding matches against the host's theme attribute.
  styleEl.textContent = `body[data-ds-dark-theme="dsh-any-background"]::before{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(255,255,255,0.03) 0%,transparent 60%)}${SETTINGS_STYLE_RULE}${TRAJECTORY_STYLE_RULE}${INPUT_BLUR_RULE}` + PLACEHOLDER_RULE
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
      profiles: [] as ProfileEntry[],
      rotation: { ...DEFAULT_CONFIG.rotation, items: [] },
      schedule: { ...DEFAULT_CONFIG.schedule },
      schemeOverride: 'auto' as SchemeOverride,
      activeProfile: null as string | null,
      metaRev: -1,
    }),
    actions: {
      syncBg: (d: any, url: string | null, r: number, bgType?: BackgroundType, genBg?: GeneratedBgParams | null, bgr?: number, reload?: boolean) => {
        if (r > d.rev) { d.url = url; d.rev = r }
        if (bgr !== undefined && bgr > d.bgRev) { d.backgroundType = bgType!; d.generatedBg = genBg ?? null; d.bgRev = bgr }
        if (reload !== undefined) { d.regenerateOnReload = reload }
      },
      syncColor: (d: any, hsv: [number, number, number], r: number) => { if (r > d.colorRev) { d.color = hsv; d.colorRev = r } },
      syncMeta: (d: any, profiles: ProfileEntry[], rotation: typeof cfg.rotation, schedule: typeof cfg.schedule, schemeOverride: SchemeOverride, activeProfile: string | null, r: number) => {
        if (r > d.metaRev) {
          d.profiles = profiles; d.rotation = rotation; d.schedule = schedule
          d.schemeOverride = schemeOverride; d.activeProfile = activeProfile; d.metaRev = r
        }
      },
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

  // ── Profiles / presets / scheme / rotation / schedule ────────────────────────
  let metaRev = 0
  const syncMetaNow = (): void => {
    metaRev++
    bound?.syncMeta(rProfiles(), rRotation(), rSchedule(), rSchemeOverride(), cfg.activeProfile, metaRev)
  }

  /** Apply an appearance snapshot (profile or built-in preset) to the whole
   *  interface: re-register the skin, re-emit tokens, persist. */
  const applyAppearanceLive = (ap: ProfileAppearance): void => {
    applyAppearance(ap)
    if (rHasColor()) {
      const [h, s, l] = rColor()
      registerCustom(h, s, l)
    } else if (!registerCustom()) {
      // Nothing to assert (no color, auto, no verdict): hand the palette back
      // to the host theme.
      customDispose?.()
      customDispose = null
      clearThemeTokens()
      const snap = ctx.theme.getTheme()
      const fallback = snap.themes.find(t => t.id !== CUSTOM_ID)
      if (fallback !== undefined && snap.preference === CUSTOM_ID) ctx.theme.setTheme(fallback.id)
    }
    applyWp()
  }

  const applyProfileById = (id: string): boolean => {
    const entry = rProfiles().find(p => p.id === id)
    if (entry === undefined) return false
    applyAppearanceLive(entry.config)
    cfg.activeProfile = id
    applyWp()
    persistConfig()
    syncMetaNow()
    return true
  }

  // ── Wallpaper rotation ───────────────────────────────────────────────────────
  /** Extract the theme color once from a freshly activated wallpaper and run
   *  the full adaptation (host skin + editor wheel sync); the caller persists. */
  const adoptWallpaperColor = async (dataUrl: string): Promise<void> => {
    const hsl = await extractWallpaperColor(dataUrl, rBgState())
    if (!hsl) return
    cfg.color = hsl
    registerCustom(hsl[0], hsl[1], hsl[2])
    colorRev++
    bound?.syncColor(hslToHsv(hsl[0], hsl[1], hsl[2]), colorRev)
  }

  /** Activate a rotation item: the server copies its bytes into the wallpaper
   *  slot; the client applies the returned data URL through the normal image
   *  path, then re-extracts the theme color from the new picture so the
   *  palette follows the rotation. */
  const applyRotationIndex = async (idx: number, auto: boolean): Promise<boolean> => {
    const rot = rRotation()
    if (idx < 0 || idx >= rot.items.length) return false
    const r = await rotationActivate(idx)
    if (!r.ok || !r.dataUrl) {
      console.warn('dsh-any-background: rotation activate failed', r.error)
      return false
    }
    setWpImageUrl(r.dataUrl)
    if (cfg.backgroundType === 'image') setWpUrl(r.dataUrl)
    cfg.rotation = { ...rot, current: idx, lastRotate: auto || rot.lastRotate === null ? new Date().toISOString() : rot.lastRotate }
    // The picture just switched, so any saved pick describes the old wallpaper:
    // extract once from the new one to re-adapt (placement state matches the
    // previous image, so a size mismatch makes the extractor fall back to the
    // whole picture — the desired behavior for a fresh wallpaper).
    if (cfg.backgroundType === 'image') await adoptWallpaperColor(r.dataUrl)
    applyThemeColor()
    syncBg()
    saveConfig()
    syncMetaNow()
    return true
  }

  const isoWeekKey = (d: Date): string => {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    const day = t.getUTCDay() || 7
    t.setUTCDate(t.getUTCDate() + 4 - day)
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
    const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    return `${t.getUTCFullYear()}-W${week}`
  }

  const rotationDue = (): boolean => {
    const rot = rRotation()
    if (!rot.enabled || rot.items.length === 0) return false
    if (rot.interval === 'reload') return true
    const last = rot.lastRotate !== null ? new Date(rot.lastRotate) : null
    if (last === null || isNaN(last.getTime())) return true
    const now = new Date()
    if (rot.interval === 'daily') return last.toDateString() !== now.toDateString()
    return isoWeekKey(last) !== isoWeekKey(now)
  }

  const pickNextRotationIndex = (): number => {
    const rot = rRotation()
    const n = rot.items.length
    if (n === 0) return -1
    if (rot.mode === 'shuffle' && n > 1) {
      let idx = rot.current
      while (idx === rot.current) idx = Math.floor(Math.random() * n)
      return idx
    }
    return (rot.current + 1) % n
  }

  const maybeRotate = async (): Promise<void> => {
    if (!rotationDue()) return
    await applyRotationIndex(pickNextRotationIndex(), true)
  }

  // ── Day/night profile schedule ───────────────────────────────────────────────
  const parseHHMM = (s: string): number => {
    const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s)
    return m === null ? -1 : Number(m[1]) * 60 + Number(m[2])
  }

  const isNightNow = (sc: ScheduleConfig): boolean => {
    const now = new Date()
    const cur = now.getHours() * 60 + now.getMinutes()
    const day = parseHHMM(sc.dayStart)
    const night = parseHHMM(sc.nightStart)
    if (day < 0 || night < 0) return false
    // Normal window (day 07:00 → night 19:00): night wraps midnight.
    if (day <= night) return cur >= night || cur < day
    // Overnight window (e.g. day 22:00 → night 06:00): night is the middle span.
    return cur >= night && cur < day
  }

  const scheduleTick = (): void => {
    const sc = rSchedule()
    if (!sc.enabled) return
    const night = sc.mode === 'system'
      ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
      : isNightNow(sc)
    const want = night ? sc.nightProfile : sc.dayProfile
    if (!want || want === cfg.activeProfile) return
    applyProfileById(want)
  }

  // 4. Wallpaper.
  applyWp(); syncBg()
  // The AppFrame mounts after this apply; watch for it so persisted per-part
  // blurs land as soon as the shell renders.
  watchParts()
  // Load the file-backed theme and re-apply once it lands (defaults are already
  // applied above; the deferred restore below re-asserts too). The server
  // advances a due rotation inside the read itself, so the restored wallpaper
  // is already the new pick and paints from the first apply — no old→new flash.
  void loadPersisted().then(async (serverRotated) => {
    syncMetaNow()
    // Re-register the skin with the restored color so UI and theme never diverge.
    if (rHasColor()) {
      const [h, s, l] = rColor()
      registerCustom(h, s, l)
    }
    if (serverRotated) {
      // The wallpaper was swapped server-side while the theme color still
      // describes the previous picture: re-extract once so the palette
      // follows the rotation (same adaptation as a client-side advance).
      // Persist the extracted pick — the disk still holds the old color, and
      // without this every later reload would restore it over the new
      // wallpaper.
      if (cfg.backgroundType === 'image' && rWp()) {
        await adoptWallpaperColor(rWp()!)
        saveConfig()
      }
    } else {
      // Fallback client-side advance (server flag missing / older half), still
      // before the branch restore so the fresh wallpaper is what gets applied.
      await maybeRotate()
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
    scheduleTick()
    if (rHasColor()) { colorRev++; bound?.syncColor(hslToHsv(...rColor()), colorRev) }
  })
  // Schedule cadence: check every 30s (covers fixed-clock switches) and react
  // immediately when the OS scheme flips in 'system' mode.
  const schemeMq = window.matchMedia?.('(prefers-color-scheme: dark)')
  const scheduleTimer = window.setInterval(scheduleTick, 30_000)
  schemeMq?.addEventListener?.('change', scheduleTick)
  ctx.effect(() => () => {
    window.clearInterval(scheduleTimer)
    schemeMq?.removeEventListener?.('change', scheduleTick)
  }, 'dsh-any-background: schedule timer')
  ctx.effect(() => () => { teardownWp() }, 'dsh-any-background: wp cleanup')
  ctx.effect(() => ctx.on('theme/change', () => {
    // The custom theme's preference lives in memory, so a host adoption can
    // silently reset it; re-assert it while the skin has anything to say (a
    // color, a brightness verdict, or a forced scheme). Guard on registry
    // presence — registerCustom disposes the old skin first, so during that
    // transient the registry lacks CUSTOM_ID.
    if (rHasColor() || rBgDark() !== null || rSchemeOverride() !== 'auto') {
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
    // The panel opens long after boot: push the current meta snapshot so the
    // profiles/rotation/schedule/scheme controls render live state, not the
    // store's boot-time defaults.
    syncMetaNow()
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
      // Save the current appearance as a named profile (oldest dropped at 20).
      saveProfile: (name: string): boolean => {
        const trimmed = name.trim()
        if (!trimmed) return false
        const profiles = [...rProfiles()]
        if (profiles.length >= 20) profiles.shift()
        const id = `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
        profiles.push({ id, name: trimmed.slice(0, 60), createdAt: new Date().toISOString(), config: currentAppearance() })
        cfg.profiles = profiles
        cfg.activeProfile = id
        persistConfig()
        syncMetaNow()
        return true
      },
      applyProfile: (id: string): boolean => applyProfileById(id),
      deleteProfile: (id: string): boolean => {
        const before = rProfiles()
        if (!before.some(p => p.id === id)) return false
        cfg.profiles = before.filter(p => p.id !== id)
        if (cfg.activeProfile === id) cfg.activeProfile = null
        // Clear schedule references so the tick never targets a dead id.
        const sc = rSchedule()
        if (sc.dayProfile === id || sc.nightProfile === id) {
          cfg.schedule = {
            ...sc,
            dayProfile: sc.dayProfile === id ? null : sc.dayProfile,
            nightProfile: sc.nightProfile === id ? null : sc.nightProfile,
          }
        }
        persistConfig()
        syncMetaNow()
        return true
      },
      applyPreset: (appearance: ProfileAppearance): void => {
        applyAppearanceLive(appearance)
        cfg.activeProfile = null
        applyWp()
        persistConfig()
        syncMetaNow()
      },
      setSchemeOverride: (v: SchemeOverride): void => {
        cfg.schemeOverride = v
        // Re-register the skin in every case: with a color the palette follows
        // the forced direction; without one a neutral palette is registered so
        // the host presenter flips the fonts too.
        registerCustom()
        applyWp()
        saveConfig()
        syncMetaNow()
      },
      setSchedule: (patch: Partial<ScheduleConfig>): void => {
        cfg.schedule = { ...rSchedule(), ...patch }
        if (patch.enabled === true) scheduleTick()
        persistConfig()
        syncMetaNow()
      },
      setRotation: (patch: Partial<Pick<typeof cfg.rotation, 'enabled' | 'mode' | 'interval'>>): void => {
        cfg.rotation = { ...rRotation(), ...patch }
        if (patch.enabled === true) void maybeRotate()
        persistConfig()
        syncMetaNow()
      },
      addRotationItems: async (files: File[]): Promise<boolean> => {
        let added = false
        for (const f of files) {
          if (!f.type.startsWith('image/')) continue
          const dataUrl = await readImgAsync(f)
          if (!dataUrl) continue
          const thumb = await makeThumb(dataUrl)
          const r = await rotationAdd(dataUrl, thumb ?? '')
          if (r.ok && r.items !== undefined) {
            cfg.rotation = { ...rRotation(), items: r.items as RotationItem[] }
            added = true
          }
        }
        if (added) {
          // Server already wrote the items into its config copy; re-persist so
          // the client's full config (meta included) stays authoritative.
          persistConfig()
          syncMetaNow()
          syncBg()
        }
        return added
      },
      removeRotationItem: async (index: number): Promise<boolean> => {
        const r = await rotationRemove(index)
        if (!r.ok || r.items === undefined) return false
        const rot = rRotation()
        cfg.rotation = {
          ...rot,
          items: r.items as RotationItem[],
          current: Math.max(0, Math.min(rot.current >= index ? rot.current - 1 : rot.current, Math.max(0, r.items.length - 1))),
        }
        persistConfig()
        syncMetaNow()
        return true
      },
      rotateNow: async (): Promise<boolean> => {
        if (rRotation().items.length === 0) return false
        return applyRotationIndex(pickNextRotationIndex(), true)
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
  // system palette. While the skin has anything to say (a color, a brightness
  // verdict, or a forced scheme), re-register and re-assert the custom theme
  // on a slow interval so the theme state always matches it, independent of
  // which event resets it.
  const watchdogId = window.setInterval(() => {
    if (!rHasColor() && rBgDark() === null && rSchemeOverride() === 'auto') return
    const snapshot = ctx.theme.getTheme()
    let changed = false
    if (!snapshot.themes.some(t => t.id === CUSTOM_ID)) {
      registerCustom()
      changed = true
    } else if (snapshot.preference !== CUSTOM_ID) {
      ctx.theme.setTheme(CUSTOM_ID)
      changed = true
    }
    if (changed) applyWp()
  }, 1000)
  ctx.effect(() => () => { window.clearInterval(watchdogId) }, 'dsh-any-background: theme watchdog')

  // 8.5. Theme-reset watchdog: counter the host re-asserting its own light
  // :root/body scheme after startup (refresh, cold load, settings adoption),
  // which would paint a frame of white surfaces.
  const disposeThemeResets = watchThemeResets()
  ctx.effect(() => () => { disposeThemeResets() }, 'dsh-any-background: theme resets watch')

  // 9. Flush any pending debounced config write when the page is hidden or
  // closed, so the last slider position is never lost to the debounce window.
  const onPageHide = (): void => flushSave()
  window.addEventListener('pagehide', onPageHide)
  ctx.effect(() => () => window.removeEventListener('pagehide', onPageHide), 'dsh-any-background: pagehide flush')
}
