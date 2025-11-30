import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, CheckCircle2, Clock, TrendingUp, RefreshCw } from "lucide-react";
import { useQuests } from "@/hooks/useQuests";
import { useGenerateDailyQuests } from "@/hooks/useGenerateDailyQuests";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export const QuestBoard = () => {
  const { quests, completedQuests, isLoading, completeQuest } = useQuests();
  const { generateQuests, isGenerating } = useGenerateDailyQuests();

  if (isLoading) {
    return (
      <Card className="glass-morphism p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-primary/20 rounded" />
          <div className="h-20 bg-primary/10 rounded" />
          <div className="h-20 bg-primary/10 rounded" />
        </div>
      </Card>
    );
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

  const getQuestTypeIcon = (type: string) => {
    const icons = {
      daily: "🌅",
      weekly: "📅",
      achievement: "🏆",
    };
    return icons[type as keyof typeof icons] || "🎯";
  };

  return (
    <div className="space-y-4">
      <Card className="glass-morphism p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center glow-effect-primary">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-heading gradient-text">
                Quêtes Actives
              </h2>
              <p className="text-sm text-muted-foreground">
                {quests.length} quêtes en cours
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => generateQuests()}
              disabled={isGenerating}
              variant="outline"
              size="sm"
              className="border-primary/30"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isGenerating ? "animate-spin" : ""}`} />
              Générer Quêtes
            </Button>
            <Badge variant="outline" className="border-success/50">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {completedQuests.length} terminées
            </Badge>
          </div>
        </div>

        {quests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-muted-foreground mb-2">
              Aucune quête active pour le moment
            </p>
            <p className="text-sm text-muted-foreground/70">
              Complétez des tâches et habitudes pour débloquer de nouvelles quêtes
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {quests.map((quest) => {
              const progress = (quest.current_progress / quest.target_value) * 100;
              const isCompleted = progress >= 100;

              return (
                <div
                  key={quest.id}
                  className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                    isCompleted 
                      ? "bg-success/10 border-success/30 glow-effect-success" 
                      : "bg-background/50 border-border/30 backdrop-blur"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getCategoryColor(quest.category)} flex items-center justify-center text-xl`}>
                        {getQuestTypeIcon(quest.quest_type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-heading text-foreground">
                            {quest.title}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {quest.quest_type}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {quest.description}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +{quest.reward_xp} XP
                          </span>
                          <span>
                            💰 +{quest.reward_credits} crédits
                          </span>
                          {quest.expires_at && (
                            <span className="flex items-center gap-1 text-warning">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(quest.expires_at), { 
                                addSuffix: true, 
                                locale: fr 
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isCompleted && (
                      <Button
                        onClick={() => completeQuest(quest.id)}
                        className="bg-gradient-to-r from-success to-success-glow hover:scale-105 transition-transform"
                        size="sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Réclamer
                      </Button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Progression
                      </span>
                      <span className="font-heading text-primary">
                        {quest.current_progress} / {quest.target_value}
                      </span>
                    </div>
                    <Progress 
                      value={progress} 
                      className="h-2"
                    />
                  </div>
                </div>
              );
            })}
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
            {completedQuests.slice(0, 3).map((quest) => (
              <div
                key={quest.id}
                className="flex items-center justify-between p-2 rounded-lg bg-success/5 border border-success/20"
              >
                <span className="text-sm text-muted-foreground">
                  {quest.title}
                </span>
                <Badge variant="outline" className="text-xs border-success/50 text-success">
                  +{quest.reward_xp} XP
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};