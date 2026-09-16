import { useRef, useState, useEffect, useCallback } from 'react'
import { cfg } from '../state'
import { Portal } from './Portal'

/** Placement slot for the active background type: video framing lives in its
 *  own state so image and video edits never overwrite each other. */
const activeState = () => cfg.backgroundType === 'video' ? cfg.videoBgState : cfg.bgState

/** Zoom is shared by every input path (wheel + pinch) so all pictures animate
 *  between the same bounds. */
const clampZoom = (z: number): number => Math.max(0.1, Math.min(10, z))

export function BgEditor({ url, t, onClose, onCommit }: {
  url: string; t: (key: string) => string; onClose: () => void
  onCommit: (zoom: number, x: number, y: number, iw: number, ih: number) => void
}) {
  const pw = Math.min(window.innerWidth * 0.75, 860)
  const ph = Math.round(pw * window.innerHeight / window.innerWidth)
  const saved = activeState()
  const [zoom, setZoom] = useState(saved.iw > 0 ? saved.zoom : 1)
  const [pos, setPos] = useState(saved.iw > 0 ? { x: saved.x * pw, y: saved.y * ph } : { x: 0, y: 0 })
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef({ active: false, sx: 0, sy: 0, spx: 0, spy: 0 })
  // Latest view for the natively-attached touch listeners below — they are
  // attached once (rather than re-bound every render) and read the current
  // zoom/offset from this mirror.
  const viewRef = useRef({ zoom, pos })
  viewRef.current = { zoom, pos }
  /** Pinch gesture baseline (two fingers down): finger spread + midpoint and
   *  the transform that was live at that moment. */
  const pinchRef = useRef<{ dist: number; zoom: number; cx: number; cy: number; px: number; py: number } | null>(null)
  /** Single-finger pan baseline. */
  const touchDragRef = useRef<{ sx: number; sy: number; spx: number; spy: number } | null>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(pw / img.width, ph / img.height)
      const w = img.width * scale, h = img.height * scale
      setImgSize({ w, h })
      const s = activeState()
      if (s.iw > 0 && s.iw === img.width && s.ih === img.height) {
        setZoom(s.zoom)
        // Saved x, y are CENTER fractions of the preview: the image center
        // lands at (x·pw, y·ph), so the top-left comes from subtracting half
        // the displayed (zoom-scaled) image size.
        setPos({ x: s.x * pw - w * s.zoom / 2, y: s.y * ph - h * s.zoom / 2 })
      } else {
        setZoom(1)
        setPos({ x: (pw - w) / 2, y: (ph - h) / 2 })
      }
    }
    img.src = url
  }, [url, pw, ph])

  const onDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { active: true, sx: e.clientX, sy: e.clientY, spx: pos.x, spy: pos.y }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.active) return
      setPos({ x: dragRef.current.spx + ev.clientX - dragRef.current.sx, y: dragRef.current.spy + ev.clientY - dragRef.current.sy })
    }
    const onUp = () => { dragRef.current.active = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
  }, [pos])

  const onWheelCb = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    // Anchor the zoom at the preview center so the mouse position never
    // steers where the image grows/shrinks — the current view stays centered.
    const mx = rect.width / 2, my = rect.height / 2
    // 3% per wheel step (0.97 zoom-out / 1.03 zoom-in).
    const factor = e.deltaY > 0 ? 0.97 : 1.03
    const nz = clampZoom(zoom * factor)
    const nx = mx - (mx - pos.x) * (nz / zoom)
    const ny = my - (my - pos.y) * (nz / zoom)
    setZoom(nz); setPos({ x: nx, y: ny })
  }, [zoom, pos])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', onWheelCb, { passive: false })
    return () => el.removeEventListener('wheel', onWheelCb)
  }, [onWheelCb])

  // ── Touch: one finger pans, two fingers pinch-zoom (dragging them together
  //  pans at the same time). These are attached natively with passive:false:
  //  React registers touchmove passively at the root, where preventDefault is
  //  a no-op — the page would pan and browser-zoom behind the open editor.
  //  touch-action:none on the container covers the same ground declaratively.
  const onTouchStartCb = useCallback((e: TouchEvent) => {
    const el = containerRef.current
    if (!el) return
    if (e.touches.length === 1) {
      // Start (or restart) a one-finger pan from the live transform.
      pinchRef.current = null
      const tp = e.touches[0]
      touchDragRef.current = { sx: tp.clientX, sy: tp.clientY, spx: viewRef.current.pos.x, spy: viewRef.current.pos.y }
      return
    }
    if (e.touches.length >= 2) {
      // A second finger takes over from the pan and opens a pinch.
      touchDragRef.current = null
      const rect = el.getBoundingClientRect()
      const a = e.touches[0], b = e.touches[1]
      pinchRef.current = {
        dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        zoom: viewRef.current.zoom,
        cx: (a.clientX + b.clientX) / 2 - rect.left,
        cy: (a.clientY + b.clientY) / 2 - rect.top,
        px: viewRef.current.pos.x, py: viewRef.current.pos.y,
      }
    }
  }, [])

  const onTouchMoveCb = useCallback((e: TouchEvent) => {
    const el = containerRef.current
    if (!el) return
    if (e.touches.length >= 2 && pinchRef.current !== null) {
      e.preventDefault()
      const p = pinchRef.current
      // A zero spread (two fingers detected at one point) has no scale to derive.
      if (p.dist <= 0) return
      const rect = el.getBoundingClientRect()
      const a = e.touches[0], b = e.touches[1]
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      const cx = (a.clientX + b.clientX) / 2 - rect.left
      const cy = (a.clientY + b.clientY) / 2 - rect.top
      const nz = clampZoom(p.zoom * (dist / p.dist))
      // Keep the image point that started under the fingers pinned to them:
      // at gesture start it sat at base coord (c0 - t0)/z0, and after zooming
      // to z1 the offset must place it back under the current midpoint. Both
      // the scale change AND a two-finger drag fall out of this one relation.
      setZoom(nz)
      setPos({ x: cx - ((p.cx - p.px) / p.zoom) * nz, y: cy - ((p.cy - p.py) / p.zoom) * nz })
      return
    }
    if (e.touches.length === 1 && touchDragRef.current !== null) {
      e.preventDefault()
      const d = touchDragRef.current
      const tp = e.touches[0]
      setPos({ x: d.spx + tp.clientX - d.sx, y: d.spy + tp.clientY - d.sy })
    }
  }, [])

  const onTouchEndCb = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      // Two fingers → one: re-baseline the pan against the finger left down,
      // or lifting one finger would snap the picture back by its offset.
      const tp = e.touches[0]
      touchDragRef.current = { sx: tp.clientX, sy: tp.clientY, spx: viewRef.current.pos.x, spy: viewRef.current.pos.y }
      pinchRef.current = null
    } else if (e.touches.length === 0) {
      touchDragRef.current = null
      pinchRef.current = null
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('touchstart', onTouchStartCb, { passive: false })
    el.addEventListener('touchmove', onTouchMoveCb, { passive: false })
    el.addEventListener('touchend', onTouchEndCb, { passive: false })
    el.addEventListener('touchcancel', onTouchEndCb, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onTouchStartCb)
      el.removeEventListener('touchmove', onTouchMoveCb)
      el.removeEventListener('touchend', onTouchEndCb)
      el.removeEventListener('touchcancel', onTouchEndCb)
    }
  }, [onTouchStartCb, onTouchMoveCb, onTouchEndCb])

  const resetView = useCallback(() => {
    if (imgSize.w === 0) return
    setZoom(1); setPos({ x: (pw - imgSize.w) / 2, y: (ph - imgSize.h) / 2 })
  }, [pw, ph, imgSize])

  return (
    <Portal>
      <div className="dab-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="dab-overlay-title">{t('editorTitle')}</div>
        <div ref={containerRef} className="dab-modal-card" style={{
          position: 'relative', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: 12, background: '#000', cursor: 'grab', width: pw, height: ph,
          // Hand the area's default pan/pinch gestures to the touch handlers
          // above: without this the page scrolls and the browser pinch-zooms
          // the viewport instead of scaling the picture.
          touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none',
        }} onMouseDown={onDown}>
          <img ref={imgRef} src={url} alt="" draggable={false} style={{
            position: 'absolute', transformOrigin: '0 0', pointerEvents: 'none',
            width: imgSize.w, height: imgSize.h,
            transform: `translate(${pos.x}px,${pos.y}px) scale(${zoom})`,
          }} />
        </div>
        <div className="dab-overlay-hint">{t('editorHint')}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="dab-btn" onClick={resetView}>{t('editorReset')}</button>
          <button type="button" className="dab-btn" onClick={onClose}>{t('editorCancel')}</button>
          <button type="button" className="dab-btn" onClick={() => onCommit(zoom, (pos.x + imgSize.w * zoom / 2) / pw, (pos.y + imgSize.h * zoom / 2) / ph, imgRef.current?.naturalWidth ?? 0, imgRef.current?.naturalHeight ?? 0)}>{t('editorCommit')}</button>
        </div>
      </div>
    </Portal>
  )
}
