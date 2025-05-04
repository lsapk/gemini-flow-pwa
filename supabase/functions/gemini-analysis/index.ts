
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
      service: 'analysis',
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Check if user has exceeded daily limit
    const canProceed = await trackUserRequest(userId);
    if (!canProceed) {
      // Return a formatted message about limit exceeded
      return new Response(
        JSON.stringify({ 
          error: "Daily limit exceeded",
          analysis: "## ⚠️ Limite quotidienne atteinte\n\nVous avez atteint votre limite quotidienne de 5 requêtes gratuites. Passez à la version premium pour un accès illimité à l'analyse IA.",
          stats: null
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429
        }
      );
    }
    
    // Get user's preferred language
    const preferredLanguage = await getUserLanguage(userId);

    // Gather user data for analysis
    const [tasksResult, habitsResult, journalResult, goalsResult, focusResult] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('journal_entries').select('*').eq('user_id', userId).limit(20).order('created_at', { ascending: false }),
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('focus_sessions').select('*').eq('user_id', userId).limit(50).order('created_at', { ascending: false })
    ]);
    
    const tasks = tasksResult.data || [];
    const habits = habitsResult.data || [];
    const journalEntries = journalResult.data || [];
    const goals = goalsResult.data || [];
    const focusSessions = focusResult.data || [];

    console.log("Data fetched successfully:", {
      tasksCount: tasks.length,
      habitsCount: habits.length,
      journalCount: journalEntries.length,
      goalsCount: goals.length,
      focusCount: focusSessions.length
    });

    // Prepare data summary for the AI
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = tasks.length - completedTasks;
    
    const completedGoals = goals.filter(goal => goal.completed).length;
    const inProgressGoals = goals.length - completedGoals;
    
    const totalFocusTime = focusSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const averageFocusSessionLength = focusSessions.length > 0 ? totalFocusTime / focusSessions.length : 0;
    
    // Format data for the AI prompt
    const dataSummary = `
    User Activity Summary:
    - Tasks: ${tasks.length} total, ${completedTasks} completed, ${pendingTasks} pending
    - Habits: ${habits.length} being tracked
    - Goals: ${goals.length} total, ${completedGoals} completed, ${inProgressGoals} in progress
    - Focus: ${focusSessions.length} sessions, ${Math.round(totalFocusTime / 60)} minutes total, ${Math.round(averageFocusSessionLength / 60)} minutes average
    - Journal: ${journalEntries.length} entries
    `;

    // Define the language-specific prompt for analysis
    let promptTemplate;
    if (preferredLanguage === 'fr') {
      promptTemplate = `
      En tant que DeepFlow AI, analysez les données de cet utilisateur et fournissez des insights personnalisés et des recommandations:
      
      ${dataSummary}
      
      Veuillez fournir:
      1. 📊 Une brève analyse de productivité
      2. 🚀 Trois recommandations spécifiques pour s'améliorer
      3. 💪 Une perspective motivante basée sur leurs habitudes
      
      Formatez votre réponse en sections claires avec des émojis et des points pour une lisibilité optimale.
      Utilisez le format Markdown pour structurer votre réponse.
      `;
    } else if (preferredLanguage === 'en') {
      promptTemplate = `
      As DeepFlow AI, analyze this user's data and provide personalized insights and recommendations:
      
      ${dataSummary}
      
      Please provide:
      1. 📊 A brief productivity analysis
      2. 🚀 Three specific recommendations for improvement
      3. 💪 A motivational insight based on their patterns
      
      Format your response in clear sections with emojis and bullet points for easy readability.
      Use Markdown format to structure your response.
      `;
    } else if (preferredLanguage === 'es') {
      promptTemplate = `
      Como DeepFlow AI, analice los datos de este usuario y proporcione información y recomendaciones personalizadas:
      
      ${dataSummary}
      
      Por favor proporcione:
      1. 📊 Un breve análisis de productividad
      2. 🚀 Tres recomendaciones específicas para mejorar
      3. 💪 Una perspectiva motivadora basada en sus patrones
      
      Formatee su respuesta en secciones claras con emojis y viñetas para facilitar la lectura.
      Use formato Markdown para estructurar su respuesta.
      `;
    } else if (preferredLanguage === 'de') {
      promptTemplate = `
      Als DeepFlow AI analysieren Sie die Daten dieses Benutzers und geben personalisierte Einblicke und Empfehlungen:
      
      ${dataSummary}
      
      Bitte geben Sie:
      1. 📊 Eine kurze Produktivitätsanalyse
      2. 🚀 Drei spezifische Verbesserungsempfehlungen
      3. 💪 Eine motivierende Einsicht basierend auf ihren Mustern
      
      Formatieren Sie Ihre Antwort in übersichtliche Abschnitte mit Emojis und Aufzählungspunkten für eine einfache Lesbarkeit.
      Verwenden Sie das Markdown-Format, um Ihre Antwort zu strukturieren.
      `;
    } else {
      // Default to French
      promptTemplate = `
      En tant que DeepFlow AI, analysez les données de cet utilisateur et fournissez des insights personnalisés et des recommandations:
      
      ${dataSummary}
      
      Veuillez fournir:
      1. 📊 Une brève analyse de productivité
      2. 🚀 Trois recommandations spécifiques pour s'améliorer
      3. 💪 Une perspective motivante basée sur leurs habitudes
      
      Formatez votre réponse en sections claires avec des émojis et des points pour une lisibilité optimale.
      Utilisez le format Markdown pour structurer votre réponse.
      `;
    }

    console.log("Sending request to Gemini API with model:", modelName);

    // Generate analysis from Gemini
    const result = await model.generateContent(promptTemplate);
    const response = result.response.text();

    console.log("Received response from Gemini API");

    // Return the analysis
    return new Response(
      JSON.stringify({
        analysis: response,
        stats: {
          tasks: { total: tasks.length, completed: completedTasks, pending: pendingTasks },
          habits: { total: habits.length },
          goals: { total: goals.length, completed: completedGoals, inProgress: inProgressGoals },
          focus: { sessions: focusSessions.length, totalMinutes: Math.round(totalFocusTime / 60) }
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in gemini-analysis function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        modelAttempted: modelName 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
