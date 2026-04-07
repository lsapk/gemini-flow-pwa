import { supabase } from "@/integrations/supabase/client";

/**
 * Track an AI request in the database for analytics.
 * Returns true if tracked successfully.
 */
export const trackAIRequest = async (service: 'chat' | 'analysis'): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { error } = await supabase
      .from('ai_requests')
      .insert({ service, user_id: user.id });
      
    return !error;
  } catch {
    return false;
  }
};

/**
 * Check AI request limits. Uses useSubscription for actual enforcement.
 * This is kept for backward compatibility — prefer useSubscription hook.
 */
export const checkAIRequestLimit = async (service: 'chat' | 'analysis'): Promise<{
  hasReachedLimit: boolean;
  requestsToday: number;
  isPremium: boolean;
}> => {
  return { hasReachedLimit: false, requestsToday: 0, isPremium: true };
};
