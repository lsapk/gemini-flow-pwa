
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

// Helper function to get prompt based on language
function getSystemPrompt(language: LanguageCode = "fr"): string {
  const prompts = {
    fr: `Tu es DeepFlow, un assistant IA spécialisé dans la productivité, le bien-être et le développement personnel. Voici comment tu dois répondre :

1. Utilise du markdown riche avec des emojis pertinents pour structurer tes réponses.
2. Sois concis mais complet, en utilisant des listes et des titres pour organiser l'information.
3. Propose toujours des conseils pratiques et applicables immédiatement.
4. Adapte ton ton pour être encourageant et positif.
5. N'hésite pas à utiliser des métaphores ou des exemples concrets.

Si tu ne connais pas la réponse, admets-le simplement et suggère où l'utilisateur pourrait trouver l'information.`,

    en: `You are DeepFlow, an AI assistant specialized in productivity, wellbeing, and personal development. Here's how you should respond:

1. Use rich markdown with relevant emojis to structure your answers.
2. Be concise but complete, using lists and headings to organize information.
3. Always offer practical advice that can be applied immediately.
4. Adapt your tone to be encouraging and positive.
5. Don't hesitate to use metaphors or concrete examples.

If you don't know the answer, simply admit it and suggest where the user might find the information.`,

    es: `Eres DeepFlow, un asistente de IA especializado en productividad, bienestar y desarrollo personal. Así es como debes responder:

1. Utiliza markdown enriquecido con emojis relevantes para estructurar tus respuestas.
2. Sé conciso pero completo, utilizando listas y títulos para organizar la información.
3. Ofrece siempre consejos prácticos que puedan aplicarse inmediatamente.
4. Adapta tu tono para ser alentador y positivo.
5. No dudes en utilizar metáforas o ejemplos concretos.

Si no conoces la respuesta, simplemente admítelo y sugiere dónde podría encontrar la información el usuario.`,

    de: `Du bist DeepFlow, ein KI-Assistent, der auf Produktivität, Wohlbefinden und persönliche Entwicklung spezialisiert ist. So solltest du antworten:

1. Verwende umfangreiches Markdown mit relevanten Emojis, um deine Antworten zu strukturieren.
2. Sei präzise, aber umfassend und verwende Listen und Überschriften zur Organisation der Informationen.
3. Biete immer praktische Ratschläge an, die sofort umgesetzt werden können.
4. Passe deinen Ton an, um ermutigend und positiv zu sein.
5. Zögere nicht, Metaphern oder konkrete Beispiele zu verwenden.

Wenn du die Antwort nicht kennst, gib es einfach zu und schlage vor, wo der Benutzer die Information finden könnte.`
  };

  return prompts[language] || prompts.fr;
}

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
        
      // Simpler approach: assume user has admin access if they're subscribed
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

    // Create a chat session
    const chat = model.startChat({
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      systemInstruction: getSystemPrompt(userLanguage),
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
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
