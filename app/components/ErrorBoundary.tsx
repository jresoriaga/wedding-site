'use client'
import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

// [AC-ITINPLAN0306-ERR4] Class component required for error boundary pattern
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Structured log for observability
    console.error('[ErrorBoundary]', { error: error.message, componentStack: errorInfo.componentStack })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <DefaultErrorFallback onRetry={() => this.setState({ hasError: false })} />
      )
    }
    return this.props.children
  }
}

function DefaultErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 text-center"
    >
      <span className="text-5xl" aria-hidden="true">⚠️</span>
      <h2 className="text-xl font-bold text-gray-800">Couldn&apos;t connect</h2>
      <p className="text-gray-500 text-sm max-w-xs">
        Something went wrong while loading. Check your connection and try again.
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-ocean text-white rounded-xl font-semibold hover:bg-ocean/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-2"
      >
        Retry
      </button>
    </div>
  )
}
