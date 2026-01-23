import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface LifeCategory {
  category: string;
  score: number;
  habits: number;
  goals: number;
  color: string;
}

const CATEGORY_MAPPINGS: Record<string, string> = {
  // Santé
  health: 'Santé',
  santé: 'Santé',
  fitness: 'Santé',
  musculation: 'Santé',
  posture: 'Santé',
  sport: 'Santé',
  // Carrière
  professional: 'Carrière',
  productivity: 'Carrière',
  work: 'Carrière',
  travail: 'Carrière',
  project: 'Carrière',
  // Mental
  mindfulness: 'Mental',
  mental: 'Mental',
  meditation: 'Mental',
  'santé mental': 'Mental',
  wellness: 'Mental',
  // Apprentissage
  learning: 'Apprentissage',
  education: 'Apprentissage',
  study: 'Apprentissage',
  études: 'Apprentissage',
  lecture: 'Apprentissage',
  // Personnel
  personal: 'Personnel',
  personel: 'Personnel',
  famille: 'Personnel',
  family: 'Personnel',
  // Loisirs
  other: 'Loisirs',
  loisirs: 'Loisirs',
  hobby: 'Loisirs',
  football: 'Loisirs',
  gaming: 'Loisirs',
  drone: 'Loisirs',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Santé': 'hsl(142, 70%, 45%)',
  'Carrière': 'hsl(199, 89%, 48%)',
  'Mental': 'hsl(258, 90%, 66%)',
  'Apprentissage': 'hsl(38, 92%, 50%)',
  'Personnel': 'hsl(330, 80%, 60%)',
  'Loisirs': 'hsl(174, 72%, 45%)',
};

const ALL_CATEGORIES = ['Santé', 'Carrière', 'Mental', 'Apprentissage', 'Personnel', 'Loisirs'];

export const useLifeWheelData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['life-wheel-data', user?.id],
    queryFn: async (): Promise<{ data: LifeCategory[], balance: number }> => {
      if (!user) {
        return { 
          data: ALL_CATEGORIES.map(cat => ({ 
            category: cat, 
            score: 0, 
            habits: 0, 
            goals: 0,
            color: CATEGORY_COLORS[cat] 
          })),
          balance: 0 
        };
      }

      try {
        const [habitsResult, goalsResult, completionsResult] = await Promise.all([
          supabase.from('habits').select('*').eq('user_id', user.id).eq('is_archived', false),
          supabase.from('goals').select('*').eq('user_id', user.id),
          supabase.from('habit_completions').select('habit_id').eq('user_id', user.id)
            .gte('completed_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        ]);

        const habits = habitsResult.data || [];
        const goals = goalsResult.data || [];
        const completions = completionsResult.data || [];

        // Count completions per habit
        const completionCounts: Record<string, number> = {};
        completions.forEach(c => {
          completionCounts[c.habit_id] = (completionCounts[c.habit_id] || 0) + 1;
        });

        // Map to life categories
        const mapToLifeCategory = (category: string): string => {
          const normalized = category?.toLowerCase().trim() || 'other';
          return CATEGORY_MAPPINGS[normalized] || 'Loisirs';
        };

        // Calculate scores per category
        const categoryData: Record<string, { habits: number, goals: number, habitScore: number, goalScore: number }> = {};
        ALL_CATEGORIES.forEach(cat => {
          categoryData[cat] = { habits: 0, goals: 0, habitScore: 0, goalScore: 0 };
        });

        // Process habits
        habits.forEach(habit => {
          const lifeCategory = mapToLifeCategory(habit.category || 'other');
          categoryData[lifeCategory].habits++;
          
          const completionCount = completionCounts[habit.id] || 0;
          const streak = habit.streak || 0;
          // Score based on streak and recent completions
          const habitScore = Math.min(100, (streak * 3) + (completionCount * 2));
          categoryData[lifeCategory].habitScore += habitScore;
        });

        // Process goals
        goals.forEach(goal => {
          const lifeCategory = mapToLifeCategory(goal.category || 'other');
          categoryData[lifeCategory].goals++;
          categoryData[lifeCategory].goalScore += goal.progress || 0;
        });

        // Calculate final scores
        const data: LifeCategory[] = ALL_CATEGORIES.map(category => {
          const cat = categoryData[category];
          const totalItems = cat.habits + cat.goals;
          
          let score = 0;
          if (totalItems > 0) {
            const avgHabitScore = cat.habits > 0 ? cat.habitScore / cat.habits : 0;
            const avgGoalScore = cat.goals > 0 ? cat.goalScore / cat.goals : 0;
            
            // Weighted average favoring habits if both exist
            if (cat.habits > 0 && cat.goals > 0) {
              score = Math.round((avgHabitScore * 0.6 + avgGoalScore * 0.4));
            } else if (cat.habits > 0) {
              score = Math.round(avgHabitScore);
            } else {
              score = Math.round(avgGoalScore);
            }
          }

          return {
            category,
            score: Math.min(100, score),
            habits: cat.habits,
            goals: cat.goals,
            color: CATEGORY_COLORS[category]
          };
        });

        // Calculate balance (inverse of standard deviation - higher = more balanced)
        const scores = data.map(d => d.score);
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        const balance = Math.max(0, Math.round(100 - stdDev));

        return { data, balance };

      } catch (error) {
        console.error('Error fetching life wheel data:', error);
        return { 
          data: ALL_CATEGORIES.map(cat => ({ 
            category: cat, 
            score: 0, 
            habits: 0, 
            goals: 0,
            color: CATEGORY_COLORS[cat] 
          })),
          balance: 0 
        };
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};
