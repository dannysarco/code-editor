import './error-boundary.css';
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// Catches render/lifecycle errors from a single cell so one broken cell
// (editor, preview, or markdown) cannot take down the whole notebook.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Cell crashed:', error, info.componentStack);
  }

  onReset = () => {
    this.setState({ error: null });
  };

  onCopy = () => {
    navigator.clipboard?.writeText(this.state.error?.message ?? '');
  };

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary" role="alert">
          <AlertTriangle size={20} className="error-icon" aria-hidden="true" />
          <div className="error-content">
            <h4>Something went wrong in this cell</h4>
            <p className="error-boundary-message">{this.state.error.message}</p>
            <div className="error-actions">
              <button className="btn btn-primary" onClick={this.onReset}>
                Reset cell
              </button>
              <button
                className="btn btn-secondary error-copy"
                onClick={this.onCopy}
              >
                Copy error
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
