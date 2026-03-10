
import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import SoundService from "@/services/soundService";

export function useSoundService() {
  const soundService = useRef(SoundService.getInstance());
  const { user } = useAuth();

  useEffect(() => {
    const loadSetting = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('user_settings')
          .select('sound_enabled')
          .eq('id', user.id)
          .maybeSingle();
        soundService.current.setEnabled(data?.sound_enabled ?? true);
      } catch {
        soundService.current.setEnabled(true);
      }
    };
    loadSetting();
  }, [user]);

  return soundService.current;
}
