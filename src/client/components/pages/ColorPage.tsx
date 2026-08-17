import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { ThemeSectionProps, ThemeStoreState } from '../../types'
import { hsvToHsl, hslToRgb, hslToHsv } from '../../utils/color'
import { ColorWheel } from '../ColorWheel'
import { ColorInputs } from '../ColorInputs'
import { ColorPicker } from '../ColorPicker'
import { PipetteIcon, SparkleIcon } from '../icons'

/** Curated quick-pick hues (HSL, s .72 l .55). */
const SWATCHES: Array<[number, number, number]> = [
  [356, 0.72, 0.55], [24, 0.78, 0.55], [44, 0.8, 0.55], [152, 0.62, 0.5],
  [174, 0.68, 0.48], [208, 0.72, 0.55], [252, 0.68, 0.6], [300, 0.64, 0.58],
]

function toHex(rgb: [number, number, number]): string {
  return '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
}

export function ColorPage({ p, notify }: { p: ThemeSectionProps; notify: (msg: string, ok?: boolean) => void }) {
  const { t, hue, sat, lit, setColor, extractColor, useStore } = p
  const store = useStore((s: ThemeStoreState) => s)
  const storeUrl = store.url
  const [pickerOpen, setPickerOpen] = useState(false)
  const [extracting, setExtracting] = useState(false)

  const wheel = (store.color ?? [hue, sat, lit]) as [number, number, number]
  const [h, s, l] = hsvToHsl(wheel[0], wheel[1], wheel[2])
  const [r, g, b] = hslToRgb(h, s, l)
  const hex = toHex([r, g, b])
  const soft = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.5)`
  const orbVars = { '--c': hex, '--c-soft': soft } as CSSProperties

  const onExtract = async () => {
    if (!storeUrl || extracting) return
    setExtracting(true)
    try {
      const ok = await extractColor()
      notify(ok ? t('extractDone') : t('extractFail'), ok)
    } catch {
      notify(t('extractFail'), false)
    } finally {
      setExtracting(false)
    }
  }

  return (
    <>
      <header className="dab-head dab-rise" style={{ '--d': 0 } as CSSProperties}>
        <div className="dab-overline">Accent</div>
        <h2 className="dab-h1">{t('colorTitle')}</h2>
        <p className="dab-desc">{t('descColor')}</p>
      </header>

      {/* Hero: living orb with a rotating conic halo + live HEX readout */}
      <section className="dab-card dab-card-hover dab-hero-accent dab-rise" style={{ '--d': 1 } as CSSProperties}>
        <div className="dab-orb-wrap" style={orbVars}>
          <div className="dab-orb-ring" />
          <div className="dab-orb" />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="dab-hex-caption">{t('hexCaption')}</div>
          <div className="dab-hex">{hex.toUpperCase()}</div>
          <div className="dab-hsl-row">
            <span>H <b>{Math.round(h)}°</b></span>
            <span>S <b>{Math.round(s * 100)}%</b></span>
            <span>L <b>{Math.round(l * 100)}%</b></span>
          </div>
          <div className="dab-chip-row" style={{ marginTop: 14 }}>
            <button type="button" className="dab-btn" disabled={!storeUrl || extracting} onClick={onExtract}>
              <SparkleIcon size={14} />{extracting ? t('extracting') : t('extractColor')}
            </button>
            <button type="button" className="dab-btn" disabled={!storeUrl} onClick={() => setPickerOpen(true)}>
              <PipetteIcon size={14} />{t('eyedropper')}
            </button>
          </div>
        </div>
      </section>

      {/* Wheel + precise entry */}
      <section className="dab-card dab-wheel-card dab-rise" style={{ '--d': 2 } as CSSProperties}>
        <div className="dab-wheel-glow" style={{ background: hex }} />
        <ColorWheel hue={wheel[0]} sat={wheel[1]} lit={wheel[2]} onChange={setColor} />
        <ColorInputs hue={wheel[0]} sat={wheel[1]} lit={wheel[2]} onChange={setColor} />
      </section>
      <p className="dab-hint dab-rise" style={{ '--d': 3 } as CSSProperties}>{t('colorHint')}</p>

      {/* Quick swatches */}
      <section className="dab-card dab-card-hover dab-rise" style={{ '--d': 3 } as CSSProperties}>
        <div className="dab-swatch-title">{t('swatchTitle')}</div>
        <div className="dab-swatches">
          {SWATCHES.map(([sh, ss, sl], i) => {
            // Circular hue distance via the (Δ+540)%360 trick. A swatch is "on"
            // only when the current color actually matches it (hue within 3°,
            // sat/lightness within 0.05). Picking a custom color in the wheel
            // clears the swatch selection instead of keeping it highlighted
            // based on hue proximity alone.
            const dist = Math.abs(((wheel[0] - sh + 540) % 360) - 180)
            const on = dist < 3 && Math.abs(s - ss) < 0.05 && Math.abs(l - sl) < 0.05
            return (
              <button
                key={i} type="button"
                className={`dab-swatch${on ? ' is-on' : ''}`}
                style={{ background: `hsl(${sh} ${Math.round(ss * 100)}% ${Math.round(sl * 100)}%)` }}
                title={toHex(hslToRgb(sh, ss, sl)).toUpperCase()}
                onClick={() => setColor(...hslToHsv(sh, ss, sl))} />
            )
          })}
        </div>
      </section>

      {/* Eyedropper modal */}
      {pickerOpen && storeUrl ? (
        <ColorPicker url={storeUrl} t={t} onClose={() => setPickerOpen(false)}
          onPick={hsv => { setColor(hsv[0], hsv[1], hsv[2]); setPickerOpen(false) }} />
      ) : null}
    </>
  )
}
