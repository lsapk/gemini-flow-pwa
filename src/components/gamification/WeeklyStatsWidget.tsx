import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Flame, Target, Zap } from "lucide-react";
import { useQuests } from "@/hooks/useQuests";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";

export function WeeklyStatsWidget() {
  const { quests, completedQuests } = useQuests();
  const { profile } = usePlayerProfile();

  // Calculate weekly stats (simplified - could be enhanced with actual weekly data)
  const stats = useMemo(() => {
    const weeklyCompleted = completedQuests?.filter(q => {
      if (!q.completed_at) return false;
      const completedDate = new Date(q.completed_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return completedDate >= weekAgo;
    }).length || 0;

    const weeklyXP = completedQuests?.filter(q => {
      if (!q.completed_at) return false;
      const completedDate = new Date(q.completed_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return completedDate >= weekAgo;
    }).reduce((sum, q) => sum + (q.reward_xp || 0), 0) || 0;

    const activeQuests = quests?.length || 0;
    const totalCompleted = profile?.total_quests_completed || 0;

    return {
      weeklyCompleted,
      weeklyXP,
      activeQuests,
      totalCompleted,
    };
  }, [quests, completedQuests, profile]);

  const statItems = [
    {
      label: "Quêtes actives",
      value: stats.activeQuests,
      icon: Target,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
    {
      label: "Cette semaine",
      value: stats.weeklyCompleted,
      icon: Flame,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
    },
    {
      label: "XP gagnés",
      value: `+${stats.weeklyXP}`,
      icon: Zap,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
    },
    {
      label: "Total",
      value: stats.totalCompleted,
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
  ];

  return (
    <Card className="glass-morphism p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-heading">Statistiques</h3>
          <p className="text-xs text-muted-foreground">Cette semaine</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-xl ${item.bgColor} border ${item.borderColor} text-center`}
          >
            <item.icon className={`w-4 h-4 ${item.color} mx-auto mb-1`} />
            <div className={`text-lg font-heading ${item.color}`}>{item.value}</div>
            <div className="text-xs text-muted-foreground truncate">{item.label}</div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
