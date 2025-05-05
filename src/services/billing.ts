
import { supabase } from "@/integrations/supabase/client";

/**
 * Crée une session de paiement Stripe pour un abonnement.
 * 
 * @param planType - Type d'abonnement (basic, premium, ultimate)
 * @returns URL de la session de paiement Stripe
 */
export const createCheckoutSession = async (planType: 'basic' | 'premium' | 'ultimate'): Promise<{ url: string | null, error: string | null }> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { planType }
    });

    if (error) {
      throw new Error(error.message);
    }

    return { url: data?.url || null, error: null };
  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement Stripe:', error);
    return { url: null, error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue' };
  }
};

/**
 * Crée une session de portail client Stripe pour gérer l'abonnement.
 * 
 * @returns URL du portail client Stripe
 */
export const createCustomerPortal = async (): Promise<{ url: string | null, error: string | null }> => {
  try {
    const { data, error } = await supabase.functions.invoke('customer-portal');

    if (error) {
      throw new Error(error.message);
    }

    return { url: data?.url || null, error: null };
  } catch (error) {
    console.error('Erreur lors de la création du portail client Stripe:', error);
    return { url: null, error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue' };
  }
};

/**
 * Vérifie le statut d'abonnement de l'utilisateur actuel.
 */
export const checkSubscriptionStatus = async (): Promise<{
  subscribed: boolean;
  subscription_tier?: string | null;
  subscription_end?: string | null;
  error: string | null;
}> => {
  try {
    // Vérifier d'abord si l'utilisateur a une session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        subscribed: false,
        error: 'Utilisateur non authentifié'
      };
    }

    // Vérifier le statut de l'abonnement
    const { data, error } = await supabase.functions.invoke('check-subscription');

    if (error) {
      throw new Error(error.message);
    }

    return {
      subscribed: data?.subscribed || false,
      subscription_tier: data?.subscription_tier || null,
      subscription_end: data?.subscription_end || null,
      error: null
    };
  } catch (error) {
    console.error('Erreur lors de la vérification du statut d\'abonnement:', error);
    return {
      subscribed: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
    };
  }
};

/**
 * Valide un achat in-app pour les applications mobiles (comme Google Play ou Apple App Store).
 * 
 * @param purchaseData - Données d'achat provenant du store mobile
 */
export const validateInAppPurchase = async (purchaseData: any): Promise<{
  success: boolean;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase.functions.invoke('validate-purchase', {
      body: purchaseData
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: data?.success || false,
      error: null
    };
  } catch (error) {
    console.error('Erreur lors de la validation de l\'achat in-app:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
    };
  }
};
