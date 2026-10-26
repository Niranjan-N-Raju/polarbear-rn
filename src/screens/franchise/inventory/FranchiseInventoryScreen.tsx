import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { CalendarClock, Clock, Filter, Package, Plus, TriangleAlert } from '../../../icons';
import { apiRequest } from '../../../api/auth';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { getAdminLayout } from '../../../utils/adminLayout';
import { salesStyles } from '../sales/salesStyles';
import type { InventoryStockItem } from '../types';
import { InventoryActionDrawer } from './InventoryActionDrawer';
import { type InventoryAction, InventoryCard } from './InventoryCard';
import { InventoryFiltersDrawer } from './InventoryFiltersDrawer';
import { inventoryStyles } from './inventoryStyles';
import { ProductsDrawer } from './ProductsDrawer';
import { StockFormDrawer } from './StockFormDrawer';
import {
  defaultInventoryFilters,
  filterInventory,
  type InventoryFilter,
  type InventoryFilters,
  summarizeInventory,
} from './utils';

const pageSize = 10;

type DrawerState =
  | { type: 'filters' }
  | { type: 'stock' }
  | { type: 'products' }
  | { type: 'action'; item: InventoryStockItem; action: InventoryAction }
  | null;

interface FranchiseInventoryScreenProps {
  storeId: string;
}

export function FranchiseInventoryScreen({ storeId }: FranchiseInventoryScreenProps) {
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
  // Keeps the action drawer's content rendered while its close animation runs.
  const [lastAction, setLastAction] = useState<{ item: InventoryStockItem; action: InventoryAction } | null>(null);
  const [pendingToast, setPendingToast] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setIsLoading(true);
    setError(null);
    apiRequest(`/inventory?storeId=${encodeURIComponent(storeId)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as { items?: InventoryStockItem[]; message?: string };
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
  const summaryRows = layout.desktopWeb ? [summaryCards] : [summaryCards.slice(0, 2), summaryCards.slice(2)];

  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, layout.desktopWeb && styles.screenHeaderInline, layout.compactWeb && styles.screenHeaderStack]}>
        <View style={layout.isWeb ? styles.screenHeaderCopy : styles.screenHeaderCopyNative}>
          <View style={styles.screenTitleRow}>
            <Text style={[styles.screenTitle, styles.screenTitleInline]}>{t('franchiseInventory')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('franchiseInventoryFilter')}
              onPress={openFilters}
              style={styles.filterIconButton}
            >
              <Filter color={theme.colors.teal} size={18} />
              {hasActiveFilters ? <View style={styles.filterActiveDot} /> : null}
            </Pressable>
            {!layout.desktopWeb ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('franchiseInventoryProducts')}
                onPress={() => setDrawer({ type: 'products' })}
                style={styles.filterIconButton}
              >
                <Package color={theme.colors.teal} size={18} />
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.screenDescription}>
            {t('franchiseInventoryDescription', { count: items.length, units: totalUnits })}
          </Text>
        </View>
        <View style={styles.screenHeaderActions}>
          {layout.desktopWeb ? (
            <View style={inventoryStyles.headerButtons}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDrawer({ type: 'products' })}
                style={[styles.secondaryButton, styles.screenHeaderAction]}
              >
                <Text style={styles.secondaryButtonText}>{t('franchiseInventoryProducts')}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDrawer({ type: 'stock' })}
                style={[styles.primaryButton, styles.screenHeaderAction]}
              >
                <Text style={styles.primaryButtonText}>{t('franchiseInventoryAddStock')}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      {isLoading && items.length === 0 ? (
        <AppLoader />
      ) : error ? (
        <AppErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : (
        <ScrollView
          style={[styles.list, !layout.desktopWeb && styles.storeListFabViewport]}
          contentContainerStyle={[styles.listContent, !layout.desktopWeb && styles.storeListWithFab]}
        >
          {isLoading ? <AppLoader variant="inline" /> : null}
          <View style={salesStyles.summaryGrid}>
            {summaryRows.map((row) => (
              <View key={row[0].key} style={salesStyles.summaryRow}>
                {row.map(({ key, label, value, color, Icon }) => {
                  const selected = filters.status === key;
                  return (
                    <Pressable
                      key={key}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${label}: ${value}`}
                      onPress={() => toggleStatus(key)}
                      style={[
                        salesStyles.summaryCard,
                        { borderTopColor: color },
                        layout.isWeb && salesStyles.summaryCardWeb,
                        selected && inventoryStyles.summaryCardSelected,
                        selected && { borderTopColor: color },
                      ]}
                    >
                      <View style={salesStyles.summaryHeader}>
                        <Text style={salesStyles.summaryLabel} numberOfLines={2}>{label}</Text>
                        <View style={salesStyles.summaryIcon}>
                          <Icon color={color} size={16} />
                        </View>
                      </View>
                      <Text
                        style={[salesStyles.summaryValue, layout.isWeb && salesStyles.summaryValueWeb, { color }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {value}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          {filteredItems.length === 0 ? (
            <Text style={styles.stateMessage}>
              {items.length === 0 ? t('franchiseInventoryEmpty') : t('franchiseInventoryNoMatch')}
            </Text>
          ) : null}

          <View style={layout.isWeb ? styles.storeGrid : undefined}>
            {visibleItems.map((item, index) => (
              <InventoryCard
                key={item._id}
                item={item}
                priority={index + 1}
                cardStyle={layout.storeCardStyle}
                onAction={openAction}
              />
            ))}
          </View>
          {visibleCount < filteredItems.length ? (
            <View style={styles.loadMoreFooter}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setVisibleCount((count) => count + pageSize)}
                style={styles.loadMoreButton}
              >
                <Text style={styles.loadMoreButtonText}>{t('adminLoadMore')}</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      )}

      {!layout.desktopWeb ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('franchiseInventoryAddStock')}
          onPress={() => setDrawer({ type: 'stock' })}
          style={styles.fab}
        >
          <Plus color={theme.colors.white} size={24} />
        </Pressable>
      ) : null}

      <InventoryFiltersDrawer
        visible={drawer?.type === 'filters'}
        height={height}
        isWeb={layout.isWeb}
        draft={draftFilters}
        canClear={hasActiveFilters || draftFilters.status !== 'all' || draftFilters.search.trim() !== ''}
        onClose={() => setDrawer(null)}
        onDraftChange={setDraftFilters}
        onClear={() => {
          setDraftFilters(defaultInventoryFilters);
          applyFilterState(defaultInventoryFilters);
          setDrawer(null);
        }}
        onApply={() => {
          applyFilterState({ ...draftFilters, search: draftFilters.search.trim() });
          setDrawer(null);
        }}
      />

      <StockFormDrawer
        visible={drawer?.type === 'stock'}
        storeId={storeId}
        onClose={() => setDrawer(null)}
        onAfterClose={handleAfterClose}
        onSaved={completeWithToast}
      />

      <ProductsDrawer
        visible={drawer?.type === 'products'}
        storeId={storeId}
        onClose={() => setDrawer(null)}
        onAfterClose={handleAfterClose}
      />

      <InventoryActionDrawer
        visible={drawer?.type === 'action'}
        storeId={storeId}
        item={drawer?.type === 'action' ? drawer.item : lastAction?.item ?? null}
        action={drawer?.type === 'action' ? drawer.action : lastAction?.action ?? null}
        onClose={() => setDrawer(null)}
        onAfterClose={() => {
          setLastAction(null);
          handleAfterClose();
        }}
        onDone={completeWithToast}
      />

      {!drawer && toast ? <AppToast message={toast} tone="success" onDismiss={() => setToast(null)} /> : null}
    </View>
  );
}
