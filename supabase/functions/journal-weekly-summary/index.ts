import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Authentication failed");

    // Fetch journal entries from last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: entries, error: entriesError } = await supabase
      .from("journal_entries")
      .select("title, content, mood, created_at")
      .eq("user_id", user.id)
      .gte("created_at", weekAgo.toISOString())
      .order("created_at", { ascending: false });

    if (entriesError) throw entriesError;

    if (!entries || entries.length === 0) {
      return new Response(
        JSON.stringify({ summary: null, message: "Aucune entrée de journal cette semaine." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build prompt
    const entriesText = entries.map((e, i) => 
      `Entrée ${i + 1} (${new Date(e.created_at).toLocaleDateString("fr-FR")}):\nTitre: ${e.title}\nHumeur: ${e.mood || "non spécifiée"}\nContenu: ${e.content}`
    ).join("\n\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Tu es un coach de bien-être bienveillant. Analyse les entrées de journal de la semaine et fournis un résumé structuré en français. Sois empathique, concis et actionnable. Réponds en JSON avec ce format:
{
  "dominant_mood": "l'humeur dominante de la semaine",
  "recurring_themes": ["thème 1", "thème 2", "thème 3"],
  "highlights": "ce qui s'est bien passé",
  "areas_of_attention": "points à surveiller",
  "recommendation": "un conseil personnalisé pour la semaine à venir"
}`
          },
          {
            role: "user",
            content: `Voici mes ${entries.length} entrées de journal de cette semaine:\n\n${entriesText}`
          }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez plus tard." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    let summary;
    try {
      summary = JSON.parse(content);
    } catch {
      summary = { raw: content };
    }

    return new Response(
      JSON.stringify({ summary, entries_count: entries.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Journal summary error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
