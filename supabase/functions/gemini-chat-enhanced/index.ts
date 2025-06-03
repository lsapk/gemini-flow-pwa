
import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1?target=deno";
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
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const { message, chatHistory, userId } = await req.json();
    
    if (!message) {
      throw new Error("Message is required");
    }
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user's language preference
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('language')
      .eq('id', userId)
      .maybeSingle();
      
    const userLanguage = userSettings?.language || "fr" as LanguageCode;

    // Get user's data for context
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle();

    const userName = userData?.display_name || "utilisateur";

    // Get user's tasks, habits, goals, and journal entries
    const [tasksResult, habitsResult, goalsResult, journalResult] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      supabase.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      supabase.from('journal_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10)
    ]);

    const userTasks = tasksResult.data || [];
    const userHabits = habitsResult.data || [];
    const userGoals = goalsResult.data || [];
    const userJournalEntries = journalResult.data || [];

    // Initialize the Google Generative AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Enhanced system prompt with user data access and action capabilities
    const systemPrompt = `Tu es DeepFlow, un assistant IA spécialisé dans la productivité, le bien-être et le développement personnel pour ${userName}. 

DONNÉES UTILISATEUR DISPONIBLES:
- Tâches: ${JSON.stringify(userTasks)}
- Habitudes: ${JSON.stringify(userHabits)}
- Objectifs: ${JSON.stringify(userGoals)}
- Entrées de journal: ${JSON.stringify(userJournalEntries)}

CAPACITÉS D'ACTION:
Tu peux créer de nouveaux éléments pour l'utilisateur UNIQUEMENT quand il te le demande EXPLICITEMENT en répondant avec des objets JSON dans ce format:

Pour créer une TÂCHE (seulement si demandé):
{"action": "create_task", "data": {"title": "Titre de la tâche", "description": "Description optionnelle", "priority": "high|medium|low", "due_date": "2024-01-01T00:00:00.000Z"}}

Pour créer une HABITUDE (seulement si demandé):
{"action": "create_habit", "data": {"title": "Titre de l'habitude", "description": "Description optionnelle", "frequency": "daily|weekly|monthly", "target": 1, "category": "health|productivity|personal"}}

Pour créer un OBJECTIF (seulement si demandé):
{"action": "create_goal", "data": {"title": "Titre de l'objectif", "description": "Description optionnelle", "target_date": "2024-01-01T00:00:00.000Z", "category": "personal|professional|health"}}

Pour créer une ENTRÉE DE JOURNAL (seulement si demandé):
{"action": "create_journal", "data": {"title": "Titre de l'entrée", "content": "Contenu de l'entrée", "mood": "excellent|good|neutral|bad|terrible"}}

Pour marquer une HABITUDE comme COMPLÉTÉE (seulement si demandé):
{"action": "complete_habit", "data": {"habit_id": "id_de_l_habitude"}}

RÈGLES IMPORTANTES:
- NE crée JAMAIS automatiquement des tâches, habitudes, objectifs ou entrées de journal
- Utilise les actions JSON UNIQUEMENT quand l'utilisateur demande EXPLICITEMENT de créer quelque chose
- Mots-clés pour déclencher les actions : "crée", "ajoute", "créer", "ajouter", "nouvelle", "nouveau", "faire une entrée", etc.
- Si l'utilisateur demande juste des conseils ou pose des questions, réponds normalement SANS utiliser d'actions JSON

INSTRUCTIONS:
- Réponds uniquement et clairement à ce qu'on te demande
- Utilise du markdown riche avec des emojis pertinents
- Sois concis mais complet, utilise des listes et titres
- Propose des conseils pratiques et applicables
- Adapte ton ton pour être encourageant et positif
- Analyse les données de l'utilisateur pour donner des conseils personnalisés
- Assure-toi que les dates sont au format ISO 8601 complet
- Pour les habitudes quotidiennes, utilise target: 1`;
    
    const fullPrompt = `${systemPrompt}\n\nQuestion de l'utilisateur: ${message}`;

    const result = await model.generateContent(fullPrompt);
    let responseText = result.response.text();

    // Check if the response contains actions to execute
    const actionRegex = /\{"action":\s*"([^"]+)",\s*"data":\s*\{[^}]+\}\}/g;
    const actions = responseText.match(actionRegex);

    if (actions) {
      for (const actionStr of actions) {
        try {
          const action = JSON.parse(actionStr);
          
          switch (action.action) {
            case "create_task":
              await supabase.from('tasks').insert({
                ...action.data,
                user_id: userId
              });
              break;
              
            case "create_habit":
              await supabase.from('habits').insert({
                ...action.data,
                user_id: userId
              });
              break;
              
            case "create_goal":
              await supabase.from('goals').insert({
                ...action.data,
                user_id: userId
              });
              break;
              
            case "create_journal":
              await supabase.from('journal_entries').insert({
                ...action.data,
                user_id: userId
              });
              break;
              
            case "complete_habit":
              // Mark habit as completed today
              const today = new Date().toISOString().split('T')[0];
              await supabase.from('habit_completions').upsert({
                habit_id: action.data.habit_id,
                user_id: userId,
                completed_at: new Date().toISOString(),
                created_by_ai: true
              });
              
              // Update habit streak and last_completed_at
              await supabase.from('habits')
                .update({ 
                  last_completed_at: new Date().toISOString(),
                  streak: supabase.rpc('increment_habit_streak', { habit_id: action.data.habit_id })
                })
                .eq('id', action.data.habit_id);
              break;
          }
          
          // Remove the action JSON from the response
          responseText = responseText.replace(actionStr, "");
        } catch (error) {
          console.error("Error executing action:", error);
        }
      }
    }

    // Clean up any remaining JSON artifacts
    responseText = responseText.replace(/\s*\{"action"[^}]*\}\s*/g, "").trim();

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
