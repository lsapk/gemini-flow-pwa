import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ListTodo, Target, Timer, Sparkles } from "lucide-react";
import { AnimatedPenguin } from "./AnimatedPenguin";

interface IslandZone {
  id: string;
  name: string;
  icon: React.ElementType;
  link: string;
  position: { top: string; left: string };
  color: string;
  bgColor: string;
}

const ISLAND_ZONES: IslandZone[] = [
  {
    id: "productivity",
    name: "La Crique de la Productivité",
    icon: ListTodo,
    link: "/tasks",
    position: { top: "25%", left: "12%" },
    color: "text-sky-400",
    bgColor: "bg-sky-500/20 border-sky-500/30 hover:bg-sky-500/30",
  },
  {
    id: "habits",
    name: "La Clairière des Habitudes",
    icon: Target,
    link: "/habits",
    position: { top: "20%", left: "78%" },
    color: "text-purple-400",
    bgColor: "bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30",
  },
  {
    id: "focus",
    name: "Le Sommet du Focus",
    icon: Timer,
    link: "/focus",
    position: { top: "65%", left: "75%" },
    color: "text-amber-400",
    bgColor: "bg-amber-500/20 border-amber-500/30 hover:bg-amber-500/30",
  },
];

export const IslandView = () => {
  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-gradient-to-b from-[hsl(var(--background))] via-[#0F1E38] to-[#0B0E14] border border-border/10">
      {/* Aurora Borealis Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-1/2 -left-1/4 w-[150%] h-full"
          style={{
            background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, 50, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -top-1/3 -right-1/4 w-[100%] h-full"
          style={{
            background: "radial-gradient(ellipse at center, hsl(270 70% 50% / 0.06) 0%, transparent 60%)",
          }}
          animate={{
            x: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      {/* Ice Platform */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-[50%] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-white/12 via-sky-100/5 to-transparent rounded-t-[100%] blur-sm" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-[85%] bg-gradient-to-t from-white/18 via-sky-50/8 to-transparent rounded-t-[100%]" />
      </div>

      {/* King Penguin Throne (Center) */}
      <motion.div
        className="absolute bottom-[18%] left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="relative flex flex-col items-center">
          <AnimatedPenguin size="xl" />
          
          {/* Title Badge */}
          <motion.div
            className="mt-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-xs font-medium text-amber-300/90 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm border border-amber-500/20">
              👑 Roi Pingouin
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Interactive Zones */}
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
            {/* Zone container */}
            <div className={`relative p-3 md:p-4 rounded-2xl ${zone.bgColor} backdrop-blur-md border transition-all duration-200`}>
              <zone.icon className={`w-5 h-5 md:w-6 md:h-6 ${zone.color}`} />
              
              {/* Hover tooltip */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                <span className="text-[10px] md:text-xs font-medium text-foreground/90 bg-card/90 px-2 py-1 rounded-lg backdrop-blur-sm border border-border/30">
                  {zone.name}
                </span>
              </div>
            </div>
            
            {/* Pulse effect */}
            <motion.div
              className={`absolute inset-0 rounded-2xl ${zone.bgColor} -z-10`}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: index * 0.4,
              }}
            />
          </motion.div>
        </Link>
      ))}

      {/* Mini-map indicator */}
      <motion.div
        className="absolute top-3 left-3 bg-card/60 backdrop-blur-md rounded-xl p-2 border border-border/20"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="text-[10px] text-muted-foreground font-medium mb-1">L'Île Polaire</div>
        <div className="w-14 h-8 bg-muted/30 rounded-lg relative">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-amber-400 rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* Floating particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/40 rounded-full pointer-events-none"
          style={{
            left: `${15 + i * 18}%`,
            top: `${25 + (i % 3) * 18}%`,
          }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + i * 0.4,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Sparkles decoration */}
      <motion.div
        className="absolute top-[15%] left-[45%]"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles className="w-4 h-4 text-amber-400/40" />
      </motion.div>
    </div>
  );
};
