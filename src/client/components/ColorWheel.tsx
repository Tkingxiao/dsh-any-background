import { useRef, useState, useEffect, useCallback } from 'react'
import { ST } from '../styles'

const WHEEL_SIZE = 220
const CX = WHEEL_SIZE / 2
const RING_OUTER = 106
const RING_INNER = 82
// Square inscribed in the ring's inner circle: half-side = RING_INNER / √2,
// so the four corners sit exactly on the inner edge of the hue ring.
const SQ_HALF = Math.round(RING_INNER / Math.SQRT2)

function drawWheel(cvs: HTMLCanvasElement, hue: number, sat: number, lit: number): void {
  // Wheel coordinates are HSV (the S-V plane); props arrive in HSV from the
  // section. The HSL conversion happens at the setColor boundary.
  const c = cvs.getContext('2d')!
  c.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE)
  // Hue ring
  for (let a = 0; a < 360; a++) {
    const r1 = (a - 90) * Math.PI / 180
    const r2 = (a + 1.5 - 90) * Math.PI / 180
    c.beginPath(); c.arc(CX, CX, RING_OUTER, r1, r2); c.arc(CX, CX, RING_INNER, r2, r1, true); c.closePath()
    c.fillStyle = `hsl(${a},100%,50%)`; c.fill()
  }
  // SL square inside ring (HSV S-V plane)
  const gx = CX - SQ_HALF, gy = CX - SQ_HALF, sz = SQ_HALF * 2
  c.fillStyle = '#fff'; c.fillRect(gx, gy, sz, sz)
  const gh = c.createLinearGradient(gx, 0, gx + sz, 0)
  gh.addColorStop(0, 'rgba(255,255,255,1)'); gh.addColorStop(1, `hsl(${hue},100%,50%)`)
  c.fillStyle = gh; c.fillRect(gx, gy, sz, sz)
  const gv = c.createLinearGradient(0, gy, 0, gy + sz)
  gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(0,0,0,1)')
  c.fillStyle = gv; c.fillRect(gx, gy, sz, sz)
  // Hue marker on ring
  const hRad = (hue - 90) * Math.PI / 180
  const hR = (RING_OUTER + RING_INNER) / 2
  const hmx = CX + Math.cos(hRad) * hR, hmy = CX + Math.sin(hRad) * hR
  c.beginPath(); c.arc(hmx, hmy, 8, 0, Math.PI * 2)
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill()
  c.beginPath(); c.arc(hmx, hmy, 6.5, 0, Math.PI * 2)
  c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke()
  // SL marker (HSV coordinates)
  const smx = gx + sat * sz, smy = gy + (1 - lit) * sz
  c.beginPath(); c.arc(smx, smy, 7, 0, Math.PI * 2)
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill()
  c.beginPath(); c.arc(smx, smy, 5.5, 0, Math.PI * 2)
  c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke()
  c.beginPath(); c.arc(smx, smy, 3.5, 0, Math.PI * 2)
  c.strokeStyle = '#000'; c.lineWidth = 1; c.stroke()
}

function hitTest(x: number, y: number): 'ring' | 'square' | null {
  if (Math.abs(x - CX) <= SQ_HALF && Math.abs(y - CX) <= SQ_HALF) return 'square'
  const dx = x - CX, dy = y - CX
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist >= RING_INNER - 4 && dist <= RING_OUTER + 4) return 'ring'
  return null
}

function pickHue(x: number, y: number): number {
  let angle = Math.atan2(y - CX, x - CX) * 180 / Math.PI + 90
  if (angle < 0) angle += 360
  return angle
}

function pickSL(x: number, y: number): [number, number] {
  const gx = CX - SQ_HALF, gy = CX - SQ_HALF, sz = SQ_HALF * 2
  return [
    Math.max(0, Math.min(1, (x - gx) / sz)),
    Math.max(0.02, Math.min(0.98, 1 - (y - gy) / sz)),
  ]
}

export function ColorWheel({ hue, sat, lit, onChange }: {
  hue: number; sat: number; lit: number
  onChange: (h: number, s: number, l: number) => void
}) {
  const cvsRef = useRef<HTMLCanvasElement>(null)
  // Internal HSV state: the slots host caches injected section props once, so
  // the canvas must redraw from interaction state instead of from props.
  const [col, setCol] = useState({ hue, sat, lit })
  const colRef = useRef(col)
  colRef.current = col

  // Adopt external changes (e.g. section remount after theme restore).
  useEffect(() => {
    setCol(c => (c.hue === hue && c.sat === sat && c.lit === lit ? c : { hue, sat, lit }))
  }, [hue, sat, lit])

  useEffect(() => { if (cvsRef.current) drawWheel(cvsRef.current, col.hue, col.sat, col.lit) }, [col])

  const apply = useCallback((nh: number, ns: number, nl: number) => {
    setCol({ hue: nh, sat: ns, lit: nl })
    onChange(nh, ns, nl)
  }, [onChange])

  const onDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = cvsRef.current!.getBoundingClientRect()
    const x = e.clientX - r.left, y = e.clientY - r.top
    const region = hitTest(x, y)
    if (!region) return
    if (region === 'ring') {
      apply(pickHue(x, y), colRef.current.sat, colRef.current.lit)
    } else {
      const [s, l] = pickSL(x, y)
      apply(colRef.current.hue, s, l)
    }
    const onMove = (ev: MouseEvent) => {
      const rr = cvsRef.current!.getBoundingClientRect()
      const mx = ev.clientX - rr.left, my = ev.clientY - rr.top
      if (region === 'ring') {
        const d = Math.sqrt((mx - CX) ** 2 + (my - CX) ** 2)
        if (d >= RING_INNER - 10 && d <= RING_OUTER + 10) apply(pickHue(mx, my), colRef.current.sat, colRef.current.lit)
      } else {
        const [s, l] = pickSL(mx, my)
        apply(colRef.current.hue, s, l)
      }
    }
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
  }, [apply])

  return <canvas ref={cvsRef} width={WHEEL_SIZE} height={WHEEL_SIZE} style={ST.wheelCanvas} onMouseDown={onDown} />
}
