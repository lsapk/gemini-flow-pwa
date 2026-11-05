import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import SoundService from "@/services/soundService";

export function useSoundService() {
  const { user } = useAuth();
  const setting = useQuery({
    queryKey: ["sound-setting", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from("user_settings")
        .select("sound_enabled").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data?.sound_enabled ?? false;
    },
  });
  const sound = SoundService.getInstance();
  useEffect(() => {
    sound.setEnabled(Boolean(user && !setting.isError && setting.data));
    return () => sound.setEnabled(false);
  }, [sound, user, setting.data, setting.isError]);
  return sound;
}
