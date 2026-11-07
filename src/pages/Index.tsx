import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CalendarDays,
  GraduationCap,
  Sparkles,
  Timer,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { Brand } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
const features = [
  {
    icon: GraduationCap,
    title: "Votre semestre, en clair.",
    description:
      "Retrouvez vos UE, notes, examens et emploi du temps. Importez un fichier ICS depuis votre université.",
  },
  {
    icon: CalendarDays,
    title: "Tout se rejoint.",
    description:
      "Consultez Google Calendar et transférez vos tâches Google Tasks, avec votre accord et des contrôles explicites.",
  },
  {
    icon: Timer,
    title: "Du temps pour avancer.",
    description:
      "Choisissez une tâche, lancez une session et retrouvez le fil. Une pause reste toujours à portée de main.",
  },
];
export default function Index() {
  const { user, isLoading } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return (
    <div className="landing-scene min-h-dvh">
      <a href="#content" className="skip-link">
        Aller au contenu
      </a>
      <header className="landing-header glass-material">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-6">
          <Link to="/" aria-label="Deepflow, accueil">
            <Brand />
          </Link>
          <nav
            aria-label="Navigation du site"
            className="flex flex-wrap items-center gap-1 sm:gap-3"
          >
            <Link
              to="/preview"
              className="hidden text-xs text-muted-foreground hover:text-primary sm:block"
            >
              Découvrir l’interface
            </Link>
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Connexion</Link>
            </Button>
            <Button asChild size="sm" className="text-xs">
              <Link to="/register">Créer mon espace</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main id="content">
        <section className="landing-hero mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:px-9 md:py-24 lg:grid-cols-[1.04fr_.96fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-[10px] font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              POUR VOS ÉTUDES. ET TOUT LE RESTE.
            </div>
            <h1 className="landing-display">
              Un esprit clair.
              <br />
              <span className="text-primary">Une journée à vous.</span>
            </h1>
            <p className="mb-8 mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Vos cours, vos tâches, vos idées. Deepflow rassemble l’essentiel
              pour vous aider à avancer, à votre rythme.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-2 rounded-xl text-sm">
                <Link to="/register">
                  Créer mon espace
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button
                variant="ghost"
                asChild
                size="lg"
                className="gap-2 text-sm"
              >
                <Link to="/preview">
                  Explorer l’interface
                  <ArrowUpRight size={16} />
                </Link>
              </Button>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              Pensé pour les études en France. Ouvert à tous vos projets.
            </p>
          </div>
          <div className="landing-stage">
            <div className="landing-orbit" aria-hidden="true" />
            <div className="landing-preview glass-material overflow-hidden">
              <div className="flex items-center justify-between border-b px-6 py-5">
                <Brand small />
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                  APERÇU
                </span>
              </div>
              <div className="p-6 sm:p-8">
                <p className="eyebrow mb-2">UN APERÇU DE VOTRE JOURNÉE</p>
                <h2 className="text-2xl font-semibold tracking-[-.7px]">
                  De la place pour l’essentiel.
                </h2>
                <div className="landing-focus mt-6 rounded-2xl p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-primary">
                      CONCENTRATION
                    </span>
                    <Timer size={16} className="text-primary" />
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-5xl font-light tracking-[-2px]">
                      25<span className="text-muted-foreground/50">:00</span>
                    </p>
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                      <ArrowRight size={16} />
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Un moment pour avancer sur votre projet.
                  </p>
                </div>
                <div className="mt-4 space-y-1">
                  {[
                    "Préparer le prochain TD",
                    "Faire le point sur mes priorités",
                    "Garder du temps pour souffler",
                  ].map((text, i) => (
                    <div
                      key={text}
                      className="flex items-center gap-3 border-b border-border/60 py-3"
                    >
                      <span
                        className={`grid h-4 w-4 place-items-center rounded border ${i === 2 ? "border-primary/20 bg-primary/10 text-primary" : ""}`}
                      >
                        {i === 2 && <Check size={11} />}
                      </span>
                      <span
                        className={`text-xs ${i === 2 ? "text-muted-foreground line-through" : ""}`}
                      >
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-right text-[9px] text-muted-foreground">
                  Illustration de l’interface · données d’exemple
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl border-t border-border/70 px-5 py-16 md:px-9">
          <p className="eyebrow mb-4">MOINS D’ONGLETS, PLUS DE CLARTÉ</p>
          <h2 className="landing-section-title mb-10">
            Un quotidien qui respire.
          </h2>
          <div className="feature-index">
            {features.map((feature, index) => (
              <article key={feature.title} className="feature-row">
                <span className="feature-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="feature-icon" aria-hidden="true">
                  <feature.icon size={21} strokeWidth={1.5} />
                </span>
                <h3 className="text-lg font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/60 px-6 py-5">
            <div className="flex items-center gap-3">
              <ShieldCheck size={21} className="shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Vous gardez la main sur vos connexions et les données partagées
                avec l’IA.
              </p>
            </div>
            <Link
              to="/preview"
              className="inline-flex items-center gap-2 text-xs font-medium text-primary"
            >
              Découvrir Deepflow
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-7 text-xs text-muted-foreground md:px-9">
          <span>© {new Date().getFullYear()} Deepflow</span>
          <span>Votre rythme. Vos priorités. Votre espace.</span>
          <nav aria-label="Informations légales" className="flex gap-4">
            <Link to="/legal/privacy" className="hover:text-primary">
              Confidentialité
            </Link>
            <Link to="/legal/terms" className="hover:text-primary">
              Conditions
            </Link>
          </nav>
          <Link to="/login" className="hover:text-primary">
            Ouvrir mon espace ↗
          </Link>
        </div>
      </footer>
    </div>
  );
}
