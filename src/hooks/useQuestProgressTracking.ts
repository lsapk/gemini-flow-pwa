import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useQuestProgressTracking = () => {
  const queryClient = useQueryClient();

  // Fonction pour calculer et mettre à jour la progression
  const updateQuestProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Récupérer les quêtes actives
    const { data: quests } = await supabase
      .from("quests")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false);

    if (!quests || quests.length === 0) return;

    const today = new Date().toISOString().split('T')[0];

    for (const quest of quests) {
      let currentProgress = 0;

      switch (quest.category) {
        case "tasks": {
          // Compter les tâches complétées aujourd'hui
          const { count } = await supabase
            .from("tasks")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("completed", true)
            .gte("updated_at", `${today}T00:00:00.000Z`)
            .lte("updated_at", `${today}T23:59:59.999Z`);
          
          currentProgress = count || 0;
          break;
        }

        case "habits": {
          // Compter les complétions d'habitudes aujourd'hui
          const { count } = await supabase
            .from("habit_completions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("completed_date", today);
          
          currentProgress = count || 0;
          break;
        }

        case "focus": {
          // Sommer les minutes de focus aujourd'hui
          const { data } = await supabase
            .from("focus_sessions")
            .select("duration")
            .eq("user_id", user.id)
            .not("completed_at", "is", null)
            .gte("completed_at", `${today}T00:00:00.000Z`)
            .lte("completed_at", `${today}T23:59:59.999Z`);
          
          currentProgress = data?.reduce((sum, session) => sum + session.duration, 0) || 0;
          break;
        }

        case "journal": {
          // Compter les entrées de journal aujourd'hui
          const { count } = await supabase
            .from("journal_entries")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("created_at", `${today}T00:00:00.000Z`)
            .lte("created_at", `${today}T23:59:59.999Z`);
          
          currentProgress = count || 0;
          break;
        }
      }

      // Mettre à jour seulement si la progression a changé
      if (currentProgress !== quest.current_progress) {
        await supabase
          .from("quests")
          .update({ 
            current_progress: currentProgress,
            updated_at: new Date().toISOString()
          })
          .eq("id", quest.id);
      }
    }

    // Rafraîchir les quêtes
    queryClient.invalidateQueries({ queryKey: ["quests"] });
  };

  // Mettre à jour la progression au montage et toutes les 30 secondes
  useEffect(() => {
    updateQuestProgress();
    
    const interval = setInterval(() => {
      updateQuestProgress();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, []);

  // Écouter les changements en temps réel
  useEffect(() => {
    const channel = supabase
      .channel("quest-progress")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        () => {
          setTimeout(() => updateQuestProgress(), 1000);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "habit_completions",
        },
        () => {
          setTimeout(() => updateQuestProgress(), 1000);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "focus_sessions",
        },
        () => {
          setTimeout(() => updateQuestProgress(), 1000);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "journal_entries",
        },
        () => {
          setTimeout(() => updateQuestProgress(), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { updateQuestProgress };
};
