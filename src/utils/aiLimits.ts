import { supabase } from "@/integrations/supabase/client";

export const MAX_FREEMIUM_REQUESTS_PER_DAY = 5;
export interface AIUsage {
  tier: string;
  is_premium: boolean;
  daily_limit: number;
  used: number;
  remaining: number;
  resets_at: string;
}

// Usage is recorded atomically by the server. A browser cannot spend or refund credits.
export const trackAIRequest = async (
  _service: "chat" | "analysis",
): Promise<boolean> => false;

export const getAIUsage = async (): Promise<AIUsage | null> => {
  try {
    const { data, error } = await supabase.rpc("get_ai_usage");
    if (error || !data || typeof data !== "object" || Array.isArray(data))
      return null;
    const value = data as Record<string, unknown>;
    if (
      typeof value.tier !== "string" ||
      typeof value.is_premium !== "boolean" ||
      typeof value.daily_limit !== "number" ||
      !Number.isFinite(value.daily_limit) ||
      value.daily_limit < 0 ||
      typeof value.used !== "number" ||
      !Number.isFinite(value.used) ||
      value.used < 0 ||
      typeof value.remaining !== "number" ||
      !Number.isFinite(value.remaining) ||
      value.remaining < 0 ||
      typeof value.resets_at !== "string" ||
      !Number.isFinite(Date.parse(value.resets_at))
    )
      return null;
    return value as unknown as AIUsage;
  } catch {
    return null;
  }
};

// UI hint only: every AI endpoint independently enforces the same server ledger.
export const checkAIRequestLimit = async (
  _service: "chat" | "analysis",
): Promise<{
  hasReachedLimit: boolean;
  requestsToday: number;
  isPremium: boolean;
}> => {
  try {
    const usage = await getAIUsage();
    return usage
      ? {
          hasReachedLimit: usage.remaining <= 0,
          requestsToday: usage.used,
          isPremium: usage.is_premium,
        }
      : { hasReachedLimit: true, requestsToday: 0, isPremium: false };
  } catch {
    return { hasReachedLimit: true, requestsToday: 0, isPremium: false };
  }
};
