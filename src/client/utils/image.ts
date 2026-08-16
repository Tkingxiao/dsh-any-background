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
