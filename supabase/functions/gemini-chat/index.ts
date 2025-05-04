
// Follow this setup guide to integrate the Deno runtime and Gemini into your Supabase project:
// https://supabase.com/docs/guides/functions/ai/google-ai?utm_source=create-supabase-app
import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.2.0";
import { createClient } from "npm:@supabase/supabase-js@2";

// Initialize Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") || "");

// Set up the model configuration - Using gemini-1.5-flash for improved performance
const modelName = "gemini-1.5-flash";
const model = genAI.getGenerativeModel({ model: modelName });

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Track request counts for freemium limiting
async function trackUserRequest(userId: string): Promise<boolean> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    // Get user's subscription status
    const { data: subscriptionData } = await supabase
      .from('subscribers')
      .select('subscribed')
      .eq('user_id', userId)
      .single();
      
    const isPremium = subscriptionData?.subscribed || false;
    
    // Premium users have unlimited access
    if (isPremium) {
      return true;
    }
    
    // For free users, count and limit requests
    const { count, error } = await supabase
      .from('ai_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());
      
    if (error) {
      console.error("Error checking request count:", error);
      return true; // Allow on error to prevent blocking users
    }
    
    // Free users are limited to 5 requests per day
    if ((count || 0) >= 5) {
      return false; // Limit exceeded
    }
    
    // Track this request
    await supabase.from('ai_requests').insert({
      user_id: userId,
      service: 'chat',
      created_at: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error("Error tracking AI request:", error);
    return true; // Allow on error to prevent blocking users
  }
}

// Get user's preferred language
async function getUserLanguage(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('language')
      .eq('id', userId)
      .single();
      
    if (error || !data) {
      return 'fr'; // Default to French
    }
    
    return data.language || 'fr';
  } catch (error) {
    console.error("Error getting user language:", error);
    return 'fr'; // Default to French
  }
}

// Format responses based on language preferences
function getSystemPromptForLanguage(language: string): string {
  const basePrompt = `
You are DeepFlow AI, a supportive and insightful personal assistant focused on productivity, 
mindfulness, and personal development. Your goal is to help users enhance their daily routines, 
develop better habits, achieve their goals, and maintain focus.

Key aspects of your personality:
- Supportive and encouraging, but not overly enthusiastic
- Professional yet warm
- Concise and practical in your advice
- Data-driven when relevant
- Respectful of the user's time and priorities

Always format your responses using Markdown with clear headings, bullet points, and occasional emoji
to improve readability and engagement. Organize information logically with short paragraphs.

Always respond in ${language === 'fr' ? 'French' : language === 'en' ? 'English' : language === 'es' ? 'Spanish' : language === 'de' ? 'German' : 'French'}.
Provide concrete, actionable advice rather than vague motivational statements.
`;

  return basePrompt;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, chatHistory = [], userId } = await req.json();
    
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    // Check if user has exceeded daily limit
    const canProceed = await trackUserRequest(userId);
    if (!canProceed) {
      return new Response(
        JSON.stringify({ 
          error: "Daily limit exceeded", 
          response: "⚠️ **Limite quotidienne atteinte**\n\nVous avez atteint votre limite quotidienne de 5 requêtes gratuites. Passez à la version premium pour un accès illimité à l'assistant IA." 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429
        }
      );
    }
    
    // Get user's preferred language
    const preferredLanguage = await getUserLanguage(userId);
    
    console.log("Processing chat request with model:", modelName);
    console.log("Chat history length:", chatHistory.length);
    console.log("User preferred language:", preferredLanguage);

    // Prepare the chat history for Gemini
    const formattedHistory = chatHistory.map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));
    
    // System prompt based on language preference
    const systemPrompt = getSystemPromptForLanguage(preferredLanguage);

    // Start a chat session
    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    });

    // First send the system prompt to set the tone and formatting preferences
    await chat.sendMessage(systemPrompt);
    
    // Then generate a response to the user message
    const result = await chat.sendMessage(message);
    const response = result.response.text();

    console.log("Received response from Gemini chat API");

    // Return the AI response
    return new Response(
      JSON.stringify({
        response,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in gemini-chat function:", error);
    
    // Provide more detailed error information for debugging
    const errorResponse = {
      error: error.message,
      details: error.toString(),
      modelAttempted: modelName,
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
