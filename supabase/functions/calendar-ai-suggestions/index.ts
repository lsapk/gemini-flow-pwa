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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
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
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: "Service IA non configuré" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Use service role key for database queries (needed to bypass RLS for internal operations)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Lovable API key retrieved successfully');

    // Récupérer les données de l'utilisateur (using authenticated user ID)
    // Use a local-date helper to avoid UTC shift bugs (matches client-side toLocalDateKey)
    const toLocalDateKey = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const targetDate = toLocalDateKey(new Date(date));
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

    const targetDateStr = targetDate;
    
    const systemPrompt = `Tu es un assistant de productivité expert. Tu dois fournir des suggestions complètes et détaillées pour organiser la journée de l'utilisateur. Ne coupe JAMAIS ta réponse - termine toujours complètement.`;
    
    const userPrompt = `Analyse les données suivantes et fournis des suggestions COMPLÈTES pour la journée du ${targetDate}.

Données de l'utilisateur:
- Tâches: ${tasks.length > 0 ? tasks.map((t: any) => `"${t.title}" (${t.priority || 'medium'})`).join(', ') : 'aucune'}
- Habitudes: ${habits.length > 0 ? habits.map((h: any) => `"${h.title}"`).join(', ') : 'aucune'}
- Objectifs: ${goals.length > 0 ? goals.map((g: any) => `"${g.title}" (${g.progress || 0}%)`).join(', ') : 'aucun'}
- Événements Google Calendar: ${calendarEvents.length > 0 ? calendarEvents.map((e: any) => `"${e.summary}"`).join(', ') : 'aucun'}

INSTRUCTIONS:
1. Fournis des suggestions en Markdown avec emojis (📅, 🎯, 💪, 🚀)
2. Pour chaque activité suggérée, inclus un horaire au format "09h00 - 10h00"
3. Propose 3-5 événements concrets basés sur les données
4. Chaque événement doit avoir un titre clair et des horaires précis pour le ${targetDateStr}
5. TERMINE TOUJOURS ta réponse complètement - ne coupe jamais

Retourne également un JSON avec les événements suggérés dans ce format:
\`\`\`json
{
  "events": [
    {"title": "Titre", "description": "Description", "startDateTime": "${targetDateStr}T09:00:00", "endDateTime": "${targetDateStr}T10:00:00"}
  ]
}
\`\`\``;

    console.log('Calling Lovable AI Gateway (Gemini)...');
    
    // Call Lovable AI Gateway (which uses Gemini)
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 8192,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your Lovable workspace.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const suggestion = aiData.choices?.[0]?.message?.content || '';

    console.log('AI response received, length:', suggestion.length);

    // Extraire les événements suggérés du JSON dans la réponse
    let suggestedEvents: any[] = [];
    
    // Essayer d'extraire le JSON des événements
    const jsonMatch = suggestion.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.events && Array.isArray(parsed.events)) {
          suggestedEvents = parsed.events;
          console.log('Extracted events from JSON:', suggestedEvents.length);
        }
      } catch (e) {
        console.log('Could not parse JSON events:', e);
      }
    }
    
    // Si pas d'événements extraits, créer des suggestions par défaut
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
    
    console.log('Final suggested events:', suggestedEvents.length);

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
