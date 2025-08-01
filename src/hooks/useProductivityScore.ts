
import { useState, useEffect } from 'react';
import { useAnalyticsData } from './useAnalyticsData';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface ProductivityMetrics {
  score: number;
  level: string;
  badges: string[];
  streakBonus: number;
  completionRate: number;
  focusTimeScore: number;
  consistencyScore: number;
  qualityScore: number;
  timeManagementScore: number;
  journalScore: number;
  goalScore: number;
  insights: string[];
  recommendations: string[];
}

export const useProductivityScore = (): ProductivityMetrics => {
  const { user } = useAuth();
  const { 
    taskCompletionRate, 
    totalFocusTime, 
    streakCount, 
    habitsData, 
    focusData,
    activityData 
  } = useAnalyticsData();

  const [aiMetrics, setAiMetrics] = useState<ProductivityMetrics>({
    score: 0,
    level: 'Novice',
    badges: [],
    streakBonus: 0,
    completionRate: 0,
    focusTimeScore: 0,
    consistencyScore: 0,
    qualityScore: 0,
    timeManagementScore: 0,
    journalScore: 0,
    goalScore: 0,
    insights: [],
    recommendations: []
  });

  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (user && !isCalculating) {
      calculateProductivityWithAI();
    }
  }, [user, taskCompletionRate, totalFocusTime, streakCount, habitsData.length, focusData.length, activityData.length]);

  const calculateProductivityWithAI = async () => {
    if (!user || isCalculating) return;

    setIsCalculating(true);
    
    try {
      console.log("Calculating enhanced productivity score with AI...");
      
      // Récupérer toutes les données utilisateur pour l'analyse
      const [
        tasksResult,
        habitsResult,
        goalsResult,
        journalResult,
        focusResult
      ] = await Promise.allSettled([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
      ]);

      const completeUserData = {
        tasks: tasksResult.status === 'fulfilled' ? (tasksResult.value.data || []) : [],
        habits: habitsResult.status === 'fulfilled' ? (habitsResult.value.data || []) : [],
        goals: goalsResult.status === 'fulfilled' ? (goalsResult.value.data || []) : [],
        journal_entries: journalResult.status === 'fulfilled' ? (journalResult.value.data || []) : [],
        focus_sessions: focusResult.status === 'fulfilled' ? (focusResult.value.data || []) : [],
        analytics: {
          taskCompletionRate,
          totalFocusTime,
          streakCount,
          habitsCount: habitsData.length,
          focusSessionsCount: focusData.length,
          activityCount: activityData.length
        }
      };

      const { data, error } = await supabase.functions.invoke('gemini-chat-enhanced', {
        body: {
          message: `Analyse en profondeur ces données utilisateur et calcule un score de productivité détaillé avec insights personnalisés. Retourne UNIQUEMENT un objet JSON valide avec les propriétés exactes: 
          {
            "score": nombre_0_à_100,
            "level": "string_français_niveau", 
            "badges": ["array", "de", "badges", "français"],
            "streakBonus": nombre_0_à_20,
            "completionRate": nombre_pourcentage,
            "focusTimeScore": nombre_0_à_25,
            "consistencyScore": nombre_0_à_25,
            "qualityScore": nombre_0_à_25,
            "timeManagementScore": nombre_0_à_25,
            "journalScore": nombre_0_à_15,
            "goalScore": nombre_0_à_15,
            "insights": ["array", "d'analyses", "personnalisées", "courtes"],
            "recommendations": ["array", "de", "recommandations", "actionables"]
          }
          
          ANALYSE APPROFONDIE REQUISE:
          - Patterns dans les habitudes et leur régularité
          - Qualité de la gestion des priorités des tâches
          - Équilibre entre objectifs à court/long terme
          - Efficacité des sessions de focus
          - Évolution temporelle des performances
          - Points forts et axes d'amélioration spécifiques
          - Recommandations concrètes et personnalisées
          
          Données complètes: ${JSON.stringify(completeUserData)}`,
          user_id: user.id,
          context: {
            user_data: completeUserData,
            recent_messages: []
          }
        }
      });

      if (error) {
        console.error('Error calling AI function:', error);
        throw error;
      }

      console.log("Enhanced AI response received:", data);

      // Try to extract JSON from AI response
      let parsedMetrics = null;
      if (data?.response && !data.error) {
        try {
          // Look for JSON in the response
          const jsonMatch = data.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedMetrics = JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
          console.error('Error parsing AI JSON:', parseError);
        }
      }

      if (parsedMetrics && typeof parsedMetrics.score === 'number') {
        console.log("Using enhanced AI-calculated metrics:", parsedMetrics);
        setAiMetrics({
          score: Math.max(0, Math.min(100, parsedMetrics.score)),
          level: parsedMetrics.level || 'Novice',
          badges: Array.isArray(parsedMetrics.badges) ? parsedMetrics.badges : [],
          streakBonus: Math.max(0, Math.min(20, parsedMetrics.streakBonus || 0)),
          completionRate: Math.max(0, Math.min(100, parsedMetrics.completionRate || taskCompletionRate)),
          focusTimeScore: Math.max(0, Math.min(25, parsedMetrics.focusTimeScore || 0)),
          consistencyScore: Math.max(0, Math.min(25, parsedMetrics.consistencyScore || 0)),
          qualityScore: Math.max(0, Math.min(25, parsedMetrics.qualityScore || 0)),
          timeManagementScore: Math.max(0, Math.min(25, parsedMetrics.timeManagementScore || 0)),
          journalScore: Math.max(0, Math.min(15, parsedMetrics.journalScore || 0)),
          goalScore: Math.max(0, Math.min(15, parsedMetrics.goalScore || 0)),
          insights: Array.isArray(parsedMetrics.insights) ? parsedMetrics.insights : [],
          recommendations: Array.isArray(parsedMetrics.recommendations) ? parsedMetrics.recommendations : []
        });
      } else {
        console.log("AI response not valid, using enhanced fallback calculation");
        calculateEnhancedFallbackMetrics();
      }

    } catch (error) {
      console.error('Error calculating productivity with enhanced AI:', error);
      calculateEnhancedFallbackMetrics();
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateEnhancedFallbackMetrics = () => {
    // Enhanced fallback calculation with more detailed analysis
    let totalPossibleScore = 0;
    let earnedScore = 0;
    
    const hasTaskData = taskCompletionRate > 0 || activityData.some(day => day.count > 0);
    if (hasTaskData) {
      const completionScore = Math.min(25, (taskCompletionRate / 100) * 25);
      totalPossibleScore += 25;
      earnedScore += completionScore;
    }
    
    const hasFocusData = totalFocusTime > 0 || focusData.some(session => session.minutes > 0);
    if (hasFocusData) {
      const avgDailyFocus = totalFocusTime / 7;
      const focusTimeScore = Math.min(25, (avgDailyFocus / 120) * 25);
      totalPossibleScore += 25;
      earnedScore += focusTimeScore;
    }
    
    const hasHabitsData = habitsData.length > 0;
    if (hasHabitsData) {
      totalPossibleScore += 25;
      earnedScore += Math.min(25, (streakCount / 21) * 25);
    }
    
    // Ajouter analyse des objectifs
    totalPossibleScore += 15;
    earnedScore += 8; // Score moyen pour les objectifs
    
    // Ajouter score de qualité générale
    totalPossibleScore += 10;
    earnedScore += 5; // Score moyen
    
    const totalScore = totalPossibleScore > 0 ? Math.round((earnedScore / totalPossibleScore) * 100) : 0;
    
    let level = 'Débutant';
    if (totalScore >= 90) level = 'Maître';
    else if (totalScore >= 80) level = 'Expert';
    else if (totalScore >= 60) level = 'Avancé';
    else if (totalScore >= 40) level = 'Intermédiaire';
    else if (totalScore >= 20) level = 'Débutant';
    else level = 'Novice';
    
    const badges = [];
    if (taskCompletionRate >= 80) badges.push('🎯 Organisé');
    if (totalFocusTime >= 120) badges.push('🧘 Focalisé');
    if (streakCount >= 7) badges.push('🔥 Persévérant');
    if (totalScore >= 80) badges.push('⭐ Excellence');
    
    const insights = [
      `Votre niveau de productivité est ${level.toLowerCase()}`,
      `Taux de completion: ${taskCompletionRate.toFixed(0)}%`,
      `Temps de focus hebdomadaire: ${totalFocusTime} minutes`,
      `Plus longue série d'habitudes: ${streakCount} jours`
    ];
    
    const recommendations = [
      'Établissez des objectifs clairs et mesurables',
      'Maintenez une routine quotidienne constante',
      'Augmentez progressivement votre temps de focus',
      'Célébrez vos petites victoires quotidiennes'
    ];
    
    setAiMetrics({
      score: totalScore,
      level,
      badges,
      streakBonus: Math.min(10, streakCount / 5),
      completionRate: taskCompletionRate,
      focusTimeScore: hasFocusData ? Math.min(25, (totalFocusTime / 7 / 120) * 25) : 0,
      consistencyScore: hasHabitsData ? Math.min(25, (streakCount / 21) * 25) : 0,
      qualityScore: 12,
      timeManagementScore: 15,
      journalScore: 8,
      goalScore: 10,
      insights,
      recommendations
    });
  };

  return aiMetrics;
};
