import { Suspense, lazy } from "react";
import { GamificationHero } from "@/components/gamification/GamificationHero";
import { useQuestProgressTracking } from "@/hooks/useQuestProgressTracking";
import { useEnsurePlayerProfile } from "@/hooks/useEnsurePlayerProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Trophy, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load heavy components
const EnhancedQuestBoard = lazy(() => 
  import("@/components/gamification/EnhancedQuestBoard").then(m => ({ default: m.EnhancedQuestBoard }))
);
const AchievementsList = lazy(() => 
  import("@/components/gamification/AchievementsList").then(m => ({ default: m.AchievementsList }))
);
const EnhancedShop = lazy(() => 
  import("@/components/gamification/EnhancedShop").then(m => ({ default: m.EnhancedShop }))
);

const LoadingFallback = () => (
  <Card className="glass-morphism p-6">
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  </Card>
);

export default function Gamification() {
  useEnsurePlayerProfile();
  useQuestProgressTracking();

  return (
      <div className="space-y-4 relative">
        {/* Optimized Background - fewer particles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute inset-0 opacity-[0.03]">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(hsl(var(--primary)/0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.3) 1px, transparent 1px)`,
                backgroundSize: '60px 60px',
              }}
            />
          </div>
          {/* Reduced particles - only 6 */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/20"
              style={{
                left: `${15 + i * 15}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{ 
                y: [0, -50, 0],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{ 
                duration: 4 + i,
                repeat: Infinity,
                delay: i * 0.5
              }}
            />
          ))}
        </div>

        {/* Compact Hero */}
        <motion.div 
          className="relative z-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GamificationHero />
        </motion.div>

        {/* Main Tabs - Sticky Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative z-10"
        >
          <Tabs defaultValue="quests" className="space-y-4">
            <TabsList className="glass-morphism p-1 border border-primary/20 sticky top-0 z-20 bg-background/80 backdrop-blur w-full grid grid-cols-3">
              <TabsTrigger 
                value="quests" 
                className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all"
              >
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Quêtes</span>
              </TabsTrigger>
              <TabsTrigger 
                value="achievements" 
                className="gap-2 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 transition-all"
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Succès</span>
              </TabsTrigger>
              <TabsTrigger 
                value="shop" 
                className="gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Boutique</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quests" className="mt-4">
              <Suspense fallback={<LoadingFallback />}>
                <EnhancedQuestBoard />
              </Suspense>
            </TabsContent>

            <TabsContent value="achievements" className="mt-4">
              <Suspense fallback={<LoadingFallback />}>
                <AchievementsList />
              </Suspense>
            </TabsContent>

            <TabsContent value="shop" className="mt-4">
              <Suspense fallback={<LoadingFallback />}>
                <EnhancedShop />
              </Suspense>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
  );
}
