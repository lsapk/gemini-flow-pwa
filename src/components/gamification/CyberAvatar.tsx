import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Shield, Star, Crown, Trophy } from "lucide-react";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { usePowerUps } from "@/hooks/usePowerUps";
import { useAchievements } from "@/hooks/useAchievements";
import { useAICredits } from "@/hooks/useAICredits";

const AVATAR_TYPES = {
  cyber_knight: { icon: "🤖", name: "Cyber Knight", color: "from-blue-500 to-cyan-500" },
  neon_hacker: { icon: "👾", name: "Neon Hacker", color: "from-pink-500 to-purple-500" },
  quantum_warrior: { icon: "⚛️", name: "Quantum Warrior", color: "from-green-500 to-teal-500" },
  shadow_ninja: { icon: "🥷", name: "Shadow Ninja", color: "from-gray-600 to-gray-900" },
  cosmic_sage: { icon: "🔮", name: "Cosmic Sage", color: "from-indigo-500 to-purple-700" },
};

const HELMET_OPTIONS = [
  { id: "default", label: "Standard", icon: "🎮" },
  { id: "visor", label: "Visor", icon: "🥽" },
  { id: "crown", label: "Couronne", icon: "👑" },
  { id: "halo", label: "Halo", icon: "😇" },
];

const ARMOR_OPTIONS = [
  { id: "default", label: "Standard", icon: "🛡️" },
  { id: "heavy", label: "Lourd", icon: "⚔️" },
  { id: "stealth", label: "Furtif", icon: "👤" },
  { id: "energy", label: "Énergie", icon: "⚡" },
];

const GLOW_COLORS = [
  { color: "#a855f7", name: "Violet" },
  { color: "#3b82f6", name: "Bleu" },
  { color: "#10b981", name: "Vert" },
  { color: "#f59e0b", name: "Or" },
  { color: "#ef4444", name: "Rouge" },
  { color: "#ec4899", name: "Rose" },
  { color: "#06b6d4", name: "Cyan" },
];

export const CyberAvatar = () => {
  const { profile, updateAvatar, xpProgress, xpNeeded } = usePlayerProfile();
  const { unlockedItems, hasActiveProtection, activePowerUps } = usePowerUps();
  const { achievements } = useAchievements();
  const { credits: aiCredits } = useAICredits();
  
  const getActiveXPBoost = () => {
    const boost = activePowerUps?.find(p => p.powerup_type.startsWith("xp_boost_"));
    return boost?.multiplier || 1;
  };
  const [isCustomizing, setIsCustomizing] = useState(false);

  if (!profile) return null;

  const avatar = AVATAR_TYPES[profile.avatar_type as keyof typeof AVATAR_TYPES] || AVATAR_TYPES.cyber_knight;
  const xpMultiplier = getActiveXPBoost();
  const hasRainbowGlow = unlockedItems.some(u => u.unlockable_id === "glow_rainbow");

  // Calculate rank based on level
  const getRank = () => {
    if (profile.level >= 50) return { name: "Légende", icon: "🏆", color: "text-amber-400" };
    if (profile.level >= 25) return { name: "Maître", icon: "👑", color: "text-purple-400" };
    if (profile.level >= 10) return { name: "Expert", icon: "⭐", color: "text-blue-400" };
    if (profile.level >= 5) return { name: "Adepte", icon: "🔥", color: "text-orange-400" };
    return { name: "Novice", icon: "🌱", color: "text-green-400" };
  };

  const rank = getRank();

  // Check if item is unlocked
  const isUnlocked = (itemId: string) => {
    if (itemId === "default") return true;
    return unlockedItems.some(u => u.unlockable_id.includes(itemId));
  };

  return (
    <Card className="glass-morphism p-6 relative overflow-hidden group">
      {/* Animated background */}
      <div 
        className={`absolute inset-0 opacity-20 ${hasRainbowGlow ? 'animate-rainbow-pulse' : 'animate-pulse'}`}
        style={{
          background: hasRainbowGlow 
            ? `conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)`
            : `radial-gradient(circle at 50% 50%, ${profile.avatar_customization.glow_color}, transparent 70%)`
        }}
      />

      {/* Active boosts indicators */}
      {(xpMultiplier > 1 || hasActiveProtection()) && (
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          {xpMultiplier > 1 && (
            <Badge className="bg-yellow-500/80 text-yellow-900 text-xs animate-pulse">
              <Zap className="w-3 h-3 mr-1" />
              XP x{xpMultiplier}
            </Badge>
          )}
          {hasActiveProtection() && (
            <Badge className="bg-green-500/80 text-green-900 text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Protégé
            </Badge>
          )}
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-heading gradient-text">
                {avatar.name}
              </h3>
              <span className={`text-sm ${rank.color}`}>
                {rank.icon} {rank.name}
              </span>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Star className="w-3 h-3 text-primary" />
              Niveau {profile.level}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
            className="border-primary/30"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            {isCustomizing ? "Fermer" : "Personnaliser"}
          </Button>
        </div>

        {/* Avatar Display */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Outer ring animation */}
            <div 
              className="absolute -inset-4 rounded-full opacity-30"
              style={{
                background: `conic-gradient(from 0deg, ${profile.avatar_customization.glow_color}, transparent, ${profile.avatar_customization.glow_color})`,
                animation: "spin 4s linear infinite",
              }}
            />
            
            {/* Main avatar circle */}
            <div 
              className="relative w-36 h-36 rounded-full flex items-center justify-center text-7xl transition-all duration-300 hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${profile.avatar_customization.glow_color}40, ${profile.avatar_customization.glow_color}10)`,
                boxShadow: `0 0 60px ${profile.avatar_customization.glow_color}60, inset 0 0 30px ${profile.avatar_customization.glow_color}20`,
              }}
            >
              {/* Floating avatar icon */}
              <div className="animate-float relative">
                {avatar.icon}
                {/* Helmet overlay */}
                {profile.avatar_customization.helmet === "crown" && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">👑</span>
                )}
                {profile.avatar_customization.helmet === "halo" && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl opacity-80">✨</span>
                )}
              </div>
              
              {/* Animated inner ring */}
              <div 
                className="absolute inset-2 rounded-full border-2"
                style={{ 
                  borderColor: `${profile.avatar_customization.glow_color}40`,
                  borderTopColor: profile.avatar_customization.glow_color,
                  animation: "spin 3s linear infinite"
                }}
              />

              {/* Energy particles */}
              <div className="absolute inset-0 overflow-hidden rounded-full">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 rounded-full animate-ping"
                    style={{
                      backgroundColor: profile.avatar_customization.glow_color,
                      top: `${20 + Math.random() * 60}%`,
                      left: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: "2s",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Level badge */}
            <div 
              className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-4 border-background"
              style={{
                background: `linear-gradient(135deg, ${profile.avatar_customization.glow_color}, ${profile.avatar_customization.glow_color}80)`,
                boxShadow: `0 0 20px ${profile.avatar_customization.glow_color}`,
              }}
            >
              {profile.level}
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{profile.experience_points} XP</span>
            <span>{xpNeeded} XP</span>
          </div>
          <div className="h-3 bg-background/40 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(xpProgress, 100)}%`,
                background: `linear-gradient(90deg, ${profile.avatar_customization.glow_color}, ${profile.avatar_customization.glow_color}80)`,
                boxShadow: `0 0 10px ${profile.avatar_customization.glow_color}`,
              }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-background/40 backdrop-blur border border-border/30">
            <div className="text-xs text-muted-foreground">XP</div>
            <div className="font-heading text-primary text-sm">{profile.experience_points}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/40 backdrop-blur border border-border/30">
            <div className="text-xs text-muted-foreground">Quêtes</div>
            <div className="font-heading text-success text-sm">{profile.total_quests_completed}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/40 backdrop-blur border border-border/30">
            <div className="text-xs text-muted-foreground">Crédits</div>
            <div className="font-heading text-info text-sm">{profile.credits}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/40 backdrop-blur border border-border/30">
            <div className="text-xs text-muted-foreground">IA</div>
            <div className="font-heading text-purple-400 text-sm">{aiCredits}</div>
          </div>
        </div>

        {/* Achievements count */}
        <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-background/40 backdrop-blur border border-border/30">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-muted-foreground">
            {achievements.length} Achievements débloqués
          </span>
        </div>

        {/* Customization Panel */}
        {isCustomizing && (
          <div className="space-y-4 mt-4 pt-4 border-t border-border/50 animate-fade-in">
            {/* Avatar Type Selection */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Avatar</label>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(AVATAR_TYPES).map(([key, value]) => {
                  const isAvailable = key === "cyber_knight" || isUnlocked(`avatar_${key}`);
                  return (
                    <button
                      key={key}
                      onClick={() => isAvailable && updateAvatar({ helmet: profile.avatar_customization.helmet })}
                      disabled={!isAvailable}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        profile.avatar_type === key 
                          ? "border-primary bg-primary/20" 
                          : isAvailable 
                            ? "border-border/50 hover:border-primary/50" 
                            : "border-border/30 opacity-40 cursor-not-allowed"
                      }`}
                    >
                      <span className="text-2xl">{value.icon}</span>
                      <div className="text-xs mt-1 truncate">{value.name.split(" ")[0]}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Helmet Selection */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Casque</label>
              <div className="flex gap-2 flex-wrap">
                {HELMET_OPTIONS.map((helmet) => {
                  const isAvailable = helmet.id === "default" || isUnlocked(`helmet_${helmet.id}`);
                  return (
                    <Button
                      key={helmet.id}
                      variant={profile.avatar_customization.helmet === helmet.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => isAvailable && updateAvatar({ helmet: helmet.id })}
                      disabled={!isAvailable}
                      className={`text-xs ${!isAvailable ? "opacity-40" : ""}`}
                    >
                      <span className="mr-1">{helmet.icon}</span>
                      {helmet.label}
                      {!isAvailable && " 🔒"}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Armor Selection */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Armure</label>
              <div className="flex gap-2 flex-wrap">
                {ARMOR_OPTIONS.map((armor) => {
                  const isAvailable = armor.id === "default" || isUnlocked(`armor_${armor.id}`);
                  return (
                    <Button
                      key={armor.id}
                      variant={profile.avatar_customization.armor === armor.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => isAvailable && updateAvatar({ armor: armor.id })}
                      disabled={!isAvailable}
                      className={`text-xs ${!isAvailable ? "opacity-40" : ""}`}
                    >
                      <span className="mr-1">{armor.icon}</span>
                      {armor.label}
                      {!isAvailable && " 🔒"}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Glow Color Selection */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Couleur Néon</label>
              <div className="flex gap-2 flex-wrap">
                {GLOW_COLORS.map(({ color, name }) => (
                  <button
                    key={color}
                    onClick={() => updateAvatar({ glow_color: color })}
                    className="w-10 h-10 rounded-full border-2 transition-all hover:scale-110 relative group"
                    style={{
                      backgroundColor: color,
                      borderColor: profile.avatar_customization.glow_color === color ? "#fff" : "transparent",
                      boxShadow: profile.avatar_customization.glow_color === color ? `0 0 20px ${color}` : "none",
                    }}
                  >
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
