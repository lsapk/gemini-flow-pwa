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
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: "Service IA non configuré" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
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
1. 📅 **Planning de la journée**: Propose un ordre optimal pour accomplir les tâches avec des horaires suggérés (format: 09h00 - 10h00)
2. 🎯 **Tâches prioritaires**: Identifie les 3 tâches les plus importantes
3. 💪 **Habitudes**: Suggère le meilleur moment pour les habitudes (format: 09h00 - 10h00)
4. 🚀 **Avancement des objectifs**: Propose des actions concrètes avec horaires (format: 09h00 - 10h00)
5. ➕ **Événements à créer**: Utilise la fonction suggest_events pour proposer des événements avec des horaires précis

**IMPORTANT**: 
- Ta réponse DOIT être formatée en Markdown avec des emojis
- Pour chaque activité suggérée, INDIQUE TOUJOURS un créneau horaire au format "09h00 - 10h00"
- Sois concis, motivant et pratique
- Limite ta réponse à 400 mots maximum`;

    console.log('Calling Gemini API with function calling...');
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
          tools: [{
            functionDeclarations: [{
              name: "suggest_events",
              description: "Suggère des événements de calendrier à créer pour aider l'utilisateur à organiser sa journée",
              parameters: {
                type: "OBJECT",
                properties: {
                  events: {
                    type: "ARRAY",
                    description: "Liste des événements suggérés",
                    items: {
                      type: "OBJECT",
                      properties: {
                        title: {
                          type: "STRING",
                          description: "Titre de l'événement"
                        },
                        description: {
                          type: "STRING",
                          description: "Description de l'événement"
                        },
                        startDateTime: {
                          type: "STRING",
                          description: "Date et heure de début au format ISO (ex: 2025-03-19T09:00:00)"
                        },
                        endDateTime: {
                          type: "STRING",
                          description: "Date et heure de fin au format ISO (ex: 2025-03-19T10:00:00)"
                        }
                      },
                      required: ["title", "startDateTime", "endDateTime"]
                    }
                  }
                },
                required: ["events"]
              }
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
    console.log('Full Gemini response:', JSON.stringify(aiData, null, 2));
    
    const suggestion = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Aucune suggestion disponible";

    // Extraire les événements suggérés via function calling
    let suggestedEvents: any[] = [];
    
    const functionCall = aiData.candidates?.[0]?.content?.parts?.find((part: any) => part.functionCall);
    console.log('Function call found:', !!functionCall);
    
    if (functionCall?.functionCall?.name === "suggest_events") {
      const args = functionCall.functionCall.args;
      suggestedEvents = args?.events || [];
      console.log('Extracted events from function call:', suggestedEvents.length);
    } else {
      // Si pas de function call, essayer d'extraire du texte
      console.log('No function call, parsing text for events');
      const eventMatches = suggestion.match(/\*\*([^*]+)\*\*.*?(\d{1,2}h\d{2})\s*-\s*(\d{1,2}h\d{2})/g);
      if (eventMatches) {
        suggestedEvents = eventMatches.map((match: string) => {
          const titleMatch = match.match(/\*\*([^*]+)\*\*/);
          const timeMatch = match.match(/(\d{1,2}h\d{2})\s*-\s*(\d{1,2}h\d{2})/);
          
          if (titleMatch && timeMatch) {
            const title = titleMatch[1];
            const startTime = timeMatch[1].replace('h', ':');
            const endTime = timeMatch[2].replace('h', ':');
            
            const targetDateStr = new Date(date).toISOString().split('T')[0];
            
            return {
              title,
              description: '',
              startDateTime: `${targetDateStr}T${startTime}:00`,
              endDateTime: `${targetDateStr}T${endTime}:00`
            };
          }
          return null;
        }).filter(Boolean);
        
        console.log('Extracted events from text:', suggestedEvents.length);
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
