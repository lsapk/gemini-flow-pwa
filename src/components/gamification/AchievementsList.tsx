import { useAchievements, ACHIEVEMENT_DEFINITIONS } from "@/hooks/useAchievements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Lock, Star, Sparkles } from "lucide-react";

export const AchievementsList = () => {
  const { achievements, isLoading, totalAchievements } = useAchievements();

  if (isLoading) {
    return (
      <Card className="glass-morphism p-6">
        <div className="space-y-4">
          <div className="h-6 bg-muted animate-pulse rounded" />
          <div className="h-20 bg-muted animate-pulse rounded" />
          <div className="h-20 bg-muted animate-pulse rounded" />
        </div>
      </Card>
    );
  }

  const unlockedIds = new Set(achievements.map(a => a.achievement_id));
  const allAchievements = Object.values(ACHIEVEMENT_DEFINITIONS);
  const progressPercent = (achievements.length / totalAchievements) * 100;

  // Group achievements by category
  const getCategory = (id: string) => {
    if (id.includes("quest")) return "Quêtes";
    if (id.includes("focus")) return "Focus";
    if (id.includes("habit")) return "Habitudes";
    if (id.includes("level")) return "Niveaux";
    if (id.includes("task")) return "Tâches";
    if (id.includes("journal")) return "Journal";
    return "Spécial";
  };

  const groupedAchievements = allAchievements.reduce((acc, achievement) => {
    const category = getCategory(achievement.id);
    if (!acc[category]) acc[category] = [];
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, typeof allAchievements>);

  return (
    <Card className="glass-morphism p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-cyan-500 flex items-center justify-center glow-effect-primary">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-heading gradient-text">Achievements</h2>
          <p className="text-sm text-muted-foreground">
            {achievements.length} / {totalAchievements} débloqués
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-heading text-primary">{Math.round(progressPercent)}%</div>
          <div className="text-xs text-muted-foreground">Progression</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <Progress value={progressPercent} className="h-3" />
      </div>

      {/* Recently unlocked */}
      {achievements.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Récemment débloqués</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {achievements.slice(0, 5).map((a) => {
              const def = ACHIEVEMENT_DEFINITIONS[a.achievement_id as keyof typeof ACHIEVEMENT_DEFINITIONS];
              return (
                <Badge key={a.id} variant="secondary" className="flex items-center gap-1">
                  <span>{def?.icon || "🏆"}</span>
                  <span>{a.title}</span>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievements by category */}
      <div className="space-y-6">
        {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => {
          const unlockedInCategory = categoryAchievements.filter(a => unlockedIds.has(a.id)).length;
          
          return (
            <div key={category}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  {category}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {unlockedInCategory}/{categoryAchievements.length}
                </Badge>
              </div>
              
              <div className="grid gap-2 sm:grid-cols-2">
                {categoryAchievements.map((achievement) => {
                  const isUnlocked = unlockedIds.has(achievement.id);
                  const unlockedData = achievements.find(a => a.achievement_id === achievement.id);

                  return (
                    <div
                      key={achievement.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isUnlocked
                          ? "bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30"
                          : "bg-muted/30 border-border/50 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`text-3xl ${!isUnlocked && "grayscale opacity-50"}`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-semibold text-sm truncate ${isUnlocked ? "gradient-text" : "text-muted-foreground"}`}>
                              {achievement.title}
                            </h4>
                            {!isUnlocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {achievement.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              +{achievement.xp} XP
                            </Badge>
                            {isUnlocked && unlockedData && (
                              <span className="text-xs text-primary">
                                ✓ {new Date(unlockedData.unlocked_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
