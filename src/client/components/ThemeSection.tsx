/**
 * dsh-any-background — appearance shell for the five pages.
 *
 * Two surfaces render this shell, and only the chrome differs:
 *   · `settings` — injected into the host settings dialog's content column,
 *     which supplies the modal frame (nav rail on the left, brand block, page
 *     max-width, the dialog's own scrolling);
 *   · `sidebar`  — a page inside dsh-better-sidebar, where the panel is much
 *     narrower, is handed a full-height column, and has to own its own scroll
 *     region. The brand block is dropped (the sidebar's tab bar already names
 *     the page) and the rail turns into a compact row.
 * The five pages themselves never branch on the surface: width-driven
 * adaptation lives in the stylesheet's container queries, which measure the
 * shell itself rather than assuming either surface's width.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ThemeSectionProps } from '../types'
import { ensureUiCss, NAV_ITEM_H, NAV_GAP } from './ui.css'
import { SunIcon, DropletIcon, LayersIcon, PhotoIcon, SlidersIcon, FontIcon, CheckIcon, AlertIcon } from './icons'
import { ErrorBoundary } from './ErrorBoundary'
import { Portal } from './Portal'
import { ColorPage } from './pages/ColorPage'
import { InterfacePage } from './pages/InterfacePage'
import { FontPage } from './pages/FontPage'
import { BackgroundPage } from './pages/BackgroundPage'
import { ProfilePage } from './pages/ProfilePage'

/** Which chrome wraps the pages; see the module doc. */
export type ThemeSurface = 'settings' | 'sidebar'

export function ThemeSection(props: ThemeSectionProps & { surface?: ThemeSurface }) {
  ensureUiCss()
  const { t } = props
  const surface = props.surface ?? 'settings'
  const [page, setPage] = useState(0)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const notify = useCallback((msg: string, ok = true): void => {
    setToast({ msg, ok })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  // Stable element identities: an inline notify + inline array rebuilds every
  // page element on each render, so a toast appearing (or any state tick)
  // re-renders all five pages at once. That churn is what makes LiveSlider's
  // sync effect fire mid-drag and yank the thumb back, so keep the elements
  // memoized on the few props that actually change them.
  const pages = useMemo(() => [
    { label: t('pageColor'), Icon: DropletIcon, node: <ColorPage p={props} notify={notify} /> },
    { label: t('pageInterface'), Icon: LayersIcon, node: <InterfacePage p={props} /> },
    { label: t('pageFont'), Icon: FontIcon, node: <FontPage p={props} notify={notify} /> },
    { label: t('pageBackground'), Icon: PhotoIcon, node: <BackgroundPage p={props} notify={notify} /> },
    { label: t('pageProfile'), Icon: SlidersIcon, node: <ProfilePage p={props} notify={notify} /> },
  ], [t, props, notify])

  return (
    <ErrorBoundary t={t}>
      <div className="dab-root" data-dab-surface={surface}>
        <div className="dab-shell">
          <nav className="dab-nav">
            {surface === 'sidebar' ? null : (
              <div className="dab-brand">
                <div className="dab-brand-tile"><SunIcon size={15} /></div>
                <div>
                  <div className="dab-brand-name">{t('nav')}</div>
                  <div className="dab-brand-tag">{t('brandTag')}</div>
                </div>
              </div>
            )}
            <div className="dab-nav-list">
              <div className="dab-nav-ind" style={{ transform: `translateY(${page * (NAV_ITEM_H + NAV_GAP)}px)` }} />
              {pages.map((pg, i) => (
                <button
                  key={pg.label} type="button"
                  className={`dab-nav-item${i === page ? ' is-active' : ''}`}
                  onClick={() => setPage(i)}>
                  <pg.Icon size={16} />
                  <span>{pg.label}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="dab-page" key={page}>
            {pages[page].node}
          </div>
        </div>
      </div>

      {toast ? (
        <Portal>
          <div className="dab-toast" role="status">
            <span className={toast.ok ? 'dab-toast-ok' : 'dab-toast-err'}>
              {toast.ok ? <CheckIcon size={14} /> : <AlertIcon size={14} />}
            </span>
            <span>{toast.msg}</span>
          </div>
        </Portal>
      ) : null}
    </ErrorBoundary>
  )
}
