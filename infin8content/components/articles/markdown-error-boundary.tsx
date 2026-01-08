'use client'

import { Component, ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary for markdown rendering
 * Catches errors during markdown rendering and displays a fallback UI
 */
export class MarkdownErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Markdown rendering error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive text-sm">
              <p className="font-medium">Error rendering markdown content</p>
              <p className="text-xs mt-1 text-muted-foreground">
                {this.state.error?.message || 'Unknown error occurred'}
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

