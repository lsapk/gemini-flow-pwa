import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Crown, Lock, RefreshCw, Loader2 } from "lucide-react";
import { usePersonalityProfile, PersonalityProfile } from "@/hooks/usePersonalityProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import PersonalityProfileCard from "@/components/PersonalityProfileCard";

export default function Profile() {
  const { profile, isLoading, isInitialLoading, generateProfile } = usePersonalityProfile();
  const { canUseFeature } = useSubscription();

  // Check if user has access to AI Profile
  if (!canUseFeature("ai_profile")) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card className="border-dashed bg-card/50 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-4">
              <Lock className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Fonctionnalité Premium</h3>
            <p className="text-muted-foreground mb-6">
              Le profil IA est réservé aux utilisateurs Premium. Profitez d'une analyse psychologique complète et personnalisée.
            </p>
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/settings">
                <Crown className="h-4 w-4 mr-2" />
                Passer à Premium
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Chargement de votre profil IA...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-card to-background">
          <CardContent className="py-16 text-center relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Brain className="h-32 w-32" />
            </div>
            <div className="p-5 bg-primary/10 rounded-2xl w-fit mx-auto mb-8 ring-1 ring-primary/20">
              <Brain className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Découvrez votre profil IA
            </h2>
            <p className="text-muted-foreground mb-10 max-w-md mx-auto text-lg leading-relaxed">
              L'IA analyse vos habitudes, vos tâches et vos objectifs pour créer un profil psychologique complet et des recommandations sur mesure.
            </p>
            <Button
              onClick={generateProfile}
              disabled={isLoading}
              size="lg"
              className="rounded-xl h-14 px-8 text-lg font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-3 h-6 w-6 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-3 h-6 w-6" />
                  Générer mon profil
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse profile data - handle both string and object formats
  const data = typeof profile === 'string' ? JSON.parse(profile) : profile;

  return (
    <div className="max-w-5xl mx-auto py-4 px-2 sm:px-4">
      <PersonalityProfileCard
        profile={data as PersonalityProfile}
        onRefresh={generateProfile}
        isLoading={isLoading}
      />
    </div>
  );
}
