import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { apiRequest } from '../../../api/auth';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { CalendarClock, Clock, Package, TriangleAlert } from '../../../icons';
import { getAdminLayout } from '../../../utils/adminLayout';
import type { InventoryStockItem } from '../types';
import { type InventoryAction } from './InventoryCard';
import {
  defaultInventoryFilters,
  filterInventory,
  type InventoryFilter,
  type InventoryFilters,
  summarizeInventory,
} from './utils';
export const pageSize = 10;
export type DrawerState =
  | { type: 'filters'; }
  | { type: 'stock'; }
  | { type: 'products'; }
  | { type: 'action'; item: InventoryStockItem; action: InventoryAction; }
  | null;
export interface FranchiseInventoryScreenProps {
  storeId: string;
}

export function useFranchiseInventory({ storeId }: FranchiseInventoryScreenProps) {
  const { width, height } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const [items, setItems] = useState<InventoryStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [filters, setFilters] = useState<InventoryFilters>(defaultInventoryFilters);
  const [draftFilters, setDraftFilters] = useState<InventoryFilters>(defaultInventoryFilters);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [lastAction, setLastAction] = useState<{ item: InventoryStockItem; action: InventoryAction; } | null>(null);
  const [pendingToast, setPendingToast] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setIsLoading(true);
    setError(null);
    apiRequest(`/inventory?storeId=${encodeURIComponent(storeId)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as { items?: InventoryStockItem[]; message?: string; };
        if (!active) return;
        if (!response.ok) {
          setError(data.message || t('adminLoadFailed'));
          return;
        }
        setItems(data.items ?? []);
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
  }, [storeId, reloadKey]);
  const summary = useMemo(() => summarizeInventory(items), [items]);
  const filteredItems = useMemo(() => filterInventory(items, filters), [items, filters]);
  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasActiveFilters = filters.status !== 'all' || filters.search.trim() !== '';
  const totalUnits = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const applyFilterState = (next: InventoryFilters) => {
    setFilters(next);
    setVisibleCount(pageSize);
  };
  const openFilters = () => {
    setDraftFilters(filters);
    setDrawer({ type: 'filters' });
  };
  const toggleStatus = (status: InventoryFilter) => {
    applyFilterState({ ...filters, status: filters.status === status ? 'all' : status });
  };
  const openAction = useCallback((item: InventoryStockItem, action: InventoryAction) => {
    setLastAction({ item, action });
    setDrawer({ type: 'action', item, action });
  }, []);
  const completeWithToast = (message: string) => {
    setReloadKey((key) => key + 1);
    setPendingToast(message);
    setDrawer(null);
  };
  const handleAfterClose = () => {
    if (!pendingToast) return;
    setToast(pendingToast);
    setPendingToast('');
  };
  const summaryCards: {
    key: InventoryFilter;
    label: string;
    value: number;
    color: string;
    Icon: typeof Package;
  }[] = [
      { key: 'expired', label: t('franchiseInventorySummaryExpired'), value: summary.expired, color: theme.colors.orange, Icon: TriangleAlert },
      { key: 'oneDay', label: t('franchiseInventorySummaryOneDay'), value: summary.oneDay, color: theme.colors.teal, Icon: Clock },
      { key: 'sevenDays', label: t('franchiseInventorySummarySevenDays'), value: summary.sevenDays, color: theme.colors.teal, Icon: CalendarClock },
      { key: 'thirtyDays', label: t('franchiseInventorySummaryThirtyDays'), value: summary.thirtyDays, color: theme.colors.orange, Icon: CalendarClock },
    ];
  return {
    height,
    layout,
    items,
    isLoading,
    error,
    setReloadKey,
    filters,
    draftFilters,
    setDraftFilters,
    visibleCount,
    setVisibleCount,
    drawer,
    setDrawer,
    lastAction,
    setLastAction,
    toast,
    setToast,
    filteredItems,
    visibleItems,
    hasActiveFilters,
    totalUnits,
    applyFilterState,
    openFilters,
    toggleStatus,
    openAction,
    completeWithToast,
    handleAfterClose,
    summaryCards,
  };
}
