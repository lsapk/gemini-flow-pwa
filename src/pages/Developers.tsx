import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Developers() {
  return <section className="max-w-3xl space-y-6">
    <div><p className="eyebrow mb-3">INTÉGRATIONS</p><h1 className="page-title">API développeurs</h1></div>
    <div className="panel space-y-4 p-7"><Shield className="text-primary" aria-hidden="true" />
      <h2 className="text-lg font-semibold">Les autorisations tierces sont suspendues.</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">L’ancienne API ne garantit pas encore les contrôles requis sur les jetons et les autorisations. La création d’applications et l’accès via ces anciens jetons sont suspendus. Aucune nouvelle autorisation n’est accordée depuis cette page.</p>
      <p className="text-sm leading-relaxed text-muted-foreground">Les connexions Google Calendar et Tasks utilisent un circuit distinct. Vous pouvez les gérer depuis Connexions.</p>
      <Button asChild><Link to="/connections">Gérer mes connexions</Link></Button>
    </div>
  </section>;
}
