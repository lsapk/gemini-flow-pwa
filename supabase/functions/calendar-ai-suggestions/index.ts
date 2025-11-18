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
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer les données de l'utilisateur
    const targetDate = new Date(date).toISOString().split('T')[0];
    const selectedDay = new Date(date).getDay();

    const [tasksRes, habitsRes, goalsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId).eq('completed', false),
      supabase.from('habits').select('*').eq('user_id', userId).eq('is_archived', false),
      supabase.from('goals').select('*').eq('user_id', userId).eq('completed', false)
    ]);

    const tasks = tasksRes.data || [];
    const habits = habitsRes.data?.filter((h: any) => 
      !h.days_of_week || h.days_of_week.length === 0 || h.days_of_week.includes(selectedDay)
    ) || [];
    const goals = goalsRes.data || [];

    const prompt = `Tu es un assistant de productivité expert. Analyse les données suivantes de l'utilisateur et fournis des suggestions personnalisées pour optimiser sa journée du ${targetDate}.

Données de l'utilisateur:
- Tâches en cours (${tasks.length}): ${tasks.map((t: any) => `"${t.title}" (priorité: ${t.priority || 'medium'}, échéance: ${t.due_date || 'non définie'})`).join(', ')}
- Habitudes du jour (${habits.length}): ${habits.map((h: any) => `"${h.title}" (fréquence: ${h.frequency})`).join(', ')}
- Objectifs en cours (${goals.length}): ${goals.map((g: any) => `"${g.title}" (progression: ${g.progress || 0}%, échéance: ${g.target_date || 'non définie'})`).join(', ')}

Fournis des suggestions concrètes et actionnables dans les catégories suivantes:
1. 📅 **Planning de la journée**: Propose un ordre optimal pour accomplir les tâches avec des horaires suggérés
2. 🎯 **Tâches prioritaires**: Identifie les 3 tâches les plus importantes à faire aujourd'hui
3. 💪 **Habitudes**: Suggère le meilleur moment pour pratiquer les habitudes du jour
4. 🚀 **Avancement des objectifs**: Propose des actions concrètes pour faire progresser les objectifs

**IMPORTANT**: Ta réponse DOIT être formatée en Markdown avec des emojis pour rendre le contenu plus engageant et visuel. Utilise:
- Des titres avec ## et ###
- Des listes à puces avec -
- Des emojis pertinents et variés (🎯, ✅, 📝, 🔥, 💡, ⏰, 🌟, 💪, 🚀, etc.)
- Du texte en **gras** pour les points importants
- Des séparateurs avec ---

Sois concis, motivant et pratique. Limite ta réponse à 300 mots maximum.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Tu es un assistant de productivité bienveillant et efficace." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const suggestion = aiData.choices[0]?.message?.content || "Aucune suggestion disponible";

    return new Response(
      JSON.stringify({ 
        suggestion,
        stats: {
          tasks: tasks.length,
          habits: habits.length,
          goals: goals.length
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
