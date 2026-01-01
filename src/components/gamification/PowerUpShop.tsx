import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Clock, Check, Lock, Sparkles, Star } from "lucide-react";
import { usePowerUps, POWERUP_DEFINITIONS, PowerUpType } from "@/hooks/usePowerUps";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

const getRarityStyles = (rarity: string) => {
  switch (rarity) {
    case "legendary":
      return "border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.3)]";
    case "epic":
      return "border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]";
    case "rare":
      return "border-blue-400/50 shadow-[0_0_10px_rgba(96,165,250,0.15)]";
    default:
      return "border-border/30";
  }
};

const getRarityBadge = (rarity: string) => {
  switch (rarity) {
    case "legendary":
      return <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px]">Légendaire</Badge>;
    case "epic":
      return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px]">Épique</Badge>;
    case "rare":
      return <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px]">Rare</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px]">Commun</Badge>;
  }
};

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
    if (powerup.rewardType === "cosmetic") {
      const cosmeticType = (powerup.rewardValue as string).startsWith("helmet") ? "helmet" : "armor";
      return isItemUnlocked(cosmeticType, powerup.rewardValue as string);
    }
    return false;
  };

  // Group powerups by category
  const boostItems = Object.entries(POWERUP_DEFINITIONS).filter(([_, p]) => 
    p.rewardType === "ai_credits" || p.rewardType === "xp_boost"
  );
  const protectionItems = Object.entries(POWERUP_DEFINITIONS).filter(([_, p]) => 
    p.rewardType === "protection"
  );
  const mysteryItems = Object.entries(POWERUP_DEFINITIONS).filter(([_, p]) => 
    p.rewardType === "random"
  );
  const cosmeticItems = Object.entries(POWERUP_DEFINITIONS).filter(([_, p]) => 
    p.rewardType === "cosmetic"
  );

  const renderPowerUpCard = ([type, powerup]: [string, typeof POWERUP_DEFINITIONS[PowerUpType]], index: number) => {
    const isActive = isPowerUpActive(type);
    const activePowerUp = getActivePowerUp(type);
    const canAfford = (profile?.credits || 0) >= powerup.cost;
    const isUnlocked = isPermanentlyUnlocked(type as PowerUpType);

    return (
      <motion.div
        key={type}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card
          className={`p-4 relative overflow-hidden transition-all duration-300 hover:scale-105 ${getRarityStyles(powerup.rarity)} ${
            isUnlocked 
              ? "bg-gradient-to-br from-success/20 to-success/5" 
              : isActive
              ? "bg-gradient-to-br from-primary/20 to-primary/5 glow-effect-primary"
              : "glass-card"
          }`}
        >
          <div 
            className={`absolute inset-0 bg-gradient-to-br ${powerup.color} opacity-10`}
          />

          <div className="relative z-10">
            {/* Rarity Badge */}
            <div className="absolute top-0 right-0">
              {getRarityBadge(powerup.rarity)}
            </div>

            <div className="text-center mb-3 mt-2">
              <motion.div 
                className="text-4xl mb-2"
                animate={powerup.rarity === "legendary" ? { 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {powerup.icon}
              </motion.div>
              <h3 className="font-heading text-foreground mb-1 text-sm">
                {powerup.name}
              </h3>
              <p className="text-xs text-muted-foreground leading-tight">
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
                  {formatDistanceToNow(new Date(activePowerUp.expires_at), { 
                    addSuffix: true, 
                    locale: fr 
                  })}
                </div>
              </div>
            ) : (
              <Button
                onClick={() => activatePowerUp(type as PowerUpType)}
                disabled={isActivating || !canAfford}
                className={`w-full bg-gradient-to-r ${powerup.color} hover:scale-105 transition-transform text-white`}
                size="sm"
              >
                {canAfford ? (
                  <>
                    <span className="mr-1">💰</span>
                    {powerup.cost}
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 mr-1" />
                    {powerup.cost}
                  </>
                )}
              </Button>
            )}

            {!canAfford && !isActive && !isUnlocked && (
              <p className="text-xs text-center text-destructive mt-2">
                Crédits insuffisants
              </p>
            )}
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-morphism p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center glow-effect"
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(251,191,36,0.5)',
                  '0 0 40px rgba(251,191,36,0.7)',
                  '0 0 20px rgba(251,191,36,0.5)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ShoppingBag className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-heading gradient-text flex items-center gap-2">
                Boutique Cyber
                <Sparkles className="w-5 h-5 text-amber-400" />
              </h2>
              <p className="text-sm text-muted-foreground">
                Échangez vos crédits contre des récompenses
              </p>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
          >
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              <span className="text-2xl font-heading text-amber-400">{profile?.credits || 0}</span>
              <span className="text-sm text-muted-foreground">crédits</span>
            </div>
          </motion.div>
        </div>

        {/* Boosts Section */}
        <div className="mb-6">
          <h3 className="text-sm font-heading text-muted-foreground mb-3 flex items-center gap-2">
            ⚡ Boosts & Crédits IA
          </h3>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {boostItems.map((item, i) => renderPowerUpCard(item as [string, typeof POWERUP_DEFINITIONS[PowerUpType]], i))}
          </div>
        </div>

        {/* Protection Section */}
        <div className="mb-6">
          <h3 className="text-sm font-heading text-muted-foreground mb-3 flex items-center gap-2">
            🛡️ Protections
          </h3>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {protectionItems.map((item, i) => renderPowerUpCard(item as [string, typeof POWERUP_DEFINITIONS[PowerUpType]], i))}
          </div>
        </div>

        {/* Mystery Section */}
        <div className="mb-6">
          <h3 className="text-sm font-heading text-muted-foreground mb-3 flex items-center gap-2">
            🎁 Coffres Mystères
          </h3>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {mysteryItems.map((item, i) => renderPowerUpCard(item as [string, typeof POWERUP_DEFINITIONS[PowerUpType]], i))}
          </div>
        </div>

        {/* Cosmetics Section */}
        <div>
          <h3 className="text-sm font-heading text-muted-foreground mb-3 flex items-center gap-2">
            ✨ Cosmétiques
          </h3>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
            {cosmeticItems.map((item, i) => renderPowerUpCard(item as [string, typeof POWERUP_DEFINITIONS[PowerUpType]], i))}
          </div>
        </div>
      </Card>

      {/* Active Protections */}
      {activePowerUps.length > 0 && (
        <Card className="glass-morphism p-4">
          <h3 className="text-sm font-heading text-muted-foreground mb-3 flex items-center gap-2">
            ⚡ Power-Ups Actifs ({activePowerUps.length})
          </h3>
          <div className="space-y-2">
            {activePowerUps.map((powerup) => {
              const def = POWERUP_DEFINITIONS[powerup.powerup_type as PowerUpType];
              if (!def) return null;
              return (
                <motion.div
                  key={powerup.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{def.icon}</span>
                    <div>
                      <span className="text-sm font-medium text-foreground">{def.name}</span>
                      {powerup.multiplier > 1 && (
                        <Badge className="ml-2 bg-primary/20 text-primary text-xs">
                          x{powerup.multiplier}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(powerup.expires_at), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
