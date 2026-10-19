import type { CSSProperties, ComponentType } from 'react'
import type { ThemeSectionProps, ThemeStoreState, PartOpacities, PartBlurs, CaptionInkMode } from '../../types'
import { cfg, rOps, rSop, rBlurs, rChatTextOpacity, rTrajectoryOpacity, rPanelOpacity, rProducedOpacity, rHeaderOpacity, rHeaderBarOpacity, rCaptionInk } from '../../state'
import { saveConfig } from '../../rpc'
import { applyCustomTokens, applySettingsOverrides, setPartBlur, applyViewCards, applyTrajectoryOverrides, applyPanelOverrides, applyProduced, applyHeaderPopovers, applyHeaderBar } from '../../wallpaper'
import { LiveSlider } from '../LiveSlider'
import { CanvasIcon, SidebarIcon, ChatIcon, GearIcon, TextIcon, TrajectoryIcon, InputIcon, PanelIcon, HeaderBarIcon } from '../icons'

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
  /** The host's own right Sidebar column: opacity + blur. */
  isPanel?: boolean
  /** Produced/highlight surfaces — code blocks, inline code, produced chips and
   *  the dsh-better-sidebar workbench: opacity + blur. */
  isProduced?: boolean
  /** Header popovers (Agent Team panel + background-job list): opacity + blur. */
  isHeader?: boolean
  /** Session header bar (the conversation's title / actions / view tabs):
   *  opacity + blur. Inert where the host renders that slot bare. */
  isHeaderBar?: boolean
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
  { isHeader: true, labelKey: 'uiHeader', Icon: PanelIcon },
  { isHeaderBar: true, labelKey: 'uiHeaderBar', Icon: HeaderBarIcon },
  { isPanel: true, labelKey: 'uiPanelNative', Icon: PanelIcon },
]

export function InterfacePage({ p }: { p: ThemeSectionProps }) {
  const { t, setOps, setBlurs, setSop, setPanelOp, useStore } = p
  // Presets, theme imports and profile restores mutate cfg directly and only
  // bump the store's metaRev — this page renders straight off cfg, so without
  // this subscription it never re-renders and the sliders keep showing the
  // values from before the change (while the interface itself already moved).
  const metaRev = useStore((s: ThemeStoreState) => s.metaRev)
  void metaRev
  // The panel row owns the host's own right Sidebar only. The dsh-better-sidebar
  // workbench used to ride this row too, but it is an artifact viewer, not a page
  // column, so since 0.3.2 it belongs to the produced row below (PRODUCED_RULE).

  return (
    <>
      <header className="dab-head dab-rise" style={{ '--d': 0 } as CSSProperties}>
        <div className="dab-overline">Surfaces</div>
        <h2 className="dab-h1">{t('uiTitle')}</h2>
        <p className="dab-desc">{t('descInterface')}</p>
      </header>

      <div className="dab-grid-parts">
        {PARTS.map((part, i) => {
          const { labelKey, Icon, isSettings, isChat, isTrajectory, isPanel, isProduced, isHeader, isHeaderBar } = part
          const opKey = part.opKey
          const label = t(labelKey)
          // Homepage parts (bg/sidebar/card/input) bind to their own part only;
          // the settings panel (isSettings) binds exclusively to the 'settings'
          // part (--dsh-any-blur-settings / --dsh-any-bg-settings-surface) and
          // must never fall back to a homepage part key — otherwise the dialog
          // panel would track the homepage center/card blur and the home-page
          // opacities. The chat region (isChat) and the trajectory view
          // (isTrajectory) own their own blur keys plus their own tint
          // opacities; the header row (isHeader) owns the 'header' blur key and
          // cfg.headerOpacity; the panel row (isPanel, the host's own right
          // Sidebar column) owns the 'panel' blur key and cfg.panelOpacity.
          // Every homepage opKey is also a PartBlurs
          // key (input included), so the shared blur slider dereferences it
          // directly.
          const blurKey: keyof PartBlurs = isChat ? 'chat' : isTrajectory ? 'trajectory' : isSettings ? 'settings' : isPanel ? 'panel' : isProduced ? 'produced' : isHeader ? 'header' : isHeaderBar ? 'headerBar' : opKey!
          const opacity = isChat ? rChatTextOpacity() : isTrajectory ? rTrajectoryOpacity() : isSettings ? rSop() : isPanel ? rPanelOpacity() : isProduced ? rProducedOpacity() : isHeader ? rHeaderOpacity() : isHeaderBar ? rHeaderBarOpacity() : rOps()[opKey!]
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
                  } else if (isHeader) {
                    cfg.headerOpacity = op
                    applyHeaderPopovers()
                  } else if (isHeaderBar) {
                    cfg.headerBarOpacity = op
                    applyHeaderBar()
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
                  } else if (isHeader) {
                    cfg.headerOpacity = op
                    applyHeaderPopovers()
                    saveConfig()
                  } else if (isHeaderBar) {
                    cfg.headerBarOpacity = op
                    applyHeaderBar()
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

              {/* The caption strip's ink belongs to the header card: the strip IS the
                  header bar's material once the sidebar is collapsed, and its chrome —
                  the native menubar plus the sidebar's fixed toggle — is the only text
                  that sits on it. Issue #30: following the strip's own brightness fixes
                  an invisible white toggle but turns 「应用 / 编辑」 black under a dark
                  theme, and the two reports wanted opposite winners, so this picks. */}
              {isHeaderBar && (
                <div className="dab-slider-block" title={t('captionInkHint')}>
                  <span className="dab-slider-label">{t('captionInkLabel')}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <select
                      className="dab-select"
                      value={rCaptionInk()}
                      onChange={e => {
                        cfg.captionInk = e.target.value as CaptionInkMode
                        // Re-emits the caption rule (which carries the ink bindings) and
                        // re-applies or releases the ink on the sidebar's fixed controls.
                        applyHeaderBar()
                        saveConfig()
                      }}>
                      <option value="auto">{t('captionInkAuto')}</option>
                      <option value="theme">{t('captionInkTheme')}</option>
                      <option value="white">{t('captionInkWhite')}</option>
                      <option value="black">{t('captionInkBlack')}</option>
                    </select>
                  </div>
                </div>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}
