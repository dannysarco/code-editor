import './error-boundary.css';
import { Component, ErrorInfo, ReactNode } from 'react';

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

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary notification is-danger">
          <h4>Something went wrong in this cell</h4>
          <p className="error-boundary-message">{this.state.error.message}</p>
          <button className="button is-small" onClick={this.onReset}>
            Reset
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
