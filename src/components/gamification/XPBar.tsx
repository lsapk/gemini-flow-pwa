import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Zap } from "lucide-react";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";

export const XPBar = () => {
  const { profile, xpProgress, xpNeeded } = usePlayerProfile();

  if (!profile) return null;

  const nextLevel = profile.level + 1;

  return (
    <Card className="glass-morphism p-4 relative overflow-hidden">
      {/* Animated glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 animate-slide-in-right" 
           style={{ animationDuration: "3s", animationIterationCount: "infinite" }} 
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center glow-effect-primary">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-heading text-muted-foreground">
                Niveau {profile.level}
              </div>
              <div className="text-xs text-muted-foreground/70">
                {profile.experience_points} / {xpNeeded} XP
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-heading gradient-text">
              Lvl {nextLevel}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary" />
              {Math.round(xpProgress)}%
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="relative">
          <Progress 
            value={xpProgress} 
            className="h-4 bg-background/50 backdrop-blur"
          />
          
          {/* Animated particles */}
          {xpProgress > 75 && (
            <div className="absolute inset-0 flex items-center justify-end pr-2">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-primary animate-pulse"
                    style={{ 
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: "1s"
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Level up indicator */}
          {xpProgress >= 100 && (
            <div className="absolute -top-8 right-0 animate-bounce">
              <span className="text-xs font-bold text-primary glow-effect-primary px-2 py-1 rounded-full bg-background/80 backdrop-blur">
                🎉 NIVEAU SUIVANT !
              </span>
            </div>
          )}
        </div>

        {/* XP gain animation area */}
        <div className="mt-2 text-center min-h-[20px]">
          <div className="text-xs text-muted-foreground/70">
            Continuez à progresser pour débloquer de nouveaux power-ups !
          </div>
        </div>
      </div>
    </Card>
  );
};