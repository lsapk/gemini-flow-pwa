import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, date } = await req.json();
    console.log('Request received:', { userId, date });
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer la clé API Gemini de l'utilisateur
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('gemini_api_key')
      .eq('id', userId)
      .single();

    if (settingsError || !userSettings?.gemini_api_key) {
      console.error('No Gemini API key found for user:', userId);
      return new Response(
        JSON.stringify({ error: "Clé API Gemini non configurée. Veuillez configurer votre clé dans les paramètres." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiApiKey = userSettings.gemini_api_key;
    console.log('Gemini API key retrieved successfully');

    // Récupérer les données de l'utilisateur
    const targetDate = new Date(date).toISOString().split('T')[0];
    const selectedDay = new Date(date).getDay();

    // Récupérer aussi les événements Google Calendar
    const [tasksRes, habitsRes, goalsRes, calendarTokenRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId).eq('completed', false),
      supabase.from('habits').select('*').eq('user_id', userId).eq('is_archived', false),
      supabase.from('goals').select('*').eq('user_id', userId).eq('completed', false),
      supabase.from('google_calendar_tokens').select('*').eq('user_id', userId).single()
    ]);

    const tasks = tasksRes.data || [];
    const habits = habitsRes.data?.filter((h: any) => 
      !h.days_of_week || h.days_of_week.length === 0 || h.days_of_week.includes(selectedDay)
    ) || [];
    const goals = goalsRes.data || [];
    
    // Charger les événements Google Calendar pour la semaine
    let calendarEvents: any[] = [];
    if (calendarTokenRes.data) {
      try {
        const weekStart = new Date(date);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        const { data: eventsData } = await supabase.functions.invoke('google-calendar-api', {
          body: {
            action: 'list',
            user_id: userId,
            time_min: weekStart.toISOString(),
            time_max: weekEnd.toISOString()
          }
        });
        
        calendarEvents = eventsData?.items || [];
      } catch (e) {
        console.log('Could not load calendar events:', e);
      }
    }

    const prompt = `Tu es un assistant de productivité expert. Analyse les données suivantes de l'utilisateur et fournis des suggestions personnalisées pour optimiser sa journée du ${targetDate}.

Données de l'utilisateur:
- Tâches en cours (${tasks.length}): ${tasks.map((t: any) => `"${t.title}" (priorité: ${t.priority || 'medium'}, échéance: ${t.due_date || 'non définie'})`).join(', ')}
- Habitudes du jour (${habits.length}): ${habits.map((h: any) => `"${h.title}" (fréquence: ${h.frequency})`).join(', ')}
- Objectifs en cours (${goals.length}): ${goals.map((g: any) => `"${g.title}" (progression: ${g.progress || 0}%, échéance: ${g.target_date || 'non définie'})`).join(', ')}
- Événements Google Calendar (${calendarEvents.length}): ${calendarEvents.map((e: any) => `"${e.summary}" (${e.start?.dateTime || e.start?.date} - ${e.end?.dateTime || e.end?.date})`).join(', ')}

Fournis des suggestions concrètes et actionnables dans les catégories suivantes:
1. 📅 **Planning de la journée**: Propose un ordre optimal pour accomplir les tâches avec des horaires suggérés en tenant compte des événements du calendrier
2. 🎯 **Tâches prioritaires**: Identifie les 3 tâches les plus importantes à faire aujourd'hui
3. 💪 **Habitudes**: Suggère le meilleur moment pour pratiquer les habitudes du jour en évitant les conflits avec les événements
4. 🚀 **Avancement des objectifs**: Propose des actions concrètes pour faire progresser les objectifs
5. ➕ **Événements à créer**: Si tu identifies des besoins (rendez-vous, blocs de temps pour les tâches, etc.), suggère des événements à créer au format JSON dans un bloc de code avec la structure suivante:
\`\`\`json
{
  "suggestedEvents": [
    {
      "title": "Titre de l'événement",
      "description": "Description",
      "startDateTime": "2025-03-19T09:00:00",
      "endDateTime": "2025-03-19T10:00:00"
    }
  ]
}
\`\`\`

**IMPORTANT**: Ta réponse DOIT être formatée en Markdown avec des emojis pour rendre le contenu plus engageant et visuel. Utilise:
- Des titres avec ## et ###
- Des listes à puces avec -
- Des emojis pertinents et variés (🎯, ✅, 📝, 🔥, 💡, ⏰, 🌟, 💪, 🚀, etc.)
- Du texte en **gras** pour les points importants
- Des séparateurs avec ---

Sois concis, motivant et pratique. Limite ta réponse à 400 mots maximum.`;

    console.log('Calling Gemini API...');
    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    console.log('Gemini API response status:', aiResponse.status);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Gemini API error response:', { status: aiResponse.status, body: errorText });
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes dépassée. Veuillez réessayer dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Gemini API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const suggestion = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Aucune suggestion disponible";

    // Extraire les événements suggérés du JSON dans la réponse
    let suggestedEvents = [];
    
    // Chercher du JSON dans la réponse (avec ou sans code blocks)
    const codeBlockMatch = suggestion.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonText = codeBlockMatch ? codeBlockMatch[1] : suggestion;
    
    // Essayer de trouver un tableau ou un objet JSON
    const arrayMatch = jsonText.match(/\[([\s\S]*?)\]/);
    const objectMatch = jsonText.match(/\{[\s\S]*?"suggestedEvents"[\s\S]*?\}/);
    
    if (arrayMatch) {
      try {
        // Si on trouve un tableau directement
        suggestedEvents = JSON.parse(arrayMatch[0]);
        console.log('Extracted events from array:', suggestedEvents.length);
      } catch (e) {
        console.log('Could not parse array format:', e);
      }
    } else if (objectMatch) {
      try {
        // Si on trouve un objet avec suggestedEvents
        const parsed = JSON.parse(objectMatch[0]);
        suggestedEvents = parsed.suggestedEvents || [];
        console.log('Extracted events from object:', suggestedEvents.length);
      } catch (e) {
        console.log('Could not parse object format:', e);
      }
    }
    
    console.log('Final suggested events:', suggestedEvents);

    return new Response(
      JSON.stringify({ 
        suggestion,
        suggestedEvents,
        stats: {
          tasks: tasks.length,
          habits: habits.length,
          goals: goals.length,
          calendarEvents: calendarEvents.length
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in calendar-ai-suggestions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
