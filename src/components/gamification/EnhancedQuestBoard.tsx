import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, RefreshCw, CheckCircle2, Sparkles } from "lucide-react";
import { useQuests } from "@/hooks/useQuests";
import { useGenerateDailyQuests } from "@/hooks/useGenerateDailyQuests";
import { useAchievements } from "@/hooks/useAchievements";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { useQuestProgressTracking } from "@/hooks/useQuestProgressTracking";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QuestCard } from "./QuestCard";
import { WeeklyStatsWidget } from "./WeeklyStatsWidget";

export const EnhancedQuestBoard = () => {
  const { quests, completedQuests, isLoading, completeQuest } = useQuests();
  const { generateQuests, isGenerating } = useGenerateDailyQuests();
  const { unlockAchievement } = useAchievements();
  const { profile } = usePlayerProfile();
  const { updateQuestProgress } = useQuestProgressTracking();

  useEffect(() => {
    if (completedQuests.length >= 1) {
      unlockAchievement("first_quest");
    }
    if (completedQuests.length >= 10) {
      unlockAchievement("quest_master");
    }
  }, [completedQuests.length, unlockAchievement]);

  useEffect(() => {
    if (profile && profile.level >= 10) {
      unlockAchievement("level_10");
    }
  }, [profile?.level, unlockAchievement]);

  const dailyQuests = quests.filter(q => q.quest_type === "daily");
  const weeklyQuests = quests.filter(q => q.quest_type === "weekly");
  const achievementQuests = quests.filter(q => q.quest_type === "achievement");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="glass-morphism p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-24 bg-muted/50 rounded" />
            <div className="h-24 bg-muted/50 rounded" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Weekly Stats */}
      <WeeklyStatsWidget />

      {/* Main Quest Card */}
      <Card className="glass-morphism p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Target className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </motion.div>
            <div>
              <h2 className="text-xl md:text-2xl font-heading gradient-text">Quêtes</h2>
              <p className="text-sm text-muted-foreground">
                {quests.length} active{quests.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => updateQuestProgress()}
              variant="ghost"
              size="sm"
              className="h-8"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => generateQuests()}
              disabled={isGenerating}
              variant="outline"
              size="sm"
              className="border-primary/30 h-8"
            >
              <Sparkles className={`w-4 h-4 mr-1 ${isGenerating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Générer</span>
            </Button>
            <Badge variant="outline" className="border-success/50 h-8 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {completedQuests.length}
            </Badge>
          </div>
        </div>

        {/* Quest Lists */}
        {quests.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-muted-foreground mb-4">Aucune quête active</p>
            <Button 
              onClick={() => generateQuests()} 
              disabled={isGenerating}
              className="bg-gradient-to-r from-primary to-purple-500"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Générer des quêtes
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Daily Quests */}
            {dailyQuests.length > 0 && (
              <div>
                <h3 className="text-sm font-heading text-muted-foreground mb-3 flex items-center gap-2">
                  <span>🌅</span> Quotidiennes ({dailyQuests.length})
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <AnimatePresence>
                    {dailyQuests.map((quest, i) => (
                      <QuestCard 
                        key={quest.id} 
                        quest={quest} 
                        onComplete={completeQuest}
                        index={i}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Weekly Quests */}
            {weeklyQuests.length > 0 && (
              <div>
                <h3 className="text-sm font-heading text-muted-foreground mb-3 flex items-center gap-2">
                  <span>📅</span> Hebdomadaires ({weeklyQuests.length})
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <AnimatePresence>
                    {weeklyQuests.map((quest, i) => (
                      <QuestCard 
                        key={quest.id} 
                        quest={quest} 
                        onComplete={completeQuest}
                        index={i}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Achievement Quests */}
            {achievementQuests.length > 0 && (
              <div>
                <h3 className="text-sm font-heading text-muted-foreground mb-3 flex items-center gap-2">
                  <span>🏆</span> Accomplissements ({achievementQuests.length})
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <AnimatePresence>
                    {achievementQuests.map((quest, i) => (
                      <QuestCard 
                        key={quest.id} 
                        quest={quest} 
                        onComplete={completeQuest}
                        index={i}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Recently Completed */}
      {completedQuests.length > 0 && (
        <Card className="glass-morphism p-4">
          <h3 className="text-sm font-heading text-muted-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            Récemment terminées
          </h3>
          <div className="space-y-2">
            {completedQuests.slice(0, 5).map((quest) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-2 rounded-lg bg-success/5 border border-success/20"
              >
                <span className="text-sm text-muted-foreground truncate">{quest.title}</span>
                <Badge variant="outline" className="text-xs border-success/50 text-success shrink-0">
                  +{quest.reward_xp} XP
                </Badge>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
