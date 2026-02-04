import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Clock, Check, Lock, Sparkles, Star, Gift } from "lucide-react";
import { usePowerUps, POWERUP_DEFINITIONS, PowerUpType } from "@/hooks/usePowerUps";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { ChestOpenAnimation } from "./ChestOpenAnimation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const getRarityStyles = (rarity: string) => {
  switch (rarity) {
    case "legendary":
      return "border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.2)]";
    case "epic":
      return "border-purple-400/50 shadow-[0_0_10px_rgba(168,85,247,0.15)]";
    case "rare":
      return "border-blue-400/50";
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
      return null;
  }
};

export const EnhancedShop = () => {
  const { activePowerUps, activatePowerUp, isActivating, isItemUnlocked } = usePowerUps();
  const { profile } = usePlayerProfile();
  const [chestOpen, setChestOpen] = useState(false);
  const [chestReward, setChestReward] = useState<any>(null);

  const isPowerUpActive = (type: string) => {
    return activePowerUps.some(p => p.powerup_type === type);
  };

  const getActivePowerUp = (type: string) => {
    return activePowerUps.find(p => p.powerup_type === type);
  };

  const isPermanentlyUnlocked = (type: PowerUpType) => {
    try {
      const powerup = POWERUP_DEFINITIONS[type];
      if (powerup.rewardType === "cosmetic") {
        const cosmeticType = (powerup.rewardValue as string).startsWith("helmet") ? "helmet" : "armor";
        return isItemUnlocked(cosmeticType, powerup.rewardValue as string);
      }
      return false;
    } catch {
      return false;
    }
  };

  const handlePurchase = async (type: PowerUpType) => {
    const powerup = POWERUP_DEFINITIONS[type];
    
    // For mystery chests, show animation
    if (powerup.rewardType === "random") {
      await activatePowerUp(type);
      // Simulate reward reveal
      setChestReward({
        type: "xp",
        value: Math.floor(Math.random() * 100) + 50,
        icon: "⚡",
        name: "XP Bonus",
        rarity: ["common", "rare", "epic", "legendary"][Math.floor(Math.random() * 4)] as any,
      });
      setChestOpen(true);
    } else {
      activatePowerUp(type);
    }
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
    const activePowerUpData = getActivePowerUp(type);
    const canAfford = (profile?.credits || 0) >= powerup.cost;
    const isUnlocked = isPermanentlyUnlocked(type as PowerUpType);

    return (
      <motion.div
        key={type}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        whileHover={{ y: -2 }}
      >
        <Card
          className={`p-3 relative overflow-hidden transition-all duration-300 ${getRarityStyles(powerup.rarity)} ${
            isUnlocked 
              ? "bg-gradient-to-br from-success/10 to-success/5" 
              : isActive
              ? "bg-gradient-to-br from-primary/10 to-primary/5"
              : "glass-card"
          }`}
        >
          <div 
            className={`absolute inset-0 bg-gradient-to-br ${powerup.color} opacity-5`}
          />

          <div className="relative z-10">
            {/* Rarity Badge */}
            <div className="absolute top-0 right-0">
              {getRarityBadge(powerup.rarity)}
            </div>

            <div className="text-center mb-2 mt-1">
              <motion.div 
                className="text-3xl mb-1"
                animate={powerup.rarity === "legendary" ? { 
                  scale: [1, 1.05, 1],
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {powerup.icon}
              </motion.div>
              <h3 className="font-heading text-foreground text-sm truncate">
                {powerup.name}
              </h3>
              <p className="text-xs text-muted-foreground leading-tight line-clamp-2 h-8">
                {powerup.description}
              </p>
            </div>

            <div className="text-center mb-2">
              <Badge variant="secondary" className="text-xs">
                {powerup.reward}
              </Badge>
            </div>

            {isUnlocked ? (
              <Badge variant="outline" className="w-full border-success/50 text-success flex items-center justify-center gap-1 h-8">
                <Check className="w-3 h-3" />
                Débloqué
              </Badge>
            ) : isActive && activePowerUpData ? (
              <div className="space-y-1">
                <Badge variant="outline" className="w-full border-primary/50 text-primary h-8 flex items-center justify-center">
                  Actif
                </Badge>
                <div className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(activePowerUpData.expires_at), { 
                    addSuffix: true, 
                    locale: fr 
                  })}
                </div>
              </div>
            ) : (
              <Button
                onClick={() => handlePurchase(type as PowerUpType)}
                disabled={isActivating || !canAfford}
                className={`w-full bg-gradient-to-r ${powerup.color} hover:opacity-90 transition-opacity text-white h-8 text-sm`}
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
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="glass-morphism p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <ShoppingBag className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-xl font-heading gradient-text flex items-center gap-2">
                Boutique
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-sm text-muted-foreground">
                Échangez vos crédits
              </p>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
          >
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              <span className="text-xl font-heading text-amber-400">{profile?.credits || 0}</span>
            </div>
          </motion.div>
        </div>
      </Card>

      {/* Shop Categories Tabs */}
      <Tabs defaultValue="boosts" className="space-y-4">
        <TabsList className="glass-morphism p-1 border border-primary/20 w-full grid grid-cols-4">
          <TabsTrigger value="boosts" className="text-xs data-[state=active]:bg-primary/20">
            ⚡ Boosts
          </TabsTrigger>
          <TabsTrigger value="protection" className="text-xs data-[state=active]:bg-green-500/20">
            🛡️ Protection
          </TabsTrigger>
          <TabsTrigger value="mystery" className="text-xs data-[state=active]:bg-purple-500/20">
            🎁 Coffres
          </TabsTrigger>
          <TabsTrigger value="cosmetics" className="text-xs data-[state=active]:bg-pink-500/20">
            ✨ Cosm.
          </TabsTrigger>
        </TabsList>

        <TabsContent value="boosts">
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {boostItems.map((item, i) => renderPowerUpCard(item as [string, typeof POWERUP_DEFINITIONS[PowerUpType]], i))}
          </div>
        </TabsContent>

        <TabsContent value="protection">
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {protectionItems.map((item, i) => renderPowerUpCard(item as [string, typeof POWERUP_DEFINITIONS[PowerUpType]], i))}
          </div>
        </TabsContent>

        <TabsContent value="mystery">
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {mysteryItems.map((item, i) => renderPowerUpCard(item as [string, typeof POWERUP_DEFINITIONS[PowerUpType]], i))}
          </div>
        </TabsContent>

        <TabsContent value="cosmetics">
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
            {cosmeticItems.map((item, i) => renderPowerUpCard(item as [string, typeof POWERUP_DEFINITIONS[PowerUpType]], i))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Active Power-Ups */}
      {activePowerUps.length > 0 && (
        <Card className="glass-morphism p-4">
          <h3 className="text-sm font-heading text-muted-foreground mb-3 flex items-center gap-2">
            ⚡ Power-Ups Actifs ({activePowerUps.length})
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {activePowerUps.map((powerup) => {
              const def = POWERUP_DEFINITIONS[powerup.powerup_type as PowerUpType];
              if (!def) return null;
              return (
                <motion.div
                  key={powerup.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{def.icon}</span>
                    <span className="text-sm font-medium">{def.name}</span>
                    {powerup.multiplier > 1 && (
                      <Badge className="bg-primary/20 text-primary text-xs">
                        x{powerup.multiplier}
                      </Badge>
                    )}
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

      {/* Chest Animation */}
      <ChestOpenAnimation 
        isOpen={chestOpen}
        onClose={() => setChestOpen(false)}
        reward={chestReward}
      />
    </div>
  );
};
