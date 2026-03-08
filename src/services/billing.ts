import { supabase } from "@/integrations/supabase/client";

/**
 * Crée une session de paiement Stripe pour un abonnement.
 */
export const createCheckoutSession = async (planType: 'basic' | 'premium' | 'ultimate'): Promise<{ url: string | null, error: string | null }> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { planType }
    });
    if (error) throw new Error(error.message);
    return { url: data?.url || null, error: null };
  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement:', error);
    return { url: null, error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue' };
  }
};

/**
 * Crée une session de portail client Stripe pour gérer l'abonnement.
 */
export const createCustomerPortal = async (): Promise<{ url: string | null, error: string | null }> => {
  try {
    const { data, error } = await supabase.functions.invoke('customer-portal');
    if (error) throw new Error(error.message);
    return { url: data?.url || null, error: null };
  } catch (error) {
    console.error('Erreur lors de la création du portail client:', error);
    return { url: null, error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue' };
  }
};
