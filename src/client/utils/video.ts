/**
 * Video-background helpers: capturing a single frame as a JPEG snapshot.
 * The snapshot stands in for everything that only understands still images:
 * the settings preview, theme-color extraction and the eyedropper. Uploads
 * stream the raw file over the binary upload route (see rpc.uploadVideo) —
 * a data-URL detour would inflate the bytes and trip the RPC body limit.
 */

function grabFrame(v: HTMLVideoElement): string | null {
  const w = v.videoWidth, h = v.videoHeight
  if (w <= 0 || h <= 0) return null
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(v, 0, 0, w, h)
  try {
    return canvas.toDataURL('image/jpeg', 0.85)
  } catch {
    return null
  }
}

/**
 * Capture one representative frame from a video data URL as a JPEG data URL.
 * Seeks to ~10% of the duration (first frame is often black) and waits for
 * the seek to land; resolves null when the video cannot be decoded. A timeout
 * keeps a broken file from hanging the upload flow.
 */
export function captureVideoSnapshot(url: string): Promise<string | null> {
  return new Promise(resolve => {
    const v = document.createElement('video')
    let settled = false
    const done = (r: string | null): void => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      v.removeAttribute('src')
      v.load()
      resolve(r)
    }
    const timer = window.setTimeout(() => done(grabFrame(v)), 6000)
    v.muted = true
    v.preload = 'auto'
    v.playsInline = true
    v.onerror = () => done(null)
    v.onloadeddata = () => {
      // Prefer a frame slightly into the clip; very short clips seek to half.
      const target = isFinite(v.duration) && v.duration > 0.6 ? Math.min(v.duration * 0.1, 2) : 0
      if (target <= 0) { done(grabFrame(v)); return }
      v.onseeked = () => done(grabFrame(v))
      try {
        v.currentTime = target
      } catch {
        done(grabFrame(v))
      }
    }
    v.src = url
  })
}
