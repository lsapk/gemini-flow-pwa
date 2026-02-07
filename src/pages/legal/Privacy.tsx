import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
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
            <Shield className="w-5 h-5 text-primary" />
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
            Politique de Confidentialité
          </h1>
          <p className="text-muted-foreground mb-8">Dernière mise à jour : Janvier 2025</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                DeepFlow ("nous", "notre", "nos") s'engage à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez notre application de productivité.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Données collectées</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">Nous collectons les types de données suivants :</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Données d'identification</strong> : email, nom d'utilisateur</li>
                <li><strong className="text-foreground">Données d'utilisation</strong> : tâches, habitudes, sessions de focus, entrées de journal</li>
                <li><strong className="text-foreground">Données de gamification</strong> : XP, badges, quêtes complétées</li>
                <li><strong className="text-foreground">Données techniques</strong> : type d'appareil, version du navigateur</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Utilisation des données</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">Vos données sont utilisées pour :</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Fournir et améliorer nos services</li>
                <li>Personnaliser votre expérience avec l'IA</li>
                <li>Générer des insights de productivité</li>
                <li>Assurer la sécurité de votre compte</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Partage des données</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nous ne vendons jamais vos données personnelles. Nous partageons vos données uniquement avec :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                <li><strong className="text-foreground">Supabase</strong> : notre fournisseur d'infrastructure</li>
                <li><strong className="text-foreground">Google AI</strong> : pour les fonctionnalités d'IA (données anonymisées)</li>
                <li><strong className="text-foreground">Stripe/PayPal</strong> : pour le traitement des paiements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Sécurité</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nous utilisons des mesures de sécurité conformes aux standards de l'industrie, incluant le chiffrement des données en transit et au repos, l'authentification sécurisée, et des audits de sécurité réguliers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Vos droits (RGPD)</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">Vous avez le droit de :</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Accéder à vos données personnelles</li>
                <li>Rectifier vos données</li>
                <li>Supprimer vos données</li>
                <li>Exporter vos données (portabilité)</li>
                <li>Retirer votre consentement</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                Pour toute question concernant cette politique de confidentialité ou vos données personnelles, contactez-nous à : <a href="mailto:deepflow.ia@gmail.com" className="text-primary hover:underline">deepflow.ia@gmail.com</a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-border/50 flex gap-4">
            <Button asChild variant="outline">
              <Link to="/legal/terms">Conditions d'utilisation</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/legal/cookies">Politique des cookies</Link>
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
