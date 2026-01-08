import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Brain, FileText, Loader2, RefreshCw, Calendar, TrendingUp, Award, Crown, Lock } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export const MonthlyAIReport = () => {
  const { user } = useAuth();
  const { isPremium, canUseFeature, getRemainingUses, trackUsage } = useSubscription();
  const { taskCompletionRate, totalFocusTime, streakCount, habitsData, tasksData } = useAnalyticsData();
  const [report, setReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    if (!user) return;

    // Check if user can use analysis feature
    if (!isPremium && !canUseFeature("analysis")) {
      toast.error("Limite quotidienne atteinte. Passez à Premium pour plus d'analyses !");
      return;
    }

    setIsGenerating(true);

    try {
      // Get PREVIOUS month data (complete month)
      const now = new Date();
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      const [tasksResult, habitsResult, focusResult, journalResult, goalsResult] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id).gte('created_at', startOfPrevMonth.toISOString()).lte('created_at', endOfPrevMonth.toISOString()),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id).gte('created_at', startOfPrevMonth.toISOString()).lte('created_at', endOfPrevMonth.toISOString()),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).gte('created_at', startOfPrevMonth.toISOString()).lte('created_at', endOfPrevMonth.toISOString()),
        supabase.from('goals').select('*').eq('user_id', user.id),
      ]);

      const monthlyData = {
        tasks: {
          total: tasksResult.data?.length || 0,
          completed: tasksResult.data?.filter(t => t.completed).length || 0,
        },
        habits: {
          total: habitsResult.data?.length || 0,
          avgStreak: habitsResult.data?.reduce((sum, h) => sum + (h.streak || 0), 0) / (habitsResult.data?.length || 1),
        },
        focus: {
          sessions: focusResult.data?.length || 0,
          totalMinutes: focusResult.data?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0,
        },
        journal: {
          entries: journalResult.data?.length || 0,
        },
        goals: {
          total: goalsResult.data?.length || 0,
          completed: goalsResult.data?.filter(g => g.completed).length || 0,
          avgProgress: goalsResult.data?.reduce((sum, g) => sum + (g.progress || 0), 0) / (goalsResult.data?.length || 1),
        },
      };

      const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
        body: {
          message: `[MODE ANALYSE APPROFONDIE] Génère un rapport mensuel complet de ma productivité avec:

1. **Résumé du mois** - Vue d'ensemble des performances
2. **Statistiques clés** - Chiffres importants avec tendances
3. **Points forts** - Ce qui a bien fonctionné
4. **Axes d'amélioration** - Ce qu'il faut améliorer
5. **Recommandations** - 3 actions concrètes pour le mois prochain
6. **Score global** - Note sur 100 avec explication

Données du mois précédent (${startOfPrevMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}):
- Tâches: ${monthlyData.tasks.completed}/${monthlyData.tasks.total} complétées
- Focus: ${monthlyData.focus.sessions} sessions, ${Math.round(monthlyData.focus.totalMinutes / 60)}h au total
- Journal: ${monthlyData.journal.entries} entrées
- Objectifs: ${monthlyData.goals.completed}/${monthlyData.goals.total} atteints
- Progression moyenne objectifs: ${Math.round(monthlyData.goals.avgProgress)}%
- Streak moyen habitudes: ${Math.round(monthlyData.habits.avgStreak)} jours`,
          context: {
            analysis_mode: true,
            user_data: monthlyData,
          }
        }
      });

      if (error) throw error;

      // Track usage for basic users
      if (!isPremium) {
        trackUsage("analysis");
      }

      setReport(data.response);
      toast.success("Rapport mensuel généré !");
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast.error("Erreur lors de la génération du rapport");
    } finally {
      setIsGenerating(false);
    }
  };

  const previousMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="dashboard-card overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="font-heading">Rapport Mensuel IA</span>
                <Badge variant="outline" className="ml-2 text-xs capitalize">
                  {previousMonth}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isPremium && (
                <Badge variant="outline" className="text-xs">
                  {getRemainingUses("analysis")}/1 restant
                </Badge>
              )}
              <Button
                onClick={generateReport}
                disabled={isGenerating || (!isPremium && !canUseFeature("analysis"))}
                size="sm"
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : report ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Actualiser
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    Générer le rapport
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isPremium && !canUseFeature("analysis") && !report ? (
            <div className="text-center py-8 space-y-4">
              <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h4 className="font-semibold">Limite quotidienne atteinte</h4>
                <p className="text-sm text-muted-foreground">
                  Passez à Premium pour des rapports illimités
                </p>
              </div>
              <Button asChild size="sm">
                <Link to="/settings">
                  <Crown className="h-4 w-4 mr-2" />
                  Passer à Premium
                </Link>
              </Button>
            </div>
          ) : report ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown content={report} />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Cliquez sur "Générer le rapport" pour obtenir une analyse IA complète de votre mois</p>
              <div className="flex justify-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Vue d'ensemble
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Tendances
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  Recommandations
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
