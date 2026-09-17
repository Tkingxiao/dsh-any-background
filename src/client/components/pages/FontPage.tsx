import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ComponentType } from 'react'
import type { PartBlurs, PartStrokes, StrokeConfig, ThemeStoreState, ThemeSectionProps } from '../../types'
import { cfg, rStrokes } from '../../state'
import { saveConfig, uploadRefusalText } from '../../rpc'
import { setPartStroke } from '../../wallpaper'
import { useBetterSidebar } from '../../env'
import { LiveSlider } from '../LiveSlider'
import {
  CanvasIcon, SidebarIcon, ChatIcon, GearIcon, TextIcon, TrajectoryIcon,
  InputIcon, PanelIcon, TrashIcon, UploadIcon,
} from '../icons'

/**
 * Font page: the custom interface font slot plus per-part text strokes.
 *
 * Stroke settings mirror the interface page's per-part blur groups one-to-one
 * (same nine surfaces) — see STROKE_RULE in wallpaper.ts for how each group
 * binds to the DOM. Colors are stored as PRESET KEYS, never resolved values,
 * so 'auto' (contrast the font) and 'theme' (follow the accent) keep tracking
 * the palette; only 'custom' carries a literal hex.
 */
interface PartDef {
  /** Surface group key — a PartBlurs key, and therefore a PartStrokes key. */
  key: keyof PartBlurs
  labelKey: string
  Icon: ComponentType<{ size?: number }>
  /** Third-party surface (dsh-better-sidebar), hidden when that plugin is absent. */
  needsSidebar?: boolean
}

const PARTS: PartDef[] = [
  { key: 'bg', labelKey: 'uiOpacityBg', Icon: CanvasIcon },
  { key: 'sidebar', labelKey: 'uiOpacitySide', Icon: SidebarIcon },
  { key: 'card', labelKey: 'uiOpacityCard', Icon: ChatIcon },
  { key: 'input', labelKey: 'uiOpacityInput', Icon: InputIcon },
  { key: 'settings', labelKey: 'uiSop', Icon: GearIcon },
  { key: 'chat', labelKey: 'uiChatRegion', Icon: TextIcon },
  { key: 'trajectory', labelKey: 'uiTrajectory', Icon: TrajectoryIcon },
  { key: 'produced', labelKey: 'uiProduced', Icon: TextIcon },
  { key: 'panel', labelKey: 'uiPanelRegion', Icon: PanelIcon, needsSidebar: true },
]

const COLOR_KEYS: Array<StrokeConfig['color']> = ['auto', 'gray', 'black', 'white', 'theme', 'custom']
const COLOR_LABEL_KEYS: Record<StrokeConfig['color'], string> = {
  auto: 'strokeAuto', gray: 'strokeGray', black: 'strokeBlack',
  white: 'strokeWhite', theme: 'strokeTheme', custom: 'strokeCustom',
}

/** Swatch fill for one preset key. 'auto' gets its half-black/half-white
 *  conic gradient from CSS, and 'custom' shows the stored hex. */
function dotStyle(key: StrokeConfig['color'], s: StrokeConfig): CSSProperties {
  switch (key) {
    case 'gray': return { background: '#808080' }
    case 'black': return { background: '#000' }
    case 'white': return { background: '#fff' }
    case 'theme': return { background: 'var(--dsw-alias-brand-primary)' }
    case 'custom': return { background: s.customColor }
    default: return {}
  }
}

export function FontPage({ p, notify }: { p: ThemeSectionProps; notify: (msg: string, ok?: boolean) => void }) {
  const { t, setFont, removeFont, setFontEnabled, setStrokes, useStore } = p
  const hasBetterSidebar = useBetterSidebar()
  const fileRef = useRef<HTMLInputElement>(null)

  // cfg is the source of truth; the local copies exist because nothing else
  // re-renders this page when the config changes (the store only carries the
  // wallpaper/color/meta snapshots), and async uploads settle after render.
  const [strokes, setStrokesState] = useState<PartStrokes>(() => rStrokes())
  const [fontInfo, setFontInfo] = useState<{ mime: string | null; enabled: boolean; name: string | null }>(() => ({
    mime: cfg.fontMime, enabled: cfg.fontEnabled, name: null,
  }))
  const [busy, setBusy] = useState(false)

  // Presets / imports / profile restores rewrite cfg.strokes and the font slot
  // directly and only bump the store's metaRev. Without this re-derivation the
  // local copies above keep rendering the values from before the change.
  const metaRev = useStore((s: ThemeStoreState) => s.metaRev)
  useEffect(() => {
    setStrokesState(rStrokes())
    setFontInfo(prev =>
      prev.mime === cfg.fontMime && prev.enabled === cfg.fontEnabled
        ? prev
        : { mime: cfg.fontMime, enabled: cfg.fontEnabled, name: null },
    )
  }, [metaRev])

  const hasFont = fontInfo.mime !== null
  // After a reload only the MIME survives (the original filename is not
  // persisted), so fall back to the container format — e.g. "WOFF2".
  const fontLabel = fontInfo.name ?? (fontInfo.mime !== null ? fontInfo.mime.replace('font/', '').toUpperCase() : t('fontNone'))

  /** Write one group's stroke: cfg + live DOM now, disk on commit. `live`
   *  marks slider drags (debounced save, no full re-apply). */
  const patch = (key: keyof PartBlurs, next: Partial<StrokeConfig>, live: boolean): void => {
    const map: PartStrokes = { ...strokes, [key]: { ...strokes[key], ...next } }
    setStrokesState(map)
    cfg.strokes = map
    setPartStroke(key, map[key])
    if (live) saveConfig()
    else setStrokes(map)
  }

  const pickFont = async (file: File): Promise<void> => {
    setBusy(true)
    setFontInfo({ ...fontInfo, name: file.name })
    const outcome = await setFont(file)
    setBusy(false)
    if (outcome.ok) {
      setFontInfo({ mime: cfg.fontMime, enabled: cfg.fontEnabled, name: file.name })
    } else {
      // Roll the optimistic name back to whatever is actually stored.
      setFontInfo({ mime: cfg.fontMime, enabled: cfg.fontEnabled, name: null })
      notify(uploadRefusalText(outcome, t, 'fontFail'), false)
    }
  }

  return (
    <>
      <header className="dab-head dab-rise" style={{ '--d': 0 } as CSSProperties}>
        <div className="dab-overline">Typography</div>
        <h2 className="dab-h1">{t('fontPageTitle')}</h2>
        <p className="dab-desc">{t('descFont')}</p>
      </header>

      <section className="dab-card dab-rise dab-font-card" style={{ '--d': 1 } as CSSProperties}>
        <div className="dab-row-head">
          <div className="dab-font-title">
            <div className="dab-part-ico"><TextIcon size={16} /></div>
            <div className="dab-part-name">{t('fontTitle')}</div>
          </div>
          {hasFont ? (
            <button type="button" className={`dab-toggle${fontInfo.enabled ? ' is-on' : ''}`} role="switch"
              aria-checked={fontInfo.enabled} aria-label={t('fontEnabled')}
              onClick={() => {
                const v = !fontInfo.enabled
                setFontEnabled(v)
                setFontInfo({ ...fontInfo, enabled: v })
              }}>
              <span className="dab-toggle-knob" />
            </button>
          ) : null}
        </div>

        <div className="dab-font-row">
          <span className={`dab-font-name${hasFont ? '' : ' is-empty'}`} title={fontLabel}>{fontLabel}</span>
          <div className="dab-font-actions">
            <button type="button" className="dab-btn dab-btn-primary" disabled={busy}
              onClick={() => fileRef.current?.click()}>
              <UploadIcon size={14} />{busy ? t('fontUploading') : t('fontUpload')}
            </button>
            {hasFont ? (
              <button type="button" className="dab-btn dab-btn-danger"
                onClick={() => {
                  removeFont()
                  setFontInfo({ mime: null, enabled: cfg.fontEnabled, name: null })
                }}>
                <TrashIcon size={14} />{t('fontRemove')}
              </button>
            ) : null}
          </div>
        </div>

        <p className="dab-hint" style={{ marginTop: 10 }}>{t('fontHint')}</p>
        <input ref={fileRef} type="file" accept=".ttf,.otf,.woff,.woff2,font/*" style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void pickFont(f)
          }} />
      </section>

      <section className="dab-card dab-rise" style={{ '--d': 2 } as CSSProperties}>
        <div className="dab-part-head" style={{ marginBottom: 10 }}>
          <div className="dab-part-name">{t('strokeTitle')}</div>
        </div>
        <p className="dab-hint" style={{ marginBottom: 14 }}>{t('strokeHint')}</p>

        <div className="dab-grid-parts">
          {PARTS.filter(part => !(part.needsSidebar && !hasBetterSidebar)).map((part, i) => {
            const s = strokes[part.key]
            return (
              <section key={part.key} className="dab-card dab-card-hover dab-rise" style={{ '--d': i + 3 } as CSSProperties}>
                <div className="dab-part-head">
                  <div className="dab-part-ico"><part.Icon size={16} /></div>
                  <div className="dab-part-name">{t(part.labelKey)}</div>
                  <span className="dab-part-badge">{s.width}px</span>
                </div>

                <LiveSlider label={t('strokeWidth')} min={0} max={4} step={0.5} def={s.width}
                  fmt={v => `${v}px`}
                  onInput={v => patch(part.key, { width: v }, true)}
                  onChange={v => patch(part.key, { width: v }, false)} />

                <div className="dab-stroke-dots">
                  {COLOR_KEYS.map(key => {
                    const active = s.color === key
                    return (
                      <div key={key} className="dab-stroke-dot-wrap">
                        <button type="button"
                          className={`dab-stroke-dot${key === 'auto' ? ' dab-stroke-dot-auto' : ''}${active ? ' is-active' : ''}`}
                          style={dotStyle(key, s)}
                          title={t(COLOR_LABEL_KEYS[key])} aria-label={t(COLOR_LABEL_KEYS[key])}
                          aria-pressed={active}
                          onClick={() => patch(part.key, { color: key }, false)} />
                        {/* The native picker is invisible and stretched over the
                            swatch, so one click both selects 'custom' and opens
                            it — no in-house color popover needed. */}
                        {key === 'custom' ? (
                          <input type="color" className="dab-stroke-dot-input" value={s.customColor}
                            aria-label={t('strokeCustom')}
                            onChange={e => patch(part.key, { color: 'custom', customColor: e.target.value }, false)} />
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </section>
    </>
  )
}
