/**
 * Read a chosen image file as a data URL WITHOUT re-encoding: the original
 * pixels are kept as-is (no canvas downscale / JPEG re-compression), so the
 * wallpaper is stored and displayed at full fidelity. The tradeoff is a larger
 * payload over the RPC channel and on disk for big images.
 */
export function readImg(file: File, cb: (url: string | null) => void): void {
  const r = new FileReader()
  r.onerror = () => cb(null)
  r.onload = () => cb(r.result as string)
  r.readAsDataURL(file)
}

/** Promised readImg variant for async flows. */
export function readImgAsync(file: File): Promise<string | null> {
  return new Promise(resolve => readImg(file, resolve))
}

/** Build a small JPEG thumbnail (rotation-pool picker preview). Resolves null
 *  when the image cannot be decoded. */
export function makeThumb(dataUrl: string, maxSide = 96): Promise<string | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.onerror = () => resolve(null)
    img.onload = () => {
      try {
        const iw = img.naturalWidth || img.width
        const ih = img.naturalHeight || img.height
        if (iw <= 0 || ih <= 0) { resolve(null); return }
        const k = Math.min(1, maxSide / Math.max(iw, ih))
        const c = document.createElement('canvas')
        c.width = Math.max(1, Math.round(iw * k))
        c.height = Math.max(1, Math.round(ih * k))
        const g = c.getContext('2d')
        if (!g) { resolve(null); return }
        g.drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', 0.72))
      } catch {
        resolve(null)
      }
    }
    img.src = dataUrl
  })
}
