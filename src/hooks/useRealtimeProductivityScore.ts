
import { useEffect } from 'react';
import { useProductivityScore } from './useProductivityScore';
import { useAnalyticsData } from './useAnalyticsData';

export const useRealtimeProductivityScore = () => {
  const { refetch } = useAnalyticsData();
  const productivityData = useProductivityScore();

  useEffect(() => {

    const interval = setInterval(() => {
      refetch();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refetch]);


  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetch]);

  return productivityData;
};
