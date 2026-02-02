import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CrossInsight {
  type: 'correlation' | 'pattern' | 'prediction' | 'opportunity';
  icon: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
}

export interface InsightsResult {
  insights: CrossInsight[];
  summary: string;
}

interface InsightsCache {
  insights: InsightsResult;
  generated_at: string;
}

const CACHE_KEY = 'deepflow_cross_insights';
const CACHE_DURATION_HOURS = 12;

export function useAIInsightsEngine() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<CrossInsight[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCachedInsights = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { insights: cachedData, generated_at }: InsightsCache = JSON.parse(cached);
        const hoursSinceGeneration = (Date.now() - new Date(generated_at).getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceGeneration < CACHE_DURATION_HOURS) {
          setInsights(cachedData.insights || []);
          setSummary(cachedData.summary || '');
          return true;
        }
      }
    } catch (e) {
      console.error('Error loading cached insights:', e);
    }
    return false;
  }, []);

  const generateInsights = useCallback(async (force = false) => {
    if (!user) return;

    if (!force && loadCachedInsights()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        'https://xzgdfetnjnwrberyddmf.supabase.co/functions/v1/ai-cross-analysis',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'cross_insights' }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Limite de requêtes atteinte.');
          throw new Error('Rate limited');
        }
        if (response.status === 402) {
          toast.error('Crédits IA épuisés.');
          throw new Error('Credits exhausted');
        }
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      
      if (data.result) {
        const result = data.result as InsightsResult;
        setInsights(result.insights || []);
        setSummary(result.summary || '');
        
        const cache: InsightsCache = {
          insights: result,
          generated_at: new Date().toISOString()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      }
    } catch (err) {
      console.error('Error generating insights:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [user, loadCachedInsights]);

  useEffect(() => {
    if (user) {
      loadCachedInsights() || generateInsights();
    }
  }, [user, loadCachedInsights, generateInsights]);

  return {
    insights,
    summary,
    isLoading,
    error,
    refreshInsights: () => generateInsights(true)
  };
}
