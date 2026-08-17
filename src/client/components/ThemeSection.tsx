/**
 * dsh-any-background — settings section shell.
 *
 * The host renders this section only while the settings dialog is open and the
 * section is the active nav entry, so mounting IS being visible. The section is
 * rendered INLINE inside the host settings dialog's content column (the host
 * provides the modal chrome); the shell is a left nav rail + page body. Only
 * the transient toast escapes through a Portal (the shell's container-type
 * containment would otherwise capture its fixed positioning).
 */
import { useEffect, useRef, useState } from 'react'
import type { ThemeSectionProps } from '../types'
import { ensureUiCss, NAV_ITEM_H, NAV_GAP } from './ui.css'
import { SunIcon, DropletIcon, LayersIcon, PhotoIcon, SlidersIcon, CheckIcon, AlertIcon } from './icons'
import { ErrorBoundary } from './ErrorBoundary'
import { Portal } from './Portal'
import { ColorPage } from './pages/ColorPage'
import { InterfacePage } from './pages/InterfacePage'
import { BackgroundPage } from './pages/BackgroundPage'
import { ProfilePage } from './pages/ProfilePage'

export function ThemeSection(props: ThemeSectionProps) {
  ensureUiCss()
  const { t } = props
  const [page, setPage] = useState(0)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const notify = (msg: string, ok = true): void => {
    setToast({ msg, ok })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }

  const pages = [
    { label: t('pageColor'), Icon: DropletIcon, node: <ColorPage p={props} notify={notify} /> },
    { label: t('pageInterface'), Icon: LayersIcon, node: <InterfacePage p={props} /> },
    { label: t('pageBackground'), Icon: PhotoIcon, node: <BackgroundPage p={props} /> },
    { label: t('pageProfile'), Icon: SlidersIcon, node: <ProfilePage p={props} notify={notify} /> },
  ]

  return (
    <ErrorBoundary t={t}>
      <div className="dab-root">
        <div className="dab-shell">
          <nav className="dab-nav">
            <div className="dab-brand">
              <div className="dab-brand-tile"><SunIcon size={15} /></div>
              <div>
                <div className="dab-brand-name">{t('nav')}</div>
                <div className="dab-brand-tag">{t('brandTag')}</div>
              </div>
            </div>
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
