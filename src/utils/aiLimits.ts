
import { supabase } from "@/integrations/supabase/client";

// Maximum de requêtes IA quotidiennes pour les utilisateurs freemium
export const MAX_FREEMIUM_REQUESTS_PER_DAY = 5;

// Suivre une nouvelle requête IA dans la base de données
export const trackAIRequest = async (service: 'chat' | 'analysis'): Promise<boolean> => {
  try {
    // Obtenir l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("Aucun utilisateur authentifié trouvé lors du suivi de la requête IA");
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
      console.error("Erreur lors du suivi de la requête IA:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Exception lors du suivi de la requête IA:", err);
    return false;
  }
};

// Vérifier si l'utilisateur a atteint la limite quotidienne pour le niveau gratuit
export const checkAIRequestLimit = async (service: 'chat' | 'analysis'): Promise<{
  hasReachedLimit: boolean;
  requestsToday: number;
  isPremium: boolean;
}> => {
  try {
    // Obtenir l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("Aucun utilisateur authentifié trouvé lors de la vérification de la limite de requêtes IA");
      return { hasReachedLimit: true, requestsToday: 0, isPremium: false };
    }

    // Vérifier d'abord si l'utilisateur a un abonnement premium
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscribers')
      .select('subscribed, subscription_tier')
      .eq('user_id', user.id)
      .single();

    // Vérifier si l'utilisateur est administrateur
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    // Vérifier si l'utilisateur a un rôle créateur
    const { data: creatorData, error: creatorError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'creator')
      .maybeSingle();

    const isAdmin = roleData?.role === 'admin';
    const isCreator = creatorData?.role === 'creator';
    const isPremium = (subscriptionData?.subscribed === true) || isAdmin || isCreator;
    
    // Les utilisateurs premium n'ont pas de limite
    if (isPremium) {
      return { hasReachedLimit: false, requestsToday: 0, isPremium };
    }
    
    // Obtenir la date du jour dans le fuseau horaire de l'utilisateur (par simplicité, utilisant UTC)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Compter les requêtes de l'utilisateur aujourd'hui
    const { count, error } = await supabase
      .from('ai_requests')
      .select('*', { count: 'exact', head: false })
      .eq('service', service)
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString());
      
    if (error) {
      console.error("Erreur lors de la vérification de la limite de requêtes IA:", error);
      return { hasReachedLimit: false, requestsToday: 0, isPremium };
    }
    
    const requestsToday = count || 0;
    const hasReachedLimit = requestsToday >= MAX_FREEMIUM_REQUESTS_PER_DAY;
    
    return { hasReachedLimit, requestsToday, isPremium };
  } catch (err) {
    console.error("Exception lors de la vérification de la limite de requêtes IA:", err);
    return { hasReachedLimit: false, requestsToday: 0, isPremium: false };
  }
};
