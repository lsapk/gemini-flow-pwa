import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const EVENT = "deepflow-student-mode";

export function notifyStudentModeChange(value: boolean) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
}

export function useStudentMode() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_settings")
      .select("student_mode")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setEnabled(!!(data as any)?.student_mode));
    const handler = (e: Event) => setEnabled(!!(e as CustomEvent).detail);
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, [user]);

  return enabled;
}
