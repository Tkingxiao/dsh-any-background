import { useRef, useState, useEffect } from 'react'
import { ST } from '../styles'
import { cfg, rOps, rSop, rWop, rBl, rBlurs } from '../state'
import { saveConfig } from '../rpc'
import { applyWp, applyCustomTokens, applySettingsOverrides, setWpOpacity, setWpBlur, setPartBlur } from '../wallpaper'
import { readImg } from '../utils/image'
import type { ThemeSectionProps, PartOpacities, PartBlurs } from '../types'
import { ColorWheel } from './ColorWheel'
import { ColorInputs } from './ColorInputs'
import { ColorPicker } from './ColorPicker'
import { BgEditor } from './BgEditor'
import { LiveSlider } from './LiveSlider'
import { ErrorBoundary } from './ErrorBoundary'

export function ThemeSection(props: ThemeSectionProps) {
  const { t, hue, sat, lit, setColor, setWp, setOps, setBlurs, setWop, setBl, setSop, useStore, extractColor, exportTheme, importTheme } = props
  const storeUrl = useStore(s => s.url)
  // Programmatic color changes (wallpaper extraction, async boot restore)
  // arrive through the store; the wheel adopts them via its props effect.
  const storeColor = useStore(s => s.color)
  const fileRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractMsg, setExtractMsg] = useState<string | null>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const msgTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(msgTimer.current), [])
  const showMsg = (setter: (v: string | null) => void, key: string) => {
    setter(t(key))
    window.clearTimeout(msgTimer.current)
    msgTimer.current = window.setTimeout(() => setter(null), 2500)
  }
  const onExtract = async () => {
    if (!storeUrl || extracting) return
    setExtracting(true)
    try {
      showMsg(setExtractMsg, await extractColor() ? 'extractDone' : 'extractFail')
    } catch {
      showMsg(setExtractMsg, 'extractFail')
    } finally {
      setExtracting(false)
    }
  }
  const onImport = async (file: File) => {
    try {
      showMsg(setImportMsg, await importTheme(file) ? 'importDone' : 'importFail')
    } catch {
      showMsg(setImportMsg, 'importFail')
    }
  }
  const wheel = (storeColor ?? [hue, sat, lit]) as [number, number, number]
  // One blur slider per interface part; each edits its own blur live and
  // commits the full per-part set on release.
  const blurSlider = (part: keyof PartBlurs) => (
    <LiveSlider label={t('uiBlur')} min={0} max={60} step={1} def={rBlurs()[part]}
      fmt={v => `${v}px`}
      onInput={v => {
        const blurs = { ...rBlurs() }
        blurs[part] = v
        cfg.blurs = blurs
        setPartBlur(part, v)
        saveConfig()
      }}
      onChange={v => {
        const blurs = { ...rBlurs() }
        blurs[part] = v
        setBlurs(blurs)
      }} />
  )
  // One slider per main-interface part; each edits its own opacity live and
  // commits the full per-part set on release.
  const partSlider = (labelKey: string, part: keyof PartOpacities) => (
    <div style={ST.sliderBlock}>
      <div style={ST.sliderLabel}>{t(labelKey)}</div>
      <LiveSlider label={t('uiOpacity')} min={0} max={100} step={1} def={Math.round(rOps()[part] * 100)}
        fmt={v => `${v}%`}
        onInput={v => {
          const ops = { ...rOps() }
          ops[part] = v / 100
          cfg.opacities = ops
          applyCustomTokens(ops)
          saveConfig()
        }}
        onChange={v => {
          const ops = { ...rOps() }
          ops[part] = v / 100
          setOps(ops)
        }} />
      {blurSlider(part)}
    </div>
  )

  return (
    <ErrorBoundary t={t}>
      <div style={ST.root}>
        <div style={ST.headerRow}>
          <div><h2 style={ST.h2}>{t('nav')}</h2><div style={ST.sub}>{t('subtitle')}</div></div>
          <div style={ST.row}>
            <button type="button" style={ST.btn} onClick={exportTheme}>{t('exportTheme')}</button>
            <button type="button" style={ST.btn} onClick={() => importRef.current?.click()}>{t('importTheme')}</button>
            <input ref={importRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={e => {
              const f = e.target.files?.[0]; if (!f) return
              void onImport(f); e.target.value = ''
            }} />
          </div>
        </div>
        {importMsg ? <div style={ST.colorHint}>{importMsg}</div> : null}

        {/* Theme color: wheel on the left, precise HSL/RGB entry on the right */}
        <div>
          <div style={ST.label}>{t('colorTitle')}</div>
          <div style={ST.wheelRow}>
            <ColorWheel hue={wheel[0]} sat={wheel[1]} lit={wheel[2]} onChange={setColor} />
            <ColorInputs hue={wheel[0]} sat={wheel[1]} lit={wheel[2]} onChange={setColor} />
          </div>
          <div style={ST.colorHint}>{t('colorHint')}</div>
          <div style={ST.btnGroup}>
            <button type="button"
              style={{ ...ST.btn, opacity: !storeUrl || extracting ? 0.55 : 1 }}
              title={!storeUrl ? t('extractNoWp') : undefined}
              disabled={!storeUrl || extracting}
              onClick={onExtract}>
              {extracting ? t('extracting') : t('extractColor')}
            </button>
            <button type="button"
              style={{ ...ST.btn, opacity: !storeUrl ? 0.55 : 1 }}
              title={!storeUrl ? t('extractNoWp') : undefined}
              disabled={!storeUrl}
              onClick={() => setPickerOpen(true)}>
              {t('eyedropper')}
            </button>
          </div>
          {extractMsg ? <div style={ST.colorHint}>{extractMsg}</div> : null}
        </div>

        <hr style={ST.hr} />

        {/* Interface: per-part homepage opacities + settings panel opacity */}
        <div>
          <div style={ST.label}>{t('uiTitle')}</div>
          <div style={ST.sliders}>
            {partSlider('uiOpacityBg', 'bg')}
            {partSlider('uiOpacitySide', 'sidebar')}
            {partSlider('uiOpacityCard', 'card')}
            <div style={ST.sliderBlock}>
              <div style={ST.sliderLabel}>{t('uiSop')}</div>
              <LiveSlider label={t('uiOpacity')} min={0} max={100} step={1} def={Math.round(rSop() * 100)}
                fmt={v => `${v}%`}
                onInput={v => { const op = v / 100; cfg.settingsOpacity = op; applySettingsOverrides(op); saveConfig() }}
                onChange={v => setSop(v / 100)} />
              {blurSlider('settings')}
            </div>
          </div>
        </div>

        <hr style={ST.hr} />

        {/* Background image */}
        <div>
          <div style={ST.label}>{t('bgTitle')}</div>
          <div style={ST.center}>{storeUrl ? <img src={storeUrl} alt="" style={ST.preview} onClick={() => setEditorOpen(true)} /> : null}</div>
          <div style={ST.btnGroup}>
            <div style={ST.row}>
              <button type="button" style={ST.btn} onClick={() => fileRef.current?.click()}>{t('bgChoose')}</button>
              {storeUrl ? <button type="button" style={ST.btn} onClick={() => setEditorOpen(true)}>{t('bgEdit')}</button> : null}
              {storeUrl ? <button type="button" style={{ ...ST.btn, ...ST.btnDanger }} onClick={() => setWp(null)}>{t('bgRemove')}</button> : null}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                const f = e.target.files?.[0]; if (!f) return
                readImg(f, d => { if (d) setWp(d); e.target.value = '' })
              }} />
            </div>
          </div>
          <div style={ST.sliders}>
            <div style={ST.sliderBlock}>
              <div style={ST.sliderLabel}>{t('wpOpacity')}</div>
              <LiveSlider min={0} max={100} step={1} def={Math.round(rWop() * 100)}
                fmt={v => `${v}%`}
                onInput={v => { const op = v / 100; cfg.wallpaperOpacity = op; setWpOpacity(op); saveConfig() }}
                onChange={v => setWop(v / 100)} />
            </div>
            <div style={ST.sliderBlock}>
              <div style={ST.sliderLabel}>{t('bgBlur')}</div>
              <LiveSlider min={0} max={60} step={1} def={rBl()}
                fmt={v => `${v}px`}
                onInput={v => { cfg.blur = v; setWpBlur(v); saveConfig() }}
                onChange={v => setBl(v)} />
            </div>
          </div>
          <div style={ST.hint}>{t('bgHint')}</div>
        </div>

        {/* Eyedropper modal: pick a theme color straight from the wallpaper */}
        {pickerOpen && storeUrl ? (
          <ColorPicker url={storeUrl} t={t} onClose={() => setPickerOpen(false)}
            onPick={hsv => { setColor(hsv[0], hsv[1], hsv[2]); setPickerOpen(false) }} />
        ) : null}

        {/* Background editor modal */}
        {editorOpen && storeUrl ? (
          <BgEditor url={storeUrl} t={t} onClose={() => setEditorOpen(false)}
            onCommit={(z, x, y, iw, ih) => { cfg.bgState = { zoom: z, x, y, iw, ih }; applyWp(); saveConfig(); setEditorOpen(false) }} />
        ) : null}
      </div>
    </ErrorBoundary>
  )
}
