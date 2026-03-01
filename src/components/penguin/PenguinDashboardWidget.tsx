import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { usePenguinProfile } from "@/hooks/usePenguinProfile";
import { usePenguinExpeditions } from "@/hooks/usePenguinExpeditions";
import { PenguinAvatar } from "./PenguinAvatar";

export const PenguinDashboardWidget = () => {
  const { profile, nextStageProgress, canEatShrimp } = usePenguinProfile();
  const { activeExpeditions } = usePenguinExpeditions();

  if (!profile) return null;

  const progress = nextStageProgress 
    ? Math.min((nextStageProgress.current / nextStageProgress.target) * 100, 100) 
    : 100;

  return (
    <Card className="border-sky-200/30 dark:border-sky-800/30 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 via-transparent to-indigo-50/50 dark:from-sky-950/20 dark:to-indigo-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-heading">
            <span>🐧</span>
            Mon Pingouin
          </div>
          <Link to="/gamification">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-sky-500">
              Voir tout <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        {/* Penguin + Evolution */}
        <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-sky-100/50 to-indigo-100/50 dark:from-sky-900/20 dark:to-indigo-900/20 border border-sky-200/30 dark:border-sky-800/30">
          <PenguinAvatar stage={profile.stage} size="sm" accessories={profile.equipped_accessories as string[]} />
          <div className="flex-1 ml-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">
                {nextStageProgress?.label || 'Maître'}
              </span>
              <span className="text-xs text-muted-foreground">
                {nextStageProgress ? `${nextStageProgress.current}/${nextStageProgress.target}` : '✨'}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Food Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200/30 dark:border-orange-800/30">
            <span className="text-lg">🦐</span>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{profile.shrimp_total}</div>
            <div className="text-[10px] text-muted-foreground">
              {canEatShrimp ? `${profile.shrimp_today}/${profile.shrimp_daily_limit}` : 'Plein'}
            </div>
          </div>
          <div className="text-center p-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200/30 dark:border-rose-800/30">
            <span className="text-lg">🐟</span>
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400">{profile.salmon_total}</div>
            <div className="text-[10px] text-muted-foreground">Saumon</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-800/30">
            <span className="text-lg">✨🐠</span>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{profile.golden_fish_total}</div>
            <div className="text-[10px] text-muted-foreground">Doré</div>
          </div>
        </div>

        {/* Active Expeditions */}
        {activeExpeditions.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">🧊 Expéditions</h4>
            {activeExpeditions.slice(0, 2).map(exp => {
              const p = Math.min((exp.current_progress / exp.target_value) * 100, 100);
              return (
                <div key={exp.id} className="p-2 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate flex-1 mr-2">{exp.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={p} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground">{exp.current_progress}/{exp.target_value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-3 text-muted-foreground">
            <p className="text-sm">Lancez des expéditions !</p>
            <Link to="/gamification">
              <Button size="sm" variant="outline" className="mt-2 border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-400">
                Explorer
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
