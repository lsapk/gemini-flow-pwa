import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Crown, Lock, RefreshCw, User, Target, Zap, Heart } from "lucide-react";
import { usePersonalityProfile } from "@/hooks/usePersonalityProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Profile() {
  const { profile, isLoading, generateProfile } = usePersonalityProfile();
  const { canUseFeature, isPremium } = useSubscription();

  // Check if user has access to AI Profile
  if (!canUseFeature("ai_profile")) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Fonctionnalité Premium</h3>
            <p className="text-muted-foreground mb-6">
              Le profil IA est réservé aux utilisateurs Premium.
            </p>
            <Button asChild size="lg">
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

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-6">
              <Brain className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-3">
              Découvrez votre profil IA
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              L'IA analyse vos données pour créer un profil personnalisé avec des insights et recommandations.
            </p>
            <Button onClick={generateProfile} disabled={isLoading} size="lg">
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
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
  
  // Get traits - support both 'traits' and 'mainTraits' keys
  const traits = data?.personality?.traits || data?.personality?.mainTraits || [];
  const strengths = data?.personality?.strengths || [];
  const workingStyle = data?.personality?.working_style || data?.personality?.workingStyle || "";
  const habitsToDevvelop = data?.recommendations?.habits_to_develop || data?.recommendations?.habitsToDevvelop || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Mon Profil IA</h1>
            <p className="text-sm text-muted-foreground">Analyse personnalisée</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={generateProfile} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Main Traits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Personnalité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {traits.length > 0 ? traits.slice(0, 4).map((trait: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{trait}</span>
                </div>
              )) : (
                <p className="text-muted-foreground col-span-2">Données non disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Strengths & Style */}
      <div className="grid sm:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Forces
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {strengths.length > 0 ? strengths.slice(0, 3).map((strength: string, i: number) => (
                  <Badge key={i} variant="secondary" className="mr-2 mb-2">
                    ✨ {strength}
                  </Badge>
                )) : <p className="text-sm text-muted-foreground">Non disponible</p>}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Style de travail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {workingStyle || "Analyse en cours..."}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {habitsToDevvelop.length > 0 ? habitsToDevvelop.slice(0, 4).map((habit: string, i: number) => (
                <div key={i} className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">💡 {habit}</p>
                </div>
              )) : (
                <p className="text-muted-foreground col-span-2">Générez votre profil pour voir les recommandations</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
