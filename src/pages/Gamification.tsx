import AppLayout from "@/components/layout/AppLayout";
import { CyberAvatar } from "@/components/gamification/CyberAvatar";
import { XPBar } from "@/components/gamification/XPBar";
import { QuestBoard } from "@/components/gamification/QuestBoard";
import { PowerUpShop } from "@/components/gamification/PowerUpShop";
import { AchievementsList } from "@/components/gamification/AchievementsList";
import { BadgesList } from "@/components/gamification/BadgesList";
import { useQuestProgressTracking } from "@/hooks/useQuestProgressTracking";
import { useEnsurePlayerProfile } from "@/hooks/useEnsurePlayerProfile";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { useAICredits } from "@/hooks/useAICredits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Gamepad2, Target, ShoppingBag, Trophy, Zap, Star, Crown, Brain, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function Gamification() {
  useEnsurePlayerProfile();
  useQuestProgressTracking();
  const { profile } = usePlayerProfile();
  const { credits: aiCredits } = useAICredits();

  const getRankInfo = () => {
    if (!profile) return { name: "Novice", icon: "🌱", tier: 1 };
    if (profile.level >= 50) return { name: "Légende", icon: "🏆", tier: 5 };
    if (profile.level >= 25) return { name: "Maître", icon: "👑", tier: 4 };
    if (profile.level >= 10) return { name: "Expert", icon: "⭐", tier: 3 };
    if (profile.level >= 5) return { name: "Adepte", icon: "🔥", tier: 2 };
    return { name: "Novice", icon: "🌱", tier: 1 };
  };

  const rank = getRankInfo();

  return (
    <AppLayout>
      <div className="space-y-6 relative">
        {/* Animated Background Grid */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute inset-0 opacity-5">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(hsl(var(--primary)/0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.3) 1px, transparent 1px)`,
                backgroundSize: '50px 50px',
                animation: 'grid-move 20s linear infinite',
              }}
            />
          </div>
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/30"
              initial={{ 
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800) 
              }}
              animate={{ 
                y: [null, -100],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        {/* Header avec effet cyberpunk amélioré */}
        <motion.div 
          className="relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-cyan-500/20 blur-3xl animate-pulse" />
          <div className="relative glass-morphism p-6 rounded-2xl border border-primary/20 overflow-hidden">
            {/* Scan line effect */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary)/0.1) 2px, hsl(var(--primary)/0.1) 4px)',
              }}
            />
            
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-cyan-500 flex items-center justify-center glow-effect-primary relative"
                  animate={{ 
                    boxShadow: [
                      '0 0 20px hsl(var(--primary)/0.5)',
                      '0 0 40px hsl(var(--primary)/0.7)',
                      '0 0 20px hsl(var(--primary)/0.5)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Gamepad2 className="w-8 h-8 text-white" />
                  {/* Rotating ring */}
                  <div 
                    className="absolute inset-0 rounded-xl border-2 border-transparent"
                    style={{
                      borderTopColor: 'hsl(var(--primary))',
                      animation: 'spin 3s linear infinite'
                    }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-heading gradient-text mb-1 flex items-center gap-2">
                    Cyber Arena
                    <span className="text-2xl">{rank.icon}</span>
                  </h1>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <span className="text-primary font-semibold">{rank.name}</span>
                    <span>•</span>
                    <span>Niveau {profile?.level || 1}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400" />
                      {profile?.experience_points || 0} XP
                    </span>
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-3">
                <motion.div 
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="font-heading text-amber-400">{profile?.credits || 0}</span>
                  <span className="text-xs text-muted-foreground">crédits</span>
                </motion.div>
                <motion.div 
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <Brain className="w-4 h-4 text-blue-400" />
                  <span className="font-heading text-blue-400">{aiCredits === Infinity ? "∞" : aiCredits}</span>
                  <span className="text-xs text-muted-foreground">crédits IA</span>
                </motion.div>
                <motion.div 
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <Trophy className="w-4 h-4 text-purple-400" />
                  <span className="font-heading text-purple-400">{profile?.total_quests_completed || 0}</span>
                  <span className="text-xs text-muted-foreground">quêtes</span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Avatar et XP Bar */}
        <motion.div 
          className="grid gap-6 lg:grid-cols-2 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <CyberAvatar />
          <XPBar />
        </motion.div>

        {/* Tabs pour Quêtes, Achievements et Shop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10"
        >
          <Tabs defaultValue="quests" className="space-y-6">
            <TabsList className="glass-morphism p-1 border border-primary/20">
              <TabsTrigger value="quests" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Quêtes</span>
              </TabsTrigger>
              <TabsTrigger value="achievements" className="gap-2 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Achievements</span>
              </TabsTrigger>
              <TabsTrigger value="badges" className="gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Badges</span>
              </TabsTrigger>
              <TabsTrigger value="shop" className="gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Boutique</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quests" className="animate-fade-in">
              <QuestBoard />
            </TabsContent>

            <TabsContent value="achievements" className="animate-fade-in">
              <AchievementsList />
            </TabsContent>

            <TabsContent value="badges" className="animate-fade-in">
              <BadgesList />
            </TabsContent>

            <TabsContent value="shop" className="animate-fade-in">
              <PowerUpShop />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Custom CSS for grid animation */}
        <style>{`
          @keyframes grid-move {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }
        `}</style>
      </div>
    </AppLayout>
  );
}
