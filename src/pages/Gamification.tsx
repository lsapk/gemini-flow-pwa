import { Suspense, lazy, useState, useEffect, useMemo } from "react";
import { useEnsurePenguinProfile } from "@/hooks/useEnsurePenguinProfile";
import { usePenguinProfile } from "@/hooks/usePenguinProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Compass, Gift, ShoppingBag, Sparkles, Flame, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const STAGE_CONFIG: Record<string, { label: string; emoji: string; next: string; title: string; level: number; color: string }> = {
  egg: { label: "Œuf", emoji: "🥚", next: "Poussin", title: "Œuf Mystérieux", level: 1, color: "from-slate-400 to-slate-500" },
  chick: { label: "Poussin", emoji: "🐣", next: "Explorateur", title: "Poussin Aventurier", level: 5, color: "from-amber-400 to-orange-500" },
  explorer: { label: "Explorateur", emoji: "🐧", next: "Empereur", title: "Explorateur Polaire", level: 15, color: "from-sky-400 to-blue-600" },
  emperor: { label: "Empereur", emoji: "👑", next: "Maître", title: "Empereur des Glaces", level: 30, color: "from-amber-300 to-yellow-500" },
};

const PENGUIN_DIALOGUES = [
  "Brrr... il fait froid ! 🥶",
  "J'ai faim ! Donne-moi du saumon ! 🐟",
  "Allons explorer ! 🧭",
  "Quelle belle journée sur l'iceberg ! ❄️",
  "Je suis le roi de la banquise ! 👑",
  "Un poisson doré, s'il te plaît ! ✨",
  "Mes expéditions avancent bien ! 🗺️",
  "J'adore ma nouvelle écharpe ! 🧣",
];

// XP Ring SVG Component
const XPRing = ({ progress, level }: { progress: number; level: number }) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative">
      <svg width="130" height="130" className="transform -rotate-90">
        {/* Background ring */}
        <circle cx="65" cy="65" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" opacity={0.3} />
        {/* Progress ring */}
        <motion.circle
          cx="65" cy="65" r={radius}
          fill="none"
          stroke="url(#xpGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="hsl(270, 70%, 60%)" />
            <stop offset="100%" stopColor="hsl(38, 92%, 50%)" />
          </linearGradient>
        </defs>
      </svg>
      {/* Avatar inside ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatedPenguin size="md" />
      </div>
      {/* Level badge */}
      <motion.div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-lg border-2 border-background"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 400 }}
      >
        Nv. {level}
      </motion.div>
    </div>
  );
};

// Animated resource counter
const ResourceCounter = ({ emoji, label, value, subValue, colorClass, delay }: {
  emoji: string; label: string; value: number; subValue?: string; colorClass: string; delay: number;
}) => (
  <motion.div
    className={`${colorClass} rounded-2xl border p-2.5 text-center backdrop-blur-sm relative overflow-hidden group cursor-default`}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
    whileHover={{ scale: 1.08, y: -3 }}
    whileTap={{ scale: 0.95 }}
  >
    {/* Shimmer effect on hover */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
    <motion.span
      className="text-xl block"
      animate={{ rotate: [0, -5, 5, 0] }}
      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: delay * 2 }}
    >
      {emoji}
    </motion.span>
    <motion.div
      className="text-sm font-bold text-foreground mt-0.5"
      key={value}
      initial={{ scale: 1.3, color: "hsl(var(--primary))" }}
      animate={{ scale: 1, color: "hsl(var(--foreground))" }}
      transition={{ duration: 0.3 }}
    >
      {value}
    </motion.div>
    <div className="text-[9px] text-muted-foreground font-medium">{subValue || label}</div>
  </motion.div>
);

// Dialogue bubble
const DialogueBubble = () => {
  const [msg, setMsg] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = () => {
      setMsg(PENGUIN_DIALOGUES[Math.floor(Math.random() * PENGUIN_DIALOGUES.length)]);
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    };
    show();
    const interval = setInterval(show, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 5 }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap"
        >
          <div className="bg-card/95 backdrop-blur-md text-foreground text-[11px] font-medium px-3 py-1.5 rounded-xl border border-border/30 shadow-lg">
            {msg}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card/95 border-r border-b border-border/30 rotate-45" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Floating particles around hero
const HeroParticles = () => (
  <>
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute pointer-events-none"
        style={{
          top: `${15 + (i % 3) * 30}%`,
          left: `${10 + i * 15}%`,
        }}
        animate={{
          y: [0, -20, 0],
          opacity: [0, 0.8, 0],
          scale: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 3 + i * 0.5,
          repeat: Infinity,
          delay: i * 0.8,
        }}
      >
        <Star className="w-3 h-3 text-amber-400/60" fill="currentColor" />
      </motion.div>
    ))}
  </>
);

export default function Gamification() {
  useEnsurePenguinProfile();
  const { profile, nextStageProgress, canEatShrimp } = usePenguinProfile();

  const progress = nextStageProgress ? Math.min((nextStageProgress.current / nextStageProgress.target) * 100, 100) : 100;
  const stageInfo = STAGE_CONFIG[profile?.stage || 'egg'];

  // Calculate pseudo-level from salmon
  const level = useMemo(() => {
    const salmon = profile?.salmon_total || 0;
    return Math.max(1, Math.floor(Math.sqrt(salmon * 2)) + stageInfo.level);
  }, [profile?.salmon_total, stageInfo.level]);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-4 md:p-6 space-y-5 max-w-3xl mx-auto">

        {/* ═══════ HERO RPG ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border/30 p-5 relative overflow-hidden"
        >
          <HeroParticles />

          <div className="flex items-center gap-5 relative z-10">
            {/* XP Ring + Avatar */}
            <div className="relative flex-shrink-0">
              <XPRing progress={progress} level={level} />
              <DialogueBubble />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-2.5">
              {/* Title */}
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  {stageInfo.emoji} {stageInfo.title}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Évolution → <span className="text-primary font-medium">{stageInfo.next}</span>
                </p>
              </div>

              {/* XP bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> XP
                  </span>
                  <span className="font-mono">{nextStageProgress?.current || 0}/{nextStageProgress?.target || 100}</span>
                </div>
                <div className="relative h-3 rounded-full bg-muted/50 overflow-hidden border border-border/20">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-purple-500 to-amber-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  {/* Shimmer on XP bar */}
                  <motion.div
                    className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/25 to-transparent rounded-full"
                    animate={{ left: ["-20%", "120%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                </div>
              </div>

              {/* Streak badge */}
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Badge className="bg-orange-500/15 border-orange-500/25 text-orange-400 text-[10px] gap-1">
                  <Flame className="w-3 h-3" />
                  Série active
                </Badge>
                <Badge className="bg-primary/10 border-primary/20 text-primary text-[10px] gap-1">
                  <Star className="w-3 h-3" />
                  {profile?.salmon_total || 0} XP totaux
                </Badge>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* ═══════ RESOURCE COUNTERS ═══════ */}
        <div className="grid grid-cols-4 gap-2">
          <ResourceCounter emoji="🦐" label="Crevettes" value={profile?.shrimp_total || 0}
            subValue={canEatShrimp ? `${profile?.shrimp_today || 0}/${profile?.shrimp_daily_limit || 10}` : "Max"}
            colorClass="bg-orange-500/10 border-orange-500/20" delay={0.15} />
          <ResourceCounter emoji="🐟" label="Saumons" value={profile?.salmon_total || 0}
            colorClass="bg-sky-500/10 border-sky-500/20" delay={0.2} />
          <ResourceCounter emoji="✨" label="Dorés" value={profile?.golden_fish_total || 0}
            colorClass="bg-amber-500/10 border-amber-500/20" delay={0.25} />
          <ResourceCounter emoji="🧊" label="Iceberg" value={profile?.iceberg_size || 1}
            colorClass="bg-cyan-500/10 border-cyan-500/20" delay={0.3} />
        </div>

        {/* ═══════ ISLAND ═══════ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <IslandView />
        </motion.div>

        {/* ═══════ GAME TABS ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Tabs defaultValue="expeditions" className="space-y-4">
            <TabsList className="w-full grid grid-cols-3 p-1 bg-muted/60 border border-border/20 rounded-xl">
              <TabsTrigger value="expeditions" className="gap-1.5 text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Compass className="w-4 h-4" />
                <span className="hidden sm:inline">Quêtes</span>
              </TabsTrigger>
              <TabsTrigger value="pearls" className="gap-1.5 text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">Perles</span>
              </TabsTrigger>
              <TabsTrigger value="shop" className="gap-1.5 text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Boutique</span>
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="expeditions" className="mt-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <Suspense fallback={<LoadingFallback />}><ExpeditionBoard /></Suspense>
                </motion.div>
              </TabsContent>
              <TabsContent value="pearls" className="mt-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <Suspense fallback={<LoadingFallback />}><PearlsPanel /></Suspense>
                </motion.div>
              </TabsContent>
              <TabsContent value="shop" className="mt-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <Suspense fallback={<LoadingFallback />}><AccessoryShop /></Suspense>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
