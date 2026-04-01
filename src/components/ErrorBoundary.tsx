import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 shadow-xl backdrop-blur-sm relative">
            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary/60">X</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Oups, quelque chose s'est cassé 🧊</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            Une erreur inattendue est survenue. Pas de panique, vos données sont en sécurité.
          </p>
          <Button onClick={() => { this.setState({ hasError: false }); window.location.href = "/dashboard"; }}>
            Retour au tableau de bord
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
