/**
 * One MutationObserver for every body-subtree watch the plugin runs.
 *
 * The plugin used to mount four observers over the same tree (the parts pass,
 * header-popover tagging, better-sidebar detection, the settings nav icon), so
 * every DOM batch — streaming tokens, keystrokes — paid four native dispatches.
 * The bus keeps ONE observer with the union of the options anyone needed:
 * childList + subtree (parts / header / nav) plus `aria-expanded` attribute
 * flips (header). A listener that only cares about body-level mounts filters
 * inside its own callback; a listener that needs the records gets them
 * verbatim.
 *
 * Teardown: unsubscribing the last listener disconnects the observer, so a
 * plugin dispose leaves nothing watching the DOM.
 */
export type DomListener = (records: MutationRecord[]) => void

const listeners = new Set<DomListener>()
let observer: MutationObserver | null = null

/** Subscribe to body-subtree mutations. Returns an unsubscribe. */
export function watchDom(cb: DomListener): () => void {
  listeners.add(cb)
  if (observer === null && typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    observer = new MutationObserver(records => {
      for (const l of listeners) l(records)
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-expanded'],
    })
  }
  return () => {
    listeners.delete(cb)
    if (listeners.size === 0) {
      observer?.disconnect()
      observer = null
    }
  }
}
