import { useAnalyticsData } from "./useAnalyticsData";
import { localProductivityScore } from "@/lib/productivity-score";

// Routine statistics never call a paid AI endpoint.
export const useProductivityScore = () => {
  const analytics = useAnalyticsData();
  const data = localProductivityScore(analytics);
  return {
    data,
    isLoading: analytics.isLoading,
    error: analytics.error,
    refetch: analytics.refetch,
  };
};
