import { useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { ThemeSectionProps, ThemeStoreState, ProfileEntry, ScheduleConfig } from '../../types'
import { BUILTIN_PRESETS } from '../../utils/presets'
import { hslToRgb } from '../../utils/color'
import { DownloadIcon, UploadIcon, CheckIcon, PlusIcon, SunIcon, MoonIcon, ClockIcon } from '../icons'

const hexOf = (color: [number, number, number] | null): string =>
  color === null
    ? ''
    : '#' + hslToRgb(color[0], color[1], color[2]).map(v => Math.round(v).toString(16).padStart(2, '0')).join('')

function ProfileDot({ entry }: { entry: ProfileEntry }) {
  const hex = hexOf(entry.config.color)
  return (
    <span className="dab-profile-dot" style={hex ? { background: hex } : undefined} title={hex ? hex.toUpperCase() : undefined}>
      {hex ? null : <CheckIcon size={11} />}
    </span>
  )
}

export function ProfilePage({ p, notify }: { p: ThemeSectionProps; notify: (msg: string, ok?: boolean) => void }) {
  const { t, exportTheme, importTheme, saveProfile, applyProfile, deleteProfile, applyPreset, setSchedule, useStore } = p
  // Field-level subscriptions: profile list, active id and schedule are the only
  // store fields this page renders — full-state subscription would re-render
  // the whole profile list on every unrelated store write (color, wallpaper…).
  const profiles = useStore((s: ThemeStoreState) => s.profiles)
  const schedule = useStore((s: ThemeStoreState) => s.schedule)
  const activeProfile = useStore((s: ThemeStoreState) => s.activeProfile)
  const importRef = useRef<HTMLInputElement>(null)
  const [nameOpen, setNameOpen] = useState(false)
  const [nameVal, setNameVal] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const onImport = async (file: File) => {
    try {
      const ok = await importTheme(file)
      notify(ok ? t('importDone') : t('importFail'), ok)
    } catch {
      notify(t('importFail'), false)
    }
  }

  const onSave = (): void => {
    const name = nameVal.trim()
    if (!name) return
    if (saveProfile(name)) {
      notify(t('profileSaved'), true)
      setNameVal('')
      setNameOpen(false)
    } else {
      notify(t('profileNameRequired'), false)
    }
  }

  const onApply = (entry: ProfileEntry): void => {
    if (applyProfile(entry.id)) notify(t('profileApplied'), true)
  }

  const onDelete = (entry: ProfileEntry): void => {
    if (confirmId !== entry.id) { setConfirmId(entry.id); return }
    setConfirmId(null)
    deleteProfile(entry.id)
  }

  const profileOptions = (value: string | null, onChange: (id: string | null) => void) => (
    <select className="dab-select" value={value ?? ''} onChange={e => onChange(e.target.value || null)}>
      <option value="">{t('profileNone')}</option>
      {profiles.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
    </select>
  )

  const patchSchedule = (patch: Partial<ScheduleConfig>): void => setSchedule(patch)

  return (
    <>
      <header className="dab-head dab-rise" style={{ '--d': 0 } as CSSProperties}>
        <div className="dab-overline">Profile</div>
        <h2 className="dab-h1">{t('pageProfile')}</h2>
        <p className="dab-desc">{t('descProfile')}</p>
      </header>

      {/* Built-in presets */}
      <section className="dab-card dab-rise" style={{ '--d': 1 } as CSSProperties}>
        <div className="dab-swatch-title">{t('presetGalleryTitle')}</div>
        <div className="dab-preset-grid">
          {BUILTIN_PRESETS.map((ps, i) => {
            const hex = hexOf(ps.appearance.color)
            return (
              <button key={ps.key} type="button" className="dab-preset" style={{ '--i': i } as CSSProperties} onClick={() => { applyPreset(ps.appearance); notify(t('presetApplied')) }}>
                <span className="dab-preset-dot" style={hex ? { background: hex } : undefined}>
                  {hex ? null : <CheckIcon size={12} />}
                </span>
                <span className="dab-preset-name">{t(`presetName_${ps.key}`)}</span>
                <span className="dab-preset-desc">{t(`presetDesc_${ps.key}`)}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Saved profiles */}
      <section className="dab-card dab-rise" style={{ '--d': 2 } as CSSProperties}>
        <div className="dab-row-head">
          <div className="dab-swatch-title" style={{ marginBottom: 0 }}>{t('profilesTitle')}</div>
          <button type="button" className="dab-btn dab-btn-primary" onClick={() => setNameOpen(o => !o)}>
            <PlusIcon size={14} />{t('profileSave')}
          </button>
        </div>
        {nameOpen ? (
          <div className="dab-urlrow">
            <input type="text" className="dab-urlinput" value={nameVal} placeholder={t('profileNamePlaceholder')} maxLength={60}
              onChange={e => setNameVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSave() } }}
              autoFocus />
            <button type="button" className="dab-btn dab-btn-primary" disabled={!nameVal.trim()} onClick={onSave}>{t('editorCommit')}</button>
            <button type="button" className="dab-btn" onClick={() => { setNameOpen(false); setNameVal('') }}>{t('bgUrlCancel')}</button>
          </div>
        ) : null}
        {profiles.length === 0 ? (
          <p className="dab-hint" style={{ marginTop: 10 }}>{t('profilesEmpty')}</p>
        ) : (
          <div className="dab-profile-list">
            {profiles.map((entry, i) => (
              <div key={entry.id} className={`dab-profile-row${activeProfile === entry.id ? ' is-active' : ''}`} style={{ '--i': i } as CSSProperties}>
                <ProfileDot entry={entry} />
                <div className="dab-profile-meta">
                  <span className="dab-profile-name">{entry.name}</span>
                  <span className="dab-profile-sub">{new Date(entry.createdAt).toLocaleDateString()}</span>
                </div>
                <button type="button" className="dab-btn" onClick={() => onApply(entry)}>{t('profileApply')}</button>
                <button type="button" className={`dab-btn dab-btn-danger-solid${confirmId === entry.id ? ' dab-btn-confirm' : ''}`}
                  title={t('profileDelete')} onClick={() => onDelete(entry)}>
                  {confirmId === entry.id ? (
                    <><CheckIcon size={13} />{t('profileDeleteConfirm')}</>
                  ) : (
                    t('profileDelete')
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Day/night auto switch */}
      <section className="dab-card dab-rise" style={{ '--d': 3 } as CSSProperties}>
        <div className="dab-row-head">
          <div className="dab-swatch-title" style={{ marginBottom: 0 }}>{t('scheduleTitle')}</div>
          <button type="button" className={`dab-toggle${schedule.enabled ? ' is-on' : ''}`} role="switch" aria-checked={schedule.enabled}
            onClick={() => patchSchedule({ enabled: !schedule.enabled })}>
            <span className="dab-toggle-knob" />
          </button>
        </div>
        <p className="dab-hint" style={{ marginTop: 8 }}>{t('scheduleHint')}</p>
        <div className={`dab-schedule-wrap${schedule.enabled ? ' is-open' : ''}`} aria-hidden={!schedule.enabled}>
          <div className="dab-schedule-clip">
            <div className="dab-schedule-grid">
              <div className="dab-schedule-cell" style={{ '--i': 0 } as CSSProperties}>
                <div className="dab-swatch-title">{t('scheduleMode')}</div>
                <div className="dab-chip-row">
                  <button type="button" className={`dab-chip${schedule.mode === 'time' ? ' is-active' : ''}`}
                    onClick={() => patchSchedule({ mode: 'time' })}><ClockIcon size={13} />{t('scheduleModeTime')}</button>
                  <button type="button" className={`dab-chip${schedule.mode === 'system' ? ' is-active' : ''}`}
                    onClick={() => patchSchedule({ mode: 'system' })}>{t('scheduleModeSystem')}</button>
                </div>
              </div>
              {schedule.mode === 'time' ? (
                <div className="dab-schedule-cell" style={{ '--i': 1 } as CSSProperties}>
                  <div className="dab-swatch-title">{t('scheduleTimes')}</div>
                  <div className="dab-time-row">
                    <label className="dab-time-label"><SunIcon size={13} />{t('scheduleDayStart')}
                      <input type="time" className="dab-timeinput" value={schedule.dayStart}
                        onChange={e => { if (/^([01]\d|2[0-3]):[0-5]\d$/.test(e.target.value)) patchSchedule({ dayStart: e.target.value }) }} />
                    </label>
                    <label className="dab-time-label"><MoonIcon size={13} />{t('scheduleNightStart')}
                      <input type="time" className="dab-timeinput" value={schedule.nightStart}
                        onChange={e => { if (/^([01]\d|2[0-3]):[0-5]\d$/.test(e.target.value)) patchSchedule({ nightStart: e.target.value }) }} />
                    </label>
                  </div>
                </div>
              ) : null}
              <div className="dab-schedule-cell" style={{ '--i': 2 } as CSSProperties}>
                <div className="dab-swatch-title">{t('scheduleProfiles')}</div>
                <div className="dab-time-row">
                  <label className="dab-time-label"><SunIcon size={13} />{t('scheduleDayProfile')}
                    {profileOptions(schedule.dayProfile, id => patchSchedule({ dayProfile: id }))}
                  </label>
                  <label className="dab-time-label"><MoonIcon size={13} />{t('scheduleNightProfile')}
                    {profileOptions(schedule.nightProfile, id => patchSchedule({ nightProfile: id }))}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Export / import */}
      <div className="dab-profile-grid">
        <section className="dab-card dab-card-hover dab-rise" style={{ '--d': 4 } as CSSProperties}>
          <div className="dab-profile-ico"><DownloadIcon size={17} /></div>
          <div className="dab-profile-title">{t('exportCardTitle')}</div>
          <div className="dab-profile-desc">{t('exportCardDesc')}</div>
          <button type="button" className="dab-btn dab-btn-primary" onClick={() => { exportTheme(); notify(t('toastExportDone')) }}>
            <DownloadIcon size={14} />{t('exportTheme')}
          </button>
        </section>

        <section className="dab-card dab-card-hover dab-rise" style={{ '--d': 5 } as CSSProperties}>
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

      <footer className="dab-footer dab-rise" style={{ '--d': 6 } as CSSProperties}>
        <span className="dab-footer-mono">dsh-any-background</span>
        <span>{t('footerTag')}</span>
      </footer>
    </>
  )
}
