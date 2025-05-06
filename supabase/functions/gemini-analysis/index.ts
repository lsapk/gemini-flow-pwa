
import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.2?target=deno";

// Define CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type LanguageCode = "fr" | "en" | "es" | "de";

// Helper function to create a custom prompt based on the user's request
function createCustomPrompt(prompt: string, userData: any, language: LanguageCode = "fr"): string {
  const tasksData = userData.tasks || [];
  const habitsData = userData.habits || [];
  const journalData = userData.journal || [];
  const goalsData = userData.goals || [];
  const focusData = userData.focus || [];
  
  // Simplify data to make it more digestible for the AI
  const simplifiedData = {
    tasks: tasksData.map((t: any) => ({
      title: t.title,
      completed: t.completed,
      dueDate: t.due_date,
      priority: t.priority
    })).slice(0, 20),
    habits: habitsData.map((h: any) => ({
      title: h.title,
      streak: h.streak,
      frequency: h.frequency
    })).slice(0, 20),
    journal: journalData.map((j: any) => ({
      title: j.title,
      mood: j.mood,
      date: j.created_at
    })).slice(0, 10),
    goals: goalsData.map((g: any) => ({
      title: g.title,
      progress: g.progress,
      targetDate: g.target_date
    })).slice(0, 10),
    focus: focusData.map((f: any) => ({
      title: f.title,
      duration: f.duration,
      date: f.created_at
    })).slice(0, 15)
  };
  
  const dataContext = JSON.stringify(simplifiedData, null, 2);

  const basePrompts = {
    fr: `Tu es DeepFlow, un assistant IA spécialisé en analyse de productivité et bien-être. Analyse la demande de l'utilisateur en tenant compte de ses données personnelles.

Voici les données réelles de l'utilisateur :
${dataContext}

Format de réponse souhaité :
1. Utilise du markdown riche avec des emojis pertinents
2. Structure ta réponse avec des titres et sous-titres
3. Sois précis et concis, en utilisant des listes à puces lorsque c'est approprié
4. Propose des recommandations concrètes et actionnables basées spécifiquement sur les données de l'utilisateur
5. Conclus de façon encourageante et positive

Si la demande de l'utilisateur implique des données qui pourraient être représentées visuellement, génère également des données pour un ou plusieurs graphiques sous forme de JSON. Par exemple :

\`\`\`json
{
  "charts": {
    "pie": [
      {"name": "Catégorie A", "value": 40},
      {"name": "Catégorie B", "value": 30},
      {"name": "Catégorie C", "value": 20},
      {"name": "Catégorie D", "value": 10}
    ]
  }
}
\`\`\`

Types de graphiques possibles : "bar", "line", "pie", "area"

Demande de l'utilisateur : "${prompt}"`,

    en: `You are DeepFlow, an AI assistant specialized in productivity and wellbeing analysis. Analyze the user's request taking into account their personal data.

Here is the user's actual data:
${dataContext}

Desired response format:
1. Use rich markdown with relevant emojis
2. Structure your response with headings and subheadings
3. Be precise and concise, using bullet points when appropriate
4. Offer concrete and actionable recommendations specifically based on the user's data
5. Conclude in an encouraging and positive way

If the user's request involves data that could be visually represented, also generate data for one or more charts in JSON format. For example:

\`\`\`json
{
  "charts": {
    "pie": [
      {"name": "Category A", "value": 40},
      {"name": "Category B", "value": 30},
      {"name": "Category C", "value": 20},
      {"name": "Category D", "value": 10}
    ]
  }
}
\`\`\`

Possible chart types: "bar", "line", "pie", "area"

User request: "${prompt}"`,

    es: `Eres DeepFlow, un asistente de IA especializado en análisis de productividad y bienestar. Analiza la solicitud del usuario teniendo en cuenta sus datos personales.

Aquí están los datos reales del usuario:
${dataContext}

Formato de respuesta deseado:
1. Utiliza markdown enriquecido con emojis relevantes
2. Estructura tu respuesta con títulos y subtítulos
3. Sé preciso y conciso, utilizando viñetas cuando sea apropiado
4. Ofrece recomendaciones concretas y procesables basadas específicamente en los datos del usuario
5. Concluye de manera alentadora y positiva

Si la solicitud del usuario involucra datos que podrían representarse visualmente, genera también datos para uno o más gráficos en formato JSON. Por ejemplo:

\`\`\`json
{
  "charts": {
    "pie": [
      {"name": "Categoría A", "value": 40},
      {"name": "Categoría B", "value": 30},
      {"name": "Categoría C", "value": 20},
      {"name": "Categoría D", "value": 10}
    ]
  }
}
\`\`\`

Tipos de gráficos posibles: "bar", "line", "pie", "area"

Solicitud del usuario: "${prompt}"`,

    de: `Du bist DeepFlow, ein KI-Assistent, der auf Produktivitäts- und Wohlbefindensanalyse spezialisiert ist. Analysiere die Anfrage des Benutzers unter Berücksichtigung seiner persönlichen Daten.

Hier sind die tatsächlichen Daten des Benutzers:
${dataContext}

Gewünschtes Antwortformat:
1. Verwende umfangreiches Markdown mit relevanten Emojis
2. Strukturiere deine Antwort mit Überschriften und Unterüberschriften
3. Sei präzise und prägnant, verwende Aufzählungspunkte, wenn es angebracht ist
4. Biete konkrete und umsetzbare Empfehlungen an, die speziell auf den Daten des Benutzers basieren
5. Schließe auf eine ermutigende und positive Weise ab

Wenn die Anfrage des Benutzers Daten enthält, die visuell dargestellt werden könnten, generiere auch Daten für eine oder mehrere Diagramme im JSON-Format. Zum Beispiel:

\`\`\`json
{
  "charts": {
    "pie": [
      {"name": "Kategorie A", "value": 40},
      {"name": "Kategorie B", "value": 30},
      {"name": "Kategorie C", "value": 20},
      {"name": "Kategorie D", "value": 10}
    ]
  }
}
\`\`\`

Mögliche Diagrammtypen: "bar", "line", "pie", "area"

Benutzeranfrage: "${prompt}"`
  };

  return basePrompts[language] || basePrompts.fr;
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
    const { prompt, userId } = await req.json();
    
    if (!prompt) {
      throw new Error("Prompt is required");
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

    // Fetch user data to provide context
    const userData = {
      tasks: [],
      habits: [],
      journal: [],
      goals: [],
      focus: []
    };

    // Fetch tasks data
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!tasksError) {
      userData.tasks = tasksData || [];
    }
    
    // Fetch habits data
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!habitsError) {
      userData.habits = habitsData || [];
    }
    
    // Fetch journal entries
    const { data: journalData, error: journalError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!journalError) {
      userData.journal = journalData || [];
    }
    
    // Fetch goals
    const { data: goalsData, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!goalsError) {
      userData.goals = goalsData || [];
    }
    
    // Fetch focus sessions
    const { data: focusData, error: focusError } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!focusError) {
      userData.focus = focusData || [];
    }

    // Check user premium status
    let isPremium = false;
    
    try {
      // Check if user is subscribed
      const { data: subscriptionData } = await supabase
        .from('subscribers')
        .select('subscribed')
        .eq('user_id', userId)
        .single();
      
      // Simpler approach: assume user has premium access if they're subscribed
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
        .eq('service', 'analysis')
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
          JSON.stringify({ content: limitMessage[userLanguage] || limitMessage.fr }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Track this request in the database
    try {
      await supabase
        .from('ai_requests')
        .insert({ 
          service: 'analysis',
          user_id: userId
        });
    } catch (error) {
      console.error("Error tracking AI request:", error);
      // Continue execution even if tracking fails
    }

    // Initialize the Google Generative AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Create a generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Create the custom prompt based on user's language and data
    const customPrompt = createCustomPrompt(prompt, userData, userLanguage);
    
    // Generate content
    const result = await model.generateContent(customPrompt);
    const responseText = result.response.text();
    
    // Process the response to extract chart data if present
    let content = responseText;
    let charts = {};
    
    // Look for JSON chart data in the response
    const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        if (jsonData.charts) {
          charts = jsonData.charts;
          
          // Remove the JSON block from the content
          content = responseText.replace(/```json\s*(\{[\s\S]*?\})\s*```/, '');
        }
      } catch (e) {
        console.error("Error parsing JSON chart data:", e);
      }
    }

    return new Response(
      JSON.stringify({ 
        content,
        charts
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating analysis:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        content: "⚠️ **Une erreur est survenue**\n\nImpossible de générer l'analyse pour le moment. Veuillez réessayer plus tard."
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
