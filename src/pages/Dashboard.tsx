import { useUnifiedProductivityScore } from "@/hooks/useUnifiedProductivityScore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, Target, Clock, Brain, Zap, BookOpen, ListTodo, Flame, ChevronDown
} from "lucide-react";
import { SmartInsightsWidget } from "@/components/SmartInsightsWidget";
import { Link } from "react-router-dom";
import { AdminAnnouncementPanel } from "@/components/dashboard/AdminAnnouncementPanel";
import { MonthlyAIReport } from "@/components/dashboard/MonthlyAIReport";
import { DailyBriefingCard } from "@/components/ai/DailyBriefingCard";
import { CrossInsightsWidget } from "@/components/ai/CrossInsightsWidget";
import { TodayActionsCard } from "@/components/dashboard/TodayActionsCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Dashboard() {
  const [insightsOpen, setInsightsOpen] = useState(false);

  const { 
    scores, level, taskCompletionRate, totalFocusTime, streakCount, activeHabits, isLoading 
  } = useUnifiedProductivityScore();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6 p-4">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const quickLinks = [
    { icon: ListTodo, label: "Tâches", path: "/tasks", color: "bg-success/10 text-success" },
    { icon: Target, label: "Objectifs", path: "/goals", color: "bg-primary/10 text-primary" },
    { icon: Flame, label: "Habitudes", path: "/habits", color: "bg-warning/10 text-warning" },
    { icon: Brain, label: "Focus", path: "/focus", color: "bg-info/10 text-info" },
    { icon: BookOpen, label: "Journal", path: "/journal", color: "bg-purple-500/10 text-purple-500" },
    { icon: Zap, label: "Analyse IA", path: "/ai-assistant", color: "bg-amber-500/10 text-amber-500" },
  ];

  return (
    <div className="space-y-6 md:space-y-10">
      <AdminAnnouncementPanel />

      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold gradient-text mb-1 animate-fade-in">
            Tableau de Bord
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Vue d'ensemble de votre productivité</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-heading font-semibold">Accès rapide</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {quickLinks.map((link) => (
            <Link key={link.path} to={link.path} className="group">
              <Card className="dashboard-card border-border/30 hover:border-primary/30 cursor-pointer">
                <CardContent className="p-3 sm:p-4 flex flex-col items-center gap-2">
                  <div className={`p-2 sm:p-3 rounded-xl ${link.color} transition-transform duration-300 group-hover:scale-110`}>
                    <link.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-center group-hover:text-primary transition-colors">{link.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Card className="dashboard-card border-primary/20 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-info/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <CardHeader className="pb-3 relative z-10">
          <CardTitle className="flex items-center gap-2 text-xl font-heading">
            <div className="p-2 rounded-lg bg-primary/10 animate-glow-pulse">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            Score de Productivité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-5xl font-heading font-extrabold gradient-text">{scores.overall}</div>
              <p className={`text-sm font-medium mt-1 ${level.color}`}>{level.label}</p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2 rounded-xl bg-gradient-to-br from-warning/20 to-warning/10 border-warning/30 animate-float">
              {streakCount} jours 🔥
            </Badge>
          </div>
          
          <Progress value={scores.overall} className="h-3 rounded-full" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="space-y-1 p-3 rounded-xl bg-success/5 hover:bg-success/10 transition-colors border border-success/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Tâches</span>
              </div>
              <div className="text-xl font-bold text-success">{Math.round(taskCompletionRate)}%</div>
            </div>
            <div className="space-y-1 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors border border-primary/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>Focus</span>
              </div>
              <div className="text-xl font-bold text-primary">{Math.round(totalFocusTime / 60)}h</div>
            </div>
            <div className="space-y-1 p-3 rounded-xl bg-warning/5 hover:bg-warning/10 transition-colors border border-warning/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-4 w-4 text-warning" />
                <span>Série</span>
              </div>
              <div className="text-xl font-bold text-warning">{streakCount}j</div>
            </div>
            <div className="space-y-1 p-3 rounded-xl bg-info/5 hover:bg-info/10 transition-colors border border-info/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Target className="h-4 w-4 text-info" />
                <span>Habitudes</span>
              </div>
              <div className="text-xl font-bold text-info">{activeHabits}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TodayActionsCard />
      <DailyBriefingCard />

      <Collapsible open={insightsOpen} onOpenChange={setInsightsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Insights IA & Rapports
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${insightsOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <CrossInsightsWidget />
          <SmartInsightsWidget />
          <MonthlyAIReport />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
