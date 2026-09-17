import { Component, type ReactNode } from 'react'

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
      // Show the cause, not just the apology. The host's own console holds the
      // full stack, but a plugin that repaints the settings panel has no other
      // way to tell the user why it went blank — and "please open devtools" is a
      // poor answer to "it crashed".
      const detail = this.state.error.stack ?? `${this.state.error.name}: ${this.state.error.message}`
      return (
        <div className="dab-crash">
          <div className="dab-crash-title">{this.props.t('crashTitle')}</div>
          <div className="dab-crash-desc">{this.props.t('crashDesc')}</div>
          <pre className="dab-crash-detail">{detail}</pre>
          <button type="button" className="dab-btn" onClick={this.reset}>{this.props.t('crashReset')}</button>
        </div>
      )
    }
    return this.props.children
  }
}
