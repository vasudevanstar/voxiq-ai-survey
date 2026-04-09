import React, { ReactNode, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// Simple error boundary implementation - minimal version
let errorBoundaryError: Error | null = null;

export default function ErrorBoundary({ children }: ErrorBoundaryProps): ReactNode {
  const [hasError, setHasError] = useState(false);

  // Check for errors from React's error boundary system
  React.useEffect(() => {
    const handleError = () => {
      setHasError(true);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-surface to-brand-dark flex items-center justify-center p-4">
        <div className="glass p-10 rounded-3xl max-w-md w-full border border-brand-secondary/30 text-center">
          <AlertTriangle size={48} className="mx-auto text-brand-secondary mb-4 animate-bounce-in" />
          <h2 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h2>
          <p className="text-slate-400 text-sm mb-6">
            An unexpected error occurred
          </p>
          <button
            onClick={() => {
              setHasError(false);
              window.location.reload();
            }}
            className="btn-gradient flex items-center justify-center gap-2 w-full rounded-xl py-3 font-bold"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return children;
}
