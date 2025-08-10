
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeProductivityScore } from "@/hooks/useRealtimeProductivityScore";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { Link } from "react-router-dom";
import { 
  CheckSquare, 
  Repeat, 
  Timer, 
  BookOpen, 
  Target, 
  TrendingUp,
  Calendar,
  Award,
  Zap,
  BarChart3,
  Plus,
  Clock,
  Users,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, subDays } from "date-fns";
import { fr } from "date-fns/locale";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: productivityData, isLoading } = useRealtimeProductivityScore();
  const { 
    taskCompletionRate, 
    totalFocusTime, 
    streakCount, 
    habitsData, 
    tasksData, 
    focusData, 
    activityData,
    refetch 
  } = useAnalyticsData();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [weeklyStats, setWeeklyStats] = useState({
    tasksCompleted: 0,
    habitsCompleted: 0,
    focusMinutes: 0,
    journalEntries: 0
  });

  // Default values if data is not available
  const {
    score = 0,
    level = 'Débutant',
    badges = [],
    completionRate = 0,
    focusTimeScore = 0,
    consistencyScore = 0,
    journalScore = 0
  } = productivityData || {};

  // Get weekly statistics
  useEffect(() => {
    async function fetchWeeklyStats() {
      if (!user) return;
      
      const startWeek = startOfWeek(new Date(), { locale: fr });
      const endWeek = endOfWeek(new Date(), { locale: fr });
      
      try {
        const [tasksRes, habitsRes, focusRes, journalRes] = await Promise.allSettled([
          supabase
            .from('tasks')
            .select('id')
            .eq('user_id', user.id)
            .eq('completed', true)
            .gte('updated_at', startWeek.toISOString())
            .lte('updated_at', endWeek.toISOString()),
          supabase
            .from('habit_completions')
            .select('id')
            .eq('user_id', user.id)
            .gte('created_at', startWeek.toISOString())
            .lte('created_at', endWeek.toISOString()),
          supabase
            .from('focus_sessions')
            .select('duration')
            .eq('user_id', user.id)
            .gte('created_at', startWeek.toISOString())
            .lte('created_at', endWeek.toISOString()),
          supabase
            .from('journal_entries')
            .select('id')
            .eq('user_id', user.id)
            .gte('created_at', startWeek.toISOString())
            .lte('created_at', endWeek.toISOString())
        ]);

        setWeeklyStats({
          tasksCompleted: tasksRes.status === 'fulfilled' ? (tasksRes.value.data?.length || 0) : 0,
          habitsCompleted: habitsRes.status === 'fulfilled' ? (habitsRes.value.data?.length || 0) : 0,
          focusMinutes: focusRes.status === 'fulfilled' 
            ? (focusRes.value.data?.reduce((sum, session) => sum + (session.duration / 60), 0) || 0)
            : 0,
          journalEntries: journalRes.status === 'fulfilled' ? (journalRes.value.data?.length || 0) : 0
        });
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    }

    fetchWeeklyStats();
  }, [user]);

  // Fetch display name
  useEffect(() => {
    async function fetchDisplayName() {
      if (user?.id) {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();
        if (data?.display_name) {
          setDisplayName(data.display_name);
        }
      }
    }
    fetchDisplayName();
  }, [user]);

  // Greeting message
  const salutation = useMemo(() => {
    const h = new Date().getHours();
    if (h < 6) return "Bonsoir";
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  }, []);

  const quickActions = [
    { name: "Nouvelle tâche", href: "/tasks", icon: CheckSquare, color: "bg-blue-500", description: "Organiser votre travail" },
    { name: "Session focus", href: "/focus", icon: Timer, color: "bg-green-500", description: "Améliorer votre concentration" },
    { name: "Journal", href: "/journal", icon: BookOpen, color: "bg-purple-500", description: "Réfléchir et apprendre" },
    { name: "Habitudes", href: "/habits", icon: Repeat, color: "bg-orange-500", description: "Construire votre routine" },
  ];

  // Animation variants
  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 1) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.10,
        duration: 0.5,
        type: "spring",
      }
    }),
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Enhanced Header */}
      <div className="space-y-2">
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Tableau de bord
            </h1>
            <p className="text-muted-foreground text-lg">
              {salutation}{" "}
              {user && (
                <span className="font-semibold text-foreground">
                  {displayName ?? user.email}
                </span>
              )}
              ! Voici votre aperçu de productivité.
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </div>
        </motion.div>
      </div>

      {/* Enhanced Productivity Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <Card className="relative overflow-hidden shadow-lg bg-gradient-to-r from-primary/5 to-primary/10 border-l-4 border-l-primary">
          <motion.div
            className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full transform translate-x-16 -translate-y-16"
            initial={{ scale: 0.7, opacity: 0.25 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ duration: 0.7 }}
          />
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Score de productivité</h3>
                  <p className="text-sm text-muted-foreground">Analyse en temps réel</p>
                </div>
              </span>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                En direct
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Score */}
              <div className="lg:col-span-1 text-center">
                <motion.div
                  className="text-6xl font-extrabold text-primary mb-2"
                  key={score}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: [0.85, 1.15, 1] }}
                  transition={{ type: "spring", duration: 0.8 }}
                >
                  {score}
                </motion.div>
                <Badge variant="outline" className="mb-2 text-sm">
                  {level}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Taux de complétion : <span className="font-semibold text-foreground">{Math.round(completionRate)}%</span>
                </p>
              </div>

              {/* Score Breakdown */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-semibold text-foreground">Détail des scores</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Focus</span>
                    </div>
                    <span className="font-semibold">{Math.round(focusTimeScore)}/25</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Consistance</span>
                    </div>
                    <span className="font-semibold">{Math.round(consistencyScore)}/25</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Journal</span>
                    </div>
                    <span className="font-semibold">{Math.round(journalScore)}/15</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Complétion</span>
                    </div>
                    <span className="font-semibold">{Math.round(completionRate)}%</span>
                  </div>
                </div>
                <div className="pt-2">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to="/analysis">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analyse complète
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Cette semaine
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tâches complétées</p>
                <p className="text-2xl font-bold text-green-600">{weeklyStats.tasksCompleted}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-green-500 opacity-75" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Habitudes suivies</p>
                <p className="text-2xl font-bold text-blue-600">{weeklyStats.habitsCompleted}</p>
              </div>
              <Repeat className="h-8 w-8 text-blue-500 opacity-75" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Minutes de focus</p>
                <p className="text-2xl font-bold text-purple-600">{Math.round(weeklyStats.focusMinutes)}</p>
              </div>
              <Timer className="h-8 w-8 text-purple-500 opacity-75" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entrées journal</p>
                <p className="text-2xl font-bold text-orange-600">{weeklyStats.journalEntries}</p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-500 opacity-75" />
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Enhanced Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {quickActions.map((action, idx) => (
              <motion.div
                key={action.name}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
                custom={idx}
                className="h-full"
              >
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105">
                  <Link to={action.href}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <action.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base mb-1">{action.name}</p>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Enhanced Badges Section */}
      {badges.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Badges obtenus
                <Badge variant="secondary">{badges.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {badges.slice(0, 6).map((badge, index) => (
                  <motion.div
                    key={badge}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Badge variant="secondary" className="text-sm py-1 px-3">
                      {badge}
                    </Badge>
                  </motion.div>
                ))}
                {badges.length > 6 && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/badges">
                      Voir tous les badges ({badges.length})
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
