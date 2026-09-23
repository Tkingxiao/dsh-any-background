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
 * AND this popover is not owned by another group". Popovers are only ever
 * tagged/released on a change of that combined state, which makes the tag
 * self-consistent and idempotent.
 *
 * The one hazard is a popover that is open for an unrelated reason (a composer
 * menu, a hover card) *while* a header trigger stays expanded. Such a popover
 * is not a candidate: it is excluded by `ownsForeignSurface`, which skips any
 * popover carrying markers of a different slider group. In practice header
 * dropdowns are transient (opening one closes the others), so this is a guard
 * rather than the common path.
 *
 * @module
 */

import { hostAdapter } from './host-compat/capabilities'

/** Marker attribute the stylesheet keys on. */
export const HEADER_POPOVER_ATTR = 'data-dsh-any-header-popover'

/** Portaled popovers a header trigger can own. */
const POPOVER_SELECTOR = '[role="menu"], [role="tree"], [role="dialog"]'

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

/** Surfaces that belong to a different slider group and must never be claimed.
 *  `_denseList` without `_portal` is the in-place card-side dense menu, an
 *  `_ioCard`/`_menu`-classed body-level list belongs elsewhere, and a modal is
 *  its own surface. */
function ownsForeignSurface(el: Element): boolean {
  if (el.getAttribute('aria-modal') === 'true') return true
  // A list that is not directly under <body> is an in-place popover owned by
  // whatever subtree it lives in (composer menus), never the header.
  return el.parentElement !== document.body
}

let observer: MutationObserver | null = null
let raf: number | null = null

/** Recompute tags from the current open state. */
function refreshHeaderPopovers(): void {
  const open = headerTriggerOpen()
  const candidates = [...document.querySelectorAll(POPOVER_SELECTOR)].filter(el => !ownsForeignSurface(el))
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

function schedule(): void {
  if (raf !== null) return
  raf = window.requestAnimationFrame(() => {
    raf = null
    refreshHeaderPopovers()
  })
}

/** Start tagging. Returns a teardown that stops observing and clears markings. */
export function startHeaderPopoverTagging(): () => void {
  if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return () => {}
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
    observer?.disconnect()
    observer = null
    if (raf !== null) { window.cancelAnimationFrame(raf); raf = null }
    for (const el of document.querySelectorAll(`[${HEADER_POPOVER_ATTR}]`)) {
      el.removeAttribute(HEADER_POPOVER_ATTR)
    }
  }
}
