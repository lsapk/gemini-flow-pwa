
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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

  const categoryColors = {
    productivity: 'bg-blue-50 border-blue-200 text-blue-900',
    consistency: 'bg-green-50 border-green-200 text-green-900',
    social: 'bg-purple-50 border-purple-200 text-purple-900',
    achievement: 'bg-yellow-50 border-yellow-200 text-yellow-900'
  };

  const earnedBadges = badges.filter(b => b.earned);
  const unlockedBadges = badges.filter(b => !b.earned);

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6 max-w-6xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Badges & Récompenses</h1>
        <p className="text-muted-foreground mt-2">
          Vos accomplissements et récompenses
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <p className="text-xl font-bold text-yellow-900">{earnedBadges.length}</p>
            <p className="text-sm text-yellow-700">Badges obtenus</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">⭐</div>
            <p className="text-xl font-bold text-purple-900">{karmaPoints}</p>
            <p className="text-sm text-purple-700">Points Karma</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-xl font-bold text-blue-900">
              {Math.round((earnedBadges.length / allBadges.length) * 100)}%
            </p>
            <p className="text-sm text-blue-700">Progression</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">🔥</div>
            <p className="text-xl font-bold text-green-900">{userStats.loginStreak}</p>
            <p className="text-sm text-green-700">Jours de suite</p>
          </CardContent>
        </Card>
      </div>

      {/* Earned Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 Badges obtenus ({earnedBadges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earnedBadges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {earnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-lg border-2 ${categoryColors[badge.category]} relative overflow-hidden`}
                >
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      {badge.category}
                    </Badge>
                  </div>
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <h3 className="font-semibold mb-1">{badge.name}</h3>
                  <p className="text-sm opacity-80 mb-2">{badge.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-200 text-green-800">
                      ✓ Obtenu
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-medium mb-2">Aucun badge encore</h3>
              <p className="text-muted-foreground">
                Continuez à utiliser DeepFlow pour débloquer vos premiers badges !
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎖️ Badges à débloquer ({unlockedBadges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedBadges.map((badge) => (
              <div
                key={badge.id}
                className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 opacity-75 relative"
              >
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-xs">
                    {badge.category}
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
