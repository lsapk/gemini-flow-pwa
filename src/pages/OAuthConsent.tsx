import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
export default function OAuthConsent() {
  return <section className="mx-auto max-w-xl space-y-5 p-8"><h1 className="text-2xl font-semibold">Autorisation indisponible</h1><p>L’accès des applications tierces à Deepflow est suspendu pendant la sécurisation de cette ancienne API. Aucune autorisation ni redirection vers une application externe n’a été effectuée.</p><Button asChild><Link to="/dashboard">Revenir à Deepflow</Link></Button></section>;
}
