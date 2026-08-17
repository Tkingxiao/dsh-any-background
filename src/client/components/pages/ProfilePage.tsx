import { useRef } from 'react'
import type { CSSProperties } from 'react'
import type { ThemeSectionProps } from '../../types'
import { DownloadIcon, UploadIcon } from '../icons'

export function ProfilePage({ p, notify }: { p: ThemeSectionProps; notify: (msg: string, ok?: boolean) => void }) {
  const { t, exportTheme, importTheme } = p
  const importRef = useRef<HTMLInputElement>(null)

  const onImport = async (file: File) => {
    try {
      const ok = await importTheme(file)
      notify(ok ? t('importDone') : t('importFail'), ok)
    } catch {
      notify(t('importFail'), false)
    }
  }

  return (
    <>
      <header className="dab-head dab-rise" style={{ '--d': 0 } as CSSProperties}>
        <div className="dab-overline">Profile</div>
        <h2 className="dab-h1">{t('pageProfile')}</h2>
        <p className="dab-desc">{t('descProfile')}</p>
      </header>

      <div className="dab-profile-grid">
        <section className="dab-card dab-card-hover dab-rise" style={{ '--d': 1 } as CSSProperties}>
          <div className="dab-profile-ico"><DownloadIcon size={17} /></div>
          <div className="dab-profile-title">{t('exportCardTitle')}</div>
          <div className="dab-profile-desc">{t('exportCardDesc')}</div>
          <button type="button" className="dab-btn dab-btn-primary" onClick={() => { exportTheme(); notify(t('toastExportDone')) }}>
            <DownloadIcon size={14} />{t('exportTheme')}
          </button>
        </section>

        <section className="dab-card dab-card-hover dab-rise" style={{ '--d': 2 } as CSSProperties}>
          <div className="dab-profile-ico"><UploadIcon size={17} /></div>
          <div className="dab-profile-title">{t('importCardTitle')}</div>
          <div className="dab-profile-desc">{t('importCardDesc')}</div>
          <button type="button" className="dab-btn" onClick={() => importRef.current?.click()}>
            <UploadIcon size={14} />{t('importTheme')}
          </button>
          <input ref={importRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={e => {
            const f = e.target.files?.[0]; if (!f) return
            void onImport(f); e.target.value = ''
          }} />
        </section>
      </div>

      <footer className="dab-footer dab-rise" style={{ '--d': 3 } as CSSProperties}>
        <span className="dab-footer-mono">dsh-any-background</span>
        <span>{t('footerTag')}</span>
      </footer>
    </>
  )
}
