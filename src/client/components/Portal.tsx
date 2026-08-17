import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Render children into a fixed root attached to document.documentElement.
 *
 * The host's sidebar is often implemented by translating the body or a wrapper
 * (margin-left / transform). A fixed element portaled to body would still be
 * captured by that transformed ancestor and shift with the sidebar. Attaching
 * the portal root directly to <html> escapes body-level transforms so the
 * overlay is always painted relative to the viewport and centered correctly.
 */
export function Portal({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  useEffect(() => {
    const el = document.createElement('div')
    el.dataset.dabPortal = '1'
    el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:999999'
    document.documentElement.appendChild(el)
    setTarget(el)
    return () => { el.remove() }
  }, [])
  return target ? createPortal(children, target) : null
}
