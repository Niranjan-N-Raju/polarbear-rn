import { useEffect, useState } from 'react';
import { apiRequest } from '../../../api/auth';
import { t } from '../../../i18n';
import { currentMonthRange, validDateRange } from '../dashboardDates';
import type { DailySale, FranchiseDashboardStats } from '../types';

export function useFranchiseDashboard(storeId: string) {
  const [stats, setStats] = useState<FranchiseDashboardStats | null>(null);
  const [sales, setSales] = useState<DailySale[]>([]);
  const [range, setRange] = useState(currentMonthRange);
  // Only committed dates drive requests; editing the drawer must not change the chart.
  const [appliedRange, setAppliedRange] = useState(currentMonthRange);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterError, setFilterError] = useState('');
  const [error, setError] = useState('');
  const [salesError, setSalesError] = useState('');
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    // Abort saves work; the active guard also blocks late responses after a store switch.
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setStats(null);
    apiRequest(`/dashboard?storeId=${encodeURIComponent(storeId)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(t('adminLoadFailed'));
        const data = await response.json().catch(() => { throw new Error(t('adminLoadFailed')); }) as FranchiseDashboardStats;
        if (active) setStats(data);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : t('adminLoadFailed'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [storeId, version]);

  // Summary and trend load independently so one failed endpoint does not hide the other.
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setSalesLoading(true);
    setSalesError('');
    setSales([]);
    apiRequest(`/sales?storeId=${encodeURIComponent(storeId)}&from=${appliedRange.from}&to=${appliedRange.to}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(t('franchiseSalesLoadFailed'));
        const data = await response.json().catch(() => { throw new Error(t('franchiseSalesLoadFailed')); }) as { sales: DailySale[] };
        if (active) setSales(data.sales);
      })
      .catch((reason: unknown) => {
        if (active) setSalesError(reason instanceof Error ? reason.message : t('franchiseSalesLoadFailed'));
      })
      .finally(() => { if (active) setSalesLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [storeId, appliedRange, version]);

  function applyRange(next = range) {
    setRange(next);
    if (!validDateRange(next.from, next.to)) {
      setFilterError(t('franchiseInvalidDates'));
      return;
    }
    setAppliedRange(next);
    setFilterError('');
    setFiltersOpen(false);
  }

  function openFilters() {
    // Reopening starts from committed dates, discarding any previously cancelled draft.
    setRange(appliedRange);
    setFilterError('');
    setFiltersOpen(true);
  }

  function changeRange(next: typeof range) {
    setRange(next);
    setFilterError('');
  }

  return {
    stats, sales, range, appliedRange, filtersOpen, filterError,
    error, salesError, loading, salesLoading, applyRange, openFilters, changeRange,
    closeFilters: () => setFiltersOpen(false),
    clearFilters: () => applyRange(currentMonthRange()),
    refresh: () => setVersion((value) => value + 1),
  };
}
