import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { ThemeSectionProps, ThemeStoreState, BackgroundType, GeneratedBgParams, BgMode } from '../../types'
import { cfg, rWop, rBl, rBgMode } from '../../state'
import { saveConfig, setWallpaperFromUrl, uploadWallpaper, WALLPAPER_SERVE_URL } from '../../rpc'
import { applyWp, setWpOpacity, setWpBlur, pauseGeneratedBg, resumeGeneratedBg } from '../../wallpaper'
import { defaultParamsFor } from '../../utils/bg-generators'
import { BgEditor } from '../BgEditor'
import { LiveSlider } from '../LiveSlider'
import { LockIcon, CheckIcon, PhotoIcon, RefreshIcon, SparkleIcon, TrashIcon, UploadIcon, EditIcon, VideoIcon, LinkIcon, PlusIcon, XIcon, PlayIcon, PauseIcon } from '../icons'

const SEG_W = 108
const BG_MODES: Array<{ mode: BgMode; labelKey: string }> = [
  { mode: 'fit', labelKey: 'bgModeFit' },
  { mode: 'fill', labelKey: 'bgModeFill' },
  { mode: 'stretch', labelKey: 'bgModeStretch' },
  { mode: 'tile', labelKey: 'bgModeTile' },
  { mode: 'center', labelKey: 'bgModeCenter' },
]

export function BackgroundPage({ p }: { p: ThemeSectionProps }) {
  const { t, setWpFromServer, setVideo, setWop, setBl, setBgType, setGeneratedBg, regenerateBg, setRegenerateOnReload, setRotation, addRotationItems, removeRotationItem, rotateNow, setVideoFromUrl, useStore } = p
  // Field-level store subscriptions: dragging sliders / picking colors changes
  // only the color fields, and the background page has no reason to re-render
  // for those — full-state subscription re-renders this whole page (hero img,
  // thumbnails, sliders) on every unrelated store write.
  const storeUrl = useStore((s: ThemeStoreState) => s.url)
  const backgroundType = useStore((s: ThemeStoreState) => s.backgroundType)
  const generatedBg = useStore((s: ThemeStoreState) => s.generatedBg)
  const regenerateOnReload = useStore((s: ThemeStoreState) => s.regenerateOnReload)
  const rotation = useStore((s: ThemeStoreState) => s.rotation)

  const fileRef = useRef<HTMLInputElement>(null)
  const rotFileRef = useRef<HTMLInputElement>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [spinTick, setSpinTick] = useState(0)
  const [rotBusy, setRotBusy] = useState(false)
  const [urlOpen, setUrlOpen] = useState(false)
  const [urlVal, setUrlVal] = useState('')
  const [urlBusy, setUrlBusy] = useState(false)
  const [urlErr, setUrlErr] = useState<string | null>(null)
  // Layout mode is owned by cfg (persisted on click); local mirror only so
  // the chip row re-renders on selection.
  const [mode, setModeState] = useState<BgMode>(rBgMode())

  const isVideo = backgroundType === 'video'
  const isStatic = backgroundType === 'image' || isVideo
  const isGenerated = !isStatic
  const activeGenType: Exclude<BackgroundType, 'image' | 'video'> = isGenerated && generatedBg ? generatedBg.type : 'mesh'

  // Session-only pause state; any controller swap (type switch, regenerate)
  // recreates the loop running, so reset the button to match.
  const [paused, setPaused] = useState(false)
  const genPreset = generatedBg !== null && generatedBg.type !== 'mesh' ? generatedBg.preset : undefined
  useEffect(() => { setPaused(false) }, [activeGenType, genPreset, generatedBg?.seed])

  const onFileSelect = (f: File) => {
    if (f.type.startsWith('video/')) {
      // Hand the raw file over directly: it streams to disk over the
      // binary upload route. A data-URL detour would inflate the bytes by a
      // third (base64) and blow the RPC body limit on large clips.
      setVideo(f, f.type)
      return
    }
    // Stream the original bytes straight to disk (no base64 round-trip, no
    // re-encoding), then point the wallpaper at the serve URL. The browser
    // decodes it natively like any <img>.
    void uploadWallpaper(f).then(ok => {
      if (ok) setWpFromServer(WALLPAPER_SERVE_URL)
    })
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f && (f.type.startsWith('image/') || f.type.startsWith('video/'))) onFileSelect(f)
  }

  const applyUrl = async () => {
    const u = urlVal.trim()
    if (!/^https?:\/\//i.test(u)) { setUrlErr(t('bgUrlBadHttp')); return }
    setUrlBusy(true)
    setUrlErr(null)
    const r = await setWallpaperFromUrl(u)
    if (r.ok) {
      // The host already replaced the local wallpaper file; just switch the
      // theme to image mode and point the display at the serve URL.
      setWpFromServer(r.wallpaperUrl ?? null)
      setUrlOpen(false)
      setUrlVal('')
    } else if (r.error === 'not an image') {
      // A video URL: stream it into the video slot through the server and
      // play from the serve route.
      const ok = await setVideoFromUrl(u)
      if (ok) {
        setUrlOpen(false)
        setUrlVal('')
      } else {
        setUrlErr(t('bgUrlVideoFail'))
      }
    } else {
      setUrlErr(r.error === 'invalid url' || r.error === 'unsupported scheme'
        ? t('bgUrlBadHttp')
        : (r.error ?? t('bgUrlFail')))
    }
    setUrlBusy(false)
  }

  const switchToStatic = () => {
    if (isStatic) return
    setBgType(isVideo || cfg.videoMime !== null ? 'video' : 'image')
  }

  const setMode = (m: BgMode) => {
    if (m === mode) return
    setModeState(m)
    cfg.bgMode = m
    applyWp()
    saveConfig()
  }

  const setGenType = (type: Exclude<BackgroundType, 'image' | 'video'>) => {
    if (type === activeGenType) return
    setPaused(false)
    setBgType(type)
  }

  const ensureGenParams = (): GeneratedBgParams => generatedBg ?? defaultParamsFor(activeGenType)

  const updateGenerated = (patch: Partial<GeneratedBgParams>) => {
    // Any parameter change rebuilds the live controller, which restarts the
    // animation loop — reset the paused state so the button stays truthful.
    setPaused(false)
    setGeneratedBg({ ...ensureGenParams(), ...patch } as GeneratedBgParams)
  }

  const typeMeta: Array<{ type: Exclude<BackgroundType, 'image' | 'video'>; labelKey: string; descKey: string; thumb: string }> = [
    { type: 'mesh', labelKey: 'bgTypeMesh', descKey: 'bgMeshDesc', thumb: 'dab-thumb-mesh' },
    { type: 'shader', labelKey: 'bgTypeShader', descKey: 'bgShaderDesc', thumb: 'dab-thumb-shader' },
    { type: 'pattern', labelKey: 'bgTypePattern', descKey: 'bgPatternDesc', thumb: 'dab-thumb-pattern' },
  ]

  const presetLabel = (key: string) => {
    switch (key) {
      case 'aurora': return t('presetAurora')
      case 'nebula': return t('presetNebula')
      case 'noise': return t('presetNoise')
      case 'starfield': return t('presetStarfield')
      case 'dots': return t('presetDots')
      case 'waves': return t('presetWaves')
      case 'poly': return t('presetPoly')
      case 'rain': return t('presetRain')
      case 'contour': return t('presetContour')
      case 'meta': return t('presetMeta')
      default: return key
    }
  }

  return (
    <>
      <header className="dab-head dab-rise" style={{ '--d': 0 } as CSSProperties}>
        <div className="dab-overline">Canvas</div>
        <h2 className="dab-h1">{t('bgTitle')}</h2>
        <p className="dab-desc">{t('descBackground')}</p>
      </header>

      {/* Preview hero with hover veil */}
      <section className="dab-rise" style={{ '--d': 1 } as CSSProperties}>
        <div className="dab-hero">
          {storeUrl ? (
            <>
              <img className="dab-hero-img" src={storeUrl} alt="" draggable={false} />
              {isGenerated ? (
                <span className="dab-hero-badge"><SparkleIcon size={11} />{t('liveBadge')}</span>
              ) : isVideo ? (
                <span className="dab-hero-badge"><VideoIcon size={11} />{t('bgVideoBadge')}</span>
              ) : null}
              <div className="dab-hero-veil">
                {isStatic && storeUrl ? (
                  <button type="button" className="dab-btn" disabled={mode !== 'fit'}
                    title={mode !== 'fit' ? t('bgEditLocked') : undefined}
                    onClick={() => setEditorOpen(true)}>
                    <EditIcon size={13} />{t('bgEdit')}
                  </button>
                ) : isGenerated ? (
                  <button type="button" className="dab-btn" onClick={() => { setPaused(false); regenerateBg(); setSpinTick(x => x + 1) }}>
                    <RefreshIcon size={13} />{t('bgRegenerate')}
                  </button>
                ) : null}
                <button type="button" className="dab-btn dab-btn-danger" onClick={() => setWpFromServer(null)}>
                  <TrashIcon size={13} />{t('bgRemove')}
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              className={`dab-hero-empty${dragOver ? ' is-over' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}>
              <UploadIcon size={20} />
              <span>{t('dropHint')}</span>
            </button>
          )}
        </div>
      </section>

      {/* Source segmented control */}
      <section className="dab-rise" style={{ '--d': 2 } as CSSProperties}>
        <div className="dab-seg" style={{ '--w': `${SEG_W}px` } as CSSProperties}>
          <div className="dab-seg-thumb" style={{ transform: `translateX(${isGenerated ? SEG_W : 0}px)` }} />
          <button type="button" className={`dab-seg-item${!isGenerated ? ' is-active' : ''}`} onClick={switchToStatic}>
            <PhotoIcon size={14} />{t('bgSourceImage')}
          </button>
          <button type="button" className={`dab-seg-item${isGenerated ? ' is-active' : ''}`}
            onClick={() => { if (!isGenerated) setBgType(generatedBg?.type ?? 'mesh') }}>
            <SparkleIcon size={14} />{t('bgSourceGenerated')}
          </button>
        </div>
      </section>

      {/* Mode content */}
      {!isGenerated ? (
        <>
      <section className="dab-card dab-card-hover dab-rise" style={{ '--d': 3 } as CSSProperties}>
          <div className="dab-chip-row">
            <button type="button" className="dab-btn dab-btn-primary" onClick={() => fileRef.current?.click()}>
              <UploadIcon size={14} />{t('bgChoose')}
            </button>
            <button type="button" className="dab-btn dab-btn-soft" onClick={() => setUrlOpen(o => !o)}>
              <LinkIcon size={14} />{t('bgFromUrl')}
            </button>
            {storeUrl || isVideo ? (
              <>
                {isStatic && storeUrl ? (
                  <button type="button" className="dab-btn" disabled={mode !== 'fit'}
                    title={mode !== 'fit' ? t('bgEditLocked') : undefined}
                    onClick={() => setEditorOpen(true)}>
                    <EditIcon size={14} />{t('bgEdit')}
                  </button>
                ) : null}
                <button type="button" className="dab-btn dab-btn-danger-inverted" onClick={() => setWpFromServer(null)}>
                  <TrashIcon size={14} />{t('bgRemove')}
                </button>
              </>
            ) : null}
          </div>
          {urlOpen ? (
            <div className="dab-urlrow">
              <input type="text" className="dab-urlinput" value={urlVal} placeholder={t('bgUrlPlaceholder')}
                onChange={e => setUrlVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void applyUrl() } }}
                autoFocus />
              <button type="button" className="dab-btn dab-btn-primary" disabled={urlBusy} onClick={() => void applyUrl()}>
                {urlBusy ? t('bgUrlApplying') : t('bgUrlApply')}
              </button>
              <button type="button" className="dab-btn" onClick={() => { setUrlOpen(false); setUrlVal(''); setUrlErr(null) }}>
                {t('bgUrlCancel')}
              </button>
            </div>
          ) : null}
          {urlErr ? (
            <p className="dab-urlerr" style={{ marginTop: 8, color: 'var(--dsw-alias-state-error-primary)', fontSize: 12 }}>{urlErr}</p>
          ) : null}
          {/* Adaptive placement for image/video backgrounds. "fit" keeps the
              editor-committed framing; the pan/zoom editor only applies there. */}
          <div style={{ marginTop: 16 }}>
            <div className="dab-swatch-title">{t('bgModeTitle')}</div>
            <div className="dab-chip-row">
              {BG_MODES.map(m => (
                <button key={m.mode} type="button" className={`dab-chip${mode === m.mode ? ' is-active' : ''}`}
                  onClick={() => setMode(m.mode)}>
                  {t(m.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Wallpaper rotation pool */}
        <section className="dab-card dab-rise" style={{ '--d': 4 } as CSSProperties}>
          <div className="dab-row-head">
            <div className="dab-swatch-title" style={{ marginBottom: 0 }}>{t('rotTitle')}</div>
            <button type="button" className={`dab-toggle${rotation.enabled ? ' is-on' : ''}`} role="switch" aria-checked={rotation.enabled}
              onClick={() => setRotation({ enabled: !rotation.enabled })}>
              <span className="dab-toggle-knob" />
            </button>
          </div>
          <p className="dab-hint" style={{ marginTop: 8 }}>{t('rotHint')}</p>
          <div className="dab-thumbstrip">
            {rotation.items.map((it, i) => (
              <div key={it.file} className={`dab-thumb${rotation.enabled && i === rotation.current ? ' is-current' : ''}`}>
                {it.thumb ? <img src={it.thumb} alt="" draggable={false} /> : <PhotoIcon size={15} />}
                <button type="button" className="dab-thumb-x" title={t('rotRemove')}
                  disabled={rotBusy} onClick={() => { setRotBusy(true); void removeRotationItem(i).finally(() => setRotBusy(false)) }}>
                  <XIcon size={10} />
                </button>
              </div>
            ))}
            <button type="button" className="dab-thumb dab-thumb-add" title={t('rotAdd')} disabled={rotBusy}
              onClick={() => rotFileRef.current?.click()}>
              <PlusIcon size={16} />
            </button>
          </div>
          {rotation.items.length > 0 ? (
            <div className="dab-chip-row" style={{ marginTop: 12 }}>
              <button type="button" className={`dab-chip${rotation.mode === 'shuffle' ? ' is-active' : ''}`}
                onClick={() => setRotation({ mode: 'shuffle' })}>{t('rotShuffle')}</button>
              <button type="button" className={`dab-chip${rotation.mode === 'order' ? ' is-active' : ''}`}
                onClick={() => setRotation({ mode: 'order' })}>{t('rotOrder')}</button>
              <span className="dab-chip-sep" />
              <button type="button" className={`dab-chip${rotation.interval === 'reload' ? ' is-active' : ''}`}
                onClick={() => setRotation({ interval: 'reload' })}>{t('rotReload')}</button>
              <button type="button" className={`dab-chip${rotation.interval === 'daily' ? ' is-active' : ''}`}
                onClick={() => setRotation({ interval: 'daily' })}>{t('rotDaily')}</button>
              <button type="button" className={`dab-chip${rotation.interval === 'weekly' ? ' is-active' : ''}`}
                onClick={() => setRotation({ interval: 'weekly' })}>{t('rotWeekly')}</button>
              <button type="button" className="dab-btn" disabled={rotBusy}
                onClick={() => { setRotBusy(true); void rotateNow().finally(() => setRotBusy(false)) }}>
                <RefreshIcon size={13} />{t('rotNow')}
              </button>
            </div>
          ) : null}
          <input ref={rotFileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => {
            const files = Array.from(e.target.files ?? [])
            e.target.value = ''
            if (files.length === 0) return
            setRotBusy(true)
            void addRotationItems(files).finally(() => setRotBusy(false))
          }} />
        </section>
        </>
      ) : (
        <section className="dab-card dab-rise" style={{ '--d': 3 } as CSSProperties}>
          {/* Type cards with animated thumbnails */}
          <div className="dab-types">
            {typeMeta.map((m, i) => (
              <button key={m.type} type="button" className={`dab-type${activeGenType === m.type ? ' is-active' : ''}`}
                style={{ '--i': i } as CSSProperties} onClick={() => setGenType(m.type)}>
                <div className={`dab-type-thumb ${m.thumb}`} />
                <div className="dab-type-name">{t(m.labelKey)}</div>
                <div className="dab-type-desc">{t(m.descKey)}</div>
                <span className="dab-type-check"><CheckIcon size={11} /></span>
              </button>
            ))}
          </div>

          {/* Presets (shader / pattern) */}
          {activeGenType === 'shader' && generatedBg?.type === 'shader' ? (
            <div style={{ marginTop: 14 }}>
              <div className="dab-swatch-title">{t('bgShaderPreset')}</div>
              <div className="dab-chip-row">
                {(['aurora', 'nebula', 'noise', 'starfield'] as const).map(pr => (
                  <button key={pr} type="button" className={`dab-chip${generatedBg.preset === pr ? ' is-active' : ''}`}
                    onClick={() => updateGenerated({ preset: pr })}>
                    {presetLabel(pr)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {activeGenType === 'pattern' && generatedBg?.type === 'pattern' ? (
            <div style={{ marginTop: 14 }}>
              <div className="dab-swatch-title">{t('bgPatternPreset')}</div>
              <div className="dab-chip-row">
                {(['dots', 'waves', 'poly', 'rain', 'contour', 'meta'] as const).map(pr => (
                  <button key={pr} type="button" className={`dab-chip${generatedBg.preset === pr ? ' is-active' : ''}`}
                    onClick={() => updateGenerated({ preset: pr })}>
                    {presetLabel(pr)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Parameter sliders */}
          <div style={{ marginTop: 16 }}>
            {activeGenType === 'mesh' && generatedBg?.type === 'mesh' ? (
              <>
                <LiveSlider label={t('bgMeshScale')} min={30} max={300} step={1} def={Math.round(generatedBg.scale * 100)}
                  fmt={v => `${v}%`} onChange={v => updateGenerated({ scale: v / 100 })} />
                <LiveSlider label={t('bgMeshIntensity')} min={0} max={100} step={1} def={Math.round(generatedBg.intensity * 100)}
                  fmt={v => `${v}%`} onChange={v => updateGenerated({ intensity: v / 100 })} />
              </>
            ) : null}
            {activeGenType === 'shader' && generatedBg?.type === 'shader' ? (
              <>
                <LiveSlider label={t('bgShaderSpeed')} min={0} max={200} step={1} def={Math.round(generatedBg.speed * 100)}
                  fmt={v => `${v}%`} onChange={v => updateGenerated({ speed: v / 100 })} />
                <LiveSlider label={t('bgShaderScale')} min={30} max={300} step={1} def={Math.round(generatedBg.scale * 100)}
                  fmt={v => `${v}%`} onChange={v => updateGenerated({ scale: v / 100 })} />
              </>
            ) : null}
            {activeGenType === 'pattern' && generatedBg?.type === 'pattern' ? (
              <>
                <LiveSlider label={t('bgPatternDensity')} min={0} max={100} step={1} def={Math.round(generatedBg.density * 100)}
                  fmt={v => `${v}%`} onChange={v => updateGenerated({ density: v / 100 })} />
                <LiveSlider label={t('bgPatternScale')} min={30} max={300} step={1} def={Math.round(generatedBg.scale * 100)}
                  fmt={v => `${v}%`} onChange={v => updateGenerated({ scale: v / 100 })} />
              </>
            ) : null}
          </div>

          {/* Seed lock + regenerate + pause */}
          <div className="dab-seed">
            <span className="dab-seed-ico"><LockIcon size={15} /></span>
            <div className="dab-seed-txt">
              <div className="dab-seed-title">{t('seedLock')}</div>
              <div className="dab-seed-desc">{!regenerateOnReload ? t('bgSeedLocked') : t('bgSeedUnlocked')}</div>
            </div>
            <button type="button" className={`dab-toggle${!regenerateOnReload ? ' is-on' : ''}`}
              role="switch" aria-checked={!regenerateOnReload}
              onClick={() => setRegenerateOnReload(!regenerateOnReload)}>
              <span className="dab-toggle-knob" />
            </button>
            <button type="button" className="dab-btn" onClick={() => {
              if (paused) { resumeGeneratedBg(); setPaused(false) }
              else { pauseGeneratedBg(); setPaused(true) }
            }}>
              {paused ? <PlayIcon size={13} /> : <PauseIcon size={13} />}{paused ? t('bgResume') : t('bgPause')}
            </button>
            <button type="button" className="dab-btn dab-btn-primary" onClick={() => { regenerateBg(); setPaused(false); setSpinTick(x => x + 1) }}>
              <span key={spinTick} className="dab-spin" style={{ display: 'grid' }}><RefreshIcon size={13} /></span>
              {t('bgRegenerate')}
            </button>
          </div>
        </section>
      )}

      {/* Global wallpaper adjustments */}
      <section className="dab-card dab-card-hover dab-rise" style={{ '--d': 5 } as CSSProperties}>
        <LiveSlider label={t('wpOpacity')} min={0} max={100} step={1} def={Math.round(rWop() * 100)}
          fmt={v => `${v}%`}
          onInput={v => { const op = v / 100; cfg.wallpaperOpacity = op; setWpOpacity(op); saveConfig() }}
          onChange={v => setWop(v / 100)} />
        <LiveSlider label={t('bgBlur')} min={0} max={60} step={1} def={rBl()}
          fmt={v => `${v}px`}
          onInput={v => { cfg.blur = v; setWpBlur(v); saveConfig() }}
          onChange={v => setBl(v)} />
        <p className="dab-hint" style={{ marginTop: 12 }}>{t('bgHint')}</p>
      </section>

      <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => {
        const f = e.target.files?.[0]; if (!f) return
        onFileSelect(f); e.target.value = ''
      }} />

      {/* Background editor modal (image/video + fit mode only). For videos
          the reference is the captured frame snapshot — same pixels as the
          playing video, so the committed framing maps 1:1 onto the layer. */}
      {editorOpen && storeUrl && isStatic && mode === 'fit' ? (
        <BgEditor url={storeUrl} t={t} onClose={() => setEditorOpen(false)}
          onCommit={(z, x, y, iw, ih) => {
            const st = { zoom: z, x, y, iw, ih }
            if (backgroundType === 'video') cfg.videoBgState = st
            else cfg.bgState = st
            applyWp(); saveConfig(); setEditorOpen(false)
          }} />
      ) : null}
    </>
  )
}
