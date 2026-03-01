import { motion } from "framer-motion";
import { PenguinProfile } from "@/hooks/usePenguinProfile";

interface IcebergViewProps {
  profile: PenguinProfile;
}

export const IcebergView = ({ profile }: IcebergViewProps) => {
  const isActive = profile.climate_state === 'active';
  const icebergScale = Math.min(1 + (profile.iceberg_size - 1) * 0.05, 2);

  return (
    <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-border/30">
      {/* Sky */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${
        isActive 
          ? 'bg-gradient-to-b from-indigo-900 via-blue-800 to-sky-600 dark:from-indigo-950 dark:via-blue-900 dark:to-sky-800'
          : 'bg-gradient-to-b from-slate-700 via-slate-600 to-slate-500 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700'
      }`} />
      
      {/* Aurora borealis (active state) */}
      {isActive && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-20 opacity-30"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.4), rgba(167,139,250,0.4), rgba(52,211,153,0.3), transparent)',
          }}
          animate={{ x: [-100, 100, -100] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      
      {/* Stars */}
      {isActive && [...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white"
          style={{ left: `${10 + i * 12}%`, top: `${10 + (i % 3) * 15}%` }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
        />
      ))}

      {/* Ocean */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-blue-600/60 to-blue-900/80 dark:from-blue-800/60 dark:to-blue-950/80" />

      {/* Iceberg */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ scale: icebergScale }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="relative">
          {/* Above water */}
          <div className="w-24 h-14 bg-gradient-to-b from-white to-sky-100 dark:from-sky-100 dark:to-sky-200 clip-iceberg-top shadow-lg" 
            style={{ clipPath: 'polygon(15% 100%, 0% 50%, 20% 0%, 80% 0%, 100% 40%, 85% 100%)' }} 
          />
          {/* Below water (subtle) */}
          <div className="w-32 h-8 bg-sky-200/30 dark:bg-sky-300/20 -ml-4 rounded-b-lg"
            style={{ clipPath: 'polygon(10% 0%, 90% 0%, 75% 100%, 25% 100%)' }}
          />
          
          {/* Decorations */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 flex gap-1">
            {profile.has_radio && <span className="text-[8px]">📻</span>}
            {profile.has_library && <span className="text-[8px]">📚</span>}
            {profile.has_lounge_chair && <span className="text-[8px]">🪑</span>}
          </div>
        </div>
      </motion.div>
      
      {/* Iceberg size indicator */}
      <div className="absolute bottom-1 right-2 text-[10px] text-white/60 font-mono">
        🧊 {profile.iceberg_size}
      </div>
    </div>
  );
};
