import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.2?target=deno";

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not set in environment variables");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !authData?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    const body = await req.json();
    const { message, chatHistory } = body;
    
    if (!message || typeof message !== 'string') {
      throw new Error("Message is required and must be a string");
    }
    
    if (message.length > 5000) {
      throw new Error("Message is too long (max 5000 characters)");
    }
    
    const sanitizedMessage = message
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:/gi, 'data-blocked:')
      .trim();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('language')
      .eq('id', userId)
      .maybeSingle();

    const userLanguage = userSettings?.language || "fr" as LanguageCode;

    let isPremium = false;
    try {
      const { data: subscriptionData } = await supabase
        .from('subscribers')
        .select('subscribed')
        .eq('user_id', userId)
        .single();
      isPremium = subscriptionData?.subscribed === true;
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }

    if (!isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
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
      
      const { data: aiCreditsData } = await supabase
        .from('ai_credits')
        .select('credits')
        .eq('user_id', userId)
        .maybeSingle();
      
      const aiCredits = aiCreditsData?.credits || 0;
      const bonusRequests = Math.floor(aiCredits / 25);
      const totalAllowedRequests = BASE_FREE_REQUESTS + bonusRequests;
      
      if (requestsToday >= BASE_FREE_REQUESTS) {
        if (bonusRequests > 0 && requestsToday < totalAllowedRequests) {
          const { data: newCredits, error: rpcError } = await supabase
            .rpc('decrement_ai_credits', { p_user_id: userId, amount: 25 });

          if (rpcError) {
            console.error("Error decrementing AI credits:", rpcError);
            throw new Error("Failed to consume AI credits");
          }

          if (newCredits === null) {
            throw new Error("Insufficient AI credits");
          }
        } else if (requestsToday >= totalAllowedRequests) {
          const limitMessage: Record<string, string> = {
            fr: `⚠️ **Limite atteinte**\n\nVous avez atteint votre limite de ${BASE_FREE_REQUESTS} requêtes quotidiennes gratuites. Passez à premium pour un accès illimité.`,
            en: `⚠️ **Limit reached**\n\nYou have reached your limit of ${BASE_FREE_REQUESTS} free daily requests. Upgrade to premium for unlimited access.`,
            es: `⚠️ **Límite alcanzado**\n\nHas alcanzado tu límite de ${BASE_FREE_REQUESTS} solicitudes diarias gratuitas. Actualiza a premium para acceso ilimitado.`,
            de: `⚠️ **Limit erreicht**\n\nSie haben Ihr Limit von ${BASE_FREE_REQUESTS} kostenlosen täglichen Anfragen erreicht. Upgraden Sie auf Premium für unbegrenzten Zugriff.`
          };
          
          return new Response(
            JSON.stringify({ response: limitMessage[userLanguage as string] || limitMessage.fr }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    try {
      await supabase.from('ai_requests').insert({ service: 'chat', user_id: userId });
    } catch (error) {
      console.error("Error tracking AI request:", error);
    }

    const systemPrompt = `Tu es DeepFlow, un assistant IA spécialisé dans la productivité, le bien-être et le développement personnel. Tu réponds uniquement et clairement à ce qu'on te demande. Utilise du markdown riche avec des emojis pertinents pour structurer tes réponses. Sois concis mais complet, en utilisant des listes et des titres pour organiser l'information. Propose toujours des conseils pratiques et applicables immédiatement. Adapte ton ton pour être encourageant et positif.`;

    // Build messages array including chat history for context
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Include last 10 messages from chat history for conversational context
    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-10);
      for (const msg of recentHistory) {
        if (msg.role && msg.content && typeof msg.content === 'string') {
          messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content.substring(0, 2000) // Limit each historical message
          });
        }
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: sanitizedMessage });
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing chat request:", (error as Error).message);
    
    return new Response(
      JSON.stringify({ error: "Une erreur interne est survenue." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
