import { Suspense, lazy } from "react";
import { useEnsurePenguinProfile } from "@/hooks/useEnsurePenguinProfile";
import { usePenguinProfile } from "@/hooks/usePenguinProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Compass, Gift, ShoppingBag, Snowflake, Fish, Sparkles, IceCreamCone } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { IslandView } from "@/components/penguin/IslandView";
import { KingPenguin } from "@/components/penguin/KingPenguin";

const ExpeditionBoard = lazy(() => import("@/components/penguin/ExpeditionBoard").then(m => ({ default: m.ExpeditionBoard })));
const PearlsPanel = lazy(() => import("@/components/penguin/PearlsPanel").then(m => ({ default: m.PearlsPanel })));
const AccessoryShop = lazy(() => import("@/components/penguin/AccessoryShop").then(m => ({ default: m.AccessoryShop })));

const LoadingFallback = () => (
  <Card className="p-6 bg-[#1A1F26] border-white/5">
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3 bg-white/5" />
      <Skeleton className="h-24 w-full bg-white/5" />
    </div>
  </Card>
);

const STAGE_LABELS: Record<string, { label: string; emoji: string; next: string }> = {
  egg: { label: "Œuf", emoji: "🥚", next: "Poussin" },
  chick: { label: "Poussin", emoji: "🐣", next: "Explorateur" },
  explorer: { label: "Explorateur", emoji: "🐧", next: "Empereur" },
  emperor: { label: "Empereur", emoji: "👑", next: "Maître" },
};

export default function Gamification() {
  useEnsurePenguinProfile();
  const { profile, nextStageProgress, canEatShrimp } = usePenguinProfile();

  const progress = nextStageProgress ? Math.min((nextStageProgress.current / nextStageProgress.target) * 100, 100) : 100;
  const stageInfo = STAGE_LABELS[profile?.stage || 'egg'];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white relative">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-950/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-[#1A1F26]/80 backdrop-blur-xl border border-white/5 p-4 md:p-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar with breathing animation */}
            <div className="relative">
              <KingPenguin size="lg" />
              <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500/20 border-amber-500/30 text-amber-300 text-[10px]">
                {stageInfo.emoji} {stageInfo.label}
              </Badge>
            </div>

            {/* Progress & Resources */}
            <div className="flex-1 space-y-4 w-full">
              {/* Evolution Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white/80">
                    Évolution → {stageInfo.next}
                  </span>
                  <span className="text-xs font-mono text-white/50">
                    {nextStageProgress?.current || 0}/{nextStageProgress?.target || 100}
                  </span>
                </div>
                <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-500 via-purple-500 to-amber-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Resource Badges */}
              <div className="grid grid-cols-4 gap-2 md:gap-3">
                <ResourceBadge
                  icon="🦐"
                  label="Crevettes"
                  value={profile?.shrimp_total || 0}
                  subValue={canEatShrimp ? `${profile?.shrimp_today || 0}/${profile?.shrimp_daily_limit || 10}` : "Max"}
                  color="bg-orange-500/10 border-orange-500/20"
                  iconColor="text-orange-400"
                />
                <ResourceBadge
                  icon="🐟"
                  label="Saumons"
                  value={profile?.salmon_total || 0}
                  color="bg-sky-500/10 border-sky-500/20"
                  iconColor="text-sky-400"
                />
                <ResourceBadge
                  icon="✨"
                  label="Dorés"
                  value={profile?.golden_fish_total || 0}
                  color="bg-amber-500/10 border-amber-500/20"
                  iconColor="text-amber-400"
                />
                <ResourceBadge
                  icon="🧊"
                  label="Icebergs"
                  value={profile?.iceberg_size || 1}
                  color="bg-cyan-500/10 border-cyan-500/20"
                  iconColor="text-cyan-400"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content - 3 Column Layout on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Resource Panel (hidden on mobile, shown in tabs) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="hidden lg:block lg:col-span-3 space-y-4"
          >
            <Card className="bg-[#1A1F26]/80 backdrop-blur-xl border-white/5 p-4">
              <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                <Fish className="w-4 h-4 text-sky-400" />
                Réserves de Nourriture
              </h3>
              <div className="space-y-3">
                <FoodSlot emoji="🦐" name="Crevettes" current={profile?.shrimp_today || 0} max={profile?.shrimp_daily_limit || 10} />
                <FoodSlot emoji="🐟" name="Saumons" current={profile?.salmon_total || 0} max={999} />
                <FoodSlot emoji="✨🐠" name="Poissons Dorés" current={profile?.golden_fish_total || 0} max={999} />
              </div>
            </Card>
            
            <Card className="bg-[#1A1F26]/80 backdrop-blur-xl border-white/5 p-4">
              <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Statistiques
              </h3>
              <div className="grid grid-cols-2 gap-2 text-center">
                <StatBox label="Niveau" value={profile?.iceberg_size || 1} />
                <StatBox label="Stade" value={stageInfo.label} />
              </div>
            </Card>
          </motion.div>

          {/* Center Column - Island View */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-6"
          >
            <IslandView />
          </motion.div>

          {/* Right Column - Quick Access (hidden on mobile) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="hidden lg:block lg:col-span-3"
          >
            <Suspense fallback={<LoadingFallback />}>
              <AccessoryShop />
            </Suspense>
          </motion.div>
        </div>

        {/* Bottom Section - Tabs for Expeditions, Pearls, Shop (especially for mobile) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Tabs defaultValue="expeditions" className="space-y-4">
            <TabsList className="p-1 bg-[#1A1F26]/80 backdrop-blur-xl border border-white/5 w-full grid grid-cols-3">
              <TabsTrigger 
                value="expeditions" 
                className="gap-2 data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-300"
              >
                <Compass className="w-4 h-4" />
                <span className="hidden sm:inline">Expéditions</span>
              </TabsTrigger>
              <TabsTrigger 
                value="pearls" 
                className="gap-2 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300"
              >
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">Perles</span>
              </TabsTrigger>
              <TabsTrigger 
                value="shop" 
                className="gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 lg:hidden"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Boutique</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expeditions">
              <Suspense fallback={<LoadingFallback />}>
                <ExpeditionBoard />
              </Suspense>
            </TabsContent>
            <TabsContent value="pearls">
              <Suspense fallback={<LoadingFallback />}>
                <PearlsPanel />
              </Suspense>
            </TabsContent>
            <TabsContent value="shop" className="lg:hidden">
              <Suspense fallback={<LoadingFallback />}>
                <AccessoryShop />
              </Suspense>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

// Helper Components
const ResourceBadge = ({ 
  icon, 
  label, 
  value, 
  subValue, 
  color, 
  iconColor 
}: { 
  icon: string; 
  label: string; 
  value: number | string; 
  subValue?: string; 
  color: string; 
  iconColor: string;
}) => (
  <div className={`${color} rounded-2xl border p-3 text-center backdrop-blur-sm`}>
    <span className="text-xl block">{icon}</span>
    <div className="text-sm font-bold text-white mt-1">{value}</div>
    <div className="text-[10px] text-white/50">{subValue || label}</div>
  </div>
);

const FoodSlot = ({ emoji, name, current, max }: { emoji: string; name: string; current: number; max: number }) => (
  <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
    <span className="text-lg">{emoji}</span>
    <div className="flex-1">
      <div className="text-xs font-medium text-white/70">{name}</div>
      <div className="flex items-center gap-2">
        <Progress value={(current / max) * 100} className="h-1.5 flex-1 bg-white/10" />
        <span className="text-[10px] text-white/50 font-mono">{current}/{max}</span>
      </div>
    </div>
  </div>
);

const StatBox = ({ label, value }: { label: string; value: string | number }) => (
  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
    <div className="text-lg font-bold text-white">{value}</div>
    <div className="text-[10px] text-white/50">{label}</div>
  </div>
);
