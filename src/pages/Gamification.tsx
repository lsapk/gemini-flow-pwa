import { Suspense, lazy } from "react";
import { useEnsurePenguinProfile } from "@/hooks/useEnsurePenguinProfile";
import { usePenguinProfile } from "@/hooks/usePenguinProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Compass, Gift, ShoppingBag, Snowflake } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PenguinAvatar } from "@/components/penguin/PenguinAvatar";
import { IcebergView } from "@/components/penguin/IcebergView";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import penguinMascot from "@/assets/penguin-mascot.png";

const ExpeditionBoard = lazy(() => import("@/components/penguin/ExpeditionBoard").then(m => ({ default: m.ExpeditionBoard })));
const PearlsPanel = lazy(() => import("@/components/penguin/PearlsPanel").then(m => ({ default: m.PearlsPanel })));
const AccessoryShop = lazy(() => import("@/components/penguin/AccessoryShop").then(m => ({ default: m.AccessoryShop })));

const LoadingFallback = () => (
  <Card className="p-6"><div className="space-y-4"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-24 w-full" /></div></Card>
);

const STAGE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  egg: { label: "Œuf", emoji: "🥚", color: "bg-slate-500/10 text-slate-600" },
  chick: { label: "Poussin", emoji: "🐣", color: "bg-sky-500/10 text-sky-600" },
  explorer: { label: "Explorateur", emoji: "🐧", color: "bg-blue-500/10 text-blue-600" },
  emperor: { label: "Empereur", emoji: "👑", color: "bg-purple-500/10 text-purple-600" },
};

export default function Gamification() {
  useEnsurePenguinProfile();
  const { profile, nextStageProgress, canEatShrimp } = usePenguinProfile();

  const progress = nextStageProgress ? Math.min((nextStageProgress.current / nextStageProgress.target) * 100, 100) : 100;
  const stageInfo = STAGE_LABELS[profile?.stage || 'egg'];

  return (
    <div className="space-y-4 relative">
      {/* Polar Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50/30 to-transparent dark:from-sky-950/20 dark:to-transparent" />
      </div>

      {/* Hero Section */}
      <motion.div className="relative z-10" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="p-4 md:p-6 border-sky-200/30 dark:border-sky-800/30 overflow-hidden">
          {/* Stage badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-sky-400" />
              <h1 className="text-xl md:text-2xl font-heading font-bold">Mon Pingouin</h1>
            </div>
            <Badge className={`${stageInfo.color} border-none font-semibold`}>
              {stageInfo.emoji} {stageInfo.label}
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <PenguinAvatar stage={profile?.stage || 'egg'} size="lg" accessories={(profile?.equipped_accessories as string[]) || []} />

            <div className="flex-1 space-y-4 w-full mt-4 sm:mt-0">
              {/* Evolution Progress */}
              {nextStageProgress && (
                <div className="bg-muted/30 rounded-xl p-3 border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">Évolution → {nextStageProgress.label}</span>
                    <span className="text-xs font-mono text-muted-foreground">{nextStageProgress.current}/{nextStageProgress.target} 🐟</span>
                  </div>
                  <Progress value={progress} className="h-2.5" />
                </div>
              )}

              {/* Food Stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 bg-orange-500/5 rounded-xl border border-orange-500/10">
                  <span className="text-lg block">🦐</span>
                  <div className="text-sm font-bold">{profile?.shrimp_total || 0}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {canEatShrimp ? `${profile?.shrimp_today || 0}/${profile?.shrimp_daily_limit || 10}` : '🫃 Plein'}
                  </div>
                </div>
                <div className="text-center p-2 bg-red-500/5 rounded-xl border border-red-500/10">
                  <span className="text-lg block">🐟</span>
                  <div className="text-sm font-bold">{profile?.salmon_total || 0}</div>
                  <div className="text-[10px] text-muted-foreground">Saumon</div>
                </div>
                <div className="text-center p-2 bg-amber-500/5 rounded-xl border border-amber-500/10">
                  <span className="text-lg block">✨🐠</span>
                  <div className="text-sm font-bold">{profile?.golden_fish_total || 0}</div>
                  <div className="text-[10px] text-muted-foreground">Doré</div>
                </div>
                <div className="text-center p-2 bg-sky-500/5 rounded-xl border border-sky-500/10">
                  <span className="text-lg block">🧊</span>
                  <div className="text-sm font-bold">{profile?.iceberg_size || 1}</div>
                  <div className="text-[10px] text-muted-foreground">Iceberg</div>
                </div>
              </div>
            </div>
          </div>

          {/* Iceberg View */}
          {profile && (
            <div className="mt-4">
              <IcebergView profile={profile} />
            </div>
          )}
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="relative z-10">
        <Tabs defaultValue="expeditions" className="space-y-4">
          <TabsList className="p-1 border border-sky-200/30 dark:border-sky-800/30 sticky top-0 z-20 bg-background/80 backdrop-blur w-full grid grid-cols-3">
            <TabsTrigger value="expeditions" className="gap-2 data-[state=active]:bg-sky-100/50 dark:data-[state=active]:bg-sky-900/30">
              <Compass className="w-4 h-4" /><span className="hidden sm:inline">Expéditions</span>
            </TabsTrigger>
            <TabsTrigger value="pearls" className="gap-2 data-[state=active]:bg-amber-100/50 dark:data-[state=active]:bg-amber-900/30">
              <Gift className="w-4 h-4" /><span className="hidden sm:inline">Perles</span>
            </TabsTrigger>
            <TabsTrigger value="shop" className="gap-2 data-[state=active]:bg-purple-100/50 dark:data-[state=active]:bg-purple-900/30">
              <ShoppingBag className="w-4 h-4" /><span className="hidden sm:inline">Boutique</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expeditions" className="mt-4"><Suspense fallback={<LoadingFallback />}><ExpeditionBoard /></Suspense></TabsContent>
          <TabsContent value="pearls" className="mt-4"><Suspense fallback={<LoadingFallback />}><PearlsPanel /></Suspense></TabsContent>
          <TabsContent value="shop" className="mt-4"><Suspense fallback={<LoadingFallback />}><AccessoryShop /></Suspense></TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
