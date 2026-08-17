import { useRef, useState, useEffect, useCallback, memo } from 'react'

const WHEEL_SIZE = 220
const CX = WHEEL_SIZE / 2
const RING_OUTER = 106
const RING_INNER = 82
// Square inscribed in the ring's inner circle: half-side = RING_INNER / √2,
// so the four corners sit exactly on the inner edge of the hue ring. The
// exact (un-rounded) value keeps the corners tangent to the ring — a rounded
// half-side would push the diagonals past the ring's inner boundary.
const SQ_HALF = RING_INNER / Math.SQRT2

/** Static hue ring cached once across all wheels. */
let ringCache: HTMLCanvasElement | null = null
function getRingCache(): HTMLCanvasElement {
  if (ringCache) return ringCache
  const cvs = document.createElement('canvas')
  cvs.width = WHEEL_SIZE; cvs.height = WHEEL_SIZE
  const c = cvs.getContext('2d')!
  // Instead of 360 separate arc paths, use a single conic gradient clipped to
  // the ring. This removes per-frame path overhead and anti-aliasing gaps.
  const g = c.createConicGradient(0, CX, CX)
  for (let i = 0; i <= 360; i++) g.addColorStop(i / 360, `hsl(${i},100%,50%)`)
  c.beginPath()
  c.arc(CX, CX, RING_OUTER, 0, Math.PI * 2)
  c.arc(CX, CX, RING_INNER, 0, Math.PI * 2, true)
  c.fillStyle = g
  c.fill()
  ringCache = cvs
  return ringCache
}

function drawMarkers(ctx: CanvasRenderingContext2D, hue: number, sat: number, lit: number): void {
  // Hue marker on ring. Canvas math angles (0 = +x / "3 o'clock", positive =
  // toward +y) directly match the conic-gradient hue distribution drawn in
  // getRingCache (colorStop i/360 → hsl(i)), so NO extra ±90° shift is applied.
  // A shift would rotate the picker's indication 90° away from the rendered
  // gradient (e.g. picking the top of the wheel would report red while the
  // pixels there are blue). hue 0 sits at the right edge, +90° at the bottom.
  const hRad = hue * Math.PI / 180
  const hR = (RING_OUTER + RING_INNER) / 2
  const hmx = CX + Math.cos(hRad) * hR
  const hmy = CX + Math.sin(hRad) * hR
  ctx.beginPath(); ctx.arc(hmx, hmy, 8, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill()
  ctx.beginPath(); ctx.arc(hmx, hmy, 6.5, 0, Math.PI * 2)
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()

  // SL marker (HSV coordinates)
  const gx = CX - SQ_HALF, gy = CX - SQ_HALF, sz = SQ_HALF * 2
  const smx = gx + sat * sz
  const smy = gy + (1 - lit) * sz
  ctx.beginPath(); ctx.arc(smx, smy, 7, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill()
  ctx.beginPath(); ctx.arc(smx, smy, 5.5, 0, Math.PI * 2)
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()
  ctx.beginPath(); ctx.arc(smx, smy, 3.5, 0, Math.PI * 2)
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke()
}

function drawSquare(c: CanvasRenderingContext2D, hue: number): void {
  const gx = CX - SQ_HALF, gy = CX - SQ_HALF, sz = SQ_HALF * 2
  c.clearRect(gx - 1, gy - 1, sz + 2, sz + 2)
  c.fillStyle = '#fff'; c.fillRect(gx, gy, sz, sz)
  const gh = c.createLinearGradient(gx, 0, gx + sz, 0)
  gh.addColorStop(0, 'rgba(255,255,255,1)'); gh.addColorStop(1, `hsl(${hue},100%,50%)`)
  c.fillStyle = gh; c.fillRect(gx, gy, sz, sz)
  const gv = c.createLinearGradient(0, gy, 0, gy + sz)
  gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(0,0,0,1)')
  c.fillStyle = gv; c.fillRect(gx, gy, sz, sz)
}

function hitTest(x: number, y: number): 'ring' | 'square' | null {
  if (Math.abs(x - CX) <= SQ_HALF && Math.abs(y - CX) <= SQ_HALF) return 'square'
  const dx = x - CX, dy = y - CX
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist >= RING_INNER - 4 && dist <= RING_OUTER + 4) return 'ring'
  return null
}

function pickHue(x: number, y: number): number {
  // Inverse of drawMarkers: no ±90° shift, matching the conic gradient exactly.
  let angle = Math.atan2(y - CX, x - CX) * 180 / Math.PI
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

export const ColorWheel = memo(function ColorWheel({ hue, sat, lit, onChange }: {
  hue: number; sat: number; lit: number
  onChange: (h: number, s: number, l: number) => void
}) {
  const cvsRef = useRef<HTMLCanvasElement>(null)
  const [col, setCol] = useState({ hue, sat, lit })
  const colRef = useRef(col)
  colRef.current = col

  // Adopt external changes (e.g. section remount after theme restore).
  useEffect(() => {
    setCol(c => (c.hue === hue && c.sat === sat && c.lit === lit ? c : { hue, sat, lit }))
  }, [hue, sat, lit])

  // Redraw only what changed. The static ring is copied from cache; the square
  // only redraws when hue changes; markers redraw on every value change.
  useEffect(() => {
    const cvs = cvsRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')!
    ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE)
    // Draw the square first, then the ring on top: the ring's opaque pixels
    // cover the square's four corners (which are tangent to the ring's inner
    // edge), so the corners no longer visually overlap the hue ring.
    drawSquare(ctx, col.hue)
    ctx.drawImage(getRingCache(), 0, 0)
    drawMarkers(ctx, col.hue, col.sat, col.lit)
  }, [col])

  // Batch pointer updates in a single rAF so rapid mousemove events do not
  // trigger a React state flush + onChange on every pixel.
  const pendingRef = useRef<{ h: number; s: number; l: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  const flushPending = useCallback(() => {
    rafRef.current = null
    const p = pendingRef.current
    if (!p) return
    pendingRef.current = null
    setCol({ hue: p.h, sat: p.s, lit: p.l })
    onChange(p.h, p.s, p.l)
  }, [onChange])

  const schedule = useCallback((h: number, s: number, l: number) => {
    pendingRef.current = { h, s, l }
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(flushPending)
  }, [flushPending])

  const onDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = cvsRef.current!.getBoundingClientRect()
    const x = e.clientX - r.left, y = e.clientY - r.top
    const region = hitTest(x, y)
    if (!region) return
    if (region === 'ring') {
      schedule(pickHue(x, y), colRef.current.sat, colRef.current.lit)
    } else {
      const [s, l] = pickSL(x, y)
      schedule(colRef.current.hue, s, l)
    }
    const onMove = (ev: MouseEvent) => {
      const rr = cvsRef.current!.getBoundingClientRect()
      const mx = ev.clientX - rr.left, my = ev.clientY - rr.top
      if (region === 'ring') {
        const d = Math.sqrt((mx - CX) ** 2 + (my - CX) ** 2)
        if (d >= RING_INNER - 10 && d <= RING_OUTER + 10) schedule(pickHue(mx, my), colRef.current.sat, colRef.current.lit)
      } else {
        const [s, l] = pickSL(mx, my)
        schedule(colRef.current.hue, s, l)
      }
    }
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
  }, [schedule])

  return <canvas ref={cvsRef} width={WHEEL_SIZE} height={WHEEL_SIZE} className="dab-wheel" onMouseDown={onDown} />
})
