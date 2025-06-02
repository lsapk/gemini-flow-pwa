
import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.2?target=deno";

// Define CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type LanguageCode = "fr" | "en" | "es" | "de";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API key from environment variable
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }

    // Get Supabase credentials from environment
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Parse request body
    const { message, chatHistory, userId } = await req.json();
    
    if (!message) {
      throw new Error("Message is required");
    }
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Initialize Supabase client with service role for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user's language preference
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('language')
      .eq('id', userId)
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching user settings:", settingsError);
    }
      
    const userLanguage = userSettings?.language || "fr" as LanguageCode;

    // Check user premium status
    let isPremium = false;
    
    try {
      // Check if user is subscribed
      const { data: subscriptionData } = await supabase
        .from('subscribers')
        .select('subscribed')
        .eq('user_id', userId)
        .single();
        
      isPremium = subscriptionData?.subscribed === true;
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }

    // If user is not premium, check request limits
    if (!isPremium) {
      // Get today's date (UTC midnight)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Count user's requests today
      const { count, error } = await supabase
        .from('ai_requests')
        .select('*', { count: 'exact', head: false })
        .eq('service', 'chat')
        .eq('user_id', userId)
        .gte('created_at', today.toISOString());
        
      if (error) {
        throw new Error(`Error checking AI request limit: ${error.message}`);
      }
      
      const requestsToday = count || 0;
      
      // If user has reached the limit, return an error
      if (requestsToday >= 5) {
        const limitMessage = {
          fr: "⚠️ **Limite atteinte**\n\nVous avez atteint votre limite de 5 requêtes quotidiennes avec le compte gratuit. Passez à un abonnement premium pour bénéficier d'un accès illimité.",
          en: "⚠️ **Limit reached**\n\nYou have reached your limit of 5 daily requests with the free account. Upgrade to a premium subscription for unlimited access.",
          es: "⚠️ **Límite alcanzado**\n\nHas alcanzado tu límite de 5 solicitudes diarias con la cuenta gratuita. Actualiza a una suscripción premium para obtener acceso ilimitado.",
          de: "⚠️ **Limit erreicht**\n\nSie haben Ihr Limit von 5 täglichen Anfragen mit dem kostenlosen Konto erreicht. Upgrade auf ein Premium-Abonnement für unbegrenzten Zugriff."
        };
        
        return new Response(
          JSON.stringify({ response: limitMessage[userLanguage] || limitMessage.fr }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Track this request in the database
    try {
      await supabase
        .from('ai_requests')
        .insert({ 
          service: 'chat',
          user_id: userId
        });
    } catch (error) {
      console.error("Error tracking AI request:", error);
      // Continue execution even if tracking fails
    }

    // Initialize the Google Generative AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Create a generative model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    // Create simple prompt with system instructions at the beginning
    const systemPrompt = `Tu es DeepFlow, un assistant IA spécialisé dans la productivité, le bien-être et le développement personnel. Tu réponds uniquement et clairement à ce qu'on te demande. Utilise du markdown riche avec des emojis pertinents pour structurer tes réponses. Sois concis mais complet, en utilisant des listes et des titres pour organiser l'information. Propose toujours des conseils pratiques et applicables immédiatement. Adapte ton ton pour être encourageant et positif.`;
    
    const fullPrompt = `${systemPrompt}\n\nQuestion de l'utilisateur: ${message}`;

    // Send message and get response
    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text();

    return new Response(
      JSON.stringify({ response: responseText }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing chat request:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
