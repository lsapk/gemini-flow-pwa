import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DailyBriefing {
  greeting: string;
  productivity_type: string;
  mood_insight: string;
  priority_tasks: string[];
  active_quest?: {
    title: string;
    progress: string;
    message: string;
  };
  daily_tip: string;
  motivation_message: string;
}

interface BriefingCache {
  briefing: DailyBriefing;
  generated_at: string;
}

const CACHE_KEY = 'deepflow_daily_briefing';
const CACHE_DURATION_HOURS = 6;

export function useAIDailyBriefing() {
  const { user } = useAuth();
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cached briefing from localStorage
  const loadCachedBriefing = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { briefing: cachedBriefing, generated_at }: BriefingCache = JSON.parse(cached);
        const hoursSinceGeneration = (Date.now() - new Date(generated_at).getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceGeneration < CACHE_DURATION_HOURS) {
          setBriefing(cachedBriefing);
          return true;
        }
      }
    } catch (e) {
      console.error('Error loading cached briefing:', e);
    }
    return false;
  }, []);

  // Generate new briefing
  const generateBriefing = useCallback(async (force = false) => {
    if (!user) return;

    // Check cache first unless forced
    if (!force && loadCachedBriefing()) {
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
          body: JSON.stringify({ type: 'daily_briefing' }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Limite de requêtes atteinte. Réessayez plus tard.');
          throw new Error('Rate limited');
        }
        if (response.status === 402) {
          toast.error('Crédits IA épuisés.');
          throw new Error('Credits exhausted');
        }
        throw new Error('Failed to generate briefing');
      }

      const data = await response.json();
      
      if (data.result) {
        const newBriefing = data.result as DailyBriefing;
        setBriefing(newBriefing);
        
        // Cache the briefing
        const cache: BriefingCache = {
          briefing: newBriefing,
          generated_at: new Date().toISOString()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      }
    } catch (err) {
      console.error('Error generating daily briefing:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [user, loadCachedBriefing]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadCachedBriefing() || generateBriefing();
    }
  }, [user, loadCachedBriefing, generateBriefing]);

  return {
    briefing,
    isLoading,
    error,
    refreshBriefing: () => generateBriefing(true)
  };
}
