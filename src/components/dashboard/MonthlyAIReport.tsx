import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Brain, FileText, Loader2, RefreshCw, Calendar, TrendingUp, Award, Crown, Lock, Save, Check } from "lucide-react";
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
  const [isSaved, setIsSaved] = useState(false);

  // Load saved report on mount
  useEffect(() => {
    const loadSavedReport = async () => {
      if (!user) return;
      
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
      
      const { data } = await supabase
        .from('ai_productivity_analysis')
        .select('analysis_data')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data?.analysis_data) {
        const savedData = data.analysis_data as { report: string; monthKey: string };
        if (savedData.monthKey === monthKey) {
          setReport(savedData.report);
          setIsSaved(true);
        }
      }
    };
    
    loadSavedReport();
  }, [user]);

  const saveReport = async () => {
    if (!user || !report) return;
    
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    
    const { error } = await supabase
      .from('ai_productivity_analysis')
      .upsert({
        user_id: user.id,
        analysis_data: { report, monthKey, savedAt: new Date().toISOString() }
      }, { onConflict: 'user_id' });
    
    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      setIsSaved(true);
      toast.success("Rapport sauvegardé !");
    }
  };

  const generateReport = async () => {
    if (!user) return;

    if (!isPremium && !canUseFeature("analysis")) {
      toast.error("Limite quotidienne atteinte. Passez à Premium pour plus d'analyses !");
      return;
    }

    setIsGenerating(true);
    setIsSaved(false);

    try {
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
        tasks: { total: tasksResult.data?.length || 0, completed: tasksResult.data?.filter(t => t.completed).length || 0 },
        habits: { total: habitsResult.data?.length || 0, avgStreak: habitsResult.data?.reduce((sum, h) => sum + (h.streak || 0), 0) / (habitsResult.data?.length || 1) },
        focus: { sessions: focusResult.data?.length || 0, totalMinutes: focusResult.data?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0 },
        journal: { entries: journalResult.data?.length || 0 },
        goals: { total: goalsResult.data?.length || 0, completed: goalsResult.data?.filter(g => g.completed).length || 0, avgProgress: goalsResult.data?.reduce((sum, g) => sum + (g.progress || 0), 0) / (goalsResult.data?.length || 1) },
      };

      const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
        body: {
          message: `Génère un rapport mensuel CONCIS (max 300 mots) avec:
1. **Score** - Note /100
2. **Résumé** - 2 phrases max
3. **Top 3** - Points forts (1 ligne chacun)
4. **À améliorer** - 2 axes (1 ligne chacun)
5. **Action** - 1 conseil prioritaire

Données ${startOfPrevMonth.toLocaleDateString('fr-FR', { month: 'long' })}:
Tâches: ${monthlyData.tasks.completed}/${monthlyData.tasks.total} | Focus: ${Math.round(monthlyData.focus.totalMinutes / 60)}h | Objectifs: ${monthlyData.goals.completed}/${monthlyData.goals.total}`,
          context: { analysis_mode: true, user_data: monthlyData }
        }
      });

      if (error) throw error;
      if (!isPremium) trackUsage("analysis");

      setReport(data.response);
      toast.success("Rapport généré !");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Erreur lors de la génération");
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
              {report && !isSaved && (
                <Button onClick={saveReport} variant="outline" size="sm" className="gap-2">
                  <Save className="h-4 w-4" />
                  Sauvegarder
                </Button>
              )}
              {isSaved && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Check className="h-3 w-3" /> Sauvegardé
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
                    ...
                  </>
                ) : report ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Nouveau
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    Générer
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
