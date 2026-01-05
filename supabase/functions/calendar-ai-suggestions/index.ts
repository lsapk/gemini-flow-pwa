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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    
    // SECURITY: Verify the user's JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: "Non autorisé - token manquant" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a client with the anon key to verify the user's token
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace("Bearer ", "");
    
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.error('Authentication failed:', userError?.message);
      return new Response(
        JSON.stringify({ error: "Non autorisé - token invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Use the authenticated user's ID, not from request body
    const authenticatedUserId = userData.user.id;
    console.log('Authenticated user:', authenticatedUserId);

    // Parse request body for date only (userId from body is ignored for security)
    const { date } = await req.json();
    console.log('Request received:', { authenticatedUserId, date });
    
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: "Service IA non configuré" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Use service role key for database queries (needed to bypass RLS for internal operations)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Gemini API key retrieved successfully');

    // Récupérer les données de l'utilisateur (using authenticated user ID)
    const targetDate = new Date(date).toISOString().split('T')[0];
    const selectedDay = new Date(date).getDay();

    // Récupérer aussi les événements Google Calendar
    const [tasksRes, habitsRes, goalsRes, calendarTokenRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', authenticatedUserId).eq('completed', false),
      supabase.from('habits').select('*').eq('user_id', authenticatedUserId).eq('is_archived', false),
      supabase.from('goals').select('*').eq('user_id', authenticatedUserId).eq('completed', false),
      supabase.from('google_calendar_tokens').select('*').eq('user_id', authenticatedUserId).single()
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
        
        // Use the original auth header to call the calendar API
        const calendarResponse = await fetch(
          `${supabaseUrl}/functions/v1/google-calendar-api`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
              'apikey': supabaseAnonKey
            },
            body: JSON.stringify({
              action: 'list',
              time_min: weekStart.toISOString(),
              time_max: weekEnd.toISOString()
            })
          }
        );
        
        if (calendarResponse.ok) {
          const eventsData = await calendarResponse.json();
          calendarEvents = eventsData?.items || [];
        }
      } catch (e) {
        console.log('Could not load calendar events:', e);
      }
    }

    const targetDateStr = new Date(date).toISOString().split('T')[0];
    
    const prompt = `Tu es un assistant de productivité expert. Analyse les données suivantes et fournis des suggestions pour la journée du ${targetDate}.

Données de l'utilisateur:
- Tâches: ${tasks.length > 0 ? tasks.map((t: any) => `"${t.title}" (${t.priority || 'medium'})`).join(', ') : 'aucune'}
- Habitudes: ${habits.length > 0 ? habits.map((h: any) => `"${h.title}"`).join(', ') : 'aucune'}
- Objectifs: ${goals.length > 0 ? goals.map((g: any) => `"${g.title}" (${g.progress || 0}%)`).join(', ') : 'aucun'}
- Événements Google Calendar: ${calendarEvents.length > 0 ? calendarEvents.map((e: any) => `"${e.summary}"`).join(', ') : 'aucun'}

INSTRUCTIONS CRITIQUES:
1. Fournis des suggestions en Markdown avec emojis (📅, 🎯, 💪, 🚀)
2. Pour chaque activité suggérée, INCLUS TOUJOURS un horaire au format "09h00 - 10h00"
3. APPELLE OBLIGATOIREMENT la fonction suggest_events avec 3-5 événements concrets basés sur les données
4. Chaque événement doit avoir un titre clair et des horaires précis pour le ${targetDateStr}
5. Limite ta réponse à 300 mots maximum

Format attendu pour les événements suggérés (via suggest_events):
- Titre descriptif et actionnable
- Horaires réalistes et espacés (ex: 09:00, 11:00, 14:00, 16:00)
- Durée adaptée à l'activité (30min à 2h)`;

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
      // Si pas de function call, extraire du texte avec patterns multiples
      console.log('No function call, parsing text for events');
      
      // Pattern 1: **Titre** suivi de horaires
      const pattern1 = /\*\*([^*]+)\*\*.*?(\d{1,2}h\d{2})\s*-\s*(\d{1,2}h\d{2})/g;
      // Pattern 2: - Titre (horaire)
      const pattern2 = /-\s*([^(]+)\s*\((\d{1,2}h\d{2})\s*-\s*(\d{1,2}h\d{2})\)/g;
      // Pattern 3: Horaire: Titre
      const pattern3 = /(\d{1,2}h\d{2})\s*-\s*(\d{1,2}h\d{2})\s*:\s*([^\n]+)/g;
      
      const parseMatch = (title: string, startTime: string, endTime: string) => {
        const cleanTitle = title.trim().replace(/[*-]/g, '').trim();
        const start = startTime.replace('h', ':');
        const end = endTime.replace('h', ':');
        return {
          title: cleanTitle,
          description: '',
          startDateTime: `${targetDateStr}T${start}:00`,
          endDateTime: `${targetDateStr}T${end}:00`
        };
      };
      
      // Essayer tous les patterns
      let match;
      while ((match = pattern1.exec(suggestion)) !== null) {
        suggestedEvents.push(parseMatch(match[1], match[2], match[3]));
      }
      while ((match = pattern2.exec(suggestion)) !== null) {
        suggestedEvents.push(parseMatch(match[1], match[2], match[3]));
      }
      while ((match = pattern3.exec(suggestion)) !== null) {
        suggestedEvents.push(parseMatch(match[3], match[1], match[2]));
      }
      
      console.log('Extracted events from text patterns:', suggestedEvents.length);
      
      // Si toujours aucun événement, créer des suggestions par défaut basées sur les données
      if (suggestedEvents.length === 0 && (tasks.length > 0 || habits.length > 0)) {
        console.log('Creating default event suggestions from user data');
        
        let hour = 9;
        
        // Ajouter les tâches prioritaires
        const priorityTasks = tasks.filter((t: any) => t.priority === 'high').slice(0, 2);
        priorityTasks.forEach((task: any) => {
          suggestedEvents.push({
            title: `Tâche: ${task.title}`,
            description: task.description || '',
            startDateTime: `${targetDateStr}T${hour.toString().padStart(2, '0')}:00:00`,
            endDateTime: `${targetDateStr}T${(hour + 1).toString().padStart(2, '0')}:00:00`
          });
          hour += 2;
        });
        
        // Ajouter les habitudes
        habits.slice(0, 2).forEach((habit: any) => {
          suggestedEvents.push({
            title: `Habitude: ${habit.title}`,
            description: `Fréquence: ${habit.frequency}`,
            startDateTime: `${targetDateStr}T${hour.toString().padStart(2, '0')}:00:00`,
            endDateTime: `${targetDateStr}T${(hour).toString().padStart(2, '0')}:30:00`
          });
          hour += 1;
        });
        
        console.log('Created default events:', suggestedEvents.length);
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
