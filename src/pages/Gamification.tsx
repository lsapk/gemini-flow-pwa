import { Suspense, lazy } from "react";
import { useEnsurePenguinProfile } from "@/hooks/useEnsurePenguinProfile";
import { usePenguinProfile } from "@/hooks/usePenguinProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Compass, Gift, ShoppingBag, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IslandView } from "@/components/penguin/IslandView";
import { AnimatedPenguin } from "@/components/penguin/AnimatedPenguin";

const ExpeditionBoard = lazy(() => import("@/components/penguin/ExpeditionBoard").then(m => ({ default: m.ExpeditionBoard })));
const PearlsPanel = lazy(() => import("@/components/penguin/PearlsPanel").then(m => ({ default: m.PearlsPanel })));
const AccessoryShop = lazy(() => import("@/components/penguin/AccessoryShop").then(m => ({ default: m.AccessoryShop })));

const LoadingFallback = () => (
  <div className="p-6 rounded-2xl bg-card/50 border border-border/20">
    <div className="space-y-4">
      <Skeleton className="h-6 w-1/3 bg-muted" />
      <Skeleton className="h-20 w-full bg-muted" />
    </div>
  </div>
);

const STAGE_LABELS: Record<string, { label: string; emoji: string; next: string }> = {
  egg: { label: "Œuf", emoji: "🥚", next: "Poussin" },
  chick: { label: "Poussin", emoji: "🐣", next: "Explorateur" },
  explorer: { label: "Explorateur", emoji: "🐧", next: "Empereur" },
  emperor: { label: "Empereur", emoji: "👑", next: "Maître" },
};

// Resource Badge Component
const ResourceBadge = ({ 
  emoji, 
  label, 
  value, 
  subValue, 
  colorClass 
}: { 
  emoji: string; 
  label: string; 
  value: number | string; 
  subValue?: string; 
  colorClass: string;
}) => (
  <motion.div
    className={`${colorClass} rounded-2xl border p-3 text-center backdrop-blur-sm`}
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 400, damping: 20 }}
  >
    <span className="text-xl block">{emoji}</span>
    <div className="text-sm font-bold text-foreground mt-1">{value}</div>
    <div className="text-[10px] text-muted-foreground">{subValue || label}</div>
  </motion.div>
);

export default function Gamification() {
  useEnsurePenguinProfile();
  const { profile, nextStageProgress, canEatShrimp } = usePenguinProfile();

  const progress = nextStageProgress ? Math.min((nextStageProgress.current / nextStageProgress.target) * 100, 100) : 100;
  const stageInfo = STAGE_LABELS[profile?.stage || 'egg'];

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
        {/* Hero Section - Compact */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border/30 p-5"
        >
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <AnimatedPenguin variant="king" size="lg" />
              <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500/20 border-amber-500/30 text-amber-400 text-[10px] whitespace-nowrap">
                {stageInfo.emoji} {stageInfo.label}
              </Badge>
            </div>

            {/* Progress & Stats */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Evolution Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Évolution → {stageInfo.next}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {nextStageProgress?.current || 0}/{nextStageProgress?.target || 100}
                  </span>
                </div>
                <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-purple-500 to-amber-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Resource Badges - Horizontal scrollable on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="grid grid-cols-4 gap-2"
        >
          <ResourceBadge
            emoji="🦐"
            label="Crevettes"
            value={profile?.shrimp_total || 0}
            subValue={canEatShrimp ? `${profile?.shrimp_today || 0}/${profile?.shrimp_daily_limit || 10}` : "Max"}
            colorClass="bg-orange-500/10 border-orange-500/20"
          />
          <ResourceBadge
            emoji="🐟"
            label="Saumons"
            value={profile?.salmon_total || 0}
            colorClass="bg-sky-500/10 border-sky-500/20"
          />
          <ResourceBadge
            emoji="✨"
            label="Dorés"
            value={profile?.golden_fish_total || 0}
            colorClass="bg-amber-500/10 border-amber-500/20"
          />
          <ResourceBadge
            emoji="🧊"
            label="Icebergs"
            value={profile?.iceberg_size || 1}
            colorClass="bg-cyan-500/10 border-cyan-500/20"
          />
        </motion.div>

        {/* Island View - Full Width */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <IslandView />
        </motion.div>

        {/* Tabs Section - Apple Segmented Control Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Tabs defaultValue="expeditions" className="space-y-4">
            <TabsList className="w-full grid grid-cols-3 p-1 bg-muted/60 border border-border/20 rounded-xl">
              <TabsTrigger 
                value="expeditions" 
                className="gap-1.5 text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <Compass className="w-4 h-4" />
                <span className="hidden sm:inline">Expéditions</span>
              </TabsTrigger>
              <TabsTrigger 
                value="pearls" 
                className="gap-1.5 text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">Perles</span>
              </TabsTrigger>
              <TabsTrigger 
                value="shop" 
                className="gap-1.5 text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Boutique</span>
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="expeditions" className="mt-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Suspense fallback={<LoadingFallback />}>
                    <ExpeditionBoard />
                  </Suspense>
                </motion.div>
              </TabsContent>
              <TabsContent value="pearls" className="mt-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Suspense fallback={<LoadingFallback />}>
                    <PearlsPanel />
                  </Suspense>
                </motion.div>
              </TabsContent>
              <TabsContent value="shop" className="mt-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Suspense fallback={<LoadingFallback />}>
                    <AccessoryShop />
                  </Suspense>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
