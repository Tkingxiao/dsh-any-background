import { useRef, useState, useEffect, useCallback } from 'react'
import { ST } from '../styles'
import { rgbToHsl, hslToHsv } from '../utils/color'

const MAG_SIZE = 96
const MAG_ZOOM = 8

function toHex(rgb: [number, number, number]): string {
  return '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('')
}

/**
 * Eyedropper modal: shows the wallpaper full-bleed (no drag/zoom) and lets the
 * user click any pixel to adopt it as the theme color. A magnifier circle
 * follows the cursor so small details can be picked precisely. The wallpaper
 * is a data URL, so sampling is CORS-free: draw it once to an offscreen-sized
 * canvas and read pixels via getImageData.
 */
export function ColorPicker({ url, t, onPick, onClose }: {
  url: string
  t: (key: string) => string
  onPick: (hsv: [number, number, number]) => void
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const magRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [ready, setReady] = useState(false)
  const [hover, setHover] = useState<{ rgb: [number, number, number] } | null>(null)
  const [mag, setMag] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => { imgRef.current = img; setReady(true) }
    img.src = url
  }, [url])

  useEffect(() => {
    if (!ready || !canvasRef.current || !imgRef.current) return
    const canvas = canvasRef.current
    canvas.width = imgRef.current.naturalWidth
    canvas.height = imgRef.current.naturalHeight
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.drawImage(imgRef.current, 0, 0)
  }, [ready])

  const sampleAt = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const sx = Math.round((clientX - rect.left) * (canvas.width / rect.width))
    const sy = Math.round((clientY - rect.top) * (canvas.height / rect.height))
    if (sx < 0 || sy < 0 || sx >= canvas.width || sy >= canvas.height) return null
    const d = ctx.getImageData(sx, sy, 1, 1).data
    return { sx, sy, rgb: [d[0], d[1], d[2]] as [number, number, number] }
  }, [])

  const drawMagnifier = useCallback((sx: number, sy: number) => {
    const mag = magRef.current
    const src = canvasRef.current
    if (!mag || !src) return
    const ctx = mag.getContext('2d')
    if (!ctx) return
    const half = MAG_SIZE / MAG_ZOOM / 2
    ctx.clearRect(0, 0, MAG_SIZE, MAG_SIZE)
    ctx.drawImage(src, sx - half, sy - half, half * 2, half * 2, 0, 0, MAG_SIZE, MAG_SIZE)
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(MAG_SIZE / 2, 0); ctx.lineTo(MAG_SIZE / 2, MAG_SIZE)
    ctx.moveTo(0, MAG_SIZE / 2); ctx.lineTo(MAG_SIZE, MAG_SIZE / 2)
    ctx.stroke()
  }, [])

  const onMove = (e: React.MouseEvent) => {
    const s = sampleAt(e.clientX, e.clientY)
    if (!s) { setHover(null); setMag(null); return }
    setHover({ rgb: s.rgb })
    drawMagnifier(s.sx, s.sy)
    const off = 28
    let x = e.clientX + off
    let y = e.clientY + off
    if (x + MAG_SIZE > window.innerWidth) x = e.clientX - off - MAG_SIZE
    if (y + MAG_SIZE > window.innerHeight) y = e.clientY - off - MAG_SIZE
    setMag({ x, y })
  }

  const onClick = (e: React.MouseEvent) => {
    const s = sampleAt(e.clientX, e.clientY)
    if (!s) return
    const [h, sl, l] = rgbToHsl(s.rgb[0], s.rgb[1], s.rgb[2])
    onPick(hslToHsv(h, sl, l))
  }

  return (
    <div style={ST.overlay}>
      <div style={ST.modalTitle}>{t('pickerTitle')}</div>
      <div style={ST.modalHint}>{t('pickerHint')}</div>
      <div style={ST.pickerBox}>
        <canvas ref={canvasRef} style={ST.pickerCanvas}
          onMouseMove={onMove}
          onMouseLeave={() => { setHover(null); setMag(null) }}
          onClick={onClick} />
      </div>
      <div style={ST.pickerBar}>
        <div style={{ ...ST.pickerSwatch, background: hover ? toHex(hover.rgb) : 'transparent' }} />
        <div style={ST.pickerValue}>{hover ? `${toHex(hover.rgb)} · rgb(${hover.rgb.join(', ')})` : '—'}</div>
      </div>
      <div style={ST.modalBtns}>
        <button type="button" style={ST.btn} onClick={onClose}>{t('pickerClose')}</button>
      </div>
      <canvas ref={magRef} width={MAG_SIZE} height={MAG_SIZE}
        style={{ ...ST.magnifier, left: mag?.x ?? 0, top: mag?.y ?? 0, opacity: mag ? 1 : 0 }} />
    </div>
  )
}
