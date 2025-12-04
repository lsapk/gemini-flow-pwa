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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error("Not authenticated");
    }
    
    console.log("Generating quests for user:", user.id);

    // Get user's activity data
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id);

    const { data: habits } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id);

    const { data: focusSessions } = await supabase
      .from("focus_sessions")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const { data: journalEntries } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const { data: playerProfile } = await supabase
      .from("player_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Delete existing incomplete daily quests
    await supabase
      .from("quests")
      .delete()
      .eq("user_id", user.id)
      .eq("quest_type", "daily")
      .eq("completed", false);

    const dailyQuests = [];
    const weeklyQuests = [];
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999)).toISOString();
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // ===== DAILY QUESTS =====
    
    // Task quests
    const incompleteTasks = tasks?.filter(t => !t.completed).length || 0;
    if (incompleteTasks > 0) {
      dailyQuests.push({
        user_id: user.id,
        title: "🎯 Productivité Express",
        description: "Terminez 3 tâches aujourd'hui",
        quest_type: "daily",
        category: "tasks",
        target_value: 3,
        current_progress: 0,
        reward_xp: 50,
        reward_credits: 15,
        expires_at: endOfDay,
      });
    }

    // Quick task quest
    dailyQuests.push({
      user_id: user.id,
      title: "⚡ Démarrage Rapide",
      description: "Complétez votre première tâche de la journée",
      quest_type: "daily",
      category: "tasks",
      target_value: 1,
      current_progress: 0,
      reward_xp: 20,
      reward_credits: 5,
      expires_at: endOfDay,
    });

    // Habit quests
    if (habits && habits.length > 0) {
      dailyQuests.push({
        user_id: user.id,
        title: "✨ Gardien des Habitudes",
        description: "Maintenez 2 habitudes aujourd'hui",
        quest_type: "daily",
        category: "habits",
        target_value: 2,
        current_progress: 0,
        reward_xp: 40,
        reward_credits: 10,
        expires_at: endOfDay,
      });

      // Perfect habits day
      dailyQuests.push({
        user_id: user.id,
        title: "🌟 Journée Parfaite",
        description: "Complétez toutes vos habitudes du jour",
        quest_type: "daily",
        category: "habits",
        target_value: habits.length,
        current_progress: 0,
        reward_xp: 100,
        reward_credits: 25,
        expires_at: endOfDay,
      });
    }

    // Focus quests
    dailyQuests.push({
      user_id: user.id,
      title: "🧘 Zen Mode",
      description: "Complétez une session de focus de 25 minutes",
      quest_type: "daily",
      category: "focus",
      target_value: 25,
      current_progress: 0,
      reward_xp: 30,
      reward_credits: 8,
      expires_at: endOfDay,
    });

    dailyQuests.push({
      user_id: user.id,
      title: "⚡ Deep Work",
      description: "Accumulez 60 minutes de focus",
      quest_type: "daily",
      category: "focus",
      target_value: 60,
      current_progress: 0,
      reward_xp: 75,
      reward_credits: 20,
      expires_at: endOfDay,
    });

    // Journal quest
    dailyQuests.push({
      user_id: user.id,
      title: "📝 Réflexion Quotidienne",
      description: "Écrivez une entrée de journal",
      quest_type: "daily",
      category: "journal",
      target_value: 1,
      current_progress: 0,
      reward_xp: 35,
      reward_credits: 10,
      expires_at: endOfDay,
    });

    // ===== WEEKLY QUESTS =====
    
    // Check for existing weekly quests
    const { data: existingWeekly } = await supabase
      .from("quests")
      .select("id")
      .eq("user_id", user.id)
      .eq("quest_type", "weekly")
      .eq("completed", false);

    if (!existingWeekly || existingWeekly.length === 0) {
      weeklyQuests.push({
        user_id: user.id,
        title: "🏆 Champion de la Semaine",
        description: "Terminez 15 tâches cette semaine",
        quest_type: "weekly",
        category: "tasks",
        target_value: 15,
        current_progress: 0,
        reward_xp: 200,
        reward_credits: 50,
        expires_at: endOfWeek,
      });

      weeklyQuests.push({
        user_id: user.id,
        title: "🔥 Streak Master",
        description: "Maintenez un streak de 5 jours sur une habitude",
        quest_type: "weekly",
        category: "habits",
        target_value: 5,
        current_progress: 0,
        reward_xp: 150,
        reward_credits: 40,
        expires_at: endOfWeek,
      });

      weeklyQuests.push({
        user_id: user.id,
        title: "🧠 Focus Warrior",
        description: "Accumulez 5 heures de focus cette semaine",
        quest_type: "weekly",
        category: "focus",
        target_value: 300,
        current_progress: 0,
        reward_xp: 250,
        reward_credits: 60,
        expires_at: endOfWeek,
      });

      weeklyQuests.push({
        user_id: user.id,
        title: "📖 Journaliste",
        description: "Écrivez 5 entrées de journal cette semaine",
        quest_type: "weekly",
        category: "journal",
        target_value: 5,
        current_progress: 0,
        reward_xp: 120,
        reward_credits: 30,
        expires_at: endOfWeek,
      });
    }

    // ===== ACHIEVEMENT QUESTS (One-time) =====
    const { data: existingAchievements } = await supabase
      .from("quests")
      .select("title")
      .eq("user_id", user.id)
      .eq("quest_type", "achievement");

    const achievementTitles = existingAchievements?.map(q => q.title) || [];
    const achievementQuests = [];

    // Level-based achievements
    const level = playerProfile?.level || 1;
    if (level < 5 && !achievementTitles.includes("🌱 Niveau 5")) {
      achievementQuests.push({
        user_id: user.id,
        title: "🌱 Niveau 5",
        description: "Atteignez le niveau 5",
        quest_type: "achievement",
        category: "tasks",
        target_value: 5,
        current_progress: level,
        reward_xp: 100,
        reward_credits: 50,
        expires_at: null,
      });
    }

    if (level < 10 && level >= 5 && !achievementTitles.includes("⭐ Niveau 10")) {
      achievementQuests.push({
        user_id: user.id,
        title: "⭐ Niveau 10",
        description: "Atteignez le niveau 10",
        quest_type: "achievement",
        category: "tasks",
        target_value: 10,
        current_progress: level,
        reward_xp: 250,
        reward_credits: 100,
        expires_at: null,
      });
    }

    // Task milestones
    const completedTasks = tasks?.filter(t => t.completed).length || 0;
    if (completedTasks < 50 && !achievementTitles.includes("📋 50 Tâches")) {
      achievementQuests.push({
        user_id: user.id,
        title: "📋 50 Tâches",
        description: "Complétez 50 tâches au total",
        quest_type: "achievement",
        category: "tasks",
        target_value: 50,
        current_progress: completedTasks,
        reward_xp: 300,
        reward_credits: 75,
        expires_at: null,
      });
    }

    // Focus milestone
    const totalFocusMinutes = focusSessions?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;
    if (totalFocusMinutes < 600 && !achievementTitles.includes("🎯 10h de Focus")) {
      achievementQuests.push({
        user_id: user.id,
        title: "🎯 10h de Focus",
        description: "Accumulez 10 heures de focus au total",
        quest_type: "achievement",
        category: "focus",
        target_value: 600,
        current_progress: totalFocusMinutes,
        reward_xp: 400,
        reward_credits: 100,
        expires_at: null,
      });
    }

    // Insert all quests
    const allQuests = [...dailyQuests, ...weeklyQuests, ...achievementQuests];
    
    if (allQuests.length > 0) {
      const { error: insertError } = await supabase
        .from("quests")
        .insert(allQuests);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        quests_generated: allQuests.length,
        daily: dailyQuests.length,
        weekly: weeklyQuests.length,
        achievement: achievementQuests.length,
        message: `${allQuests.length} quêtes générées`
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
