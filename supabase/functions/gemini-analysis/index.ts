import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
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
1. Sois CONCIS et va droit au but, utilise des phrases courtes
2. Utilise des emojis pertinents pour rendre ta réponse plus vivante
3. Structure ta réponse avec quelques titres simples
4. Propose des recommandations concrètes et actionnables
5. Ne dépasse pas 3-4 paragraphes au total
6. Adopte le ton d'un véritable analyste personnel ou coach, pas celui d'une IA
7. Réponds comme si tu parlais directement à l'utilisateur

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
1. Be CONCISE and straight to the point, use short sentences
2. Use relevant emojis to make your response more lively
3. Structure your response with a few simple headings
4. Offer concrete and actionable recommendations
5. Don't exceed 3-4 paragraphs in total
6. Adopt the tone of a real personal analyst or coach, not that of an AI
7. Respond as if you're speaking directly to the user

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
1. Sé CONCISO y ve al grano, utiliza frases cortas
2. Utiliza emojis relevantes para hacer tu respuesta más animada
3. Estructura tu respuesta con algunos títulos simples
4. Ofrece recomendaciones concretas y procesables
5. No excedas 3-4 párrafos en total
6. Adopta el tono de un verdadero analista personal o coach, no el de una IA
7. Responde como si estuvieras hablando directamente al usuario

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
1. Sei PRÄZISE und komme auf den Punkt, verwende kurze Sätze
2. Verwende relevante Emojis, um deine Antwort lebendiger zu gestalten
3. Strukturiere deine Antwort mit einigen einfachen Überschriften
4. Biete konkrete und umsetzbare Empfehlungen an
5. Überschreite nicht 3-4 Absätze insgesamt
6. Nimm den Ton eines echten persönlichen Analysten oder Coaches an, nicht den einer KI
7. Antworte, als würdest du direkt mit dem Benutzer sprechen

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not set in environment variables");
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

    // ALL USERS ARE CONSIDERED PREMIUM NOW - Removing the premium check
    // No limits will be applied

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

    // Create the custom prompt based on user's language and data
    const customPrompt = createCustomPrompt(prompt, userData, userLanguage);
    
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
          { role: 'user', content: customPrompt }
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
