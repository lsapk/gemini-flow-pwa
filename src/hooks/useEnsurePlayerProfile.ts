import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useEnsurePlayerProfile = () => {
  const { user } = useAuth();

  useEffect(() => {
    const ensureProfile = async () => {
      if (!user) return;

      // Vérifier si le profil existe
      const { data: profile } = await supabase
        .from("player_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Si le profil n'existe pas, le créer
      if (!profile) {
        await supabase
          .from("player_profiles")
          .insert({
            user_id: user.id,
          })
          .select()
          .single();
      }

      // Vérifier si ai_credits existe
      const { data: credits } = await supabase
        .from("ai_credits")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Si les crédits n'existent pas, les créer
      if (!credits) {
        await supabase
          .from("ai_credits")
          .insert({
            user_id: user.id,
            credits: 10,
          })
          .select()
          .single();
      }
    };

    ensureProfile();
  }, [user?.id]);
};
