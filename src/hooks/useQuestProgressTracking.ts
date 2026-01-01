import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useQuestProgressTracking = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const updateQuestProgress = useCallback(async () => {
    if (!user) return;

    // Récupérer les quêtes actives
    const { data: quests } = await supabase
      .from("quests")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false);

    if (!quests || quests.length === 0) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString();

    for (const quest of quests) {
      let currentProgress = 0;

      switch (quest.category) {
        case "tasks": {
          if (quest.quest_type === "daily") {
            const { count } = await supabase
              .from("tasks")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("completed", true)
              .gte("updated_at", `${todayStr}T00:00:00.000Z`)
              .lte("updated_at", `${todayStr}T23:59:59.999Z`);
            
            currentProgress = count || 0;
          } else if (quest.quest_type === "weekly") {
            const { count } = await supabase
              .from("tasks")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("completed", true)
              .gte("updated_at", weekStartStr);
            
            currentProgress = count || 0;
          } else if (quest.quest_type === "achievement") {
            // Check if it's a level quest
            if (quest.title.includes("Niveau")) {
              const { data: profile } = await supabase
                .from("player_profiles")
                .select("level")
                .eq("user_id", user.id)
                .single();
              currentProgress = profile?.level || 1;
            } else {
              // Total completed tasks
              const { count } = await supabase
                .from("tasks")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("completed", true);
              
              currentProgress = count || 0;
            }
          }
          break;
        }

        case "habits": {
          if (quest.quest_type === "daily") {
            // Check if "Journée Parfaite" quest (complete all habits)
            if (quest.title.includes("Parfaite")) {
              const { count } = await supabase
                .from("habit_completions")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("completed_date", todayStr);
              
              currentProgress = count || 0;
            } else {
              const { count } = await supabase
                .from("habit_completions")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("completed_date", todayStr);
              
              currentProgress = count || 0;
            }
          } else if (quest.quest_type === "weekly") {
            // Max streak
            const { data: habits } = await supabase
              .from("habits")
              .select("streak")
              .eq("user_id", user.id);
            
            currentProgress = habits?.reduce((max, h) => Math.max(max, h.streak || 0), 0) || 0;
          }
          break;
        }

        case "focus": {
          if (quest.quest_type === "daily") {
            const { data } = await supabase
              .from("focus_sessions")
              .select("duration")
              .eq("user_id", user.id)
              .gte("created_at", `${todayStr}T00:00:00.000Z`)
              .lte("created_at", `${todayStr}T23:59:59.999Z`);
            
            currentProgress = data?.reduce((sum, session) => sum + session.duration, 0) || 0;
          } else if (quest.quest_type === "weekly") {
            const { data } = await supabase
              .from("focus_sessions")
              .select("duration")
              .eq("user_id", user.id)
              .gte("created_at", weekStartStr);
            
            currentProgress = data?.reduce((sum, session) => sum + session.duration, 0) || 0;
          } else if (quest.quest_type === "achievement") {
            const { data } = await supabase
              .from("focus_sessions")
              .select("duration")
              .eq("user_id", user.id);
            
            currentProgress = data?.reduce((sum, session) => sum + session.duration, 0) || 0;
          }
          break;
        }

        case "journal": {
          if (quest.quest_type === "daily") {
            const { count } = await supabase
              .from("journal_entries")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .gte("created_at", `${todayStr}T00:00:00.000Z`)
              .lte("created_at", `${todayStr}T23:59:59.999Z`);
            
            currentProgress = count || 0;
          } else if (quest.quest_type === "weekly") {
            const { count } = await supabase
              .from("journal_entries")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .gte("created_at", weekStartStr);
            
            currentProgress = count || 0;
          }
          break;
        }
      }

      // Mettre à jour seulement si la progression a changé
      if (currentProgress !== quest.current_progress) {
        const isCompleted = currentProgress >= quest.target_value;
        
        await supabase
          .from("quests")
          .update({ 
            current_progress: currentProgress,
            completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq("id", quest.id);
      }
    }

    // Rafraîchir les quêtes
    queryClient.invalidateQueries({ queryKey: ["quests", user?.id] });
  }, [queryClient, user]);

  // Mettre à jour la progression au montage et toutes les 30 secondes
  useEffect(() => {
    updateQuestProgress();
    
    const interval = setInterval(() => {
      updateQuestProgress();
    }, 30000);

    return () => clearInterval(interval);
  }, [updateQuestProgress]);

  // Écouter les changements en temps réel
  useEffect(() => {
    const channel = supabase
      .channel("quest-progress")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => setTimeout(() => updateQuestProgress(), 1000)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habit_completions" },
        () => setTimeout(() => updateQuestProgress(), 1000)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "focus_sessions" },
        () => setTimeout(() => updateQuestProgress(), 1000)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "journal_entries" },
        () => setTimeout(() => updateQuestProgress(), 1000)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "player_profiles" },
        () => setTimeout(() => updateQuestProgress(), 1000)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [updateQuestProgress]);

  return { updateQuestProgress };
};
