/**
 * Hover highlight — "which real region does this slider actually control?" (issue #33 ②).
 *
 * DESIGN: it never writes to a host node. No class, no attribute, no inline style on
 * someone else's element, no z-index on a third-party surface (§2-G / §2-T). It draws
 * FIXED-position outline rectangles in one plugin-owned layer attached to <body>,
 * measured from `getBoundingClientRect()`. That makes the whole feature a single
 * removable node: `hideHighlight()` is its complete teardown (§2-O).
 *
 * The targets are supplied by the caller, which uses the plugin's OWN selectors and
 * `partHighlightElements()` — the same nodes its blur/opacity rules paint. A region
 * that is absent on the current page yields zero boxes and the settings card says so;
 * this is the honest answer to "some surfaces only exist once a conversation is open"
 * (the maintainer's reply on issue #33), not a guess about where they might be.
 *
 * POSITION UPDATES are event-driven (capture-phase `scroll` + `resize`), never rAF:
 * a hidden tab / occluded desktop window does not run frames, and a stale outline is
 * worse than none (§2-H).
 */
const LAYER_ID = 'dab-highlight-layer'

let layer: HTMLDivElement | null = null
let pairs: Array<{ box: HTMLDivElement; target: HTMLElement }> = []
let detach: (() => void) | null = null

function paint(): void {
  for (const { box, target } of pairs) {
    if (!target.isConnected) { box.style.display = 'none'; continue }
    const r = target.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) { box.style.display = 'none'; continue }
    box.style.display = ''
    box.style.left = `${r.left}px`
    box.style.top = `${r.top}px`
    box.style.width = `${r.width}px`
    box.style.height = `${r.height}px`
  }
}

/** Outline `elements` and name the first box. Returns how many regions were found;
 *  0 means "not on this page". Calling it twice in a row is safe (it tears down the
 *  previous layer first), which is what a fast mouse moving between cards does.
 *
 *  `tone` is the plugin's OWN effective interface scheme (`rScheme()`: forced
 *  override > picked theme color's lightness > wallpaper brightness verdict).
 *  The caller passes it in so this module stays a pure DOM layer with no business
 *  imports, and the CSS can pick the inverse plate — white on a dark interface,
 *  black on a light one. No invented color, so it cannot clash with the wallpaper. */
export function showHighlight(elements: HTMLElement[], name: string, tone: 'light' | 'dark'): number {
  hideHighlight()
  if (typeof document === 'undefined' || typeof window === 'undefined') return 0
  const unique = [...new Set(elements)].filter(el => el.isConnected)
  // A translucent plate per box means nested targets would STACK into an opaque
  // block (a code block inside the chat column, say). Keep only the outermost
  // element of each ancestor chain; siblings still each get their own box.
  const outer = unique.filter(el => !unique.some(other => other !== el && other.contains(el)))
  if (outer.length === 0) return 0

  layer = document.createElement('div')
  layer.id = LAYER_ID
  layer.className = 'dab-highlight-layer'
  layer.dataset.tone = tone
  for (const target of outer) {
    const box = document.createElement('div')
    box.className = 'dab-highlight-box'
    pairs.push({ box, target })
    layer.appendChild(box)
  }
  const tag = document.createElement('span')
  tag.className = 'dab-highlight-tag'
  tag.textContent = name
  pairs[0]!.box.appendChild(tag)
  document.body.appendChild(layer)
  paint()

  window.addEventListener('scroll', paint, true)
  window.addEventListener('resize', paint)
  detach = () => {
    window.removeEventListener('scroll', paint, true)
    window.removeEventListener('resize', paint)
  }
  return outer.length
}

/** Idempotent teardown: removes the layer, its listeners and every measured pair. */
export function hideHighlight(): void {
  detach?.()
  detach = null
  layer?.remove()
  layer = null
  pairs = []
}
