import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 rounded border border-rose/30 bg-rose/5 text-rose text-sm text-center">
          <p className="font-semibold mb-1">Something went wrong.</p>
          <button 
            onClick={() => this.setState({ hasError: false })} 
            className="text-xs text-rose underline hover:text-rose-hover"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
