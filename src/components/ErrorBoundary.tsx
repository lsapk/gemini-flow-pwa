import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Reset key — when this changes, the boundary resets automatically. Useful per-route. */
  resetKey?: string;
  /** Optional fallback message */
  message?: string;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center bg-background p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6 border border-destructive/20 shadow-xl backdrop-blur-sm">
            <span className="text-3xl font-bold text-destructive">!</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Oups, quelque chose s'est cassé</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            {this.props.message ?? "Une erreur inattendue est survenue. Vos données sont en sécurité."}
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button variant="outline" onClick={this.handleRetry}>
              Réessayer
            </Button>
            <Button onClick={() => { this.handleRetry(); window.location.href = "/dashboard"; }}>
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
