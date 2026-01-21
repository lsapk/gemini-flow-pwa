import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not set in environment variables");
    }

    // Get Supabase credentials from environment
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Parse and validate request body
    const body = await req.json();
    const { message, chatHistory, userId } = body;
    
    // Input validation
    if (!message || typeof message !== 'string') {
      throw new Error("Message is required and must be a string");
    }
    
    if (message.length > 5000) {
      throw new Error("Message is too long (max 5000 characters)");
    }
    
    if (!userId || typeof userId !== 'string') {
      throw new Error("User ID is required and must be a string");
    }
    
    // Sanitize message - remove ALL HTML tags to prevent XSS
    // This is more secure than pattern-matching specific tags
    const sanitizedMessage = message
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=, onerror=, etc.
      .replace(/data:/gi, 'data-blocked:') // Block data: URLs which can contain executable content
      .trim();

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

    // If user is not premium, check request limits and AI credits
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
      const BASE_FREE_REQUESTS = 5;
      
      // Check if user has AI credits (25 credits = 1 extra request)
      const { data: aiCreditsData } = await supabase
        .from('ai_credits')
        .select('credits')
        .eq('user_id', userId)
        .maybeSingle();
      
      const aiCredits = aiCreditsData?.credits || 0;
      const bonusRequests = Math.floor(aiCredits / 25);
      const totalAllowedRequests = BASE_FREE_REQUESTS + bonusRequests;
      
      // If user has reached the base limit, try to use AI credits
      if (requestsToday >= BASE_FREE_REQUESTS) {
        if (bonusRequests > 0 && requestsToday < totalAllowedRequests) {
          // Deduct 25 credits for this extra request
          const newCredits = aiCredits - 25;
          await supabase
            .from('ai_credits')
            .update({ credits: newCredits, last_updated: new Date().toISOString() })
            .eq('user_id', userId);
            
          console.log(`Used 25 AI credits for bonus request. Credits remaining: ${newCredits}`);
        } else if (requestsToday >= totalAllowedRequests) {
          // No more requests available
          const limitMessage = {
            fr: `⚠️ **Limite atteinte**\n\nVous avez atteint votre limite de ${BASE_FREE_REQUESTS} requêtes quotidiennes gratuites${bonusRequests > 0 ? ` + ${bonusRequests} requêtes bonus (crédits IA épuisés)` : ''}. Achetez des crédits IA dans la boutique (25 crédits = 1 requête) ou passez à un abonnement premium pour un accès illimité.`,
            en: `⚠️ **Limit reached**\n\nYou have reached your limit of ${BASE_FREE_REQUESTS} free daily requests${bonusRequests > 0 ? ` + ${bonusRequests} bonus requests (AI credits exhausted)` : ''}. Buy AI credits in the shop (25 credits = 1 request) or upgrade to premium for unlimited access.`,
            es: `⚠️ **Límite alcanzado**\n\nHas alcanzado tu límite de ${BASE_FREE_REQUESTS} solicitudes diarias gratuitas${bonusRequests > 0 ? ` + ${bonusRequests} solicitudes extra (créditos IA agotados)` : ''}. Compra créditos IA en la tienda (25 créditos = 1 solicitud) o actualiza a premium para acceso ilimitado.`,
            de: `⚠️ **Limit erreicht**\n\nSie haben Ihr Limit von ${BASE_FREE_REQUESTS} kostenlosen täglichen Anfragen erreicht${bonusRequests > 0 ? ` + ${bonusRequests} Bonusanfragen (KI-Credits erschöpft)` : ''}. Kaufen Sie KI-Credits im Shop (25 Credits = 1 Anfrage) oder upgraden Sie auf Premium für unbegrenzten Zugriff.`
          };
          
          return new Response(
            JSON.stringify({ response: limitMessage[userLanguage] || limitMessage.fr }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
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

    // Create simple prompt with system instructions at the beginning
    const systemPrompt = `Tu es DeepFlow, un assistant IA spécialisé dans la productivité, le bien-être et le développement personnel. Tu réponds uniquement et clairement à ce qu'on te demande. Utilise du markdown riche avec des emojis pertinents pour structurer tes réponses. Sois concis mais complet, en utilisant des listes et des titres pour organiser l'information. Propose toujours des conseils pratiques et applicables immédiatement. Adapte ton ton pour être encourageant et positif.`;
    
    // Call Lovable AI gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: sanitizedMessage }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to your Lovable workspace.');
      }
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || '';

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
