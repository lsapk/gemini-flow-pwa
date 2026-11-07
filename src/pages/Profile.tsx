import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePersonalityProfile } from "@/hooks/usePersonalityProfile";
import PersonalityProfileCard from "@/components/PersonalityProfileCard";
import { useAuth } from "@/hooks/useAuth";

export default function Profile() {
  const { profile, isLoading, error, generateProfile } =
    usePersonalityProfile();
  const { user } = useAuth();
  const [consent, setConsent] = useState({ userId: user?.id, enabled: false });
  const includeJournal = consent.userId === user?.id && consent.enabled;
  const generate = () => generateProfile({ includeJournal });
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="page-intro">
        <p className="eyebrow mb-3">PROFIL IA</p>
        <h1 className="page-title">Pistes de réflexion personnelles</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Explorer vos habitudes de travail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            À votre demande, Google Gemini reçoit vos tâches, habitudes,
            objectifs et séances récentes pour proposer des pistes à vérifier.
            Ce texte ne constitue pas une évaluation psychologique ou un
            diagnostic. Chaque génération utilise 1 crédit.
          </p>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={includeJournal}
              onChange={(event) =>
                setConsent({ userId: user?.id, enabled: event.target.checked })
              }
              disabled={isLoading}
              className="mt-1"
            />
            <span>
              J’autorise aussi l’envoi de mes 20 dernières notes de journal et
              de mes 20 dernières réflexions personnelles à Google Gemini pour
              cette analyse.
            </span>
          </label>
          <Button onClick={generate} disabled={isLoading}>
            {isLoading ? "Analyse en cours…" : "Générer des pistes · 1 crédit"}
          </Button>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
      {profile && (
        <PersonalityProfileCard
          profile={profile}
          onRefresh={generate}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
