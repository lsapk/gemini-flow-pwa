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
    
    const [
      { data: tasks },
      { data: habits },
      { data: goals },
      { data: focusSessions },
      { data: journalEntries },
      { data: playerProfile },
      { data: habitCompletions }
    ] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id),
      supabase.from("habits").select("*").eq("user_id", user.id),
      supabase.from("goals").select("*").eq("user_id", user.id),
      supabase.from("focus_sessions").select("*").eq("user_id", user.id),
      supabase.from("journal_entries").select("*").eq("user_id", user.id),
      supabase.from("player_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("habit_completions").select("*").eq("user_id", user.id)
        .gte("completed_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    ]);

    // Delete existing incomplete daily quests
    await supabase
      .from("quests")
      .delete()
      .eq("user_id", user.id)
      .eq("quest_type", "daily")
      .eq("completed", false);

    const dailyQuests = [];
    const weeklyQuests = [];
    const achievementQuests = [];
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999)).toISOString();
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // ===== DAILY QUESTS =====
    const incompleteTasks = tasks?.filter(t => !t.completed).length || 0;
    const habitsCount = habits?.length || 0;
    const level = playerProfile?.level || 1;

    // Base daily quests
    dailyQuests.push({
      user_id: user.id,
      title: "⚡ Démarrage Rapide",
      description: "Complétez votre première tâche de la journée",
      quest_type: "daily",
      category: "tasks",
      target_value: 1,
      current_progress: 0,
      reward_xp: 15,
      reward_credits: 5,
      expires_at: endOfDay,
    });

    if (incompleteTasks >= 3) {
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

    if (incompleteTasks >= 5) {
      dailyQuests.push({
        user_id: user.id,
        title: "🚀 Machine à Tâches",
        description: "Terminez 5 tâches aujourd'hui",
        quest_type: "daily",
        category: "tasks",
        target_value: 5,
        current_progress: 0,
        reward_xp: 100,
        reward_credits: 30,
        expires_at: endOfDay,
      });
    }

    // Habit quests
    if (habitsCount > 0) {
      dailyQuests.push({
        user_id: user.id,
        title: "✨ Première Habitude",
        description: "Complétez au moins 1 habitude",
        quest_type: "daily",
        category: "habits",
        target_value: 1,
        current_progress: 0,
        reward_xp: 20,
        reward_credits: 5,
        expires_at: endOfDay,
      });

      if (habitsCount >= 2) {
        dailyQuests.push({
          user_id: user.id,
          title: "💪 Gardien des Habitudes",
          description: "Maintenez 2 habitudes aujourd'hui",
          quest_type: "daily",
          category: "habits",
          target_value: 2,
          current_progress: 0,
          reward_xp: 40,
          reward_credits: 10,
          expires_at: endOfDay,
        });
      }

      if (habitsCount >= 3) {
        dailyQuests.push({
          user_id: user.id,
          title: "🌟 Journée Parfaite",
          description: `Complétez toutes vos ${habitsCount} habitudes`,
          quest_type: "daily",
          category: "habits",
          target_value: habitsCount,
          current_progress: 0,
          reward_xp: 100,
          reward_credits: 25,
          expires_at: endOfDay,
        });
      }
    }

    // Focus quests
    dailyQuests.push({
      user_id: user.id,
      title: "🧘 Mini Focus",
      description: "Complétez une session de focus de 15 minutes",
      quest_type: "daily",
      category: "focus",
      target_value: 15,
      current_progress: 0,
      reward_xp: 25,
      reward_credits: 8,
      expires_at: endOfDay,
    });

    dailyQuests.push({
      user_id: user.id,
      title: "🎯 Zen Mode",
      description: "Complétez une session Pomodoro (25 min)",
      quest_type: "daily",
      category: "focus",
      target_value: 25,
      current_progress: 0,
      reward_xp: 40,
      reward_credits: 12,
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

    if (level >= 5) {
      dailyQuests.push({
        user_id: user.id,
        title: "🔥 Marathon Focus",
        description: "Accumulez 120 minutes de focus intense",
        quest_type: "daily",
        category: "focus",
        target_value: 120,
        current_progress: 0,
        reward_xp: 150,
        reward_credits: 40,
        expires_at: endOfDay,
      });
    }

    // Journal quests
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
    const { data: existingWeekly } = await supabase
      .from("quests")
      .select("id")
      .eq("user_id", user.id)
      .eq("quest_type", "weekly")
      .eq("completed", false);

    if (!existingWeekly || existingWeekly.length === 0) {
      weeklyQuests.push(
        {
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
        },
        {
          user_id: user.id,
          title: "📋 Maître des Tâches",
          description: "Terminez 25 tâches cette semaine",
          quest_type: "weekly",
          category: "tasks",
          target_value: 25,
          current_progress: 0,
          reward_xp: 350,
          reward_credits: 80,
          expires_at: endOfWeek,
        },
        {
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
        },
        {
          user_id: user.id,
          title: "💪 Habitude Hebdo",
          description: "Complétez 10 habitudes cette semaine",
          quest_type: "weekly",
          category: "habits",
          target_value: 10,
          current_progress: 0,
          reward_xp: 180,
          reward_credits: 45,
          expires_at: endOfWeek,
        },
        {
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
        },
        {
          user_id: user.id,
          title: "⚡ Ultra Focus",
          description: "Accumulez 10 heures de focus cette semaine",
          quest_type: "weekly",
          category: "focus",
          target_value: 600,
          current_progress: 0,
          reward_xp: 500,
          reward_credits: 120,
          expires_at: endOfWeek,
        },
        {
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
        },
        {
          user_id: user.id,
          title: "✍️ Écrivain Prolifique",
          description: "Écrivez 7 entrées de journal (1 par jour)",
          quest_type: "weekly",
          category: "journal",
          target_value: 7,
          current_progress: 0,
          reward_xp: 200,
          reward_credits: 50,
          expires_at: endOfWeek,
        }
      );
    }

    // ===== ACHIEVEMENT QUESTS (One-time) =====
    const { data: existingAchievements } = await supabase
      .from("quests")
      .select("title")
      .eq("user_id", user.id)
      .eq("quest_type", "achievement");

    const achievementTitles = existingAchievements?.map(q => q.title) || [];

    // Level achievements
    const levelMilestones = [
      { level: 5, title: "🌱 Niveau 5", xp: 100, credits: 50 },
      { level: 10, title: "⭐ Niveau 10", xp: 250, credits: 100 },
      { level: 15, title: "🌟 Niveau 15", xp: 400, credits: 150 },
      { level: 20, title: "💫 Niveau 20", xp: 600, credits: 200 },
      { level: 25, title: "🏆 Niveau 25", xp: 800, credits: 300 },
      { level: 50, title: "👑 Niveau 50", xp: 1500, credits: 500 },
    ];

    for (const milestone of levelMilestones) {
      if (level < milestone.level && !achievementTitles.includes(milestone.title)) {
        achievementQuests.push({
          user_id: user.id,
          title: milestone.title,
          description: `Atteignez le niveau ${milestone.level}`,
          quest_type: "achievement",
          category: "tasks",
          target_value: milestone.level,
          current_progress: level,
          reward_xp: milestone.xp,
          reward_credits: milestone.credits,
          expires_at: null,
        });
        break; // Only add next level milestone
      }
    }

    // Task milestones
    const completedTasks = tasks?.filter(t => t.completed).length || 0;
    const taskMilestones = [
      { count: 10, title: "📋 10 Tâches", xp: 50, credits: 20 },
      { count: 25, title: "📝 25 Tâches", xp: 100, credits: 40 },
      { count: 50, title: "🎯 50 Tâches", xp: 200, credits: 75 },
      { count: 100, title: "💯 100 Tâches", xp: 400, credits: 150 },
      { count: 250, title: "🏅 250 Tâches", xp: 750, credits: 300 },
      { count: 500, title: "🏆 500 Tâches", xp: 1200, credits: 500 },
    ];

    for (const milestone of taskMilestones) {
      if (completedTasks < milestone.count && !achievementTitles.includes(milestone.title)) {
        achievementQuests.push({
          user_id: user.id,
          title: milestone.title,
          description: `Complétez ${milestone.count} tâches au total`,
          quest_type: "achievement",
          category: "tasks",
          target_value: milestone.count,
          current_progress: completedTasks,
          reward_xp: milestone.xp,
          reward_credits: milestone.credits,
          expires_at: null,
        });
        break;
      }
    }

    // Focus milestones
    const totalFocusMinutes = focusSessions?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;
    const focusMilestones = [
      { minutes: 60, title: "⏱️ 1h de Focus", xp: 50, credits: 20 },
      { minutes: 300, title: "🧘 5h de Focus", xp: 150, credits: 50 },
      { minutes: 600, title: "🎯 10h de Focus", xp: 300, credits: 100 },
      { minutes: 1500, title: "⚡ 25h de Focus", xp: 600, credits: 200 },
      { minutes: 3000, title: "🔥 50h de Focus", xp: 1000, credits: 400 },
      { minutes: 6000, title: "🏆 100h de Focus", xp: 2000, credits: 800 },
    ];

    for (const milestone of focusMilestones) {
      if (totalFocusMinutes < milestone.minutes && !achievementTitles.includes(milestone.title)) {
        achievementQuests.push({
          user_id: user.id,
          title: milestone.title,
          description: `Accumulez ${milestone.minutes / 60} heures de focus`,
          quest_type: "achievement",
          category: "focus",
          target_value: milestone.minutes,
          current_progress: totalFocusMinutes,
          reward_xp: milestone.xp,
          reward_credits: milestone.credits,
          expires_at: null,
        });
        break;
      }
    }

    // Journal milestones
    const totalJournalEntries = journalEntries?.length || 0;
    const journalMilestones = [
      { count: 5, title: "📝 5 Entrées", xp: 50, credits: 20 },
      { count: 15, title: "📖 15 Entrées", xp: 100, credits: 40 },
      { count: 30, title: "📚 30 Entrées", xp: 200, credits: 75 },
      { count: 100, title: "✍️ 100 Entrées", xp: 500, credits: 200 },
    ];

    for (const milestone of journalMilestones) {
      if (totalJournalEntries < milestone.count && !achievementTitles.includes(milestone.title)) {
        achievementQuests.push({
          user_id: user.id,
          title: milestone.title,
          description: `Écrivez ${milestone.count} entrées de journal`,
          quest_type: "achievement",
          category: "journal",
          target_value: milestone.count,
          current_progress: totalJournalEntries,
          reward_xp: milestone.xp,
          reward_credits: milestone.credits,
          expires_at: null,
        });
        break;
      }
    }

    // Habit streak achievements
    const maxStreak = habits?.reduce((max, h) => Math.max(max, h.streak || 0), 0) || 0;
    const streakMilestones = [
      { days: 7, title: "🔥 Streak 7 jours", xp: 100, credits: 40 },
      { days: 14, title: "💪 Streak 14 jours", xp: 200, credits: 80 },
      { days: 30, title: "🏆 Streak 30 jours", xp: 500, credits: 200 },
      { days: 60, title: "⭐ Streak 60 jours", xp: 1000, credits: 400 },
      { days: 100, title: "👑 Streak 100 jours", xp: 2000, credits: 800 },
    ];

    for (const milestone of streakMilestones) {
      if (maxStreak < milestone.days && !achievementTitles.includes(milestone.title)) {
        achievementQuests.push({
          user_id: user.id,
          title: milestone.title,
          description: `Maintenez un streak de ${milestone.days} jours`,
          quest_type: "achievement",
          category: "habits",
          target_value: milestone.days,
          current_progress: maxStreak,
          reward_xp: milestone.xp,
          reward_credits: milestone.credits,
          expires_at: null,
        });
        break;
      }
    }

    // Goal achievements
    const completedGoals = goals?.filter(g => g.completed).length || 0;
    if (completedGoals < 1 && !achievementTitles.includes("🎯 Premier Objectif")) {
      achievementQuests.push({
        user_id: user.id,
        title: "🎯 Premier Objectif",
        description: "Complétez votre premier objectif",
        quest_type: "achievement",
        category: "tasks",
        target_value: 1,
        current_progress: completedGoals,
        reward_xp: 150,
        reward_credits: 50,
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
