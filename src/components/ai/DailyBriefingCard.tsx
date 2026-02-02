import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sun, 
  Moon, 
  Sunrise, 
  RefreshCw, 
  Sparkles, 
  Target, 
  Lightbulb,
  Trophy,
  Zap
} from "lucide-react";
import { useAIDailyBriefing } from "@/hooks/useAIDailyBriefing";
import { motion } from "framer-motion";

const getTimeIcon = () => {
  const hour = new Date().getHours();
  if (hour < 12) return <Sunrise className="h-5 w-5 text-warning" />;
  if (hour < 18) return <Sun className="h-5 w-5 text-warning" />;
  return <Moon className="h-5 w-5 text-primary" />;
};

const getProductivityBadge = (type: string) => {
  const lower = type?.toLowerCase() || '';
  if (lower.includes('lève-tôt') || lower.includes('early') || lower.includes('matin')) {
    return { icon: '🌅', label: 'Lève-tôt', color: 'bg-warning/20 text-warning border-warning/30' };
  }
  if (lower.includes('nuit') || lower.includes('owl') || lower.includes('soir')) {
    return { icon: '🦉', label: 'Oiseau de nuit', color: 'bg-primary/20 text-primary border-primary/30' };
  }
  return { icon: '⚔️', label: "Guerrier de l'après-midi", color: 'bg-success/20 text-success border-success/30' };
};

export function DailyBriefingCard() {
  const { briefing, isLoading, refreshBriefing } = useAIDailyBriefing();

  if (isLoading && !briefing) {
    return (
      <Card className="dashboard-card border-primary/20 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!briefing) {
    return (
      <Card className="dashboard-card border-primary/20 overflow-hidden">
        <CardContent className="py-8 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Générez votre briefing personnalisé</p>
          <Button onClick={refreshBriefing} disabled={isLoading}>
            <Sparkles className="h-4 w-4 mr-2" />
            Générer le briefing
          </Button>
        </CardContent>
      </Card>
    );
  }

  const productivityBadge = getProductivityBadge(briefing.productivity_type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="dashboard-card border-primary/20 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-warning/5 opacity-50" />
        
        <CardHeader className="pb-3 relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-heading">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-warning/20 animate-glow-pulse">
                {getTimeIcon()}
              </div>
              <div>
                <span className="gradient-text">Coach IA</span>
                <span className="text-muted-foreground text-sm font-normal ml-2">Briefing du jour</span>
              </div>
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={refreshBriefing}
              disabled={isLoading}
              className="hover:bg-primary/10"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 relative z-10">
          {/* Greeting & Productivity Type */}
          <div className="space-y-3">
            <p className="text-lg font-medium">{briefing.greeting}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${productivityBadge.color} border`}>
                <span className="mr-1">{productivityBadge.icon}</span>
                {productivityBadge.label}
              </Badge>
              {briefing.mood_insight && (
                <Badge variant="outline" className="bg-muted/50">
                  💭 {briefing.mood_insight}
                </Badge>
              )}
            </div>
          </div>

          {/* Priority Tasks */}
          {briefing.priority_tasks && briefing.priority_tasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Target className="h-4 w-4 text-primary" />
                <span>Priorités du jour</span>
              </div>
              <div className="grid gap-2">
                {briefing.priority_tasks.slice(0, 3).map((task, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm flex-1">{task}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Active Quest */}
          {briefing.active_quest && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-warning/10 to-warning/5 border border-warning/20">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-warning">{briefing.active_quest.title}</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {briefing.active_quest.progress}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{briefing.active_quest.message}</p>
            </div>
          )}

          {/* Daily Tip */}
          {briefing.daily_tip && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-info/5 border border-info/20">
              <Lightbulb className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
              <p className="text-sm">{briefing.daily_tip}</p>
            </div>
          )}

          {/* Motivation Message */}
          {briefing.motivation_message && (
            <div className="pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning animate-pulse" />
                <p className="text-sm font-medium gradient-text">{briefing.motivation_message}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
