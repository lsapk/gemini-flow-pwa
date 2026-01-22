import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Retour</span>
          </Link>
          <div className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-primary" />
            <span className="font-heading font-bold">DeepFlow</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold font-heading mb-2 gradient-text">
            Politique des Cookies
          </h1>
          <p className="text-muted-foreground mb-8">Dernière mise à jour : Janvier 2025</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Qu'est-ce qu'un cookie ?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Un cookie est un petit fichier texte stocké sur votre appareil lorsque vous visitez un site web. Les cookies permettent au site de mémoriser vos actions et préférences sur une période donnée.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Cookies utilisés par DeepFlow</h2>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h3 className="font-bold text-foreground mb-2">Cookies essentiels</h3>
                  <p className="text-muted-foreground text-sm">
                    Nécessaires au fonctionnement de l'application. Incluent l'authentification et les préférences de session.
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="inline-block px-2 py-1 rounded bg-success/10 text-success">Obligatoires</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h3 className="font-bold text-foreground mb-2">Cookies de préférences</h3>
                  <p className="text-muted-foreground text-sm">
                    Mémorisent vos préférences (thème, langue, design mode) pour personnaliser votre expérience.
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="inline-block px-2 py-1 rounded bg-primary/10 text-primary">Fonctionnels</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h3 className="font-bold text-foreground mb-2">Cookies d'analyse</h3>
                  <p className="text-muted-foreground text-sm">
                    Nous aident à comprendre comment vous utilisez l'application pour l'améliorer. Données anonymisées.
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="inline-block px-2 py-1 rounded bg-info/10 text-info">Optionnels</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Stockage local (localStorage)</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                En plus des cookies, nous utilisons le stockage local de votre navigateur pour :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Sauvegarder vos données hors ligne</li>
                <li>Mémoriser l'option "Se souvenir de moi"</li>
                <li>Stocker les préférences de l'application</li>
                <li>Mettre en cache les données pour des performances optimales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Durée de conservation</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 text-foreground">Type de cookie</th>
                    <th className="text-left py-2 text-foreground">Durée</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/30">
                    <td className="py-2">Session d'authentification</td>
                    <td className="py-2">7 jours (ou 30 si "Se souvenir de moi")</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2">Préférences utilisateur</td>
                    <td className="py-2">1 an</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2">Données hors ligne</td>
                    <td className="py-2">Jusqu'à synchronisation</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Gérer vos cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Vous pouvez contrôler et supprimer les cookies via les paramètres de votre navigateur :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Chrome</strong> : Paramètres → Confidentialité et sécurité → Cookies</li>
                <li><strong className="text-foreground">Firefox</strong> : Options → Vie privée et sécurité → Cookies</li>
                <li><strong className="text-foreground">Safari</strong> : Préférences → Confidentialité → Cookies</li>
                <li><strong className="text-foreground">Edge</strong> : Paramètres → Cookies et autorisations de site</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4 p-4 bg-warning/10 rounded-lg border border-warning/30">
                ⚠️ La désactivation des cookies essentiels peut empêcher l'application de fonctionner correctement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                Pour toute question concernant notre utilisation des cookies, contactez-nous à : <a href="mailto:privacy@deepflow.app" className="text-primary hover:underline">privacy@deepflow.app</a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-border/50 flex gap-4">
            <Button asChild variant="outline">
              <Link to="/legal/privacy">Politique de confidentialité</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/legal/terms">Conditions d'utilisation</Link>
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
