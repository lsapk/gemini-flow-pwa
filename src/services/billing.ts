
import { supabase } from "@/integrations/supabase/client";

// This service handles billing operations for the app,
// with support for Google Play Billing for native apps

// Check if running in native environment
const isNativeApp = (): boolean => {
  return typeof (window as any).Capacitor !== 'undefined';
};

// Initialize native billing if available
export const initBillingOnLoad = async () => {
  try {
    console.log("Running in native environment:", isNativeApp());
    
    if (!isNativeApp()) {
      return;
    }
    
    // Check if the Google Play Billing API is available
    const { Plugins } = (window as any).Capacitor;
    if (!Plugins.InAppPurchase) {
      console.warn("Google Play Billing plugin not available");
      return;
    }
    
    // Register Billing event listeners
    Plugins.InAppPurchase.addListener('purchaseCompleted', (info: any) => {
      console.log('Purchase completed:', info);
      // Here you should validate the purchase with your backend
      validatePurchaseOnServer(info);
    });

    // Initialize products
    await registerProducts();
    
    console.log("Native billing initialized successfully");
  } catch (error) {
    console.error("Error initializing billing:", error);
  }
};

// Register available products (plans)
const registerProducts = async () => {
  if (!isNativeApp()) return;

  try {
    const { Plugins } = (window as any).Capacitor;
    if (!Plugins.InAppPurchase) return;
    
    // Define your product IDs here
    const productIds = [
      'com.deepflow.premium.monthly',
      'com.deepflow.premium.yearly',
      'com.deepflow.premium.lifetime'
    ];
    
    // Register products with the Play Store
    await Plugins.InAppPurchase.getProducts(productIds);
  } catch (error) {
    console.error("Error registering products:", error);
  }
};

// Make a purchase
export const makePurchase = async (productId: string): Promise<boolean> => {
  if (!isNativeApp()) {
    // For web, use Stripe Checkout instead
    return initiateStripeCheckout(productId);
  }
  
  try {
    const { Plugins } = (window as any).Capacitor;
    if (!Plugins.InAppPurchase) return false;
    
    await Plugins.InAppPurchase.purchase(productId);
    return true;
  } catch (error) {
    console.error("Purchase error:", error);
    return false;
  }
};

// Initiate Stripe checkout for web payments
async function initiateStripeCheckout(productId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User not authenticated");
      return false;
    }
    
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { productId }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (data && data.url) {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return false;
  }
}

// Restore purchases
export const restorePurchases = async (): Promise<boolean> => {
  if (!isNativeApp()) return false;
  
  try {
    const { Plugins } = (window as any).Capacitor;
    if (!Plugins.InAppPurchase) return false;
    
    const result = await Plugins.InAppPurchase.restorePurchases();
    
    // Handle restored purchases
    if (result && result.purchases) {
      for (const purchase of result.purchases) {
        validatePurchaseOnServer(purchase);
      }
    }
    
    return true;
  } catch (error) {
    console.error("Restore purchases error:", error);
    return false;
  }
};

// Validate purchase with your server
const validatePurchaseOnServer = async (purchaseInfo: any) => {
  try {
    // Call Supabase Edge Function to validate and record the purchase
    const { data, error } = await supabase.functions.invoke('validate-purchase', {
      body: { purchaseInfo }
    });
    
    if (error) {
      console.error("Error validating purchase:", error);
      return;
    }
    
    console.log("Purchase validated:", data);
    
    // Update subscription status in local storage
    localStorage.setItem('subscriptionStatus', JSON.stringify({
      subscribed: true,
      plan: purchaseInfo.productId,
      expirationDate: null // Set to null for lifetime subscriptions or calculate for recurring
    }));
    
    // Notify the app that subscription status has changed
    window.dispatchEvent(new CustomEvent('subscription:updated'));
  } catch (error) {
    console.error("Purchase validation error:", error);
  }
};

// Get subscription status
export const getSubscriptionStatus = async (): Promise<{isActive: boolean, plan: string | null}> => {
  try {
    // First check the cached status
    const cachedStatus = localStorage.getItem('subscriptionStatus');
    if (cachedStatus) {
      const status = JSON.parse(cachedStatus);
      // If expiration date exists and is in the future, return cached status
      if (!status.expirationDate || new Date(status.expirationDate) > new Date()) {
        return { isActive: status.subscribed, plan: status.plan };
      }
    }
    
    // If cached status doesn't exist or has expired, check actual status
    
    if (isNativeApp()) {
      const { Plugins } = (window as any).Capacitor;
      if (!Plugins.InAppPurchase) {
        return { isActive: false, plan: null };
      }
      
      // Get active subscriptions
      const result = await Plugins.InAppPurchase.getPurchases();
      if (result && result.purchases && result.purchases.length > 0) {
        const activeSub = result.purchases.find((p: any) => 
          p.productId.includes('premium') && p.state === 'ACTIVE'
        );
        
        if (activeSub) {
          // Update cached status
          localStorage.setItem('subscriptionStatus', JSON.stringify({
            subscribed: true,
            plan: activeSub.productId,
            expirationDate: activeSub.expiryDate
          }));
          
          return { isActive: true, plan: activeSub.productId };
        }
      }
      
      // Clear cached status if no active subscription found
      localStorage.removeItem('subscriptionStatus');
      return { isActive: false, plan: null };
    } else {
      // Web implementation - check with Supabase backend
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { isActive: false, plan: null };
      }
      
      // Get subscription from database
      try {
        const { data, error } = await supabase
          .from('subscribers')
          .select('subscribed, subscription_tier, subscription_end')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error("Error fetching subscription:", error);
          return { isActive: false, plan: null };
        }
        
        if (data && data.subscribed) {
          // Update cached status
          localStorage.setItem('subscriptionStatus', JSON.stringify({
            subscribed: true,
            plan: data.subscription_tier,
            expirationDate: data.subscription_end
          }));
          
          return { isActive: true, plan: data.subscription_tier };
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
      }
      
      // Clear cached status if no active subscription found
      localStorage.removeItem('subscriptionStatus');
      return { isActive: false, plan: null };
    }
  } catch (error) {
    console.error("Error checking subscription:", error);
    
    // Fallback to cached status if available
    const cachedStatus = localStorage.getItem('subscriptionStatus');
    if (cachedStatus) {
      const status = JSON.parse(cachedStatus);
      return { isActive: status.subscribed, plan: status.plan };
    }
    
    return { isActive: false, plan: null };
  }
};

// Create Stripe customer portal session (for managing subscription on web)
export const createCustomerPortalSession = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('customer-portal', {
      body: {}
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data.url;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return null;
  }
};
