import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'

/**
 * Zero-lag slider: the thumb and value label update through DOM refs while
 * dragging (onInput) so the caller can mutate the live UI directly without a
 * React re-render; onChange commits the settled value. Double-click resets to
 * the canonical default. The track fill is a gradient driven by the --pct
 * custom property, updated imperatively alongside the thumb.
 */
export function LiveSlider({ min, max, step, def, fmt, label, onInput, onChange }: {
  min: number; max: number; step: number; def: number
  fmt: (v: number) => string; label?: string; onInput?: (v: number) => void; onChange: (v: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const valRef = useRef<HTMLSpanElement>(null)
  const numRef = useRef<HTMLInputElement>(null)

  const paint = (el: HTMLInputElement, v: number): void => {
    el.style.setProperty('--pct', String(((v - min) / (max - min)) * 100))
  }

  // Read the formatter through a ref: every caller passes an inline arrow
  // (`v => `${v}%``), whose identity changes per render. Listing `fmt` in the
  // effect deps would re-run this sync on EVERY parent render — and since the
  // sync writes inputRef.value from `def`, a mid-drag re-render (the 30s
  // schedule tick, a toast, a store sync) yanks the thumb back to the old
  // committed value. Only the numeric bounds may re-sync, never the closure.
  const fmtRef = useRef(fmt)
  fmtRef.current = fmt

  // Controlled sync: keep the knob and label aligned with the canonical prop
  // so external updates (presets, regeneration, imports) never leave it stale.
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = String(def)
      paint(inputRef.current, def)
    }
    if (valRef.current) valRef.current.textContent = fmtRef.current(def)
    if (numRef.current) numRef.current.value = String(def)
  }, [def, min, max])

  const apply = (v: number): void => {
    if (inputRef.current) {
      inputRef.current.value = String(v)
      paint(inputRef.current, v)
    }
    if (valRef.current) valRef.current.textContent = fmt(v)
    if (numRef.current) numRef.current.value = String(v)
    onInput?.(v)
    onChange(v)
  }

  return (
    <div className="dab-slider-block">
      {label ? <span className="dab-slider-label">{label}</span> : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          ref={inputRef} type="range" className="dab-slider"
          style={{ '--pct': ((def - min) / (max - min)) * 100 } as CSSProperties}
          min={min} max={max} step={step} defaultValue={def}
          title={label ? `${label} · ${fmt(def)}` : fmt(def)}
          onDoubleClick={() => apply(def)}
          onInput={e => {
            const el = e.target as HTMLInputElement
            const v = Number(el.value)
            paint(el, v)
            onInput?.(v)
            if (valRef.current) valRef.current.textContent = fmt(v)
            // The number field is a second view of the same value, not a second
            // source of truth — keep it in step with an imperative write so a drag
            // never triggers a React render (the whole point of this component).
            if (numRef.current) numRef.current.value = String(v)
          }}
          onChange={e => onChange(Number((e.target as HTMLInputElement).value))} />
        <span ref={valRef} className="dab-slider-val">{fmt(def)}</span>
        <input
          ref={numRef} type="number" className="dab-slider-num"
          min={min} max={max} step={step} defaultValue={def}
          title={label ? `${label} · ${min}–${max}` : `${min}–${max}`}
          aria-label={label}
          onChange={e => {
            const raw = e.currentTarget.value
            // An empty / mid-edit value is not a commit: leave the text alone so
            // typing "100" is not rewritten to "1" on the first keystroke.
            if (raw.trim() === '') return
            const n = Number(raw)
            if (!Number.isFinite(n)) return
            apply(Math.min(max, Math.max(min, n)))
          }}
          onBlur={e => {
            const raw = e.currentTarget.value
            const n = Number(raw)
            const v = raw.trim() === '' || !Number.isFinite(n)
              ? (inputRef.current ? Number(inputRef.current.value) : def)
              : Math.min(max, Math.max(min, n))
            e.currentTarget.value = String(v)
          }} />
      </div>
    </div>
  )
}
