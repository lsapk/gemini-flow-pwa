import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles, TrendingUp, Coins } from "lucide-react";
import { Quest } from "@/hooks/useQuests";
import { QuestProgressRing } from "./QuestProgressRing";
import { QuestTimer } from "./QuestTimer";

interface QuestCardProps {
  quest: Quest;
  onComplete: (id: string) => void;
  index?: number;
}

const getCategoryColor = (category: string) => {
  const colors = {
    tasks: "from-blue-500 to-cyan-500",
    habits: "from-green-500 to-emerald-500",
    focus: "from-purple-500 to-pink-500",
    journal: "from-orange-500 to-red-500",
  };
  return colors[category as keyof typeof colors] || "from-gray-500 to-gray-600";
};

const getCategoryIcon = (category: string) => {
  const icons = {
    tasks: "📋",
    habits: "🔄",
    focus: "🎯",
    journal: "📝",
  };
  return icons[category as keyof typeof icons] || "🎯";
};

const getQuestTypeLabel = (type: string) => {
  switch (type) {
    case "daily": return { label: "Quotidienne", icon: "🌅", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    case "weekly": return { label: "Hebdomadaire", icon: "📅", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
    case "achievement": return { label: "Accomplissement", icon: "🏆", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    default: return { label: "Quête", icon: "🎯", color: "" };
  }
};

const getDifficultyStars = (targetValue: number) => {
  if (targetValue >= 10) return "⭐⭐⭐";
  if (targetValue >= 5) return "⭐⭐";
  return "⭐";
};

export function QuestCard({ quest, onComplete, index = 0 }: QuestCardProps) {
  const progress = (quest.current_progress / quest.target_value) * 100;
  const isComplete = progress >= 100;
  const questType = getQuestTypeLabel(quest.quest_type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card
        className={`p-4 relative overflow-hidden transition-all duration-300 ${
          isComplete 
            ? "bg-gradient-to-br from-success/10 to-success/5 border-success/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]" 
            : "glass-card hover:border-primary/30"
        }`}
      >
        {/* Subtle background gradient */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(quest.category)} opacity-5`}
        />

        {/* Claimable animation */}
        {isComplete && (
          <motion.div
            className="absolute inset-0 bg-success/5"
            animate={{ opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        <div className="relative z-10">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-xs ${questType.color}`}>
                {questType.icon} {questType.label}
              </Badge>
              <span className="text-xs text-muted-foreground/70">
                {getDifficultyStars(quest.target_value)}
              </span>
            </div>
            
            {quest.expires_at && (
              <QuestTimer expiresAt={quest.expires_at} />
            )}
          </div>

          {/* Main content */}
          <div className="flex items-center gap-4">
            {/* Progress Ring */}
            <QuestProgressRing progress={progress} size={64} strokeWidth={5} />

            {/* Quest Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{getCategoryIcon(quest.category)}</span>
                <h3 className="font-heading text-foreground truncate">
                  {quest.title}
                </h3>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {quest.description}
              </p>

              {/* Progress text */}
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-primary">{quest.current_progress}</span>
                <span> / {quest.target_value}</span>
              </div>
            </div>
          </div>

          {/* Rewards & Action */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-primary">
                <TrendingUp className="w-3 h-3" />
                +{quest.reward_xp} XP
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <Coins className="w-3 h-3" />
                +{quest.reward_credits}
              </span>
            </div>

            {isComplete && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Button
                  onClick={() => onComplete(quest.id)}
                  size="sm"
                  className="bg-gradient-to-r from-success to-emerald-400 hover:from-success hover:to-emerald-300 text-white shadow-lg shadow-success/25"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Réclamer
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
