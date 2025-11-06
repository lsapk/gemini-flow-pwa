import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Award, Badge as BadgeIcon, Flame, Star, Users, Trophy, Zap, Check } from "lucide-react";
import { BadgeProgressBar } from "@/components/ui/BadgeProgressBar";
import { BadgeCheck } from "lucide-react";

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

export default function Badges() {
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
  const [karmaPoints, setKarmaPoints] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const allBadges: Omit<UserBadge, 'earned' | 'earnedAt'>[] = [
    // ==================== PRODUCTIVITY BADGES ====================
    // Tasks
    { id: "first_task", name: "Premier Pas", description: "Créez votre première tâche", icon: "✅", criteria: "Create 1 task", category: "productivity" },
    { id: "task_starter", name: "Débutant", description: "Créez 5 tâches", icon: "📝", criteria: "Create 5 tasks", category: "productivity" },
    { id: "task_creator", name: "Créateur", description: "Créez 25 tâches", icon: "📋", criteria: "Create 25 tasks", category: "productivity" },
    { id: "task_organizer", name: "Organisateur", description: "Créez 50 tâches", icon: "📊", criteria: "Create 50 tasks", category: "productivity" },
    { id: "task_architect", name: "Architecte", description: "Créez 100 tâches", icon: "🏗️", criteria: "Create 100 tasks", category: "productivity" },
    
    { id: "task_completer", name: "Finisseur", description: "Complétez 10 tâches", icon: "✔️", criteria: "Complete 10 tasks", category: "productivity" },
    { id: "task_achiever", name: "Accomplisseur", description: "Complétez 25 tâches", icon: "🎯", criteria: "Complete 25 tasks", category: "productivity" },
    { id: "task_master", name: "Maître des Tâches", description: "Complétez 50 tâches", icon: "🏅", criteria: "Complete 50 tasks", category: "productivity" },
    { id: "task_legend", name: "Légende", description: "Complétez 100 tâches", icon: "👑", criteria: "Complete 100 tasks", category: "productivity" },
    { id: "task_unstoppable", name: "Inarrêtable", description: "Complétez 250 tâches", icon: "⚡", criteria: "Complete 250 tasks", category: "productivity" },
    
    // Habits
    { id: "habit_starter", name: "Initié", description: "Créez votre première habitude", icon: "🌱", criteria: "Create 1 habit", category: "productivity" },
    { id: "habit_builder", name: "Bâtisseur", description: "Créez 5 habitudes", icon: "🔄", criteria: "Create 5 habits", category: "productivity" },
    { id: "habit_architect", name: "Architecte d'Habitudes", description: "Créez 10 habitudes", icon: "🏛️", criteria: "Create 10 habits", category: "productivity" },
    { id: "habit_master", name: "Maître des Habitudes", description: "Créez 20 habitudes", icon: "🎓", criteria: "Create 20 habits", category: "productivity" },
    
    { id: "habit_keeper", name: "Gardien", description: "Complétez 25 habitudes", icon: "🛡️", criteria: "Complete 25 habits", category: "productivity" },
    { id: "habit_champion", name: "Champion", description: "Complétez 50 habitudes", icon: "🏆", criteria: "Complete 50 habits", category: "productivity" },
    { id: "habit_legend", name: "Légende Vivante", description: "Complétez 100 habitudes", icon: "💫", criteria: "Complete 100 habits", category: "productivity" },
    
    // Goals
    { id: "goal_dreamer", name: "Rêveur", description: "Créez votre premier objectif", icon: "💭", criteria: "Create 1 goal", category: "productivity" },
    { id: "goal_setter", name: "Visionnaire", description: "Créez 5 objectifs", icon: "🎯", criteria: "Create 5 goals", category: "productivity" },
    { id: "goal_planner", name: "Planificateur", description: "Créez 10 objectifs", icon: "📈", criteria: "Create 10 goals", category: "productivity" },
    
    { id: "goal_achiever", name: "Réalisateur", description: "Atteignez votre premier objectif", icon: "🌟", criteria: "Achieve 1 goal", category: "productivity" },
    { id: "goal_winner", name: "Gagnant", description: "Atteignez 3 objectifs", icon: "🏅", criteria: "Achieve 3 goals", category: "productivity" },
    { id: "goal_champion", name: "Champion des Objectifs", description: "Atteignez 5 objectifs", icon: "👑", criteria: "Achieve 5 goals", category: "productivity" },
    { id: "goal_master", name: "Maître des Objectifs", description: "Atteignez 10 objectifs", icon: "💎", criteria: "Achieve 10 goals", category: "productivity" },
    
    // ==================== FOCUS BADGES ====================
    { id: "focus_beginner", name: "Concentré", description: "Complétez votre première session", icon: "🧘", criteria: "Complete 1 focus session", category: "focus" },
    { id: "focus_starter", name: "Méditant", description: "Complétez 5 sessions de focus", icon: "🎯", criteria: "Complete 5 focus sessions", category: "focus" },
    { id: "focus_dedicated", name: "Dévoué", description: "Complétez 10 sessions de focus", icon: "⏰", criteria: "Complete 10 focus sessions", category: "focus" },
    { id: "focus_committed", name: "Engagé", description: "Complétez 25 sessions de focus", icon: "🔥", criteria: "Complete 25 focus sessions", category: "focus" },
    { id: "focus_champion", name: "Champion du Focus", description: "Complétez 50 sessions de focus", icon: "🏆", criteria: "Complete 50 focus sessions", category: "focus" },
    { id: "focus_master", name: "Maître du Focus", description: "Complétez 100 sessions de focus", icon: "🧠", criteria: "Complete 100 focus sessions", category: "focus" },
    
    { id: "focus_time_1h", name: "Une Heure de Focus", description: "Accumulez 1h de focus", icon: "⏱️", criteria: "60 minutes focus", category: "focus" },
    { id: "focus_time_5h", name: "Marathonien", description: "Accumulez 5h de focus", icon: "🏃", criteria: "300 minutes focus", category: "focus" },
    { id: "focus_time_10h", name: "Expert en Concentration", description: "Accumulez 10h de focus", icon: "💪", criteria: "600 minutes focus", category: "focus" },
    { id: "focus_time_25h", name: "Moine du Focus", description: "Accumulez 25h de focus", icon: "🕉️", criteria: "1500 minutes focus", category: "focus" },
    { id: "focus_time_50h", name: "Légende du Focus", description: "Accumulez 50h de focus", icon: "👑", criteria: "3000 minutes focus", category: "focus" },
    
    // ==================== CONSISTENCY BADGES ====================
    { id: "journal_starter", name: "Écrivain Novice", description: "Écrivez votre première entrée", icon: "📖", criteria: "Write 1 journal entry", category: "consistency" },
    { id: "journal_writer", name: "Écrivain", description: "Écrivez 5 entrées de journal", icon: "✍️", criteria: "Write 5 journal entries", category: "consistency" },
    { id: "journal_committed", name: "Journaliste Engagé", description: "Écrivez 10 entrées de journal", icon: "📝", criteria: "Write 10 journal entries", category: "consistency" },
    { id: "journal_keeper", name: "Gardien du Journal", description: "Écrivez 20 entrées de journal", icon: "📒", criteria: "Write 20 journal entries", category: "consistency" },
    { id: "journal_master", name: "Maître du Journal", description: "Écrivez 50 entrées de journal", icon: "📚", criteria: "Write 50 journal entries", category: "consistency" },
    { id: "journal_legend", name: "Chroniqueur Légendaire", description: "Écrivez 100 entrées de journal", icon: "📜", criteria: "Write 100 journal entries", category: "consistency" },
    
    { id: "streak_3", name: "Trois Jours", description: "Connectez-vous 3 jours de suite", icon: "🔥", criteria: "3 day streak", category: "consistency" },
    { id: "early_bird", name: "Lève-Tôt", description: "Connectez-vous 7 jours de suite", icon: "☀️", criteria: "7 day streak", category: "consistency" },
    { id: "streak_14", name: "Deux Semaines", description: "Maintenez une série de 14 jours", icon: "⚡", criteria: "14 day streak", category: "consistency" },
    { id: "streak_master", name: "Maître des Séries", description: "Maintenez une série de 30 jours", icon: "💪", criteria: "30 day streak", category: "consistency" },
    { id: "streak_legend", name: "Légende de la Constance", description: "Maintenez une série de 60 jours", icon: "👑", criteria: "60 day streak", category: "consistency" },
    { id: "streak_unstoppable", name: "Force Irrésistible", description: "Maintenez une série de 100 jours", icon: "💎", criteria: "100 day streak", category: "consistency" },
    
    // ==================== ACHIEVEMENT BADGES ====================
    { id: "explorer", name: "Explorateur", description: "Utilisez toutes les fonctionnalités principales", icon: "🗺️", criteria: "Use all main features", category: "achievement" },
    { id: "organized", name: "Organisé", description: "Ayez 10 tâches actives", icon: "📊", criteria: "10 active tasks", category: "achievement" },
    { id: "balanced", name: "Équilibré", description: "Ayez des tâches, habitudes et objectifs actifs", icon: "⚖️", criteria: "All types active", category: "achievement" },
    { id: "dedicated", name: "Dévoué", description: "Utilisez l'app 30 jours au total", icon: "💖", criteria: "30 days usage", category: "achievement" },
    { id: "veteran", name: "Vétéran", description: "Utilisez l'app 100 jours au total", icon: "🎖️", criteria: "100 days usage", category: "achievement" },
    { id: "productivity_pro", name: "Pro de la Productivité", description: "Complétez 100 tâches et 50 habitudes", icon: "🏆", criteria: "100 tasks + 50 habits", category: "achievement" },
    { id: "zen_master", name: "Maître Zen", description: "50h de focus et 50 entrées journal", icon: "🧘‍♂️", criteria: "50h focus + 50 journal", category: "achievement" },
    { id: "completionist", name: "Perfectionniste", description: "Débloquez 30 badges", icon: "🌟", criteria: "30 badges", category: "achievement" },
  ];

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

      const stats = {
        tasksCreated: allTasks.data?.length || 0,
        tasksCompleted: completedTasks.data?.length || 0,
        habitsCreated: allHabits.data?.length || 0,
        habitsCompleted: habitCompletions.data?.length || 0,
        goalsCreated: allGoals.data?.length || 0,
        goalsAchieved: completedGoals.data?.length || 0,
        journalEntries: journal.data?.length || 0,
        focusSessions: focus.data?.length || 0,
        totalFocusMinutes,
        loginStreak: 0 // TODO: Calculate actual streak
      };

      setUserStats(stats);
      
      const karma = stats.tasksCompleted * 2 + 
                   stats.habitsCompleted * 3 + 
                   stats.goalsAchieved * 10 + 
                   stats.journalEntries * 5 + 
                   stats.focusSessions * 4;
      
      setKarmaPoints(karma);
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
      if (badge.id === "task_organizer") earned = userStats.tasksCreated >= 50;
      if (badge.id === "task_architect") earned = userStats.tasksCreated >= 100;
      
      if (badge.id === "task_completer") earned = userStats.tasksCompleted >= 10;
      if (badge.id === "task_achiever") earned = userStats.tasksCompleted >= 25;
      if (badge.id === "task_master") earned = userStats.tasksCompleted >= 50;
      if (badge.id === "task_legend") earned = userStats.tasksCompleted >= 100;
      if (badge.id === "task_unstoppable") earned = userStats.tasksCompleted >= 250;
      
      // Habits
      if (badge.id === "habit_starter") earned = userStats.habitsCreated >= 1;
      if (badge.id === "habit_builder") earned = userStats.habitsCreated >= 5;
      if (badge.id === "habit_architect") earned = userStats.habitsCreated >= 10;
      if (badge.id === "habit_master") earned = userStats.habitsCreated >= 20;
      
      if (badge.id === "habit_keeper") earned = userStats.habitsCompleted >= 25;
      if (badge.id === "habit_champion") earned = userStats.habitsCompleted >= 50;
      if (badge.id === "habit_legend") earned = userStats.habitsCompleted >= 100;
      
      // Goals
      if (badge.id === "goal_dreamer") earned = userStats.goalsCreated >= 1;
      if (badge.id === "goal_setter") earned = userStats.goalsCreated >= 5;
      if (badge.id === "goal_planner") earned = userStats.goalsCreated >= 10;
      
      if (badge.id === "goal_achiever") earned = userStats.goalsAchieved >= 1;
      if (badge.id === "goal_winner") earned = userStats.goalsAchieved >= 3;
      if (badge.id === "goal_champion") earned = userStats.goalsAchieved >= 5;
      if (badge.id === "goal_master") earned = userStats.goalsAchieved >= 10;
      
      // Focus Sessions
      if (badge.id === "focus_beginner") earned = userStats.focusSessions >= 1;
      if (badge.id === "focus_starter") earned = userStats.focusSessions >= 5;
      if (badge.id === "focus_dedicated") earned = userStats.focusSessions >= 10;
      if (badge.id === "focus_committed") earned = userStats.focusSessions >= 25;
      if (badge.id === "focus_champion") earned = userStats.focusSessions >= 50;
      if (badge.id === "focus_master") earned = userStats.focusSessions >= 100;
      
      // Focus Time
      if (badge.id === "focus_time_1h") earned = userStats.totalFocusMinutes >= 60;
      if (badge.id === "focus_time_5h") earned = userStats.totalFocusMinutes >= 300;
      if (badge.id === "focus_time_10h") earned = userStats.totalFocusMinutes >= 600;
      if (badge.id === "focus_time_25h") earned = userStats.totalFocusMinutes >= 1500;
      if (badge.id === "focus_time_50h") earned = userStats.totalFocusMinutes >= 3000;
      
      // Journal
      if (badge.id === "journal_starter") earned = userStats.journalEntries >= 1;
      if (badge.id === "journal_writer") earned = userStats.journalEntries >= 5;
      if (badge.id === "journal_committed") earned = userStats.journalEntries >= 10;
      if (badge.id === "journal_keeper") earned = userStats.journalEntries >= 20;
      if (badge.id === "journal_master") earned = userStats.journalEntries >= 50;
      if (badge.id === "journal_legend") earned = userStats.journalEntries >= 100;
      
      // Streaks
      if (badge.id === "streak_3") earned = userStats.loginStreak >= 3;
      if (badge.id === "early_bird") earned = userStats.loginStreak >= 7;
      if (badge.id === "streak_14") earned = userStats.loginStreak >= 14;
      if (badge.id === "streak_master") earned = userStats.loginStreak >= 30;
      if (badge.id === "streak_legend") earned = userStats.loginStreak >= 60;
      if (badge.id === "streak_unstoppable") earned = userStats.loginStreak >= 100;
      
      // Achievements
      if (badge.id === "explorer") earned = userStats.tasksCreated > 0 && userStats.habitsCreated > 0 && userStats.goalsCreated > 0 && userStats.journalEntries > 0 && userStats.focusSessions > 0;
      if (badge.id === "organized") earned = (userStats.tasksCreated - userStats.tasksCompleted) >= 10;
      if (badge.id === "balanced") earned = userStats.tasksCreated > 0 && userStats.habitsCreated > 0 && userStats.goalsCreated > 0;
      if (badge.id === "dedicated") earned = false; // TODO: Track total usage days
      if (badge.id === "veteran") earned = false; // TODO: Track total usage days
      if (badge.id === "productivity_pro") earned = userStats.tasksCompleted >= 100 && userStats.habitsCompleted >= 50;
      if (badge.id === "zen_master") earned = userStats.totalFocusMinutes >= 3000 && userStats.journalEntries >= 50;
      if (badge.id === "completionist") earned = badges.filter(b => b.earned).length >= 30;
      
      return {
        ...badge,
        earned,
        earnedAt: earned ? new Date().toISOString() : undefined
      };
    });
    
    setBadges(earnedBadges);
  };

  // Util pour grouper par catégorie
  const badgesByCategory = useMemo(() => {
    return badges.reduce((acc, badge) => {
      if (!acc[badge.category]) acc[badge.category] = [];
      acc[badge.category].push(badge);
      return acc;
    }, {} as Record<UserBadge['category'], UserBadge[]>);
  }, [badges]);

  // Trouver le badge obtenu le plus récent
  const latestEarnedBadge = badges
    .filter(b => b.earned && b.earnedAt)
    .sort((a, b) => (b.earnedAt && a.earnedAt) ? b.earnedAt.localeCompare(a.earnedAt) : 0)[0];

  // Compter les badges obtenus par catégorie
  const categoryCounts = useMemo(() => {
    const counts: Record<UserBadge['category'], {earned: number, total: number}> = {
      productivity: {earned: 0, total: 0},
      focus: {earned: 0, total: 0},
      consistency: {earned: 0, total: 0},
      achievement: {earned: 0, total: 0},
    };
    badges.forEach(b => {
      counts[b.category].total++;
      if (b.earned) counts[b.category].earned++;
    });
    return counts;
  }, [badges]);

  const earnedBadges = badges.filter(b => b.earned);
  const unlockedBadges = badges.filter(b => !b.earned);

  // Gamification : barre de progression globale
  const totalBadges = badges.length;
  const earnedCount = earnedBadges.length;
  const percentEarned = totalBadges > 0 ? Math.round((earnedCount / totalBadges) * 100) : 0;

  return (
    <div className="container mx-auto px-1 sm:px-6 py-2 sm:py-6 space-y-6 max-w-6xl">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight flex justify-center items-center gap-2">
          <BadgeIcon className="h-8 w-8 text-primary animate-bounce drop-shadow-md" />
          Badges & Récompenses
        </h1>
        <p className="text-muted-foreground mt-2 text-base sm:text-lg">
          <span className="hidden sm:inline">💎</span> Vos accomplissements et récompenses <span className="hidden sm:inline">🌱</span>
        </p>
      </div>
      
      {/* Global Progress */}
      <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-white/90 animate-fade-in shadow-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-y-3 gap-x-8">
            <div className="flex-1 w-full">
              <BadgeProgressBar
                label="Progression Globale"
                value={earnedCount}
                total={totalBadges}
                color="primary"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl sm:text-5xl font-black text-primary animate-pulse drop-shadow-lg">{percentEarned}%</span>
              <span className="text-xs sm:text-sm text-muted-foreground">Complété</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Progression */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(categoryMeta).map(([cat, meta]) => (
          <Card
            key={cat}
            className={`border-2 border-${meta.color}-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all`}
          >
            <CardContent className="p-3 flex flex-col items-center">
              <div className="flex items-center gap-1 mb-1">
                {meta.icon}
                <span className="font-semibold">{meta.label}</span>
              </div>
              <BadgeProgressBar
                label="Progression"
                value={categoryCounts[cat as UserBadge['category']].earned}
                total={categoryCounts[cat as UserBadge['category']].total}
                color={meta.color}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dernier badge gagné ! */}
      {latestEarnedBadge && (
        <Card className="relative overflow-hidden border-green-200 shadow animate-scale-in bg-gradient-to-r from-green-50 via-white to-blue-50">
          <div className="absolute -top-5 right-2 opacity-20 pointer-events-none text-green-200 text-[5rem]">
            <Award className="w-24 h-24 sm:w-32 sm:h-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-green-700">
              <Award className="text-green-400" />
              Nouveau badge obtenu&nbsp;!
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-3">
            <div className="text-4xl sm:text-6xl animate-bounce rounded-full bg-green-100 p-2 shadow-lg border-2 border-green-200">
              {latestEarnedBadge.icon}
            </div>
            <div>
              <div className="font-bold text-base sm:text-xl mb-1 text-green-900">{latestEarnedBadge.name}</div>
              <div className="text-sm text-muted-foreground">{latestEarnedBadge.description}</div>
            </div>
            <div className="flex-1" />
            <Badge variant="secondary" className="text-xs">{categoryMeta[latestEarnedBadge.category].label}</Badge>
          </CardContent>
        </Card>
      )}

      {/* Earned Badges par catégorie */}
      {Object.entries(categoryMeta).map(([cat, meta]) => (
        <div key={cat + "-earned"} className="mt-4">
          <div className="flex items-center mb-1 gap-2 px-2 sm:px-0">
            {meta.icon}
            <h2 className={`font-heading font-semibold text-lg sm:text-xl text-${meta.color}-600`}>
              {meta.label}&nbsp;<span className="font-normal text-gray-400">({categoryCounts[cat as UserBadge['category']].earned}/{categoryCounts[cat as UserBadge['category']].total})</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {badgesByCategory[cat as UserBadge['category']]
              ?.filter(b => b.earned)
              .map((badge) => (
                <div
                  key={badge.id}
                  className={`relative group p-4 rounded-xl border-2 border-${meta.color}-200 bg-gradient-to-br from-white via-${meta.color}-50 to-white flex flex-col items-center gap-3 transition-all animate-scale-in hover:scale-105 hover:shadow-xl min-h-[140px]`}
                >
                  <span className={`text-3xl sm:text-4xl drop-shadow-lg`}>{badge.icon}</span>
                  <div className="font-semibold text-sm sm:text-base text-gray-900 text-center">{badge.name}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground text-center">{badge.description}</div>
                  <Badge variant="secondary" className="absolute bottom-2 left-1 right-1 mx-2 text-xs py-0.5">{meta.label}</Badge>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-green-400">
                    <BadgeCheck className="w-5 h-5" />
                  </div>
                </div>
            ))}
            {(!badgesByCategory[cat as UserBadge['category']] ||
              badgesByCategory[cat as UserBadge['category']].filter(b => b.earned).length === 0) && (
              <div className="text-center py-8 col-span-full opacity-60">
                <BadgeIcon className="mx-auto h-8 w-8" />
                <div className="text-sm">Aucun badge {meta.label} débloqué</div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Badges non encore obtenus */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Star className="text-gray-400" />
            Badges à débloquer ({unlockedBadges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {unlockedBadges.map((badge) => (
              <div
                key={badge.id}
                className="p-4 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 via-white to-gray-100 opacity-80 relative flex flex-col items-center min-h-[120px] hover:scale-100 shadow-none"
              >
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-xs">
                    {categoryMeta[badge.category].label}
                  </Badge>
                </div>
                <div className="text-3xl mb-2 grayscale opacity-60">{badge.icon}</div>
                <h3 className="font-semibold mb-1 text-gray-600 text-sm text-center">{badge.name}</h3>
                <p className="text-xs text-gray-500 mb-1 text-center">{badge.description}</p>
                <div className="text-xs text-gray-400 italic text-center">
                  {badge.criteria}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
