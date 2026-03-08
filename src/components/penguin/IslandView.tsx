import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ListTodo, Target, Timer, Sparkles, BookOpen } from "lucide-react";
import { AnimatedPenguin } from "./AnimatedPenguin";
import { usePenguinProfile } from "@/hooks/usePenguinProfile";

interface IslandZone {
  id: string;
  name: string;
  icon: React.ElementType;
  link: string;
  position: { top: string; left: string };
  color: string;
  bgColor: string;
  glowColor: string;
}

const ISLAND_ZONES: IslandZone[] = [
  {
    id: "productivity",
    name: "Crique Productivité",
    icon: ListTodo,
    link: "/tasks",
    position: { top: "22%", left: "10%" },
    color: "text-sky-400",
    bgColor: "bg-sky-500/20 border-sky-500/30 hover:bg-sky-500/30",
    glowColor: "shadow-sky-500/30",
  },
  {
    id: "habits",
    name: "Clairière Habitudes",
    icon: Target,
    link: "/habits",
    position: { top: "18%", left: "78%" },
    color: "text-purple-400",
    bgColor: "bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30",
    glowColor: "shadow-purple-500/30",
  },
  {
    id: "focus",
    name: "Sommet du Focus",
    icon: Timer,
    link: "/focus",
    position: { top: "60%", left: "78%" },
    color: "text-amber-400",
    bgColor: "bg-amber-500/20 border-amber-500/30 hover:bg-amber-500/30",
    glowColor: "shadow-amber-500/30",
  },
];

const DIALOGUE_MESSAGES = [
  "Brrr... 🥶", "Explorons ! 🧭", "Du saumon ! 🐟", "Quel froid ! ❄️", "Allons-y ! 🚀"
];

// Snowflake component
const Snowflake = ({ index }: { index: number }) => (
  <motion.div
    className="absolute text-white/30 pointer-events-none select-none"
    style={{ left: `${5 + index * 12}%`, top: "-5%", fontSize: `${6 + (index % 3) * 3}px` }}
    animate={{
      y: ["0%", "800%"],
      x: [0, Math.sin(index) * 30, 0],
      opacity: [0, 0.7, 0],
      rotate: [0, 360],
    }}
    transition={{
      duration: 8 + index * 2,
      repeat: Infinity,
      delay: index * 1.5,
      ease: "linear",
    }}
  >
    ❄
  </motion.div>
);

// Wave animation at bottom
const WaveEffect = () => (
  <div className="absolute bottom-0 left-0 right-0 h-8 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute bottom-0 w-[200%] h-full opacity-20"
      style={{
        background: "repeating-linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.3) 25%, transparent 50%)",
        backgroundSize: "200px 100%",
      }}
      animate={{ x: [0, -200] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    />
  </div>
);

export const IslandView = () => {
  const { profile } = usePenguinProfile();
  const [dialogue, setDialogue] = useState("");
  const [showDialogue, setShowDialogue] = useState(false);

  useEffect(() => {
    const show = () => {
      setDialogue(DIALOGUE_MESSAGES[Math.floor(Math.random() * DIALOGUE_MESSAGES.length)]);
      setShowDialogue(true);
      setTimeout(() => setShowDialogue(false), 3000);
    };
    const interval = setInterval(show, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-border/10" style={{ aspectRatio: "4/3" }}>
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0F1E38] to-[#0B0E14]" />

      {/* Stars */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-1 h-1 bg-white rounded-full pointer-events-none"
          style={{ left: `${5 + i * 6.2}%`, top: `${3 + (i * 7) % 30}%` }}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.3 }}
        />
      ))}

      {/* Aurora */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-1/2 -left-1/4 w-[150%] h-full"
          style={{ background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, transparent 70%)" }}
          animate={{ x: [0, 50, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -top-1/3 -right-1/4 w-[100%] h-full"
          style={{ background: "radial-gradient(ellipse at center, hsl(270 70% 50% / 0.06) 0%, transparent 60%)" }}
          animate={{ x: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* Snowflakes */}
      {[...Array(8)].map((_, i) => <Snowflake key={i} index={i} />)}

      {/* Ice Platform */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-[50%] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-white/12 via-sky-100/5 to-transparent rounded-t-[100%] blur-sm" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-[85%] bg-gradient-to-t from-white/18 via-sky-50/8 to-transparent rounded-t-[100%]" />
      </div>

      {/* Cabane (unlocked with has_library) */}
      <AnimatePresence>
        {profile?.has_library && (
          <motion.div
            className="absolute bottom-[35%] left-[22%] z-5"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="flex flex-col items-center">
              <BookOpen className="w-5 h-5 text-amber-300/70" />
              <span className="text-[8px] text-amber-200/60 mt-0.5">Bibliothèque</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Penguin Central */}
      <motion.div
        className="absolute bottom-[16%] left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="relative flex flex-col items-center">
          <AnimatedPenguin size="xl" />

          {/* Dialogue bubble */}
          <AnimatePresence>
            {showDialogue && (
              <motion.div
                className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap"
                initial={{ opacity: 0, scale: 0.7, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: 5 }}
              >
                <div className="bg-white/90 dark:bg-card/95 backdrop-blur-md text-foreground text-[10px] font-medium px-2.5 py-1 rounded-xl shadow-lg border border-border/30">
                  {dialogue}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white/90 dark:bg-card/95 border-r border-b border-border/30 rotate-45" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title */}
          <motion.div className="mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <span className="text-[10px] font-medium text-amber-300/90 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm border border-amber-500/20">
              👑 Roi Pingouin
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Interactive Zones - Always-visible labels */}
      {ISLAND_ZONES.map((zone, index) => (
        <Link key={zone.id} to={zone.link}>
          <motion.div
            className="absolute group cursor-pointer"
            style={{ top: zone.position.top, left: zone.position.left }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1, type: "spring", stiffness: 300 }}
            whileHover={{ scale: 1.15, y: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className={`relative p-3 md:p-4 rounded-2xl ${zone.bgColor} backdrop-blur-md border transition-all duration-200 shadow-lg ${zone.glowColor}`}>
              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, delay: index * 0.5 }}>
                <zone.icon className={`w-5 h-5 md:w-6 md:h-6 ${zone.color}`} />
              </motion.div>
            </div>
            {/* Always visible label */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-[8px] md:text-[10px] font-medium text-foreground/70 bg-card/60 px-1.5 py-0.5 rounded-md backdrop-blur-sm border border-border/20">
                {zone.name}
              </span>
            </div>
            {/* Pulse */}
            <motion.div
              className={`absolute inset-0 rounded-2xl ${zone.bgColor} -z-10`}
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.4 }}
            />
          </motion.div>
        </Link>
      ))}

      {/* Mini-map */}
      <motion.div
        className="absolute top-3 left-3 bg-card/60 backdrop-blur-md rounded-xl p-2 border border-border/20"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="text-[10px] text-muted-foreground font-medium mb-1">🗺️ L'Île Polaire</div>
        <div className="w-14 h-8 bg-muted/30 rounded-lg relative">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-amber-400 rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* Sparkles */}
      <motion.div
        className="absolute top-[12%] left-[45%]"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles className="w-4 h-4 text-amber-400/40" />
      </motion.div>

      <WaveEffect />
    </div>
  );
};
