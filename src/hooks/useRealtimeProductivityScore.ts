
import { useEffect } from 'react';
import { useProductivityScore } from './useProductivityScore';
import { useAnalyticsData } from './useAnalyticsData';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeProductivityScore = () => {
  const { refetch } = useAnalyticsData();
  const productivityData = useProductivityScore();

  useEffect(() => {
    // Mettre à jour toutes les 2 minutes pour plus de réactivité
    const interval = setInterval(() => {
      refetch();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Mettre à jour quand l'utilisateur revient sur la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetch]);

  // Écouter les changements en temps réel sur les tables importantes
  useEffect(() => {
    const channel = supabase
      .channel('productivity-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habits' },
        () => refetch()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => refetch()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goals' },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return productivityData;
};
