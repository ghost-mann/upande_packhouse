import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  resetKey?: string // change this (e.g. route path) to clear the error
}
interface State {
  error: Error | null
  key?: string
}

// Keeps a crashing page from blanking the whole SPA — shows the error inside
// the layout instead, and auto-resets when the route changes.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.key) return { key: props.resetKey, error: null }
    return null
  }

  componentDidCatch(error: Error) {
    console.error('[packhouse] page error:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto mt-8 max-w-[1760px] px-3 sm:px-5">
          <div className="glass glass-sheen relative flex flex-col items-center gap-3 rounded-2.5xl py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-red/12 text-accent-red">
              <AlertTriangle size={22} />
            </span>
            <p className="text-[15px] font-bold text-ink">This page hit an error</p>
            <p className="max-w-md text-[12px] text-ink-mute">{this.state.error.message}</p>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-1 rounded-2xl bg-gradient-to-r from-accent-blue to-accent-purple px-4 py-1.5 text-[12px] font-semibold text-white transition hover:opacity-90"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
