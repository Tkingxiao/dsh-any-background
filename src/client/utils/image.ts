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

/** Blob → data URL (used when a local asset must be embedded, e.g. theme export). */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result as string)
    fr.onerror = () => reject(fr.error)
    fr.readAsDataURL(blob)
  })
}

// Shared decoded-image cache. The boot path decodes the same wallpaper URL up
// to four times (palette extract, brightness verdict, low-res capture,
// intrinsic size); memoizing the decoded element turns those into one decode.
const IMG_CACHE_MAX = 6
const imgCache = new Map<string, Promise<HTMLImageElement | null>>()

/** Decode an image URL once and share the element across callers (LRU-capped). */
export function loadImage(url: string): Promise<HTMLImageElement | null> {
  const hit = imgCache.get(url)
  if (hit) {
    imgCache.delete(url)
    imgCache.set(url, hit)
    return hit
  }
  const p = new Promise<HTMLImageElement | null>(resolve => {
    const img = new Image()
    img.onerror = () => resolve(null)
    img.onload = () => resolve(img)
    img.src = url
  })
  imgCache.set(url, p)
  while (imgCache.size > IMG_CACHE_MAX) {
    const oldest = imgCache.keys().next().value
    if (oldest !== undefined) imgCache.delete(oldest)
  }
  return p
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
