import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, Zap, Shield, Star, Crown, Trophy, Brain, 
  Settings2, ChevronRight, Flame
} from "lucide-react";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { usePowerUps } from "@/hooks/usePowerUps";
import { useAchievements } from "@/hooks/useAchievements";
import { useAICredits } from "@/hooks/useAICredits";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const AVATAR_TYPES = {
  cyber_knight: { icon: "🤖", name: "Cyber Knight", color: "from-blue-500 to-cyan-500" },
  neon_hacker: { icon: "👾", name: "Neon Hacker", color: "from-pink-500 to-purple-500" },
  quantum_warrior: { icon: "⚛️", name: "Quantum Warrior", color: "from-green-500 to-teal-500" },
  shadow_ninja: { icon: "🥷", name: "Shadow Ninja", color: "from-gray-600 to-gray-900" },
  cosmic_sage: { icon: "🔮", name: "Cosmic Sage", color: "from-indigo-500 to-purple-700" },
};

const GLOW_COLORS = [
  { color: "#a855f7", name: "Violet" },
  { color: "#3b82f6", name: "Bleu" },
  { color: "#10b981", name: "Vert" },
  { color: "#f59e0b", name: "Or" },
  { color: "#ef4444", name: "Rouge" },
  { color: "#ec4899", name: "Rose" },
  { color: "#06b6d4", name: "Cyan" },
];

const HELMET_OPTIONS = [
  { id: "default", label: "Standard", icon: "🎮" },
  { id: "visor", label: "Visor", icon: "🥽" },
  { id: "crown", label: "Couronne", icon: "👑" },
  { id: "halo", label: "Halo", icon: "😇" },
];

export const GamificationHero = () => {
  const { profile, updateAvatar, xpProgress, xpNeeded } = usePlayerProfile();
  const { activePowerUps, hasActiveProtection, unlockedItems } = usePowerUps();
  const { achievements } = useAchievements();
  const { credits: aiCredits } = useAICredits();
  const [isCustomizing, setIsCustomizing] = useState(false);

  if (!profile) return null;

  const avatar = AVATAR_TYPES[profile.avatar_type as keyof typeof AVATAR_TYPES] || AVATAR_TYPES.cyber_knight;
  
  const getActiveXPBoost = () => {
    const boost = activePowerUps?.find(p => p.powerup_type.startsWith("xp_boost_"));
    return boost?.multiplier || 1;
  };
  
  const xpMultiplier = getActiveXPBoost();

  const getRank = () => {
    if (profile.level >= 50) return { name: "Légende", icon: "🏆", color: "text-amber-400", tier: 5 };
    if (profile.level >= 25) return { name: "Maître", icon: "👑", color: "text-purple-400", tier: 4 };
    if (profile.level >= 10) return { name: "Expert", icon: "⭐", color: "text-blue-400", tier: 3 };
    if (profile.level >= 5) return { name: "Adepte", icon: "🔥", color: "text-orange-400", tier: 2 };
    return { name: "Novice", icon: "🌱", color: "text-green-400", tier: 1 };
  };

  const rank = getRank();

  const isUnlocked = (itemId: string) => {
    if (itemId === "default") return true;
    return unlockedItems.some(u => u.unlockable_id.includes(itemId));
  };

  return (
    <Card className="glass-morphism p-4 md:p-6 relative overflow-hidden">
      {/* Subtle animated background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(circle at 20% 50%, ${profile.avatar_customization?.glow_color || '#a855f7'}40, transparent 50%)`
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Compact Avatar */}
          <div className="relative">
            <motion.div 
              className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center text-4xl md:text-5xl relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${profile.avatar_customization?.glow_color || '#a855f7'}30, ${profile.avatar_customization?.glow_color || '#a855f7'}10)`,
                boxShadow: `0 0 30px ${profile.avatar_customization?.glow_color || '#a855f7'}40`,
              }}
              whileHover={{ scale: 1.05 }}
            >
              {/* Rotating border */}
              <div 
                className="absolute inset-0 rounded-2xl border-2 border-transparent"
                style={{
                  borderTopColor: profile.avatar_customization?.glow_color || '#a855f7',
                  animation: "spin 4s linear infinite"
                }}
              />
              
              <span className="relative z-10 animate-float">{avatar.icon}</span>
              
              {/* Helmet overlay */}
              {profile.avatar_customization?.helmet === "crown" && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-lg z-20">👑</span>
              )}
            </motion.div>

            {/* Level badge */}
            <div 
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 border-background"
              style={{
                background: `linear-gradient(135deg, ${profile.avatar_customization?.glow_color || '#a855f7'}, ${profile.avatar_customization?.glow_color || '#a855f7'}80)`,
              }}
            >
              {profile.level}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-xl md:text-2xl font-heading gradient-text truncate">
                Niveau {profile.level}
              </h2>
              <Badge variant="outline" className={`${rank.color} border-current text-xs`}>
                {rank.icon} {rank.name}
              </Badge>
              
              {/* Active boost indicators */}
              {xpMultiplier > 1 && (
                <Badge className="bg-yellow-500/80 text-yellow-900 text-xs animate-pulse">
                  <Zap className="w-3 h-3 mr-1" />
                  x{xpMultiplier}
                </Badge>
              )}
              {hasActiveProtection() && (
                <Badge className="bg-green-500/80 text-green-900 text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Protégé
                </Badge>
              )}
            </div>

            {/* XP Progress */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{profile.experience_points} / {xpNeeded} XP</span>
                <span className="text-primary font-medium">{Math.round(xpProgress)}%</span>
              </div>
              <div className="h-2.5 bg-background/50 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{
                    background: `linear-gradient(90deg, ${profile.avatar_customization?.glow_color || '#a855f7'}, ${profile.avatar_customization?.glow_color || '#a855f7'}80)`,
                    boxShadow: `0 0 10px ${profile.avatar_customization?.glow_color || '#a855f7'}`,
                  }}
                />
              </div>
            </div>

            {/* Customize button - mobile */}
            <Sheet open={isCustomizing} onOpenChange={setIsCustomizing}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2 md:hidden">
                  <Settings2 className="w-3 h-3 mr-1" />
                  Personnaliser
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh]">
                <SheetHeader>
                  <SheetTitle>Personnaliser l'Avatar</SheetTitle>
                </SheetHeader>
                <AvatarCustomizer 
                  profile={profile} 
                  updateAvatar={updateAvatar} 
                  isUnlocked={isUnlocked}
                  avatarTypes={AVATAR_TYPES}
                />
              </SheetContent>
            </Sheet>
          </div>

          {/* Stats Chips */}
          <div className="flex flex-wrap gap-2 justify-end">
            <motion.div 
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center gap-1.5"
              whileHover={{ scale: 1.05 }}
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="font-heading text-amber-400 text-sm">{profile.credits}</span>
            </motion.div>
            
            <motion.div 
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center gap-1.5"
              whileHover={{ scale: 1.05 }}
            >
              <Brain className="w-4 h-4 text-blue-400" />
              <span className="font-heading text-blue-400 text-sm">{aiCredits === Infinity ? "∞" : aiCredits}</span>
            </motion.div>
            
            <motion.div 
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center gap-1.5"
              whileHover={{ scale: 1.05 }}
            >
              <Trophy className="w-4 h-4 text-purple-400" />
              <span className="font-heading text-purple-400 text-sm">{profile.total_quests_completed}</span>
            </motion.div>

            {/* Desktop customize button */}
            <Sheet open={isCustomizing} onOpenChange={setIsCustomizing}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="hidden md:flex border-primary/30 text-xs h-8">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Personnaliser
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Personnaliser l'Avatar</SheetTitle>
                </SheetHeader>
                <AvatarCustomizer 
                  profile={profile} 
                  updateAvatar={updateAvatar} 
                  isUnlocked={isUnlocked}
                  avatarTypes={AVATAR_TYPES}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </Card>
  );
};

interface AvatarCustomizerProps {
  profile: any;
  updateAvatar: (data: any) => void;
  isUnlocked: (id: string) => boolean;
  avatarTypes: typeof AVATAR_TYPES;
}

const AvatarCustomizer = ({ profile, updateAvatar, isUnlocked, avatarTypes }: AvatarCustomizerProps) => {
  return (
    <div className="space-y-6 mt-4 overflow-y-auto max-h-full pb-8">
      {/* Avatar Type */}
      <div>
        <label className="text-sm font-medium mb-3 block">Type d'Avatar</label>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(avatarTypes).map(([key, value]) => {
            const isAvailable = key === "cyber_knight" || isUnlocked(`avatar_${key}`);
            return (
              <button
                key={key}
                onClick={() => isAvailable && updateAvatar({ type: key })}
                disabled={!isAvailable}
                className={`p-3 rounded-xl border text-center transition-all ${
                  profile.avatar_type === key 
                    ? "border-primary bg-primary/20 ring-2 ring-primary/50" 
                    : isAvailable 
                      ? "border-border/50 hover:border-primary/50 hover:bg-primary/5" 
                      : "border-border/30 opacity-40 cursor-not-allowed"
                }`}
              >
                <span className="text-3xl block mb-1">{value.icon}</span>
                <div className="text-xs truncate">{value.name.split(" ")[0]}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Helmet */}
      <div>
        <label className="text-sm font-medium mb-3 block">Casque</label>
        <div className="flex gap-2 flex-wrap">
          {HELMET_OPTIONS.map((helmet) => {
            const isAvailable = helmet.id === "default" || isUnlocked(`helmet_${helmet.id}`);
            return (
              <Button
                key={helmet.id}
                variant={profile.avatar_customization?.helmet === helmet.id ? "default" : "outline"}
                size="sm"
                onClick={() => isAvailable && updateAvatar({ helmet: helmet.id })}
                disabled={!isAvailable}
                className={`${!isAvailable ? "opacity-40" : ""}`}
              >
                <span className="mr-1">{helmet.icon}</span>
                {helmet.label}
                {!isAvailable && " 🔒"}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Glow Color */}
      <div>
        <label className="text-sm font-medium mb-3 block">Couleur Néon</label>
        <div className="flex gap-3 flex-wrap">
          {GLOW_COLORS.map(({ color, name }) => (
            <button
              key={color}
              onClick={() => updateAvatar({ glow_color: color })}
              className="w-12 h-12 rounded-full border-2 transition-all hover:scale-110 relative group"
              style={{
                backgroundColor: color,
                borderColor: profile.avatar_customization?.glow_color === color ? "#fff" : "transparent",
                boxShadow: profile.avatar_customization?.glow_color === color ? `0 0 20px ${color}` : "none",
              }}
            >
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
