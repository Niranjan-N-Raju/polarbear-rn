import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Banknote, CreditCard, Filter, IndianRupee, Plus, Receipt } from '../../../icons';
import { apiRequest } from '../../../api/auth';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { getAdminLayout } from '../../../utils/adminLayout';
import { SummaryCards } from '../../../components/SummaryCards';
import { formatMoney } from '../DashboardCharts';
import type { SaleRecord } from '../types';
import { SaleCard } from './SaleCard';
import { SaleFiltersDrawer } from './SaleFiltersDrawer';
import { SaleFormDrawer } from './SaleFormDrawer';
import { defaultSaleRange, type SaleRange, saleRangeError, summarizeSales } from './utils';

const pageSize = 10;

interface FranchiseSalesScreenProps {
  storeId: string;
}

export function FranchiseSalesScreen({ storeId }: FranchiseSalesScreenProps) {
  const { width, height } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const [range, setRange] = useState<SaleRange>(() => defaultSaleRange());
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
        const data = await response.json().catch(() => ({})) as { sales?: SaleRecord[]; message?: string };
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

  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, layout.desktopWeb && styles.screenHeaderInline, layout.compactWeb && styles.screenHeaderStack]}>
        <View style={layout.isWeb ? styles.screenHeaderCopy : styles.screenHeaderCopyNative}>
          <View style={styles.screenTitleRow}>
            <Text style={[styles.screenTitle, styles.screenTitleInline]}>{t('franchiseSales')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('franchiseFilterSales')}
              onPress={openFilters}
              style={styles.filterIconButton}
            >
              <Filter color={theme.colors.teal} size={18} />
              {hasActiveFilters ? <View style={styles.filterActiveDot} /> : null}
            </Pressable>
          </View>
          <Text style={styles.screenDescription}>
            {t('franchiseSalesRange', { from: range.from, to: range.to, count: sales.length })}
          </Text>
        </View>
        <View style={styles.screenHeaderActions}>
          {layout.desktopWeb ? (
            <Pressable accessibilityRole="button" onPress={openCreate} style={[styles.primaryButton, styles.screenHeaderAction]}>
              <Text style={styles.primaryButtonText}>{t('franchiseAddSale')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {isLoading && sales.length === 0 ? (
        <AppLoader />
      ) : error ? (
        <AppErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : (
        <ScrollView
          style={[styles.list, !layout.desktopWeb && styles.storeListFabViewport]}
          contentContainerStyle={[styles.listContent, !layout.desktopWeb && styles.storeListWithFab]}
        >
          {isLoading ? <AppLoader variant="inline" /> : null}
          <SummaryCards cards={summaryCards} isWeb={layout.isWeb} perRow={layout.desktopWeb ? 4 : 2} />

          {sales.length === 0 ? <Text style={styles.stateMessage}>{t('franchiseNoSales')}</Text> : null}

          <View style={layout.isWeb ? styles.storeGrid : undefined}>
            {visibleSales.map((sale) => (
              <SaleCard
                key={sale._id}
                sale={sale}
                cardStyle={layout.storeCardStyle}
                actionsAtBottom={layout.storeCardActionsAtBottom}
                onEdit={openEdit}
              />
            ))}
          </View>
          {visibleCount < sales.length ? (
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
        <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseAddSale')} onPress={openCreate} style={styles.fab}>
          <Plus color={theme.colors.white} size={24} />
        </Pressable>
      ) : null}

      <SaleFiltersDrawer
        visible={isFilterOpen}
        height={height}
        isWeb={layout.isWeb}
        draft={draftRange}
        error={draftError}
        canClear={hasActiveFilters || draftRange.from !== defaultRange.from || draftRange.to !== defaultRange.to}
        onClose={() => setIsFilterOpen(false)}
        onDraftChange={(next) => {
          setDraftRange(next);
          setDraftError(null);
        }}
        onClear={clearFilters}
        onApply={applyFilters}
      />

      <SaleFormDrawer
        visible={isFormOpen}
        storeId={storeId}
        editingSale={editingSale}
        existingDates={existingDates}
        onClose={() => setIsFormOpen(false)}
        onAfterClose={() => {
          setEditingSale(null);
          if (!pendingToast) return;
          setToast(pendingToast);
          setPendingToast('');
        }}
        onSaved={handleSaved}
      />

      {!isFormOpen && toast ? <AppToast message={toast} tone="success" onDismiss={() => setToast(null)} /> : null}
    </View>
  );
}
