/**
 * Header-surface tagging.
 *
 * WHY A RUNTIME TAG IS NEEDED
 * The session-header dropdowns (open-in-app, session-log, Agent Team, the job
 * list, the subagent lineage tree) render their popover through the Menu/tree
 * primitives, which PORTAL the list to `document.body`. A portaled list is not a
 * DOM descendant of the header — no ancestor selector can reach it — and the
 * primitive emits no `id`/`aria-controls` back-link to its anchor either. Pure
 * CSS class matching was the remaining option, but 0.1.7 broke the shapes this
 * plugin relied on: open-in-app moved from in-place to `portal` (so the old
 * `:not(_portal)` discriminator no longer selected it), and the session row menu
 * became a dynamic `sidebar.workspaces.session.menu.item` slot whose rows are no
 * longer guaranteed to include a destructive one.
 *
 * THE SIGNAL
 * The slot renderer stamps every registered slot with `data-slot="<key>"`
 * (ui-renderer `scoped-slots.tsx`). Those anchors live in the header subtree, so
 * the plugin can detect when a header trigger is expanded — which keys identify
 * the header is a per-release fact and comes from the host adapter, not from a
 * hardcoded list here.
 *
 * WHY NOT GEOMETRY
 * A tempting link is the inline position the primitive writes on a portaled list
 * (`style="left: …; top: …"`). It was tried and REJECTED: an `align="end"` list
 * is flush to the trigger's right edge while the trigger itself sits at the far
 * right of the header, so the two boxes often do not overlap horizontally (in
 * the reported DOM the list is at `left:1012` with the trigger near x=1400). Any
 * purely geometric proximity test therefore misses real header menus.
 *
 * THE ACTUAL RULE (structural, no geometry, no timing)
 * A header dropdown can only be open while its trigger reports
 * `aria-expanded="true"`, and opening one is what mounts the popover. So a
 * popover tag is maintained as: "there is at least one expanded header trigger,
 * AND this popover is a header candidate" — see `isHeaderSurface` for the two
 * shapes that qualify (portaled to `<body>`, or mounted inside one of the
 * header's own slot anchors) and for what stays foreign. Popovers are only ever
 * tagged/released on a change of that combined state, which makes the tag
 * self-consistent and idempotent.
 *
 * The one hazard is a popover that is open for an unrelated reason (a composer
 * menu, a hover card) *while* a header trigger stays expanded. Such a popover is
 * not a candidate: it is neither portaled nor a descendant of a header anchor,
 * and the composer's in-place lists keep belonging to the card group. In practice
 * header dropdowns are transient (opening one closes the others), so this is a
 * guard rather than the common path.
 *
 * THE SURFACE MARKER IS PART OF THE CANDIDATE SET (`0.2.1-alpha.3` and up).
 * That release moved the background-job list onto the shared `MenuSurface`, whose
 * root carries NO role — the `<ul>` inside it is now a paint-free `.menuBody`
 * (`JobListAction.module.css` dropped its own `background`/`backdrop-filter`), and
 * the fill plus the frost live on the surface's `.material` child. Keyed on roles
 * alone the tagger went blind exactly when the paint moved one level up, and the
 * job list kept the stock look. `data-menu-material` is the surface's own semantic
 * marker (`MenuSurface.tsx`), so the tag rides it: the tokens land on the surface
 * root, which is the nearest ancestor of `.material`, and inherit down into it.
 * The pre-migration shape (a self-painting `<ul class*="_menu">`) stays matched by
 * the header group's class-shape arm, so both eras are styled by one rule set.
 *
 * @module
 */

import { hostAdapter } from './host-compat/capabilities'

/** Marker attribute the stylesheet keys on. */
export const HEADER_POPOVER_ATTR = 'data-dsh-any-header-popover'

/** Portaled popovers a header trigger can own. */
const POPOVER_SELECTOR = '[role="menu"], [role="tree"], [role="dialog"], [data-menu-material]'

/** Which session-header slot anchors to watch — supplied by the host adapter,
 *  because the set is not the same on every release: 0.1.6-alpha.2 registers a
 *  sixth (`.leading`) that neither the line before nor the line after has.
 *  Memoised on the array identity, which the adapter keeps stable until the
 *  release verdict lands. */
let slotAnchorCache: { keys: readonly string[]; selector: string } | null = null
function headerSlotAnchors(): string {
  const keys = hostAdapter().surface.headerSlotKeys
  if (slotAnchorCache === null || slotAnchorCache.keys !== keys) {
    slotAnchorCache = { keys, selector: keys.map(key => `[data-slot="${key}"]`).join(',') }
  }
  return slotAnchorCache.selector
}

/** Whether any header slot anchor has an expanded trigger. */
function headerTriggerOpen(): boolean {
  for (const anchor of document.querySelectorAll(headerSlotAnchors())) {
    if (anchor.querySelector('[aria-expanded="true"]') !== null) return true
  }
  return false
}

/** Whether this popover can belong to the header.
 *
 *  Two shapes, and the second one is the reason this is not just "portaled to body":
 *  `session-log-export/HeaderAction.tsx` renders its `Menu` WITHOUT the `portal` prop,
 *  so the card is mounted in place, inside `[data-slot="conversation.session.header
 *  .utilities"]` — a DOM descendant of the row, exactly where a header trigger's own
 *  popover belongs. Keyed on `parentElement === body` alone it was never claimable, and
 *  the only thing that styled it at all was the header group's
 *  `[role="menu"][class*="_denseList"]:not([class*="_portal"])` arm — which dies the
 *  moment the host drops `dense` (or adds a header popover that is not a dense menu),
 *  and leaves the surface following the card slider while it sits in the title row.
 *
 *  A popover that is neither portaled nor inside a header anchor stays foreign: that is
 *  the composer's in-place lists (permission / command / model), which the card group
 *  owns and this group must never reach. */
function isHeaderSurface(el: Element): boolean {
  // A modal is its own surface whatever it is nested in.
  if (el.getAttribute('aria-modal') === 'true') return false
  return el.parentElement === document.body || el.closest(headerSlotAnchors()) !== null
}

let observer: MutationObserver | null = null
let pending: Promise<void> | null = null
/** False once the effect is torn down, so a pass already queued on the microtask queue
 *  cannot re-mark a popover after the teardown cleared it. */
let active = false

/** Coalesce the observer's batches into ONE pass, but flush it on the microtask queue
 *  rather than a animation frame.
 *
 *  The frame version was the bug, not the batching: `requestAnimationFrame` callbacks
 *  do not run while a window is not rendering — a hidden tab, an occluded or minimized
 *  desktop window, a background Electron surface — and a queued frame never fires, so
 *  the tag never lands and the 「顶栏选项」 pair silently keeps whatever the card group
 *  gave the panel. Observed live: with the page not painting, an open header menu stayed
 *  `data-dsh-any-header-popover`-less indefinitely, and the same menu was tagged the
 *  moment rAF was made to run. A `MutationObserver` callback is already delivered once
 *  per batch at microtask time, so a microtask flush coalesces exactly as well and has no
 *  dependency on the compositor at all — and it lands in the SAME frame the popover
 *  mounts, which also removes the one-frame flash of card styling on open. */
function schedule(): void {
  if (pending !== null || !active) return
  pending = Promise.resolve().then(() => {
    pending = null
    if (active) refreshHeaderPopovers()
  })
}

/** Recompute tags from the current open state. */
function refreshHeaderPopovers(): void {
  const open = headerTriggerOpen()
  const candidates = [...document.querySelectorAll(POPOVER_SELECTOR)].filter(isHeaderSurface)
  if (!open) {
    for (const el of document.querySelectorAll(`[${HEADER_POPOVER_ATTR}]`)) {
      el.removeAttribute(HEADER_POPOVER_ATTR)
    }
    return
  }
  // A header dropdown is open: claim body-level popovers, releasing any that
  // stopped being candidates (detached, or re-classified as foreign).
  for (const el of candidates) el.setAttribute(HEADER_POPOVER_ATTR, '')
  for (const el of document.querySelectorAll(`[${HEADER_POPOVER_ATTR}]`)) {
    if (!candidates.includes(el)) el.removeAttribute(HEADER_POPOVER_ATTR)
  }
}

/** Start tagging. Returns a teardown that stops observing and clears markings. */
export function startHeaderPopoverTagging(): () => void {
  if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return () => {}
  active = true
  refreshHeaderPopovers()
  observer = new MutationObserver(schedule)
  // Attribute + childList across the body subtree: a popover mounting and an
  // `aria-expanded` flipping both land here. Character data is irrelevant.
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-expanded'],
  })
  return () => {
    active = false
    observer?.disconnect()
    observer = null
    for (const el of document.querySelectorAll(`[${HEADER_POPOVER_ATTR}]`)) {
      el.removeAttribute(HEADER_POPOVER_ATTR)
    }
  }
}
