import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import penguinThinking from "@/assets/penguin-thinking.png";

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
          <img src={penguinThinking} alt="" className="h-32 w-32 object-contain mb-6 opacity-80" />
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
