
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
      'com.deepflow.premium.yearly'
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
    console.warn("Purchase attempted in non-native environment");
    return false;
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
    // Here you would call your Supabase Edge Function to validate and record the purchase
    // Example:
    // await supabase.functions.invoke('validate-purchase', {
    //   body: { purchaseInfo }
    // });
    
    console.log("Purchase validated:", purchaseInfo);
  } catch (error) {
    console.error("Purchase validation error:", error);
  }
};

// Get subscription status
export const getSubscriptionStatus = async (): Promise<{isActive: boolean, plan: string | null}> => {
  try {
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
          return { isActive: true, plan: activeSub.productId };
        }
      }
      
      return { isActive: false, plan: null };
    } else {
      // Web implementation could check with your backend
      return { isActive: false, plan: null };
    }
  } catch (error) {
    console.error("Error checking subscription:", error);
    return { isActive: false, plan: null };
  }
};
