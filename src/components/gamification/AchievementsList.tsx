import { useAchievements, ACHIEVEMENT_DEFINITIONS } from "@/hooks/useAchievements";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export const AchievementsList = () => {
  const { achievements, isLoading } = useAchievements();

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

  return (
    <Card className="glass-morphism p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-cyan-500 flex items-center justify-center glow-effect-primary">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-heading gradient-text">Achievements</h2>
          <p className="text-sm text-muted-foreground">
            {achievements.length} / {allAchievements.length} débloqués
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {allAchievements.map((achievement) => {
          const isUnlocked = unlockedIds.has(achievement.id);
          const unlockedData = achievements.find(a => a.achievement_id === achievement.id);

          return (
            <div
              key={achievement.id}
              className={`p-4 rounded-xl border transition-all ${
                isUnlocked
                  ? "bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30 glow-effect-primary"
                  : "bg-muted/30 border-border/50 opacity-60"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`text-4xl ${!isUnlocked && "grayscale opacity-50"}`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${isUnlocked ? "gradient-text" : "text-muted-foreground"}`}>
                    {achievement.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {achievement.description}
                  </p>
                  {isUnlocked && unlockedData && (
                    <p className="text-xs text-primary mt-1">
                      Débloqué le {new Date(unlockedData.unlocked_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {isUnlocked && (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
