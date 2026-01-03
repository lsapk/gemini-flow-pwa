import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Zap, Brain, Trophy, Lock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface PremiumUpgradeCardProps {
  onUpgrade?: () => void;
}

export const PremiumUpgradeCard: React.FC<PremiumUpgradeCardProps> = ({ onUpgrade }) => {
  const { 
    currentTier, 
    isPremium, 
    createPayPalOrder, 
    isCreatingOrder,
    getRemainingUses,
  } = useSubscription();

  const handleUpgrade = async (plan: string) => {
    try {
      const result = await createPayPalOrder(plan);
      if (result?.approvalUrl) {
        window.location.href = result.approvalUrl;
      }
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  if (isPremium) {
    return (
      <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            <CardTitle>Abonnement Premium Actif</CardTitle>
          </div>
          <CardDescription>
            Vous bénéficiez d'un accès illimité à toutes les fonctionnalités
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span>Chat IA illimité</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span>Analyses illimitées</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span>Profil IA personnalisé</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span>Gamification complète</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const remainingChats = getRemainingUses("chat");
  const remainingAnalyses = getRemainingUses("analysis");

  return (
    <Card className="border-muted">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
            <CardTitle>Passez à Premium</CardTitle>
          </div>
          <Badge variant="secondary">Basic</Badge>
        </div>
        <CardDescription>
          Débloquez toutes les fonctionnalités pour booster votre productivité
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current usage */}
        <div className="p-4 rounded-lg bg-muted/50">
          <h4 className="font-medium mb-2">Utilisation aujourd'hui</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Chat IA:</span>{" "}
              <span className={remainingChats === 0 ? "text-destructive" : ""}>
                {remainingChats} restants
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Analyses:</span>{" "}
              <span className={remainingAnalyses === 0 ? "text-destructive" : ""}>
                {remainingAnalyses} restante{remainingAnalyses > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div className="space-y-4">
          <h4 className="font-medium">Ce que vous obtenez avec Premium:</h4>
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Chat IA illimité</p>
                <p className="text-sm text-muted-foreground">Au lieu de 5/jour</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Analyses illimitées</p>
                <p className="text-sm text-muted-foreground">Au lieu de 1/jour</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Profil IA personnalisé</p>
                <p className="text-sm text-muted-foreground">Analyse psychologique complète</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Gamification complète</p>
                <p className="text-sm text-muted-foreground">Quêtes, achievements et récompenses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => handleUpgrade("premium_monthly")}
            disabled={isCreatingOrder}
            className="flex flex-col h-auto py-4"
          >
            <span className="text-lg font-bold">4,99€</span>
            <span className="text-xs opacity-80">/mois</span>
          </Button>
          <Button
            onClick={() => handleUpgrade("premium_yearly")}
            disabled={isCreatingOrder}
            variant="default"
            className="flex flex-col h-auto py-4 relative"
          >
            <Badge className="absolute -top-2 -right-2 bg-green-500">-17%</Badge>
            <span className="text-lg font-bold">49,99€</span>
            <span className="text-xs opacity-80">/an</span>
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Paiement sécurisé via PayPal • Annulation à tout moment
        </p>
      </CardContent>
    </Card>
  );
};

export const FeatureLockedOverlay: React.FC<{ 
  feature: string;
  children: React.ReactNode;
}> = ({ feature, children }) => {
  const { canUseFeature, isPremium } = useSubscription();

  const featureMap: Record<string, "chat" | "analysis" | "ai_profile" | "gamification"> = {
    chat: "chat",
    analysis: "analysis",
    ai_profile: "ai_profile",
    gamification: "gamification",
  };

  const mappedFeature = featureMap[feature];
  const canUse = mappedFeature ? canUseFeature(mappedFeature) : true;

  if (canUse) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none blur-sm">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <div className="text-center p-6">
          <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">
            {feature === "ai_profile" ? "Profil IA Premium" : 
             feature === "gamification" ? "Gamification Premium" :
             "Limite quotidienne atteinte"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isPremium 
              ? "Cette fonctionnalité nécessite un abonnement premium"
              : "Passez à Premium pour un accès illimité"
            }
          </p>
          <Button size="sm" onClick={() => window.location.href = "/settings"}>
            <Crown className="h-4 w-4 mr-2" />
            Passer à Premium
          </Button>
        </div>
      </div>
    </div>
  );
};
