
import { useState, useEffect } from "react";
import ProductivityBadges from "@/components/ui/ProductivityBadges";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function Badges() {
  const [stats, setStats] = useState({
    habitsCount: 0,
    tasksCompleted: 0,
    goalsProgress: 0,
    focusTime: 0,
    streakDays: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        const [habitsRes, tasksRes, goalsRes, focusRes] = await Promise.all([
          supabase.from('habits').select('*').eq('user_id', user.id),
          supabase.from('tasks').select('*').eq('user_id', user.id),
          supabase.from('goals').select('*').eq('user_id', user.id),
          supabase.from('focus_sessions').select('*').eq('user_id', user.id)
        ]);

        const habits = habitsRes.data || [];
        const tasks = tasksRes.data || [];
        const goals = goalsRes.data || [];
        const focusSessions = focusRes.data || [];

        const completedTasks = tasks.filter(t => t.completed).length;
        const avgProgress = goals.length > 0 
          ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length
          : 0;
        const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;
        const maxStreak = Math.max(...habits.map(h => h.streak || 0), 0);

        setStats({
          habitsCount: habits.length,
          tasksCompleted: completedTasks,
          goalsProgress: avgProgress,
          focusTime: totalFocusMinutes,
          streakDays: maxStreak
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Badges de productivité</h1>
        <div className="animate-pulse bg-muted h-96 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Badges de productivité</h1>
      <ProductivityBadges {...stats} />
    </div>
  );
}
