import { useCallback, useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { apiRequest } from '../../../api/auth';
import type { SummaryCardItem } from '../../../components/SummaryCards';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { ChartNoAxesCombined, IndianRupee, Receipt, Users } from '../../../icons';
import { getAdminLayout } from '../../../utils/adminLayout';
import { formatMoney } from '../DashboardCharts';
import type { PnlData, PnlMonth } from './types';
export interface FranchisePnlScreenProps {
  storeId: string;
}

export function useFranchisePnl({ storeId }: FranchisePnlScreenProps) {
  const { width } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const [data, setData] = useState<PnlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [drawerMonth, setDrawerMonth] = useState<PnlMonth | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [pendingToast, setPendingToast] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);
    apiRequest(`/pnl?${new URLSearchParams({ storeId }).toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json().catch(() => ({})) as PnlData & { message?: string; };
        if (!active) return;
        if (!response.ok) throw new Error(result.message || t('franchisePnlLoadFailed'));
        setData(result);
        setSelectedPeriod((current) => result.months.some((month) => month.period === current)
          ? current
          : result.months.find((month) => month.isCurrent)?.period ?? result.months[0]?.period ?? '');
      })
      .catch((reason: unknown) => {
        if (active && !controller.signal.aborted) setError(reason instanceof Error ? reason.message : t('franchisePnlLoadFailed'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [storeId, reloadKey]);
  const months = data?.months ?? [];
  const latest = months.find((month) => month.isCurrent) ?? months[0];
  const selected = months.find((month) => month.period === selectedPeriod) ?? latest;
  const lastPeriod = months[0]?.period ?? '';
  const cards: SummaryCardItem[] = latest ? [
    { label: t('franchisePnlRevenue'), value: formatMoney(latest.revenue), color: theme.colors.teal, Icon: IndianRupee },
    { label: t('franchisePnlStoreExpenses'), value: formatMoney(latest.storeExpenses), color: theme.colors.orange, Icon: Receipt },
    { label: t('franchisePnlPayroll'), value: formatMoney(latest.payroll), color: theme.colors.orange, Icon: Users },
    { label: t('franchisePnlNetProfit'), value: formatMoney(latest.netProfit), color: latest.netProfit >= 0 ? theme.colors.teal : theme.colors.yellow, Icon: ChartNoAxesCombined },
  ] : [];
  const openMonth = useCallback((month: PnlMonth) => {
    setDrawerMonth(month);
    setDrawerVisible(true);
  }, []);
  const closeDrawer = () => setDrawerVisible(false);
  const finishDrawerClose = () => {
    setDrawerMonth(null);
    if (pendingToast) {
      setToast(pendingToast);
      setPendingToast('');
    }
  };
  return {
    layout,
    loading,
    error,
    setReloadKey,
    setSelectedPeriod,
    drawerMonth,
    drawerVisible,
    setPendingToast,
    toast,
    setToast,
    months,
    selected,
    lastPeriod,
    cards,
    openMonth,
    closeDrawer,
    finishDrawerClose,
  };
}
