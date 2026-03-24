import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCcw } from 'lucide-react';
import { captureException } from '@/lib/sentry';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureException(error, { componentStack: errorInfo.componentStack });
  }

  public reset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 text-center">
          <div className="card-container p-12 max-w-xl space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center text-danger mx-auto">
              <ShieldAlert size={40} />
            </div>
            <div className="space-y-3">
              <h2 className="text-h1 text-primary">Đã xảy ra lỗi hệ thống</h2>
              <p className="text-body text-muted leading-relaxed">
                Chúng tôi xin lỗi vì sự bất tiện này. Một lỗi không mong muốn đã xảy ra trong quá trình xử lý dữ liệu.
              </p>
              {this.state.error && (
                <div className="mt-4 p-4 bg-bg rounded-lg text-left overflow-x-auto">
                  <p className="text-mono text-small text-danger opacity-80">{this.state.error.message}</p>
                </div>
              )}
            </div>
            <button
              onClick={this.reset}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <RefreshCcw size={18} />
              Thử tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
