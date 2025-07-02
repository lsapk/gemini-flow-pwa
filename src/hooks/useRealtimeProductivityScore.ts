
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

interface ProductivityData {
  tasksCompleted: number;
  goalsCompleted: number;
  isLoading: boolean;
  focusData: Array<{ date: string; minutes: number }>;
}

export const useRealtimeProductivityScore = (): ProductivityData => {
  const { user } = useAuth();
  const [data, setData] = useState<ProductivityData>({
    tasksCompleted: 0,
    goalsCompleted: 0,
    isLoading: true,
    focusData: []
  });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [tasksRes, goalsRes, focusRes] = await Promise.all([
          supabase.from('tasks').select('*').eq('user_id', user.id).eq('completed', true),
          supabase.from('goals').select('*').eq('user_id', user.id).eq('completed', true),
          supabase.from('focus_sessions').select('*').eq('user_id', user.id).gte('created_at', subDays(new Date(), 7).toISOString())
        ]);

        // Préparer les données de focus pour le graphique
        const focusData = [];
        for (let i = 6; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayFocus = focusRes.data?.filter(session => 
            session.created_at?.startsWith(dateStr)
          ) || [];
          
          const totalMinutes = dayFocus.reduce((sum, session) => sum + (session.duration || 0), 0);
          
          focusData.push({
            date: format(date, 'dd/MM'),
            minutes: Math.round(totalMinutes / 60)
          });
        }

        setData({
          tasksCompleted: tasksRes.data?.length || 0,
          goalsCompleted: goalsRes.data?.length || 0,
          isLoading: false,
          focusData
        });
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchData();
  }, [user]);

  return data;
};
