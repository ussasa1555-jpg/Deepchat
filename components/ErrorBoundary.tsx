'use client';

import { Component, ReactNode } from 'react';
import { errorMonitor } from '@/lib/errorMonitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log to error monitoring
    errorMonitor.logError(error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center p-4 login-page">
            <div className="particles-container">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="particle"></div>
              ))}
            </div>
            <div className="login-form">
              <div className="terminal max-w-md w-full">
                <div className="border-b-2 border-error pb-4 mb-6">
                  <h1 className="text-2xl uppercase tracking-[0.2em] mb-2 text-error retro-title">
                    SYSTEM ERROR
                  </h1>
                  <p className="text-error text-sm retro-text">
                    Something went wrong
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="border border-error bg-error/10 p-4 rounded">
                    <p className="text-xs font-mono text-error">
                      {this.state.error?.message || 'Unknown error'}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="retro-button w-full"
                  >
                    Return to Dashboard
                  </button>
                  
                  <button
                    onClick={() => this.setState({ hasError: false })}
                    className="retro-button w-full border-muted text-muted"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}










