
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ListTodoIcon, 
  CalendarCheckIcon, 
  TimerIcon, 
  BrainCircuitIcon 
} from "@/components/icons/DeepFlowIcons";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    const shouldRemember = localStorage.getItem("deepflow_remember_me") === "true";
    if (user && shouldRemember) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Affiche rien le temps de vérifier l'état de connexion
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-nav py-4">
        <div className="container flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-deepflow-400 to-deepflow-700 animate-pulse"></div>
              <div className="absolute inset-0.5 rounded-full bg-white dark:bg-gray-900"></div>
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-deepflow-400 to-deepflow-600"></div>
            </div>
            <span className="text-xl font-bold font-heading bg-gradient-to-br from-deepflow-400 to-deepflow-700 text-transparent bg-clip-text">
              DeepFlow
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link to="/register">
              <Button>Inscription</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6 bg-gradient-to-r from-deepflow-400 to-deepflow-600 text-transparent bg-clip-text animate-fade-in">
            Libérez votre potentiel avec DeepFlow
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: "150ms" }}>
            Atteignez vos objectifs, suivez vos habitudes et optimisez votre productivité avec notre assistant IA personnalisé.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "300ms" }}>
            <Link to="/register">
              <Button size="lg" className="text-lg px-8">
                Commencer gratuitement
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Se connecter
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-b from-background to-background/80">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-16">Fonctionnalités principales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Gestion de tâches */}
              <div className="glass-card p-6 flex flex-col items-center text-center hover-scale">
                <div className="mb-4 p-3 rounded-full bg-primary/10 text-primary">
                  <ListTodoIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Gestion de tâches</h3>
                <p className="text-muted-foreground">
                  Organisez vos tâches avec des priorités et des échéances pour rester productif.
                </p>
              </div>

              {/* Suivi d'habitudes */}
              <div className="glass-card p-6 flex flex-col items-center text-center hover-scale">
                <div className="mb-4 p-3 rounded-full bg-primary/10 text-primary">
                  <CalendarCheckIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Suivi d'habitudes</h3>
                <p className="text-muted-foreground">
                  Créez et maintenez des habitudes positives avec des rappels et des statistiques.
                </p>
              </div>

              {/* Mode Focus */}
              <div className="glass-card p-6 flex flex-col items-center text-center hover-scale">
                <div className="mb-4 p-3 rounded-full bg-primary/10 text-primary">
                  <TimerIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Mode Focus</h3>
                <p className="text-muted-foreground">
                  Restez concentré avec la méthode Pomodoro et évitez les distractions.
                </p>
              </div>

              {/* Analyse IA */}
              <div className="glass-card p-6 flex flex-col items-center text-center hover-scale">
                <div className="mb-4 p-3 rounded-full bg-primary/10 text-primary">
                  <BrainCircuitIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Analyse IA</h3>
                <p className="text-muted-foreground">
                  Obtenez des insights personnalisés et des recommandations basées sur votre activité.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t">
        <div className="container text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} DeepFlow. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

