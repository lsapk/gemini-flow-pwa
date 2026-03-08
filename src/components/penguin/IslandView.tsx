import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ListTodo, Target, Timer, Sparkles } from "lucide-react";
import penguinKing from "@/assets/penguin-king.png";

interface IslandZone {
  id: string;
  name: string;
  icon: React.ElementType;
  link: string;
  position: { top: string; left: string };
  color: string;
}

const ISLAND_ZONES: IslandZone[] = [
  {
    id: "productivity",
    name: "La Crique de la Productivité",
    icon: ListTodo,
    link: "/tasks",
    position: { top: "20%", left: "15%" },
    color: "from-blue-500/20 to-blue-600/30",
  },
  {
    id: "habits",
    name: "La Clairière des Habitudes",
    icon: Target,
    link: "/habits",
    position: { top: "25%", left: "75%" },
    color: "from-purple-500/20 to-purple-600/30",
  },
  {
    id: "focus",
    name: "Le Sommet du Focus",
    icon: Timer,
    link: "/focus",
    position: { top: "70%", left: "70%" },
    color: "from-amber-500/20 to-amber-600/30",
  },
];

export const IslandView = () => {
  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-gradient-to-b from-[#0B1628] via-[#0F1E38] to-[#0B0E14] border border-white/5">
      {/* Aurora Borealis Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/4 w-[150%] h-full"
          style={{
            background: "radial-gradient(ellipse at center, rgba(56, 189, 248, 0.08) 0%, transparent 70%)",
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
            background: "radial-gradient(ellipse at center, rgba(168, 85, 247, 0.06) 0%, transparent 60%)",
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
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[45%]">
        <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-sky-100/5 to-transparent rounded-t-[100%] blur-sm" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-[80%] bg-gradient-to-t from-white/15 via-sky-50/8 to-transparent rounded-t-[100%]" />
      </div>

      {/* King Penguin Throne (Center) */}
      <motion.div
        className="absolute bottom-[20%] left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative">
          {/* Throne glow */}
          <div className="absolute -inset-4 bg-gradient-to-t from-amber-500/20 via-amber-400/10 to-transparent rounded-full blur-xl" />
          
          {/* King Penguin */}
          <motion.img
            src={penguinKing}
            alt="Roi Pingouin"
            className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl cursor-pointer"
            whileHover={{ 
              scale: 1.1,
              y: -8,
              transition: { type: "spring", stiffness: 400 }
            }}
          />
          
          {/* Crown sparkle */}
          <motion.div
            className="absolute -top-2 left-1/2 -translate-x-1/2"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
          </motion.div>
        </div>
        
        {/* Title */}
        <div className="text-center mt-2">
          <span className="text-xs font-medium text-amber-300/80 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
            👑 Roi Pingouin
          </span>
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
            transition={{ delay: index * 0.15 }}
            whileHover={{ scale: 1.1 }}
          >
            {/* Zone container */}
            <div className={`relative p-3 md:p-4 rounded-2xl bg-gradient-to-br ${zone.color} backdrop-blur-md border border-white/10 shadow-lg group-hover:border-white/20 transition-all`}>
              {/* Icon */}
              <zone.icon className="w-6 h-6 md:w-8 md:h-8 text-white/90" />
              
              {/* Hover tooltip */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <span className="text-[10px] md:text-xs font-medium text-white/90 bg-black/60 px-2 py-1 rounded-lg backdrop-blur-sm">
                  {zone.name}
                </span>
              </div>
            </div>
            
            {/* Pulse effect */}
            <motion.div
              className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${zone.color} -z-10`}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.3,
              }}
            />
          </motion.div>
        </Link>
      ))}

      {/* Mini-map indicator */}
      <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md rounded-xl p-2 border border-white/10">
        <div className="text-[10px] text-white/60 font-medium mb-1">L'Île Polaire</div>
        <div className="w-16 h-10 bg-white/5 rounded-lg relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/30 rounded-full"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + (i % 3) * 20}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
};
