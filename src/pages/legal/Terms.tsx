import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
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
            <FileText className="w-5 h-5 text-primary" />
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
            Conditions d'Utilisation
          </h1>
          <p className="text-muted-foreground mb-8">Dernière mise à jour : Janvier 2025</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptation des conditions</h2>
              <p className="text-muted-foreground leading-relaxed">
                En accédant et en utilisant DeepFlow, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Description du service</h2>
              <p className="text-muted-foreground leading-relaxed">
                DeepFlow est une application de productivité augmentée par l'intelligence artificielle. Elle offre des fonctionnalités de gestion de tâches, suivi d'habitudes, sessions de focus, journaling et gamification pour améliorer votre productivité quotidienne.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Inscription et compte</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Vous devez fournir des informations exactes lors de l'inscription</li>
                <li>Vous êtes responsable de la confidentialité de votre mot de passe</li>
                <li>Vous devez avoir au moins 16 ans pour utiliser le service</li>
                <li>Un compte par personne est autorisé</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Utilisation acceptable</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">Vous vous engagez à ne pas :</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Utiliser le service à des fins illégales</li>
                <li>Tenter de compromettre la sécurité du service</li>
                <li>Partager votre compte avec des tiers</li>
                <li>Utiliser des robots ou scripts automatisés</li>
                <li>Revendre ou redistribuer le service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Abonnements et paiements</h2>
              <p className="text-muted-foreground leading-relaxed">
                DeepFlow propose des formules gratuites et premium. Les abonnements sont facturés mensuellement ou annuellement. Vous pouvez annuler à tout moment, mais les paiements effectués ne sont pas remboursables, sauf dans les cas prévus par la loi.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Propriété intellectuelle</h2>
              <p className="text-muted-foreground leading-relaxed">
                Tout le contenu de DeepFlow (code, design, textes, images) est protégé par les droits d'auteur. Vous conservez la propriété de vos données personnelles et du contenu que vous créez.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Limitation de responsabilité</h2>
              <p className="text-muted-foreground leading-relaxed">
                DeepFlow est fourni "tel quel". Nous ne garantissons pas que le service sera ininterrompu ou sans erreur. Nous ne sommes pas responsables des pertes indirectes résultant de l'utilisation du service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Modification des conditions</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications importantes seront notifiées par email ou via l'application.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Résiliation</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nous pouvons suspendre ou résilier votre compte en cas de violation de ces conditions. Vous pouvez supprimer votre compte à tout moment depuis les paramètres.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Droit applicable</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ces conditions sont régies par le droit français. Tout litige sera soumis aux tribunaux compétents de Paris, France.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-border/50 flex gap-4">
            <Button asChild variant="outline">
              <Link to="/legal/privacy">Politique de confidentialité</Link>
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
