import type { CSSProperties, ComponentType } from 'react'
import type { ThemeSectionProps, PartOpacities, PartBlurs } from '../../types'
import { cfg, rOps, rSop, rBlurs, rChatTextOpacity, rTrajectoryOpacity } from '../../state'
import { saveConfig } from '../../rpc'
import { applyCustomTokens, applySettingsOverrides, setPartBlur, applyViewCards, applyTrajectoryOverrides } from '../../wallpaper'
import { LiveSlider } from '../LiveSlider'
import { CanvasIcon, SidebarIcon, ChatIcon, GearIcon, TextIcon, TrajectoryIcon, InputIcon } from '../icons'

interface PartDef {
  labelKey: string
  Icon: ComponentType<{ size?: number }>
  /** Homepage part key; absent for the settings-panel part. */
  opKey?: keyof PartOpacities
  isSettings?: boolean
  /** Conversation text region: tint opacity + blur over the message column. */
  isChat?: boolean
  /** Trajectory view: tint opacity + blur over the whole view surface. */
  isTrajectory?: boolean
}

const PARTS: PartDef[] = [
  { opKey: 'bg', labelKey: 'uiOpacityBg', Icon: CanvasIcon },
  { opKey: 'sidebar', labelKey: 'uiOpacitySide', Icon: SidebarIcon },
  { opKey: 'card', labelKey: 'uiOpacityCard', Icon: ChatIcon },
  { opKey: 'input', labelKey: 'uiOpacityInput', Icon: InputIcon },
  { isSettings: true, labelKey: 'uiSop', Icon: GearIcon },
  { isChat: true, labelKey: 'uiChatRegion', Icon: TextIcon },
  { isTrajectory: true, labelKey: 'uiTrajectory', Icon: TrajectoryIcon },
]

export function InterfacePage({ p }: { p: ThemeSectionProps }) {
  const { t, setOps, setBlurs, setSop } = p

  return (
    <>
      <header className="dab-head dab-rise" style={{ '--d': 0 } as CSSProperties}>
        <div className="dab-overline">Surfaces</div>
        <h2 className="dab-h1">{t('uiTitle')}</h2>
        <p className="dab-desc">{t('descInterface')}</p>
      </header>

      <div className="dab-grid-parts">
        {PARTS.map((part, i) => {
          const { labelKey, Icon, isSettings, isChat, isTrajectory } = part
          const opKey = part.opKey
          // Homepage parts (bg/sidebar/card/input) bind to their own part only;
          // the settings panel (isSettings) binds exclusively to the 'settings'
          // part (--dsh-any-blur-settings / --dsh-any-bg-settings-surface) and
          // must never fall back to a homepage part key — otherwise the dialog
          // panel would track the homepage center/card blur and the home-page
          // opacities. The chat region (isChat) and the trajectory view
          // (isTrajectory) own their own blur keys plus their own tint
          // opacities. Every homepage opKey is also a PartBlurs key (input
          // included), so the shared blur slider dereferences it directly.
          const blurKey: keyof PartBlurs = isChat ? 'chat' : isTrajectory ? 'trajectory' : isSettings ? 'settings' : opKey!
          const opacity = isChat ? rChatTextOpacity() : isTrajectory ? rTrajectoryOpacity() : isSettings ? rSop() : rOps()[opKey!]
          return (
            <section key={blurKey} className="dab-card dab-card-hover dab-rise" style={{ '--d': i + 1 } as CSSProperties}>
              <div className="dab-part-head">
                <div className="dab-part-ico"><Icon size={16} /></div>
                <div className="dab-part-name">{t(labelKey)}</div>
                <span className="dab-part-badge">{Math.round(opacity * 100)}%</span>
              </div>

              <LiveSlider label={t('uiOpacity')} min={0} max={100} step={1} def={Math.round(opacity * 100)}
                fmt={v => `${v}%`}
                onInput={v => {
                  const op = v / 100
                  if (isChat) {
                    cfg.chatTextOpacity = op
                    applyViewCards()
                  } else if (isTrajectory) {
                    cfg.trajectoryOpacity = op
                    applyTrajectoryOverrides(op)
                  } else if (isSettings) {
                    cfg.settingsOpacity = op
                    applySettingsOverrides(op)
                  } else {
                    const ops = { ...rOps() }
                    ops[opKey!] = op
                    cfg.opacities = ops
                    applyCustomTokens(ops)
                  }
                  saveConfig()
                }}
                onChange={v => {
                  const op = v / 100
                  if (isChat) {
                    cfg.chatTextOpacity = op
                    applyViewCards()
                    saveConfig()
                  } else if (isTrajectory) {
                    cfg.trajectoryOpacity = op
                    applyTrajectoryOverrides(op)
                    saveConfig()
                  } else if (isSettings) {
                    setSop(op)
                  } else {
                    const ops = { ...rOps() }
                    ops[opKey!] = op
                    setOps(ops)
                  }
                }} />

              <LiveSlider label={t('uiBlur')} min={0} max={60} step={1} def={rBlurs()[blurKey]}
                fmt={v => `${v}px`}
                onInput={v => {
                  const blurs = { ...rBlurs() }
                  blurs[blurKey] = v
                  cfg.blurs = blurs
                  setPartBlur(blurKey, v)
                  saveConfig()
                }}
                onChange={v => {
                  const blurs = { ...rBlurs() }
                  blurs[blurKey] = v
                  setBlurs(blurs)
                }} />
            </section>
          )
        })}
      </div>
    </>
  )
}
