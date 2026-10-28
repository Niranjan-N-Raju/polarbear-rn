import { useCallback,useEffect,useState } from 'react';
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
const loadStats = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const response = await apiRequest('/dashboard');
      if (!response.ok) throw new Error('dashboard request failed');
      setStats((await response.json()) as DashboardStats);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);
useEffect(() => {
    void loadStats();
  }, [loadStats]);
return { layout, perRow, stats, isLoading, hasError };
}
