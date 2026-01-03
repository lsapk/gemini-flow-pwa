import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Award, Zap, Trophy, Flame, Star, BadgeCheck, Check } from "lucide-react";
import { motion } from "framer-motion";

interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  earned: boolean;
  earnedAt?: string;
  category: 'productivity' | 'focus' | 'consistency' | 'achievement';
}

type CategoryMeta = {
  label: string;
  icon: React.ReactNode;
  color: string;
};

const categoryMeta: Record<UserBadge['category'], CategoryMeta> = {
  productivity: { label: "Productivité", icon: <Zap className="text-blue-400" />, color: 'blue' },
  focus: { label: "Concentration", icon: <Award className="text-purple-400" />, color: 'purple' },
  consistency: { label: "Régularité", icon: <Flame className="text-green-400"/>, color: 'green' },
  achievement: { label: "Succès", icon: <Trophy className="text-yellow-400"/>, color: 'yellow' },
};

const allBadges: Omit<UserBadge, 'earned' | 'earnedAt'>[] = [
  // Tasks
  { id: "first_task", name: "Premier Pas", description: "Créez votre première tâche", icon: "✅", criteria: "Create 1 task", category: "productivity" },
  { id: "task_starter", name: "Débutant", description: "Créez 5 tâches", icon: "📝", criteria: "Create 5 tasks", category: "productivity" },
  { id: "task_creator", name: "Créateur", description: "Créez 25 tâches", icon: "📋", criteria: "Create 25 tasks", category: "productivity" },
  { id: "task_completer", name: "Finisseur", description: "Complétez 10 tâches", icon: "✔️", criteria: "Complete 10 tasks", category: "productivity" },
  { id: "task_master", name: "Maître des Tâches", description: "Complétez 50 tâches", icon: "🏅", criteria: "Complete 50 tasks", category: "productivity" },
  { id: "task_legend", name: "Légende", description: "Complétez 100 tâches", icon: "👑", criteria: "Complete 100 tasks", category: "productivity" },
  
  // Habits
  { id: "habit_starter", name: "Initié", description: "Créez votre première habitude", icon: "🌱", criteria: "Create 1 habit", category: "productivity" },
  { id: "habit_builder", name: "Bâtisseur", description: "Créez 5 habitudes", icon: "🔄", criteria: "Create 5 habits", category: "productivity" },
  { id: "habit_champion", name: "Champion", description: "Complétez 50 habitudes", icon: "🏆", criteria: "Complete 50 habits", category: "productivity" },
  
  // Goals
  { id: "goal_dreamer", name: "Rêveur", description: "Créez votre premier objectif", icon: "💭", criteria: "Create 1 goal", category: "productivity" },
  { id: "goal_achiever", name: "Réalisateur", description: "Atteignez votre premier objectif", icon: "🌟", criteria: "Achieve 1 goal", category: "productivity" },
  { id: "goal_champion", name: "Champion des Objectifs", description: "Atteignez 5 objectifs", icon: "👑", criteria: "Achieve 5 goals", category: "productivity" },
  
  // Focus Sessions
  { id: "focus_beginner", name: "Concentré", description: "Complétez votre première session", icon: "🧘", criteria: "Complete 1 focus session", category: "focus" },
  { id: "focus_starter", name: "Méditant", description: "Complétez 5 sessions de focus", icon: "🎯", criteria: "Complete 5 focus sessions", category: "focus" },
  { id: "focus_champion", name: "Champion du Focus", description: "Complétez 50 sessions de focus", icon: "🏆", criteria: "Complete 50 focus sessions", category: "focus" },
  { id: "focus_master", name: "Maître du Focus", description: "Complétez 100 sessions de focus", icon: "🧠", criteria: "Complete 100 focus sessions", category: "focus" },
  { id: "focus_time_1h", name: "Une Heure de Focus", description: "Accumulez 1h de focus", icon: "⏱️", criteria: "60 minutes focus", category: "focus" },
  { id: "focus_time_10h", name: "Expert en Concentration", description: "Accumulez 10h de focus", icon: "💪", criteria: "600 minutes focus", category: "focus" },
  
  // Journal
  { id: "journal_starter", name: "Écrivain Novice", description: "Écrivez votre première entrée", icon: "📖", criteria: "Write 1 journal entry", category: "consistency" },
  { id: "journal_writer", name: "Écrivain", description: "Écrivez 5 entrées de journal", icon: "✍️", criteria: "Write 5 journal entries", category: "consistency" },
  { id: "journal_master", name: "Maître du Journal", description: "Écrivez 50 entrées de journal", icon: "📚", criteria: "Write 50 journal entries", category: "consistency" },
  
  // Streaks
  { id: "streak_3", name: "Trois Jours", description: "Connectez-vous 3 jours de suite", icon: "🔥", criteria: "3 day streak", category: "consistency" },
  { id: "early_bird", name: "Lève-Tôt", description: "Connectez-vous 7 jours de suite", icon: "☀️", criteria: "7 day streak", category: "consistency" },
  { id: "streak_master", name: "Maître des Séries", description: "Maintenez une série de 30 jours", icon: "💪", criteria: "30 day streak", category: "consistency" },
  
  // Achievements
  { id: "explorer", name: "Explorateur", description: "Utilisez toutes les fonctionnalités principales", icon: "🗺️", criteria: "Use all main features", category: "achievement" },
  { id: "balanced", name: "Équilibré", description: "Ayez des tâches, habitudes et objectifs actifs", icon: "⚖️", criteria: "All types active", category: "achievement" },
  { id: "productivity_pro", name: "Pro de la Productivité", description: "Complétez 100 tâches et 50 habitudes", icon: "🏆", criteria: "100 tasks + 50 habits", category: "achievement" },
];

export const BadgesList = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [userStats, setUserStats] = useState({
    tasksCompleted: 0,
    tasksCreated: 0,
    habitsCreated: 0,
    habitsCompleted: 0,
    goalsCreated: 0,
    goalsAchieved: 0,
    journalEntries: 0,
    focusSessions: 0,
    totalFocusMinutes: 0,
    loginStreak: 0
  });

  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  useEffect(() => {
    calculateBadges();
  }, [userStats]);

  const loadUserStats = async () => {
    if (!user) return;

    try {
      const [
        allTasks,
        completedTasks,
        allHabits,
        habitCompletions,
        allGoals,
        completedGoals,
        journal,
        focus
      ] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id).eq('completed', true),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('habit_completions').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id).eq('completed', true),
        supabase.from('journal_entries').select('*').eq('user_id', user.id),
        supabase.from('focus_sessions').select('duration').eq('user_id', user.id)
      ]);

      const totalFocusMinutes = focus.data?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0;

      setUserStats({
        tasksCreated: allTasks.data?.length || 0,
        tasksCompleted: completedTasks.data?.length || 0,
        habitsCreated: allHabits.data?.length || 0,
        habitsCompleted: habitCompletions.data?.length || 0,
        goalsCreated: allGoals.data?.length || 0,
        goalsAchieved: completedGoals.data?.length || 0,
        journalEntries: journal.data?.length || 0,
        focusSessions: focus.data?.length || 0,
        totalFocusMinutes,
        loginStreak: 0
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const calculateBadges = () => {
    const earnedBadges: UserBadge[] = allBadges.map(badge => {
      let earned = false;
      
      // Tasks
      if (badge.id === "first_task") earned = userStats.tasksCreated >= 1;
      if (badge.id === "task_starter") earned = userStats.tasksCreated >= 5;
      if (badge.id === "task_creator") earned = userStats.tasksCreated >= 25;
      if (badge.id === "task_completer") earned = userStats.tasksCompleted >= 10;
      if (badge.id === "task_master") earned = userStats.tasksCompleted >= 50;
      if (badge.id === "task_legend") earned = userStats.tasksCompleted >= 100;
      
      // Habits
      if (badge.id === "habit_starter") earned = userStats.habitsCreated >= 1;
      if (badge.id === "habit_builder") earned = userStats.habitsCreated >= 5;
      if (badge.id === "habit_champion") earned = userStats.habitsCompleted >= 50;
      
      // Goals
      if (badge.id === "goal_dreamer") earned = userStats.goalsCreated >= 1;
      if (badge.id === "goal_achiever") earned = userStats.goalsAchieved >= 1;
      if (badge.id === "goal_champion") earned = userStats.goalsAchieved >= 5;
      
      // Focus Sessions
      if (badge.id === "focus_beginner") earned = userStats.focusSessions >= 1;
      if (badge.id === "focus_starter") earned = userStats.focusSessions >= 5;
      if (badge.id === "focus_champion") earned = userStats.focusSessions >= 50;
      if (badge.id === "focus_master") earned = userStats.focusSessions >= 100;
      if (badge.id === "focus_time_1h") earned = userStats.totalFocusMinutes >= 60;
      if (badge.id === "focus_time_10h") earned = userStats.totalFocusMinutes >= 600;
      
      // Journal
      if (badge.id === "journal_starter") earned = userStats.journalEntries >= 1;
      if (badge.id === "journal_writer") earned = userStats.journalEntries >= 5;
      if (badge.id === "journal_master") earned = userStats.journalEntries >= 50;
      
      // Streaks
      if (badge.id === "streak_3") earned = userStats.loginStreak >= 3;
      if (badge.id === "early_bird") earned = userStats.loginStreak >= 7;
      if (badge.id === "streak_master") earned = userStats.loginStreak >= 30;
      
      // Achievements
      if (badge.id === "explorer") earned = userStats.tasksCreated > 0 && userStats.habitsCreated > 0 && userStats.goalsCreated > 0 && userStats.journalEntries > 0 && userStats.focusSessions > 0;
      if (badge.id === "balanced") earned = userStats.tasksCreated > 0 && userStats.habitsCreated > 0 && userStats.goalsCreated > 0;
      if (badge.id === "productivity_pro") earned = userStats.tasksCompleted >= 100 && userStats.habitsCompleted >= 50;
      
      return {
        ...badge,
        earned,
        earnedAt: earned ? new Date().toISOString() : undefined
      };
    });
    
    setBadges(earnedBadges);
  };

  const earnedCount = badges.filter(b => b.earned).length;
  const progressPercent = badges.length > 0 ? (earnedCount / badges.length) * 100 : 0;
  
  const groupedBadges = badges.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<UserBadge['category'], UserBadge[]>);

  return (
    <Card className="glass-morphism p-6">
      <div className="flex items-center gap-3 mb-6">
        <motion.div 
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center glow-effect"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <BadgeCheck className="w-6 h-6 text-white" />
        </motion.div>
        <div className="flex-1">
          <h2 className="text-2xl font-heading gradient-text">Badges</h2>
          <p className="text-sm text-muted-foreground">
            {earnedCount} / {badges.length} débloqués
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-heading text-amber-500">{Math.round(progressPercent)}%</div>
          <div className="text-xs text-muted-foreground">Complété</div>
        </div>
      </div>

      <Progress value={progressPercent} className="h-3 mb-6" />

      {/* Badges by category */}
      <div className="space-y-6">
        {Object.entries(groupedBadges).map(([category, categoryBadges]) => {
          const meta = categoryMeta[category as UserBadge['category']];
          const earnedInCategory = categoryBadges.filter(b => b.earned).length;
          
          return (
            <div key={category}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  {meta.icon}
                  {meta.label}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {earnedInCategory}/{categoryBadges.length}
                </Badge>
              </div>
              
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {categoryBadges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-xl border transition-all ${
                      badge.earned
                        ? `bg-gradient-to-r from-${meta.color}-500/10 to-${meta.color}-500/5 border-${meta.color}-500/30`
                        : "bg-muted/30 border-border/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl ${!badge.earned && "grayscale opacity-50"}`}>
                        {badge.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-semibold text-xs truncate ${badge.earned ? "text-foreground" : "text-muted-foreground"}`}>
                            {badge.name}
                          </h4>
                          {badge.earned && <Check className="w-3 h-3 text-green-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
