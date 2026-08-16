import { useRef } from 'react'
import { ST } from '../styles'

export function LiveSlider({ min, max, step, def, fmt, label, onInput, onChange }: {
  min: number; max: number; step: number; def: number
  fmt: (v: number) => string; label?: string; onInput: (v: number) => void; onChange: (v: number) => void
}) {
  const valRef = useRef<HTMLSpanElement>(null)
  return (
    <div style={ST.sliderRow}>
      {label ? <span style={ST.sliderLabel}>{label}</span> : null}
      <input type="range" min={min} max={max} step={step} defaultValue={def} style={ST.slider}
        onInput={e => { const v = Number((e.target as HTMLInputElement).value); onInput(v); if (valRef.current) valRef.current.textContent = fmt(v) }}
        onChange={e => onChange(Number((e.target as HTMLInputElement).value))} />
      <span ref={valRef} style={ST.sliderVal}>{fmt(def)}</span>
    </div>
  )
}
