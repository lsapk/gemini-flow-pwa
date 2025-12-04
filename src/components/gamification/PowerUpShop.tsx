import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Clock, Check, Lock } from "lucide-react";
import { usePowerUps, POWERUP_DEFINITIONS, PowerUpType } from "@/hooks/usePowerUps";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export const PowerUpShop = () => {
  const { activePowerUps, activatePowerUp, isActivating, isItemUnlocked } = usePowerUps();
  const { profile } = usePlayerProfile();

  const isPowerUpActive = (type: string) => {
    return activePowerUps.some(p => p.powerup_type === type);
  };

  const getActivePowerUp = (type: string) => {
    return activePowerUps.find(p => p.powerup_type === type);
  };

  const isPermanentlyUnlocked = (type: PowerUpType) => {
    const powerup = POWERUP_DEFINITIONS[type];
    if (powerup.rewardType === "theme") {
      return isItemUnlocked("theme", powerup.rewardValue as string);
    }
    if (powerup.rewardType === "avatar") {
      return isItemUnlocked("avatar", powerup.rewardValue as string);
    }
    return false;
  };

  return (
    <div className="space-y-4">
      <Card className="glass-morphism p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-info to-info-glow flex items-center justify-center glow-effect">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-heading gradient-text">
                Boutique de Récompenses
              </h2>
              <p className="text-sm text-muted-foreground">
                Débloquez du contenu avec vos crédits
              </p>
            </div>
          </div>

          <Badge variant="outline" className="border-primary/50">
            <span className="text-lg mr-1">💰</span>
            {profile?.credits || 0} crédits
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {(Object.entries(POWERUP_DEFINITIONS) as [PowerUpType, typeof POWERUP_DEFINITIONS[PowerUpType]][]).map(([type, powerup]) => {
            const isActive = isPowerUpActive(type);
            const activePowerUp = getActivePowerUp(type);
            const canAfford = (profile?.credits || 0) >= powerup.cost;
            const isUnlocked = isPermanentlyUnlocked(type);

            return (
              <Card
                key={type}
                className={`p-4 relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                  isUnlocked 
                    ? "bg-gradient-to-br from-success/20 to-success/5 border-success/50" 
                    : isActive
                    ? "bg-gradient-to-br from-primary/20 to-primary/5 border-primary/50 glow-effect-primary"
                    : "glass-card"
                }`}
              >
                <div 
                  className={`absolute inset-0 bg-gradient-to-br ${powerup.color} opacity-10`}
                />

                <div className="relative z-10">
                  <div className="text-center mb-3">
                    <div className="text-4xl mb-2 animate-float">
                      {powerup.icon}
                    </div>
                    <h3 className="font-heading text-foreground mb-1">
                      {powerup.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {powerup.description}
                    </p>
                  </div>

                  <div className="text-center mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {powerup.reward}
                    </Badge>
                  </div>

                  {isUnlocked ? (
                    <div className="space-y-2">
                      <Badge variant="outline" className="w-full border-success/50 text-success flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" />
                        Débloqué
                      </Badge>
                    </div>
                  ) : isActive && activePowerUp ? (
                    <div className="space-y-2">
                      <Badge variant="outline" className="w-full border-primary/50 text-primary">
                        Actif
                      </Badge>
                      <div className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expire {formatDistanceToNow(new Date(activePowerUp.expires_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => activatePowerUp(type)}
                      disabled={isActivating || !canAfford}
                      className={`w-full bg-gradient-to-r ${powerup.color} hover:scale-105 transition-transform`}
                      size="sm"
                    >
                      {canAfford ? (
                        <>
                          <span className="mr-1">💰</span>
                          {powerup.cost} crédits
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 mr-1" />
                          {powerup.cost} crédits
                        </>
                      )}
                    </Button>
                  )}

                  {!canAfford && !isActive && !isUnlocked && (
                    <p className="text-xs text-center text-destructive mt-2">
                      Pas assez de crédits
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Active Protections */}
      {activePowerUps.length > 0 && (
        <Card className="glass-morphism p-4">
          <h3 className="text-sm font-heading text-muted-foreground mb-3 flex items-center gap-2">
            🛡️ Protections Actives ({activePowerUps.length})
          </h3>
          <div className="space-y-2">
            {activePowerUps.map((powerup) => {
              const def = POWERUP_DEFINITIONS[powerup.powerup_type as PowerUpType];
              if (!def) return null;
              return (
                <div
                  key={powerup.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{def.icon}</span>
                    <span className="text-sm text-foreground">{def.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Expire {formatDistanceToNow(new Date(powerup.expires_at), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
