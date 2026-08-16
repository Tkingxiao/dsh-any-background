import { Component, type ReactNode } from 'react'
import { ST } from '../styles'

interface Props {
  t: (key: string) => string
  onReset?: () => void
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render errors from the theme section subtree (wheel, sliders, editor)
 * so a single bad state can never take down the whole settings panel. Shows a
 * compact fallback with a reset button; the reset re-renders the section with
 * the current saved config, which is enough to recover from most transient
 * failures (corrupt transient UI state, stale image decode, etc.).
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    console.error('dsh-any-background: section render crashed', error, info.componentStack)
  }

  private reset = (): void => {
    this.setState({ error: null })
    this.props.onReset?.()
  }

  override render() {
    if (this.state.error) {
      return (
        <div style={ST.crashBox}>
          <div style={ST.crashTitle}>{this.props.t('crashTitle')}</div>
          <div style={ST.crashDesc}>{this.props.t('crashDesc')}</div>
          <button type="button" style={ST.btn} onClick={this.reset}>{this.props.t('crashReset')}</button>
        </div>
      )
    }
    return this.props.children
  }
}
