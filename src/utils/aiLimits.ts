
import { supabase } from "@/integrations/supabase/client";

// Maximum daily AI requests for freemium users
export const MAX_FREEMIUM_REQUESTS_PER_DAY = 5;

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
      })
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
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found when checking AI request limit");
      return { hasReachedLimit: true, requestsToday: 0, isPremium: false };
    }

    // First check if user has premium subscription
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscribers')
      .select('subscribed, subscription_tier')
      .eq('user_id', user.id)
      .single();

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    const isAdmin = roleData?.role === 'admin';
    const isPremium = (subscriptionData?.subscribed === true) || isAdmin;
    
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
      .eq('user_id', user.id)
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
