import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useEnsurePenguinProfile = () => {
  const { user } = useAuth();

  useEffect(() => {
    const ensure = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("penguin_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) {
        await supabase
          .from("penguin_profiles")
          .insert({ user_id: user.id })
          .select()
          .single();
      }

      // Also ensure AI credits
      const { data: credits } = await supabase
        .from("ai_credits")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!credits) {
        await supabase
          .from("ai_credits")
          .insert({ user_id: user.id, credits: 50 })
          .select()
          .single();
      }
    };

    ensure();
  }, [user?.id]);
};
