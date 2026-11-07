import { Link } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import { Brand } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="auth-scene">
      <section className="standalone-panel glass-material space-y-5">
        <Link to="/" aria-label="Accueil Deepflow">
          <Brand />
        </Link>
        <div className="status-symbol">
          <Compass size={24} aria-hidden="true" />
        </div>
        <p className="eyebrow">ERREUR 404</p>
        <h1 className="page-title">Page introuvable</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Cette page a été déplacée ou son adresse est incorrecte.
        </p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft aria-hidden="true" /> Retour à l’accueil
          </Link>
        </Button>
      </section>
    </main>
  );
}
