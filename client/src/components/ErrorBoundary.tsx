import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
  },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-3xl font-bold mb-4">אירעה שגיאה לא צפויה</h1>
          <p className="text-gray-600 mb-2">אנא נסה לרענן את הדף.</p>
          <details className="text-xs text-gray-400 whitespace-pre-wrap">
            {this.state.error?.message}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
