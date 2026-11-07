import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Brand } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";

export default function OAuthConsent() {
  return (
    <main className="auth-scene">
      <section className="standalone-panel glass-material space-y-5">
        <Link to="/" aria-label="Accueil Deepflow">
          <Brand />
        </Link>
        <div className="status-symbol">
          <ShieldCheck size={24} aria-hidden="true" />
        </div>
        <p className="eyebrow">AUTORISATIONS</p>
        <h1 className="page-title">Autorisation indisponible</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          L’accès des applications tierces à Deepflow est suspendu pendant la
          sécurisation de cette ancienne API. Aucune autorisation ni redirection
          vers une application externe n’a été effectuée.
        </p>
        <Button asChild>
          <Link to="/dashboard">Revenir à Deepflow</Link>
        </Button>
      </section>
    </main>
  );
}
