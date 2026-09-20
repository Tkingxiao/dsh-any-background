import type { CSSProperties, ComponentType } from 'react'
import type { ThemeSectionProps, ThemeStoreState, PartOpacities, PartBlurs } from '../../types'
import { cfg, rOps, rSop, rBlurs, rChatTextOpacity, rTrajectoryOpacity, rPanelOpacity, rProducedOpacity } from '../../state'
import { saveConfig } from '../../rpc'
import { applyCustomTokens, applySettingsOverrides, setPartBlur, applyViewCards, applyTrajectoryOverrides, applyPanelOverrides, applyProduced } from '../../wallpaper'
import { LiveSlider } from '../LiveSlider'
import { CanvasIcon, SidebarIcon, ChatIcon, GearIcon, TextIcon, TrajectoryIcon, InputIcon, PanelIcon } from '../icons'
import { useBetterSidebar } from '../../env'

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
  /** dsh-better-sidebar bottom workbench panel: opacity + blur. */
  isPanel?: boolean
  /** Highlighter code blocks + produced chips: opacity + blur. */
  isProduced?: boolean
}

const PARTS: PartDef[] = [
  { opKey: 'bg', labelKey: 'uiOpacityBg', Icon: CanvasIcon },
  { opKey: 'sidebar', labelKey: 'uiOpacitySide', Icon: SidebarIcon },
  { opKey: 'card', labelKey: 'uiOpacityCard', Icon: ChatIcon },
  { opKey: 'input', labelKey: 'uiOpacityInput', Icon: InputIcon },
  { isSettings: true, labelKey: 'uiSop', Icon: GearIcon },
  { isChat: true, labelKey: 'uiChatRegion', Icon: TextIcon },
  { isTrajectory: true, labelKey: 'uiTrajectory', Icon: TrajectoryIcon },
  { isProduced: true, labelKey: 'uiProduced', Icon: TextIcon },
  { isPanel: true, labelKey: 'uiPanelRegion', Icon: PanelIcon },
]

export function InterfacePage({ p }: { p: ThemeSectionProps }) {
  const { t, setOps, setBlurs, setSop, setPanelOp, useStore } = p
  // Presets, theme imports and profile restores mutate cfg directly and only
  // bump the store's metaRev — this page renders straight off cfg, so without
  // this subscription it never re-renders and the sliders keep showing the
  // values from before the change (while the interface itself already moved).
  const metaRev = useStore((s: ThemeStoreState) => s.metaRev)
  void metaRev
  // The ninth row is always present, but its identity follows the host:
  //   · native (DSH 0.1.6+ right Sidebar) — "右方侧边栏", the slider pair
  //     drives the host's own `[data-sidebar-right-panel]` surface tokens;
  //   · dsh-better-sidebar installed — "bettersidebar", the same pair takes
  //     over that plugin's bottom workbench panel as well. The verdict is
  //     sticky (see env.ts), so the label flips at most once per session and
  //     useBetterSidebar re-renders this page when it does.
  const hasBetterSidebar = useBetterSidebar()

  return (
    <>
      <header className="dab-head dab-rise" style={{ '--d': 0 } as CSSProperties}>
        <div className="dab-overline">Surfaces</div>
        <h2 className="dab-h1">{t('uiTitle')}</h2>
        <p className="dab-desc">{t('descInterface')}</p>
      </header>

      <div className="dab-grid-parts">
        {PARTS.map((part, i) => {
          const { labelKey, Icon, isSettings, isChat, isTrajectory, isPanel, isProduced } = part
          const opKey = part.opKey
          // The ninth row's name follows the host: native right Sidebar without
          // better-sidebar, that plugin's workbench with it.
          const label = isPanel ? t(hasBetterSidebar ? 'uiPanelRegion' : 'uiPanelNative') : t(labelKey)
          // Homepage parts (bg/sidebar/card/input) bind to their own part only;
          // the settings panel (isSettings) binds exclusively to the 'settings'
          // part (--dsh-any-blur-settings / --dsh-any-bg-settings-surface) and
          // must never fall back to a homepage part key — otherwise the dialog
          // panel would track the homepage center/card blur and the home-page
          // opacities. The chat region (isChat) and the trajectory view
          // (isTrajectory) own their own blur keys plus their own tint
          // opacities; the ninth row (isPanel — native right Sidebar or the
          // better-sidebar workbench, per the label) owns the 'panel' blur key
          // and cfg.panelOpacity. Every homepage opKey is also a PartBlurs key
          // (input included), so the shared blur slider dereferences it directly.
          const blurKey: keyof PartBlurs = isChat ? 'chat' : isTrajectory ? 'trajectory' : isSettings ? 'settings' : isPanel ? 'panel' : isProduced ? 'produced' : opKey!
          const opacity = isChat ? rChatTextOpacity() : isTrajectory ? rTrajectoryOpacity() : isSettings ? rSop() : isPanel ? rPanelOpacity() : isProduced ? rProducedOpacity() : rOps()[opKey!]
          return (
            <section key={blurKey} className="dab-card dab-card-hover dab-rise" style={{ '--d': i + 1 } as CSSProperties}>
              <div className="dab-part-head">
                <div className="dab-part-ico"><Icon size={16} /></div>
                <div className="dab-part-name">{label}</div>
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
                  } else if (isPanel) {
                    cfg.panelOpacity = op
                    applyPanelOverrides(op)
                  } else if (isProduced) {
                    cfg.producedOpacity = op
                    applyProduced()
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
                  } else if (isPanel) {
                    setPanelOp(op)
                  } else if (isProduced) {
                    cfg.producedOpacity = op
                    applyProduced()
                    saveConfig()
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
