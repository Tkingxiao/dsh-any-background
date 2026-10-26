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
 *
 * Two trees, still ONE observer: `body` (subtree, the original contract) and `head`
 * (childList only, for `style[data-plugin]` sheets — see `DomTarget`). Records are
 * routed by target, and the head split is gated on somebody listening, so adding the
 * second tree costs the body listeners nothing.
 */
export type DomListener = (records: MutationRecord[]) => void

/** Which tree a subscription watches. `head` is the one place the plugin needs to see
 *  a stylesheet appear — third-party plugins tag their own sheets
 *  (`style[data-plugin="…"]`, which is how dsh-better-display mounts its CSS), and that
 *  is the only reliable "this plugin is loaded" signal that does not depend on its view
 *  being mounted. It is observed WITHOUT `subtree`, so its records always carry
 *  `target === document.head` and can be routed cleanly. */
export type DomTarget = 'body' | 'head'

const listeners: Record<DomTarget, Set<DomListener>> = { body: new Set(), head: new Set() }
let observer: MutationObserver | null = null

/** Subscribe to mutations of one tree. Returns an unsubscribe. */
export function watchDom(cb: DomListener, target: DomTarget = 'body'): () => void {
  listeners[target].add(cb)
  if (observer === null && typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    observer = new MutationObserver(records => {
      // Body listeners keep seeing the raw batch exactly as before. The head split is
      // gated on somebody actually listening, so the common case pays no allocation.
      for (const l of listeners.body) l(records)
      if (listeners.head.size > 0) {
        const head = records.filter(r => r.target === document.head)
        if (head.length > 0) for (const l of listeners.head) l(head)
      }
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-expanded'],
    })
    observer.observe(document.head, { childList: true })
  }
  return () => {
    listeners[target].delete(cb)
    if (listeners.body.size + listeners.head.size === 0) {
      observer?.disconnect()
      observer = null
    }
  }
}
