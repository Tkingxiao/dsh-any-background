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
  /**
   * The overlay node is held in STATE rather than a plain ref, so the listener
   * effect below re-runs the moment it actually exists.
   *
   * This is not a style choice. Everything here renders through <Portal>, which
   * returns null on its first render — its own effect has to create the host
   * node under <html> first. A plain ref is therefore still null when a
   * mount-only effect runs, and an effect whose deps never change again attaches
   * nothing, ever. That is exactly how the touch handlers below ended up dead on
   * real phones: the wheel handler only survived because its deps churn on every
   * zoom/pan, so the wallpaper's img.onload re-ran it once and wired it up.
   */
  const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null)
  const dragRef = useRef({ active: false, sx: 0, sy: 0, spx: 0, spy: 0 })
  /** Unmount-time cleanup for a drag that never saw its mouseup (editor closed
   *  mid-drag): without it the document listeners stay attached forever and
   *  keep calling setPos on a dead component. */
  const dragStopRef = useRef<(() => void) | null>(null)
  /** Set once a gesture actually moved, so the click that follows a drag is not
   *  mistaken for a tap on the backdrop (mousedown and mouseup in different
   *  subtrees make the click land on the overlay, i.e. "outside"). Reset at the
   *  start of every gesture — touchstart / mousedown / wheel — so it can only
   *  ever describe the gesture that just ended, never an earlier one. */
  const movedRef = useRef(false)
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
    movedRef.current = false
    dragRef.current = { active: true, sx: e.clientX, sy: e.clientY, spx: pos.x, spy: pos.y }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.active) return
      if (Math.abs(ev.clientX - dragRef.current.sx) > 4 || Math.abs(ev.clientY - dragRef.current.sy) > 4) movedRef.current = true
      setPos({ x: dragRef.current.spx + ev.clientX - dragRef.current.sx, y: dragRef.current.spy + ev.clientY - dragRef.current.sy })
    }
    const stopDrag = () => {
      dragRef.current.active = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', stopDrag)
      dragStopRef.current = null
    }
    dragStopRef.current = stopDrag
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', stopDrag)
  }, [pos])

  // A drag ended by closing the editor never fires mouseup; drop the listeners
  // here so they cannot outlive this component.
  useEffect(() => () => { dragStopRef.current?.() }, [])

  const onWheelCb = useCallback((e: WheelEvent) => {
    e.preventDefault()
    movedRef.current = false
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    // Anchor the zoom at the preview center so the mouse position never
    // steers where the image grows/shrinks — the current view stays centered.
    const mx = rect.width / 2, my = rect.height / 2
    // 3% per wheel step (0.97 zoom-out / 1.03 zoom-in).
    const factor = e.deltaY > 0 ? 0.97 : 1.03
    // Read the live view from the mirror instead of closing over zoom/pos: that
    // keeps this handler identity-stable, so it is bound once rather than torn
    // down and re-bound on every zoom/pan frame.
    const { zoom: z, pos: p } = viewRef.current
    const nz = clampZoom(z * factor)
    const nx = mx - (mx - p.x) * (nz / z)
    const ny = my - (my - p.y) * (nz / z)
    setZoom(nz); setPos({ x: nx, y: ny })
  }, [])

  // ── Touch: one finger pans the preview, two fingers pinch-zoom (dragging them
  //  together pans at the same time). Three things are deliberate here:
  //
  //  1. The listeners hang off the OVERLAY, not the preview card. The card is
  //     only ~75% of a phone's width, so a pinch whose fingers land on the dimmed
  //     backdrop — the common case on a phone — used to be handed straight to the
  //     browser, which zoomed the page instead of the picture. Touch events
  //     bubble, and `TouchEvent.touches` lists every finger on the surface rather
  //     than only the target's own, so listening on the overlay also lets a pinch
  //     with one finger on the card and one on the backdrop work.
  //  2. They are attached natively with passive:false: React registers touchmove
  //     passively at the root, where preventDefault is a no-op — the page would
  //     pan and browser-zoom behind the open editor. A jsx onTouchMove prop
  //     cannot fix that, since it rides the same passive root listener.
  //  3. A one-finger pan only starts on the preview itself, so dragging the
  //     backdrop still reads as a tap-outside-to-close rather than silently
  //     shoving the wallpaper around.
  const onTouchStartCb = useCallback((e: TouchEvent) => {
    const card = containerRef.current
    if (!card) return
    movedRef.current = false
    if (e.touches.length >= 2) {
      // A second finger takes over from the pan and opens a pinch.
      touchDragRef.current = null
      const rect = card.getBoundingClientRect()
      const a = e.touches[0], b = e.touches[1]
      pinchRef.current = {
        dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        zoom: viewRef.current.zoom,
        cx: (a.clientX + b.clientX) / 2 - rect.left,
        cy: (a.clientY + b.clientY) / 2 - rect.top,
        px: viewRef.current.pos.x, py: viewRef.current.pos.y,
      }
      return
    }
    if (e.touches.length === 1) {
      // Start (or restart) a one-finger pan from the live transform.
      pinchRef.current = null
      if (!card.contains(e.target as Node)) { touchDragRef.current = null; return }
      const tp = e.touches[0]
      touchDragRef.current = { sx: tp.clientX, sy: tp.clientY, spx: viewRef.current.pos.x, spy: viewRef.current.pos.y }
    }
  }, [])

  const onTouchMoveCb = useCallback((e: TouchEvent) => {
    const card = containerRef.current
    if (!card) return
    if (e.touches.length >= 2 && pinchRef.current !== null) {
      e.preventDefault()
      movedRef.current = true
      const p = pinchRef.current
      // A zero spread (two fingers detected at one point) has no scale to derive.
      if (p.dist <= 0) return
      const rect = card.getBoundingClientRect()
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
      if (Math.abs(tp.clientX - d.sx) > 4 || Math.abs(tp.clientY - d.sy) > 4) movedRef.current = true
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

  // Bound once the overlay node exists — see the note on `overlayEl` above for
  // why keying this off a plain ref silently attached nothing.
  useEffect(() => {
    if (!overlayEl) return
    const noPageGesture = (e: Event): void => e.preventDefault()
    overlayEl.addEventListener('wheel', onWheelCb, { passive: false })
    overlayEl.addEventListener('touchstart', onTouchStartCb, { passive: false })
    overlayEl.addEventListener('touchmove', onTouchMoveCb, { passive: false })
    overlayEl.addEventListener('touchend', onTouchEndCb, { passive: false })
    overlayEl.addEventListener('touchcancel', onTouchEndCb, { passive: false })
    // WebKit's legacy page-zoom gestures (iOS). touch-action:none covers modern
    // iOS by itself; this is insurance for older in-app WebViews, where a
    // two-finger pinch would otherwise still scale the whole viewport.
    overlayEl.addEventListener('gesturestart', noPageGesture, { passive: false })
    overlayEl.addEventListener('gesturechange', noPageGesture, { passive: false })
    overlayEl.addEventListener('gestureend', noPageGesture, { passive: false })
    return () => {
      overlayEl.removeEventListener('wheel', onWheelCb)
      overlayEl.removeEventListener('touchstart', onTouchStartCb)
      overlayEl.removeEventListener('touchmove', onTouchMoveCb)
      overlayEl.removeEventListener('touchend', onTouchEndCb)
      overlayEl.removeEventListener('touchcancel', onTouchEndCb)
      overlayEl.removeEventListener('gesturestart', noPageGesture)
      overlayEl.removeEventListener('gesturechange', noPageGesture)
      overlayEl.removeEventListener('gestureend', noPageGesture)
    }
  }, [overlayEl, onWheelCb, onTouchStartCb, onTouchMoveCb, onTouchEndCb])

  const resetView = useCallback(() => {
    if (imgSize.w === 0) return
    setZoom(1); setPos({ x: (pw - imgSize.w) / 2, y: (ph - imgSize.h) / 2 })
  }, [pw, ph, imgSize])

  return (
    <Portal>
      <div
        ref={setOverlayEl}
        className="dab-overlay"
        style={{
          // The modal owns every gesture inside it: without this, a pinch or a
          // drag started on the dimmed backdrop is claimed by the browser, which
          // pinches the viewport and rubber-bands the page behind the editor.
          // Scoped to this overlay rather than the shared .dab-overlay class —
          // the color picker shares that class and must stay scrollable.
          touchAction: 'none', overscrollBehavior: 'contain',
        }}
        onClick={e => {
          // A pan that ended on the backdrop would otherwise fire a click whose
          // target is the nearest common ancestor — the overlay — and close the
          // editor, throwing away the adjustment mid-drag.
          if (movedRef.current) { movedRef.current = false; return }
          if (e.target === e.currentTarget) onClose()
        }}
        onMouseDown={() => { movedRef.current = false }}
      >
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
