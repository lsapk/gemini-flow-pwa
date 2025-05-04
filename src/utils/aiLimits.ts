
import { supabase } from "@/integrations/supabase/client";

// Maximum daily AI requests for freemium users
export const MAX_FREEMIUM_REQUESTS_PER_DAY = 5;

// Track a new AI request in the database
export const trackAIRequest = async (service: 'chat' | 'analysis'): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('ai_requests')
      .insert({ service })
      .select();
      
    if (error) {
      console.error("Error tracking AI request:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Exception tracking AI request:", err);
    return false;
  }
};

// Check if user has reached the daily limit for free tier
export const checkAIRequestLimit = async (service: 'chat' | 'analysis'): Promise<{
  hasReachedLimit: boolean;
  requestsToday: number;
  isPremium: boolean;
}> => {
  try {
    // First check if user has premium subscription
    const { data: subscriptionData } = await supabase
      .from('subscribers')
      .select('subscribed')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    const isPremium = subscriptionData?.subscribed || false;
    
    // Premium users have no limit
    if (isPremium) {
      return { hasReachedLimit: false, requestsToday: 0, isPremium };
    }
    
    // Get today's date in user's timezone (for simplicity, using UTC)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count user's requests today
    const { count, error } = await supabase
      .from('ai_requests')
      .select('*', { count: 'exact', head: false })
      .eq('service', service)
      .gte('created_at', today.toISOString());
      
    if (error) {
      console.error("Error checking AI request limit:", error);
      return { hasReachedLimit: false, requestsToday: 0, isPremium };
    }
    
    const requestsToday = count || 0;
    const hasReachedLimit = requestsToday >= MAX_FREEMIUM_REQUESTS_PER_DAY;
    
    return { hasReachedLimit, requestsToday, isPremium };
  } catch (err) {
    console.error("Exception checking AI request limit:", err);
    return { hasReachedLimit: false, requestsToday: 0, isPremium: false };
  }
};
