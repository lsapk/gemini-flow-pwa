import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowRight, 
  Brain, 
  Target, 
  Sparkles,
  Clock,
  CheckCircle2,
  Zap
} from "lucide-react";

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* Navigation - Simple et épurée */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="container max-w-6xl mx-auto flex justify-between items-center py-3 px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-primary-glow animate-pulse opacity-60"></div>
              <div className="absolute inset-0.5 rounded-xl bg-background"></div>
              <div className="absolute inset-2 rounded-lg bg-gradient-to-br from-primary to-primary-glow"></div>
            </div>
            <span className="text-xl sm:text-2xl font-heading font-bold text-foreground">
              DeepFlow
            </span>
          </div>
          <Link to="/register">
            <Button size="sm" className="sm:hidden font-semibold bg-primary hover:bg-primary/90 rounded-lg">
              Start
            </Button>
            <Button size="lg" className="hidden sm:flex font-semibold px-6 bg-primary hover:bg-primary/90">
              Reprendre le contrôle
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-grow pt-24">
        {/* HERO - Above the Fold */}
        <section className="relative min-h-[85vh] flex items-center">
          {/* Background elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-info/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="container max-w-6xl mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Value Proposition - A à B */}
              <h1 className="text-5xl md:text-7xl font-heading font-bold mb-8 leading-tight">
                <span className="text-foreground">Passez du </span>
                <span className="text-muted-foreground line-through decoration-2">chaos mental</span>
                <br />
                <span className="text-foreground">à la </span>
                <span className="bg-gradient-to-r from-primary via-primary-glow to-info bg-clip-text text-transparent">
                  clarté chirurgicale
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                L'IA qui priorise pour vous. Moins de charge mentale. Plus de résultats.
              </p>

              {/* Single CTA */}
              <div className="flex flex-col items-center gap-6">
                <Link to="/register">
                  <Button 
                    size="lg" 
                    className="text-lg px-10 py-7 font-semibold bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-all duration-300 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:scale-105"
                  >
                    Reprendre le contrôle
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </Button>
                </Link>
                
                {/* Social Proof - Chiffres */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-mono text-sm">
                    +2,847 sessions de focus optimisées cette semaine
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Preview - L'Effet d'Ancrage */}
        <section className="py-20 bg-gradient-to-b from-background to-muted/20">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="relative rounded-3xl border border-border/50 bg-card/50 backdrop-blur-xl p-4 shadow-2xl overflow-hidden">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 mb-4 px-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60"></div>
                  <div className="w-3 h-3 rounded-full bg-warning/60"></div>
                  <div className="w-3 h-3 rounded-full bg-success/60"></div>
                </div>
                <div className="flex-1 bg-muted/50 rounded-lg h-8 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground font-mono">app.deepflow.ai/dashboard</span>
                </div>
              </div>
              
              {/* Dashboard Preview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                {/* Score Card */}
                <div className="md:col-span-1 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-6 border border-primary/20">
                  <div className="text-sm text-muted-foreground mb-2">Score Productivité</div>
                  <div className="text-5xl font-heading font-bold text-primary font-mono">87</div>
                  <div className="text-xs text-success mt-2 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> +12% cette semaine
                  </div>
                </div>
                
                {/* Tasks Preview */}
                <div className="md:col-span-2 bg-card/80 rounded-2xl p-6 border border-border/30">
                  <div className="text-sm text-muted-foreground mb-4">Tâches prioritaires</div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                      <span className="text-xs sm:text-sm">Finaliser la présentation client</span>
                      <span className="ml-auto text-[10px] sm:text-xs bg-destructive/20 text-destructive px-2 py-1 rounded-full">Urgent</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                      <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-muted-foreground/30"></div>
                      <span className="text-xs sm:text-sm">Réviser le budget Q2</span>
                      <span className="ml-auto text-[10px] sm:text-xs bg-warning/20 text-warning px-2 py-1 rounded-full">Haute</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Insight Banner */}
              <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Insight DeepFlow</div>
                  <div className="text-xs text-muted-foreground">
                    "Votre productivité est 23% plus élevée le matin. Planifiez vos tâches critiques avant 11h."
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section PAS - Problème, Agitation, Solution */}
        <section className="py-32">
          <div className="container max-w-4xl mx-auto px-6">
            {/* Problème */}
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-6">
                <Target className="h-4 w-4" />
                Le Problème
              </div>
              <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
                Votre liste de tâches s'allonge,<br />
                <span className="text-muted-foreground">mais votre sentiment d'accomplissement stagne.</span>
              </h2>
            </div>

            {/* Agitation */}
            <div className="bg-gradient-to-br from-destructive/5 via-warning/5 to-transparent rounded-3xl p-10 mb-20 border border-destructive/10">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-heading font-semibold mb-4 text-foreground">
                    Chaque distraction vous coûte
                  </h3>
                  <div className="text-6xl font-heading font-bold text-destructive font-mono mb-4">
                    23 min
                  </div>
                  <p className="text-muted-foreground">
                    de concentration pour revenir à votre tâche initiale.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-background/80 border border-border/50">
                    <Clock className="h-8 w-8 text-warning" />
                    <div>
                      <div className="font-semibold">En un an</div>
                      <div className="text-sm text-muted-foreground">C'est un mois entier de vie perdu</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-background/80 border border-border/50">
                    <Brain className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">Charge mentale</div>
                      <div className="text-sm text-muted-foreground">Stress, anxiété, épuisement décisionnel</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Solution */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                La Solution
              </div>
              <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
                DeepFlow n'est pas une liste.
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                C'est un <span className="text-primary font-semibold">cerveau externe</span> qui priorise pour vous, analyse vos patterns, et vous guide vers ce qui compte vraiment.
              </p>
            </div>
          </div>
        </section>

        {/* Comment ça marche - Règle de 3 */}
        <section className="py-32 bg-gradient-to-b from-muted/20 to-background">
          <div className="container max-w-5xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-16">
              Simple. Trois étapes.
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Étape 1 */}
              <div className="relative group">
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-mono font-bold text-primary text-xl border-2 border-primary/30">
                  1
                </div>
                <div className="pt-8 pl-4">
                  <h3 className="text-xl font-heading font-semibold mb-3">Capturez</h3>
                  <p className="text-muted-foreground">
                    Videz votre esprit. Tâches, idées, projets — tout au même endroit.
                  </p>
                </div>
              </div>

              {/* Étape 2 */}
              <div className="relative group">
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-mono font-bold text-primary text-xl border-2 border-primary/50">
                  2
                </div>
                <div className="pt-8 pl-4">
                  <h3 className="text-xl font-heading font-semibold mb-3">Focus</h3>
                  <p className="text-muted-foreground">
                    L'IA priorise. Vous travaillez sur ce qui génère le plus d'impact.
                  </p>
                </div>
              </div>

              {/* Étape 3 */}
              <div className="relative group">
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center font-mono font-bold text-primary text-xl border-2 border-primary/70">
                  3
                </div>
                <div className="pt-8 pl-4">
                  <h3 className="text-xl font-heading font-semibold mb-3">Analysez</h3>
                  <p className="text-muted-foreground">
                    Découvrez vos patterns. Optimisez votre énergie et votre temps.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial / Social Proof Section */}
        <section className="py-24">
          <div className="container max-w-4xl mx-auto px-6 text-center">
            <div className="flex justify-center gap-8 flex-wrap">
              <div className="flex flex-col items-center">
                <div className="text-4xl font-heading font-bold text-primary font-mono">+2,847</div>
                <div className="text-sm text-muted-foreground">Sessions Focus</div>
              </div>
              <div className="w-px bg-border hidden md:block"></div>
              <div className="flex flex-col items-center">
                <div className="text-4xl font-heading font-bold text-success font-mono">87%</div>
                <div className="text-sm text-muted-foreground">Taux de complétion</div>
              </div>
              <div className="w-px bg-border hidden md:block"></div>
              <div className="flex flex-col items-center">
                <div className="text-4xl font-heading font-bold text-info font-mono">4.2h</div>
                <div className="text-sm text-muted-foreground">Gagnées par semaine</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer CTA */}
      <footer className="py-20 border-t border-border/30">
        <div className="container max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
            Prêt à retrouver votre temps ?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Commencez gratuitement. Aucune carte bancaire requise.
          </p>
          <Link to="/register">
            <Button 
              size="lg" 
              className="text-lg px-10 py-7 font-semibold bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-all duration-300 shadow-xl shadow-primary/25"
            >
              Reprendre le contrôle
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-8">
            &copy; {new Date().getFullYear()} DeepFlow. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
