import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, Target, Flame, ChevronRight, Star, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { useQuests } from "@/hooks/useQuests";

export const GamificationWidget = () => {
  const { profile, xpProgress, xpNeeded } = usePlayerProfile();
  const { quests } = useQuests();

  if (!profile) return null;

  // Get top 3 active quests
  const topQuests = quests
    .filter(q => !q.completed)
    .sort((a, b) => {
      // Priority: daily > weekly > achievement, then by progress %
      const typeOrder = { daily: 3, weekly: 2, achievement: 1 };
      const aType = typeOrder[a.quest_type] || 0;
      const bType = typeOrder[b.quest_type] || 0;
      if (aType !== bType) return bType - aType;
      
      const aProgress = (a.current_progress / a.target_value) * 100;
      const bProgress = (b.current_progress / b.target_value) * 100;
      return bProgress - aProgress;
    })
    .slice(0, 3);

  const totalActiveQuests = quests.filter(q => !q.completed).length;

  return (
    <Card className="dashboard-card border-primary/20 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-warning/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-heading">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-warning/20 animate-pulse">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            Progression
          </div>
          <Link to="/gamification">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
              Voir tout <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        {/* Level & XP */}
        <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-xl font-bold text-white">{profile.level}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Niveau {profile.level}</span>
              <span className="text-xs text-muted-foreground">{profile.experience_points} / {xpNeeded} XP</span>
            </div>
            <Progress value={xpProgress} className="h-2" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-warning/10 border border-warning/20">
            <Flame className="h-4 w-4 text-warning mx-auto mb-1" />
            <div className="text-lg font-bold text-warning">{profile.total_quests_completed}</div>
            <div className="text-[10px] text-muted-foreground">Quêtes</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Star className="h-4 w-4 text-primary mx-auto mb-1" />
            <div className="text-lg font-bold text-primary">{profile.credits}</div>
            <div className="text-[10px] text-muted-foreground">Crédits</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-success/10 border border-success/20">
            <Target className="h-4 w-4 text-success mx-auto mb-1" />
            <div className="text-lg font-bold text-success">{totalActiveQuests}</div>
            <div className="text-[10px] text-muted-foreground">Actives</div>
          </div>
        </div>

        {/* Active Quests */}
        {topQuests.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Gift className="h-4 w-4 text-warning" />
              Quêtes en cours
            </h4>
            {topQuests.map((quest) => {
              const progress = Math.min((quest.current_progress / quest.target_value) * 100, 100);
              const isClose = progress >= 75;
              
              return (
                <div
                  key={quest.id}
                  className={`p-2 rounded-lg border transition-all ${
                    isClose 
                      ? "bg-success/10 border-success/30 animate-pulse" 
                      : "bg-muted/30 border-border/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate flex-1 mr-2">
                      {quest.title}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={`text-[10px] px-1.5 ${
                        quest.quest_type === "daily" 
                          ? "bg-primary/20 text-primary" 
                          : quest.quest_type === "weekly"
                          ? "bg-info/20 text-info"
                          : "bg-warning/20 text-warning"
                      }`}
                    >
                      {quest.quest_type === "daily" ? "Jour" : quest.quest_type === "weekly" ? "Sem" : "🏆"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {quest.current_progress}/{quest.target_value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {topQuests.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Générez des quêtes pour commencer !</p>
            <Link to="/gamification">
              <Button size="sm" className="mt-2">
                Aller à l'arène
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
