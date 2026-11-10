import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-3xl glass-panel border border-[#42221b] bg-[#1a0f0d] text-center my-4 max-w-md mx-auto shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-[#e07a68]/15 border border-[#e07a68]/30 flex items-center justify-center mx-auto mb-3 text-[#e07a68]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#f5ede4] mb-1">
            {this.props.fallbackMessage || 'Wystąpił drobny błąd widoku'}
          </h3>
          <p className="text-xs text-[#9e8f82] mb-4">
            {this.state.error?.message || 'Nie udało się poprawnie wyrenderować tego elementu.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] text-xs font-semibold transition-all active:scale-95 shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Odśwież widok
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
