import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type ProductivityType = 'early_bird' | 'night_owl' | 'afternoon_warrior' | 'balanced';

interface HourlyData {
  hour: number;
  tasks: number;
  habits: number;
  focus: number;
  total: number;
}

interface ChronobiologyResult {
  hourlyData: HourlyData[];
  peakHour: number;
  productivityType: ProductivityType;
  insight: string;
  recommendation: string;
  stats: {
    morningPercent: number;
    afternoonPercent: number;
    eveningPercent: number;
  };
}

const getProductivityType = (morningPercent: number, afternoonPercent: number, eveningPercent: number): ProductivityType => {
  if (morningPercent >= 50) return 'early_bird';
  if (eveningPercent >= 50) return 'night_owl';
  if (afternoonPercent >= 40) return 'afternoon_warrior';
  return 'balanced';
};

const getInsight = (type: ProductivityType, peakHour: number, morningPercent: number): { insight: string, recommendation: string } => {
  const peakTime = `${peakHour}h`;
  
  switch (type) {
    case 'early_bird':
      return {
        insight: `🌅 Tu es un **Lève-tôt**! ${morningPercent}% de tes activités sont faites avant midi. Ton pic de productivité est à ${peakTime}.`,
        recommendation: "Bloque tes après-midis pour le travail créatif léger et les réunions."
      };
    case 'night_owl':
      return {
        insight: `🦉 Tu es un **Oiseau de nuit**! Ta productivité explose en soirée avec un pic à ${peakTime}.`,
        recommendation: "Garde tes matinées pour les tâches administratives légères."
      };
    case 'afternoon_warrior':
      return {
        insight: `⚔️ Tu es un **Guerrier de l'après-midi**! Ton énergie culmine vers ${peakTime}.`,
        recommendation: "Réserve tes matinées pour la planification et tes soirées pour la décompression."
      };
    default:
      return {
        insight: `⚖️ Tu as un rythme **équilibré** avec une activité bien répartie. Pic à ${peakTime}.`,
        recommendation: "Continue à diversifier tes heures de travail pour maintenir cette flexibilité."
      };
  }
};

export const useChronobiologyData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['chronobiology-data', user?.id],
    queryFn: async (): Promise<ChronobiologyResult> => {
      if (!user) {
        return {
          hourlyData: Array.from({ length: 24 }, (_, hour) => ({ hour, tasks: 0, habits: 0, focus: 0, total: 0 })),
          peakHour: 9,
          productivityType: 'balanced',
          insight: 'Connectez-vous pour voir votre analyse chronobiologique.',
          recommendation: '',
          stats: { morningPercent: 33, afternoonPercent: 33, eveningPercent: 34 }
        };
      }

      try {
        // Fetch data from last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        
        const [tasksResult, completionsResult, focusResult] = await Promise.all([
          supabase.from('tasks').select('updated_at').eq('user_id', user.id).eq('completed', true).gte('updated_at', thirtyDaysAgo),
          supabase.from('habit_completions').select('created_at').eq('user_id', user.id).gte('created_at', thirtyDaysAgo),
          supabase.from('focus_sessions').select('started_at').eq('user_id', user.id).gte('started_at', thirtyDaysAgo)
        ]);

        const hourlyData: HourlyData[] = Array.from({ length: 24 }, (_, hour) => ({ 
          hour, 
          tasks: 0, 
          habits: 0, 
          focus: 0, 
          total: 0 
        }));

        // Process tasks
        (tasksResult.data || []).forEach(task => {
          if (task.updated_at) {
            const hour = new Date(task.updated_at).getHours();
            hourlyData[hour].tasks++;
            hourlyData[hour].total++;
          }
        });

        // Process habit completions
        (completionsResult.data || []).forEach(completion => {
          if (completion.created_at) {
            const hour = new Date(completion.created_at).getHours();
            hourlyData[hour].habits++;
            hourlyData[hour].total++;
          }
        });

        // Process focus sessions
        (focusResult.data || []).forEach(session => {
          if (session.started_at) {
            const hour = new Date(session.started_at).getHours();
            hourlyData[hour].focus++;
            hourlyData[hour].total++;
          }
        });

        // Calculate peak hour
        let peakHour = 9;
        let maxTotal = 0;
        hourlyData.forEach(h => {
          if (h.total > maxTotal) {
            maxTotal = h.total;
            peakHour = h.hour;
          }
        });

        // Calculate time period percentages
        const totalActivities = hourlyData.reduce((sum, h) => sum + h.total, 0) || 1;
        const morningTotal = hourlyData.slice(5, 12).reduce((sum, h) => sum + h.total, 0); // 5h-11h
        const afternoonTotal = hourlyData.slice(12, 18).reduce((sum, h) => sum + h.total, 0); // 12h-17h
        const eveningTotal = hourlyData.slice(18, 24).reduce((sum, h) => sum + h.total, 0) + 
                            hourlyData.slice(0, 5).reduce((sum, h) => sum + h.total, 0); // 18h-4h

        const morningPercent = Math.round((morningTotal / totalActivities) * 100);
        const afternoonPercent = Math.round((afternoonTotal / totalActivities) * 100);
        const eveningPercent = Math.round((eveningTotal / totalActivities) * 100);

        const productivityType = getProductivityType(morningPercent, afternoonPercent, eveningPercent);
        const { insight, recommendation } = getInsight(productivityType, peakHour, morningPercent);

        return {
          hourlyData,
          peakHour,
          productivityType,
          insight,
          recommendation,
          stats: { morningPercent, afternoonPercent, eveningPercent }
        };

      } catch (error) {
        console.error('Error fetching chronobiology data:', error);
        return {
          hourlyData: Array.from({ length: 24 }, (_, hour) => ({ hour, tasks: 0, habits: 0, focus: 0, total: 0 })),
          peakHour: 9,
          productivityType: 'balanced',
          insight: 'Erreur lors du chargement des données.',
          recommendation: '',
          stats: { morningPercent: 33, afternoonPercent: 33, eveningPercent: 34 }
        };
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};
