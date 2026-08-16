import { useRef, useState, useEffect, useCallback } from 'react'
import { ST } from '../styles'
import { rBgState } from '../state'

export function BgEditor({ url, t, onClose, onCommit }: {
  url: string; t: (key: string) => string; onClose: () => void
  onCommit: (zoom: number, x: number, y: number, iw: number, ih: number) => void
}) {
  const pw = Math.min(window.innerWidth * 0.75, 860)
  const ph = Math.round(pw * window.innerHeight / window.innerWidth)
  const saved = rBgState()
  const [zoom, setZoom] = useState(saved.iw > 0 ? saved.zoom : 1)
  const [pos, setPos] = useState(saved.iw > 0 ? { x: saved.x * pw, y: saved.y * ph } : { x: 0, y: 0 })
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef({ active: false, sx: 0, sy: 0, spx: 0, spy: 0 })

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(pw / img.width, ph / img.height)
      const w = img.width * scale, h = img.height * scale
      setImgSize({ w, h })
      const s = rBgState()
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
    const factor = e.deltaY > 0 ? 0.92 : 1.08
    const nz = Math.max(0.1, Math.min(10, zoom * factor))
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

  const resetView = useCallback(() => {
    if (imgSize.w === 0) return
    setZoom(1); setPos({ x: (pw - imgSize.w) / 2, y: (ph - imgSize.h) / 2 })
  }, [pw, ph, imgSize])

  return (
    <div style={ST.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={ST.modalTitle}>{t('editorTitle')}</div>
      <div ref={containerRef} style={{ ...ST.previewRect, width: pw, height: ph }} onMouseDown={onDown}>
        <img ref={imgRef} src={url} alt="" draggable={false} style={{
          ...ST.previewImg, width: imgSize.w, height: imgSize.h,
          transform: `translate(${pos.x}px,${pos.y}px) scale(${zoom})`,
        }} />
      </div>
      <div style={ST.modalHint}>{t('editorHint')}</div>
      <div style={ST.modalBtns}>
        <button style={ST.btn} onClick={resetView}>{t('editorReset')}</button>
        <button style={ST.btn} onClick={onClose}>{t('editorCancel')}</button>
        <button style={{ ...ST.btn, ...ST.btnPrimary }} onClick={() => onCommit(zoom, (pos.x + imgSize.w * zoom / 2) / pw, (pos.y + imgSize.h * zoom / 2) / ph, imgRef.current?.naturalWidth ?? 0, imgRef.current?.naturalHeight ?? 0)}>{t('editorCommit')}</button>
      </div>
    </div>
  )
}
