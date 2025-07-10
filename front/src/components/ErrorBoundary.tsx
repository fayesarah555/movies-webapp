import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{error: Error; resetError: () => void}>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={error!} resetError={this.resetError} />;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>❌ Oups ! Quelque chose s'est mal passé</h2>
            <p>Une erreur inattendue s'est produite dans l'application.</p>
            
            <div className="error-details">
              <h3>Détails de l'erreur:</h3>
              <pre className="error-message">
                {error?.message || 'Erreur inconnue'}
              </pre>
              
              {import.meta.env.DEV && (
                <details className="error-stack">
                  <summary>Stack trace (développement)</summary>
                  <pre>{error?.stack}</pre>
                </details>
              )}
            </div>
            
            <div className="error-actions">
              <button onClick={this.resetError} className="retry-error-button">
                Réessayer
              </button>
              <button onClick={() => window.location.reload()} className="reload-button">
                Recharger la page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Composant de fallback simple pour les erreurs mineures
export const SimpleErrorFallback: React.FC<{error: Error; resetError: () => void}> = ({ error, resetError }) => (
  <div className="simple-error-fallback">
    <div className="error-icon">⚠️</div>
    <h3>Erreur de chargement</h3>
    <p>{error.message}</p>
    <button onClick={resetError} className="retry-button">
      Réessayer
    </button>
  </div>
);

export default ErrorBoundary;
