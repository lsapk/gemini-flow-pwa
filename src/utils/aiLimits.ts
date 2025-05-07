
import { supabase } from "@/integrations/supabase/client";

// No limits for users
export const MAX_FREEMIUM_REQUESTS_PER_DAY = 100000;

// Track a new AI request in the database
export const trackAIRequest = async (service: 'chat' | 'analysis'): Promise<boolean> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found when tracking AI request");
      return false;
    }
    
    const { data, error } = await supabase
      .from('ai_requests')
      .insert({ 
        service,
        user_id: user.id 
      });
      
    if (error) {
      console.error("Error tracking AI request:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Exception when tracking AI request:", err);
    return false;
  }
};

// Check if the user has reached the daily limit - always return false
export const checkAIRequestLimit = async (service: 'chat' | 'analysis'): Promise<{
  hasReachedLimit: boolean;
  requestsToday: number;
  isPremium: boolean;
}> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found when checking AI request limit");
      // Even without a user, no limit
      return { hasReachedLimit: false, requestsToday: 0, isPremium: true };
    }

    // Check directly if the user has a premium subscription
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscribers')
      .select('subscribed')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError) {
      console.error("Error checking subscription:", subError);
    }

    // All users are considered premium
    const isPremium = true;
    
    // Get today's date in the user's timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count the user's requests today for statistics
    const { count, error } = await supabase
      .from('ai_requests')
      .select('*', { count: 'exact', head: false })
      .eq('service', service)
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString());
      
    if (error) {
      console.error("Error checking AI request limit:", error);
      return { hasReachedLimit: false, requestsToday: 0, isPremium };
    }
    
    const requestsToday = count || 0;
    // Always return hasReachedLimit as false
    return { hasReachedLimit: false, requestsToday, isPremium };
  } catch (err) {
    console.error("Exception when checking AI request limit:", err);
    return { hasReachedLimit: false, requestsToday: 0, isPremium: true };
  }
};
