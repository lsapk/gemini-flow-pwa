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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get user's activity data
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .limit(10);

    const { data: habits } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .limit(10);

    const { data: focusSessions } = await supabase
      .from("focus_sessions")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10);

    const { data: journalEntries } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10);

    // Delete existing incomplete daily quests
    await supabase
      .from("quests")
      .delete()
      .eq("user_id", user.id)
      .eq("quest_type", "daily")
      .eq("completed", false);

    const dailyQuests = [];

    // Generate task-based quest
    if (tasks && tasks.length > 0) {
      const incompleteTasks = tasks.filter(t => !t.completed).length;
      if (incompleteTasks > 0) {
        dailyQuests.push({
          user_id: user.id,
          title: "🎯 Complétez 3 tâches aujourd'hui",
          description: "Terminez 3 tâches pour progresser vers vos objectifs",
          quest_type: "daily",
          category: "tasks",
          target_value: 3,
          current_progress: 0,
          reward_xp: 50,
          reward_credits: 10,
          expires_at: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
        });
      }
    }

    // Generate habit-based quest
    if (habits && habits.length > 0) {
      dailyQuests.push({
        user_id: user.id,
        title: "✨ Maintenez vos habitudes",
        description: "Complétez au moins 2 habitudes aujourd'hui",
        quest_type: "daily",
        category: "habits",
        target_value: 2,
        current_progress: 0,
        reward_xp: 40,
        reward_credits: 8,
        expires_at: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
      });
    }

    // Generate focus-based quest
    const avgFocusMinutes = focusSessions && focusSessions.length > 0
      ? focusSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / focusSessions.length
      : 25;

    dailyQuests.push({
      user_id: user.id,
      title: "⚡ Session de focus profond",
      description: "Concentrez-vous pendant au moins 45 minutes",
      quest_type: "daily",
      category: "focus",
      target_value: 45,
      current_progress: 0,
      reward_xp: 60,
      reward_credits: 12,
      expires_at: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
    });

    // Generate journal-based quest
    const recentJournalCount = journalEntries?.length || 0;
    if (recentJournalCount < 7) {
      dailyQuests.push({
        user_id: user.id,
        title: "📝 Journal de réflexion",
        description: "Écrivez une entrée de journal pour documenter votre journée",
        quest_type: "daily",
        category: "journal",
        target_value: 1,
        current_progress: 0,
        reward_xp: 30,
        reward_credits: 6,
        expires_at: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
      });
    }

    // Insert new daily quests
    if (dailyQuests.length > 0) {
      const { error: insertError } = await supabase
        .from("quests")
        .insert(dailyQuests);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        quests_generated: dailyQuests.length,
        message: `${dailyQuests.length} quêtes quotidiennes générées`
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error generating daily quests:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});