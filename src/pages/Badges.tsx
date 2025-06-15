import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Award, Badge as BadgeIcon, Flame, Star, Users, Trophy, Zap } from "lucide-react";
import { BadgeProgressBar } from "@/components/ui/BadgeProgressBar";

interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  earned: boolean;
  earnedAt?: string;
  category: 'productivity' | 'social' | 'consistency' | 'achievement';
}

type CategoryMeta = {
  label: string;
  icon: React.ReactNode;
  color: string;
};

const categoryMeta: Record<UserBadge['category'], CategoryMeta> = {
  productivity: { label: "Productivité", icon: <Zap className="text-blue-400" />, color: 'blue' },
  social: { label: "Social", icon: <Users className="text-purple-400" />, color: 'purple' },
  consistency: { label: "Régularité", icon: <Flame className="text-green-400"/>, color: 'green' },
  achievement: { label: "Succès", icon: <Trophy className="text-yellow-400"/>, color: 'yellow' },
};

export default function Badges() {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [userStats, setUserStats] = useState({
    tasksCompleted: 0,
    habitsCreated: 0,
    goalsAchieved: 0,
    journalEntries: 0,
    focusSessions: 0,
    goodActionsCreated: 0,
    likesReceived: 0,
    commentsGiven: 0,
    loginStreak: 0
  });
  const [karmaPoints, setKarmaPoints] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const allBadges: Omit<UserBadge, 'earned' | 'earnedAt'>[] = [
    // Productivity Badges
    {
      id: "first_task",
      name: "Premier Pas",
      description: "Créez votre première tâche",
      icon: "✅",
      criteria: "Create 1 task",
      category: "productivity"
    },
    {
      id: "task_master",
      name: "Maître des Tâches",
      description: "Complétez 50 tâches",
      icon: "📝",
      criteria: "Complete 50 tasks",
      category: "productivity"
    },
    {
      id: "habit_builder",
      name: "Bâtisseur d'Habitudes",
      description: "Créez 10 habitudes",
      icon: "🔄",
      criteria: "Create 10 habits",
      category: "productivity"
    },
    {
      id: "goal_setter",
      name: "Visionnaire",
      description: "Créez 5 objectifs",
      icon: "🎯",
      criteria: "Create 5 goals",
      category: "productivity"
    },
    {
      id: "focus_champion",
      name: "Champion du Focus",
      description: "Complétez 25 sessions de focus",
      icon: "⏰",
      criteria: "Complete 25 focus sessions",
      category: "productivity"
    },
    
    // Consistency Badges
    {
      id: "journal_keeper",
      name: "Gardien du Journal",
      description: "Écrivez 20 entrées de journal",
      icon: "📒",
      criteria: "Write 20 journal entries",
      category: "consistency"
    },
    {
      id: "early_bird",
      name: "Lève-Tôt",
      description: "Connectez-vous 7 jours de suite",
      icon: "☀️",
      criteria: "Login 7 days straight",
      category: "consistency"
    },
    {
      id: "streak_master",
      name: "Maître des Séries",
      description: "Maintenez une série de 30 jours",
      icon: "🔥",
      criteria: "Maintain a 30-day streak",
      category: "consistency"
    },
    
    // Social Badges
    {
      id: "social_butterfly",
      name: "Papillon Social",
      description: "Créez 10 bonnes actions publiques",
      icon: "📢",
      criteria: "Create 10 public good actions",
      category: "social"
    },
    {
      id: "kind_heart",
      name: "Cœur Bienveillant",
      description: "Recevez 25 likes sur vos bonnes actions",
      icon: "❤️",
      criteria: "Receive 25 likes on good actions",
      category: "social"
    },
    {
      id: "helpful_soul",
      name: "Âme Serviable",
      description: "Donnez 50 commentaires encourageants",
      icon: "💬",
      criteria: "Give 50 comments",
      category: "social"
    },
    
    // Achievement Badges
    {
      id: "productivity_pro",
      name: "Pro de la Productivité",
      description: "Atteignez un score de productivité de 90%",
      icon: "🏆",
      criteria: "Reach 90% productivity score",
      category: "achievement"
    },
    {
      id: "explorer",
      name: "Explorateur",
      description: "Utilisez toutes les fonctionnalités de l'app",
      icon: "🗺️",
      criteria: "Use all app features",
      category: "achievement"
    },
    {
      id: "zen_master",
      name: "Maître Zen",
      description: "Maintenez un équilibre parfait pendant une semaine",
      icon: "🧘",
      criteria: "Perfect balance for a week",
      category: "achievement"
    }
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
      // Get user statistics from various tables
      const [tasks, habits, goals, journal, focus, goodActions, likes, comments] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id).eq('completed', true),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id).eq('completed', true),
        supabase.from('journal_entries').select('*').eq('user_id', user.id),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id),
        supabase.from('good_actions').select('*').eq('user_id', user.id),
        supabase.from('good_action_likes').select('good_action_id').eq('user_id', user.id),
        supabase.from('good_action_comments').select('*').eq('user_id', user.id)
      ]);

      const stats = {
        tasksCompleted: tasks.data?.length || 0,
        habitsCreated: habits.data?.length || 0,
        goalsAchieved: goals.data?.length || 0,
        journalEntries: journal.data?.length || 0,
        focusSessions: focus.data?.length || 0,
        goodActionsCreated: goodActions.data?.length || 0,
        likesReceived: likes.data?.length || 0,
        commentsGiven: comments.data?.length || 0,
        loginStreak: 7 // Placeholder for login streak calculation
      };

      setUserStats(stats);
      
      // Calculate karma points
      const karma = stats.tasksCompleted * 2 + 
                   stats.habitsCreated * 5 + 
                   stats.goalsAchieved * 10 + 
                   stats.journalEntries * 3 + 
                   stats.focusSessions * 4 + 
                   stats.goodActionsCreated * 8 + 
                   stats.likesReceived * 2 + 
                   stats.commentsGiven * 1;
      
      setKarmaPoints(karma);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const calculateBadges = () => {
    const earnedBadges: UserBadge[] = allBadges.map(badge => {
      let earned = false;
      
      switch (badge.id) {
        case "first_task":
          earned = userStats.tasksCompleted >= 1;
          break;
        case "task_master":
          earned = userStats.tasksCompleted >= 50;
          break;
        case "habit_builder":
          earned = userStats.habitsCreated >= 10;
          break;
        case "goal_setter":
          earned = userStats.goalsAchieved >= 5;
          break;
        case "focus_champion":
          earned = userStats.focusSessions >= 25;
          break;
        case "journal_keeper":
          earned = userStats.journalEntries >= 20;
          break;
        case "early_bird":
          earned = userStats.loginStreak >= 7;
          break;
        case "streak_master":
          earned = userStats.loginStreak >= 30;
          break;
        case "social_butterfly":
          earned = userStats.goodActionsCreated >= 10;
          break;
        case "kind_heart":
          earned = userStats.likesReceived >= 25;
          break;
        case "helpful_soul":
          earned = userStats.commentsGiven >= 50;
          break;
        case "productivity_pro":
          earned = false; // Would need productivity score calculation
          break;
        case "explorer":
          earned = userStats.tasksCompleted > 0 && userStats.habitsCreated > 0 && userStats.goalsAchieved > 0;
          break;
        case "zen_master":
          earned = false; // Would need balance calculation
          break;
        default:
          earned = false;
      }
      
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
      social: {earned: 0, total: 0},
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
    <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-6xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight flex justify-center items-center gap-2">
          <BadgeIcon className="h-7 w-7 text-primary animate-bounce" />
          Badges & Récompenses
        </h1>
        <p className="text-muted-foreground mt-2">
          Vos accomplissements et récompenses
        </p>
      </div>

      {/* Global Progress */}
      <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-white/90 animate-fade-in">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-y-3 gap-x-8">
            <div className="flex-1">
              <BadgeProgressBar
                label="Progression Globale"
                value={earnedCount}
                total={totalBadges}
                color="primary"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold text-primary animate-pulse">{percentEarned}%</span>
              <span className="text-sm text-muted-foreground">Complété</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Progression */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(categoryMeta).map(([cat, meta]) => (
          <Card key={cat} className={`border-2 border-${meta.color}-200`}>
            <CardContent className="p-3 flex flex-col items-center">
              <div className="flex items-center gap-1">
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
        <Card className="bg-gradient-to-r from-green-50 via-white to-blue-50 border-green-200 shadow animate-scale-in">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Award className="text-green-400" />
              Nouveau badge obtenu&nbsp;!
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-3">
            <div className="text-4xl animate-bounce">{latestEarnedBadge.icon}</div>
            <div>
              <div className="font-semibold mb-1">{latestEarnedBadge.name}</div>
              <div className="text-sm text-muted-foreground">{latestEarnedBadge.description}</div>
            </div>
            <div className="flex-1" />
            <Badge variant="secondary" className="text-xs">{categoryMeta[latestEarnedBadge.category].label}</Badge>
          </CardContent>
        </Card>
      )}

      {/* Earned Badges par catégorie */}
      {Object.entries(categoryMeta).map(([cat, meta]) => (
        <Card key={cat + "-earned"} className="mt-4 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {meta.icon}
              {meta.label} ({categoryCounts[cat as UserBadge['category']].earned}/{categoryCounts[cat as UserBadge['category']].total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badgesByCategory[cat as UserBadge['category']]
                ?.filter(b => b.earned)
                .map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-lg border-2 border-${meta.color}-200 bg-white flex flex-col items-center gap-2 transition-transform animate-scale-in hover:scale-105`}
                  >
                    <span className="text-3xl">{badge.icon}</span>
                    <div className="font-semibold">{badge.name}</div>
                    <div className="text-sm text-muted-foreground">{badge.description}</div>
                    <Badge variant="secondary" className="text-xs">{meta.label}</Badge>
                  </div>
              ))}
              {/* Cas pas de badge débloqué */}
              {(!badgesByCategory[cat as UserBadge['category']] ||
                badgesByCategory[cat as UserBadge['category']].filter(b => b.earned).length === 0) && (
                <div className="text-center py-8 col-span-full opacity-60">
                  <BadgeIcon className="mx-auto h-8 w-8" />
                  <div className="text-sm">Aucun badge {meta.label} débloqué</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Badges non encore obtenus */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="text-gray-400" />
            Badges à débloquer ({unlockedBadges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedBadges.map((badge) => (
              <div
                key={badge.id}
                className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 opacity-75 relative flex flex-col items-center"
              >
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-xs">
                    {categoryMeta[badge.category].label}
                  </Badge>
                </div>
                <div className="text-3xl mb-2 grayscale">{badge.icon}</div>
                <h3 className="font-semibold mb-1 text-gray-600">{badge.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{badge.description}</p>
                <div className="text-xs text-gray-400 italic">
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
