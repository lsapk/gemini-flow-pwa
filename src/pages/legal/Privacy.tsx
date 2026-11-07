import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  return (
    <div className="reading-scene min-h-dvh">
      <header className="reading-header glass-material">
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
        <div className="reading-card panel">
          <h1 className="page-title mb-3">Politique de Confidentialité</h1>
          <p className="text-muted-foreground mb-8">Dernière mise à jour : 4 novembre 2026</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Responsable de traitement</h2>
              <p className="text-muted-foreground leading-relaxed">
                DeepFlow est édité et exploité depuis la France. Pour toute question relative à la protection de vos données personnelles, vous pouvez contacter le responsable de traitement à : <a href="mailto:deepflow.ia@gmail.com" className="text-primary hover:underline">deepflow.ia@gmail.com</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Données collectées</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">Nous collectons les types de données suivants :</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Données d'identification</strong> : email, nom d'utilisateur</li>
                <li><strong className="text-foreground">Données d'utilisation</strong> : tâches, habitudes, sessions de focus, entrées de journal</li>
                <li><strong className="text-foreground">Données étudiantes</strong> : établissement renseigné, semestres, UE, notes, échéances et événements importés</li>
                <li><strong className="text-foreground">Connexions facultatives</strong> : autorisations Google Calendar et Tasks, données consultées ou transférées à votre demande</li>
                <li><strong className="text-foreground">Données techniques</strong> : session de connexion, préférences, état du minuteur et journaux techniques des services d’hébergement</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Utilisation des données</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">Vos données sont utilisées pour :</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Fournir et améliorer nos services</li>
                <li>Personnaliser votre expérience avec l'IA</li>
                <li>Générer des insights de productivité</li>
                <li>Traiter les paiements et gérer les abonnements</li>
                <li>Assurer la sécurité de votre compte</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Sous-traitants et partage</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Nous ne vendons jamais vos données personnelles. Nous les partageons uniquement avec les sous-traitants suivants :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Supabase</strong> : hébergement de la base de données et authentification (UE/US)</li>
                <li><strong className="text-foreground">Google AI (Gemini)</strong> : messages et contexte que vous choisissez de transmettre à l’IA. Ces contenus ne sont pas garantis anonymes. Les entrées du journal et réflexions sont exclues sauf activation explicite de leur partage. Le traitement dépend des <a href="https://aistudio.google.com/docs/terms" target="_blank" rel="noopener noreferrer" className="underline">conditions du service Gemini utilisé</a>.</li>
                <li><strong className="text-foreground">Google Calendar et Tasks</strong> : connexion facultative, révocable depuis Connexions. Les transferts de tâches et modifications de calendrier nécessitent une action de votre part.</li>
                <li><strong className="text-foreground">Stripe</strong> : traitement sécurisé des paiements par carte bancaire</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Sécurité</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nous utilisons des mesures de sécurité conformes aux standards de l'industrie : chiffrement des données en transit (TLS) et au repos, authentification par tokens JWT avec PKCE, politiques de sécurité au niveau des lignes (RLS) pour isoler vos données.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Vos droits (RGPD)</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Accès</strong> : consulter vos données via la page Paramètres</li>
                <li><strong className="text-foreground">Rectification</strong> : modifier votre profil à tout moment</li>
                <li><strong className="text-foreground">Suppression</strong> : demander la suppression de votre compte et de vos données à l’adresse de contact ci-dessous</li>
                <li><strong className="text-foreground">Portabilité</strong> : exporter vos données principales depuis Paramètres et vos données étudiantes depuis Espace étudiant</li>
                <li><strong className="text-foreground">Connexions et partage IA</strong> : déconnecter Google depuis Connexions et désactiver les options de contexte avant une nouvelle demande IA. Une désactivation ne retire pas les informations déjà envoyées.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                Pour toute question ou exercice de vos droits : <a href="mailto:deepflow.ia@gmail.com" className="text-primary hover:underline">deepflow.ia@gmail.com</a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t flex flex-wrap gap-3">
            <Button asChild variant="outline"><Link to="/legal/terms">Conditions d'utilisation</Link></Button>
            <Button asChild variant="outline"><Link to="/legal/cookies">Politique des cookies</Link></Button>
          </div>
        </div>
      </main>
    </div>
  );
}
