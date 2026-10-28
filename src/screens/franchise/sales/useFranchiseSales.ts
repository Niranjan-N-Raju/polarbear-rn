import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { apiRequest } from '../../../api/auth';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { Banknote, CreditCard, IndianRupee, Receipt } from '../../../icons';
import { getAdminLayout } from '../../../utils/adminLayout';
import { formatMoney } from '../DashboardCharts';
import type { SaleRecord } from '../types';
import { defaultSaleRange, type SaleRange, saleRangeError, summarizeSales } from './utils';
export const pageSize = 10;
export interface FranchiseSalesScreenProps {
  storeId: string;
}

export function useFranchiseSales({ storeId }: FranchiseSalesScreenProps) {
  const { width, height } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const [range, setRange] = useState<SaleRange>(() => defaultSaleRange());
  // Drawer edits stay local until Apply; requests depend on range, not draftRange.
  const [draftRange, setDraftRange] = useState<SaleRange>(range);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [pendingToast, setPendingToast] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setIsLoading(true);
    setError(null);
    const query = new URLSearchParams({ storeId, from: range.from, to: range.to });
    apiRequest(`/sales?${query.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as { sales?: SaleRecord[]; message?: string; };
        if (!active) return;
        if (!response.ok) {
          setError(data.message || t('adminLoadFailed'));
          return;
        }
        setSales(data.sales ?? []);
        setVisibleCount(pageSize);
      })
      .catch(() => {
        if (active) setError(t('adminNetworkError'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [storeId, range, reloadKey]);
  const summary = useMemo(() => summarizeSales(sales), [sales]);
  const existingDates = useMemo(() => sales.map((sale) => sale.date), [sales]);
  const defaultRange = useMemo(() => defaultSaleRange(), []);
  const hasActiveFilters = range.from !== defaultRange.from || range.to !== defaultRange.to;
  const visibleSales = sales.slice(0, visibleCount);
  // Pagination reveals the loaded date range; it does not fetch another server page.
  const openFilters = () => {
    setDraftRange(range);
    setDraftError(null);
    setIsFilterOpen(true);
  };
  const applyFilters = () => {
    const nextError = saleRangeError(draftRange);
    setDraftError(nextError);
    if (nextError) return;
    setRange({ from: draftRange.from.trim(), to: draftRange.to.trim() });
    setIsFilterOpen(false);
  };
  const clearFilters = () => {
    setDraftRange(defaultRange);
    setDraftError(null);
    setRange(defaultRange);
    setIsFilterOpen(false);
  };
  const openCreate = () => {
    setEditingSale(null);
    setIsFormOpen(true);
  };
  const openEdit = useCallback((sale: SaleRecord) => {
    setEditingSale(sale);
    setIsFormOpen(true);
  }, []);
  const handleSaved = (message: string, keepOpen: boolean) => {
    setReloadKey((key) => key + 1);
    // Save-and-continue leaves feedback in the form; ordinary saves defer it until drawer close.
    if (keepOpen) return;
    setPendingToast(message);
    setIsFormOpen(false);
  };
  const summaryCards = [
    { label: t('franchiseTotalSales'), value: formatMoney(summary.totalSales), color: theme.colors.teal, Icon: IndianRupee },
    { label: t('franchiseOnlineSales'), value: formatMoney(summary.onlineSales), color: theme.colors.orange, Icon: CreditCard },
    { label: t('franchiseTotalExpenses'), value: formatMoney(summary.totalExpenses), color: theme.colors.orange, Icon: Receipt },
    { label: t('franchiseSaleBankingCash'), value: formatMoney(summary.bankingCash), color: theme.colors.teal, Icon: Banknote },
  ];
  return {
    height,
    layout,
    range,
    draftRange,
    setDraftRange,
    draftError,
    setDraftError,
    isFilterOpen,
    setIsFilterOpen,
    sales,
    visibleCount,
    setVisibleCount,
    isLoading,
    error,
    setReloadKey,
    isFormOpen,
    setIsFormOpen,
    editingSale,
    setEditingSale,
    pendingToast,
    setPendingToast,
    toast,
    setToast,
    existingDates,
    defaultRange,
    hasActiveFilters,
    visibleSales,
    openFilters,
    applyFilters,
    clearFilters,
    openCreate,
    openEdit,
    handleSaved,
    summaryCards,
  };
}
