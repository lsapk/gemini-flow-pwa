import { useProductivityScore } from "./useProductivityScore";
export const useEnhancedProductivityScore = () => {
  const result = useProductivityScore();
  return {
    ...result,
    data: {
      ...result.data,
      weeklyTrend: 0,
      strongPoints: result.data.badges,
      improvementAreas: [],
      nextMilestone: "Choisir votre prochaine action",
    },
  };
};
