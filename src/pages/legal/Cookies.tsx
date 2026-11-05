import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Cookies() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b px-5 py-5">
        <Link
          to="/"
          className="mx-auto flex max-w-3xl items-center gap-2 text-sm text-primary"
        >
          <ArrowLeft size={16} />
          Retour à Deepflow
        </Link>
      </header>
      <main className="mx-auto max-w-3xl space-y-8 px-5 py-12">
        <div>
          <h1 className="page-title">Cookies et stockage local</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Dernière mise à jour : 4 novembre 2026
          </p>
        </div>
        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">
            Ce que votre navigateur conserve
          </h2>
          <ul className="list-disc space-y-3 pl-5 text-muted-foreground">
            <li>
              La session Supabase, dans une clé commençant par <code>sb-</code>,
              permet de rester connecté. Sa validité dépend de la configuration
              du service d’authentification. La déconnexion retire la session
              locale.
            </li>
            <li>
              La préférence <code>theme</code> conserve votre choix clair,
              sombre ou système sur cet appareil.
            </li>
            <li>
              Une session de concentration en cours est conservée dans une clé
              propre à votre compte, commençant par{" "}
              <code>deepflow_focus_v2_</code>. Elle permet de reprendre le
              minuteur après rechargement ; elle est retirée à la fin de la
              session ou à la déconnexion.
            </li>
            <li>
              Le service worker met en cache des fichiers publics de
              l’interface. Il ne met pas en cache les réponses
              d’authentification, API ou les données privées de votre espace.
            </li>
            <li>
              La connexion Google utilise temporairement un cookie technique de
              vérification OAuth, inaccessible au JavaScript de la page. Les
              jetons Google sont conservés côté serveur.
            </li>
          </ul>
        </section>
        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">Conservation et suppression</h2>
          <p className="text-muted-foreground">
            Le thème et les fichiers publics restent jusqu’à leur remplacement
            ou à la suppression des données du site. Vous pouvez effacer les
            cookies, le stockage local et les données hors connexion depuis les
            paramètres de votre navigateur. Cela déconnecte cet appareil et peut
            supprimer l’état d’un minuteur non enregistré.
          </p>
          <p className="text-muted-foreground">
            Cette version n’installe pas de service publicitaire ou de mesure
            d’audience dans l’interface.
          </p>
        </section>
        <section className="space-y-3 text-sm">
          <h2 className="text-lg font-semibold">Contact</h2>
          <a
            href="mailto:deepflow.ia@gmail.com"
            className="text-primary underline"
          >
            deepflow.ia@gmail.com
          </a>
        </section>
        <nav
          aria-label="Documents associés"
          className="flex flex-wrap gap-5 border-t pt-6 text-sm text-primary"
        >
          <Link to="/legal/privacy">Confidentialité</Link>
          <Link to="/legal/terms">Conditions d’utilisation</Link>
        </nav>
      </main>
    </div>
  );
}
