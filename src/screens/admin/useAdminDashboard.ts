import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { apiRequest } from '../../api/auth';
import { getDashboardLayout } from '../../utils/dashboardConfig';
import type { DashboardStats } from '../../utils/types';


export function useAdminDashboard() {
  const { width } = useWindowDimensions();
  const layout = getDashboardLayout(width);
  const perRow = layout.dashboardCardsWide ? 4 : layout.dashboardCardsTablet ? 3 : 2;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  useEffect(() => {
    // Abort on unmount so a late response cannot update an unmounted dashboard.
    const controller = new AbortController();
    setIsLoading(true);
    setHasError(false);
    (async () => {
      try {
        const response = await apiRequest('/dashboard', { signal: controller.signal });
        if (!response.ok) throw new Error('dashboard request failed');
        const data = (await response.json()) as DashboardStats;
        if (!controller.signal.aborted) setStats(data);
      } catch {
        if (!controller.signal.aborted) setHasError(true);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);
  return {
    layout,
    perRow,
    stats,
    isLoading,
    hasError,
  };
}
