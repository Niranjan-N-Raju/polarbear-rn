import { Pressable, ScrollView, Text, View } from 'react-native';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { SummaryCards } from '../../../components/SummaryCards';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { Filter, Plus } from '../../../icons';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { SaleCard } from './SaleCard';
import { SaleFiltersDrawer } from './SaleFiltersDrawer';
import { SaleFormDrawer } from './SaleFormDrawer';
import { pageSize, useFranchiseSales, type FranchiseSalesScreenProps } from './useFranchiseSales';
import { salesStyles } from './salesStyles';


export function FranchiseSalesScreen({ storeId }: FranchiseSalesScreenProps) {
  const {
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
  } = useFranchiseSales({ storeId });
  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, layout.desktopWeb && styles.screenHeaderInline, layout.compactWeb && styles.screenHeaderStack, layout.isWeb && salesStyles.webHeader]}>
        <View style={layout.isWeb ? styles.screenHeaderCopy : styles.screenHeaderCopyNative}>
          <View style={[styles.screenTitleRow, layout.isWeb && salesStyles.webTitleRow]}>
            <Text style={[styles.screenTitle, styles.screenTitleInline]}>{t('franchiseSales')}</Text>
            {!layout.isWeb ? <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('franchiseFilterSales')}
              onPress={openFilters}
              style={styles.filterIconButton}
            >
              <Filter color={theme.colors.teal} size={18} />
              {hasActiveFilters ? <View style={styles.filterActiveDot} /> : null}
            </Pressable> : null}
            {layout.isWeb ? <View style={[styles.screenHeaderActions, salesStyles.webHeaderActions]}>
              <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseFilterSales')} onPress={openFilters} style={styles.filterIconButton}>
                <Filter color={theme.colors.teal} size={18} />
                {hasActiveFilters ? <View style={styles.filterActiveDot} /> : null}
              </Pressable>
              <Pressable accessibilityRole="button" onPress={openCreate} style={[styles.primaryButton, styles.screenHeaderAction, salesStyles.webHeaderButton]}>
                <Text style={styles.primaryButtonText}>{t('franchiseAddSale')}</Text>
              </Pressable>
            </View> : null}
          </View>
          <Text style={styles.screenDescription}>
            {t('franchiseSalesRange', { from: range.from, to: range.to, count: sales.length })}
          </Text>
        </View>
      </View>

      {isLoading && sales.length === 0 ? (
        <AppLoader />
      ) : error ? (
        <AppErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : (
        <ScrollView
          style={[styles.list, !layout.isWeb && styles.storeListFabViewport]}
          contentContainerStyle={[styles.listContent, !layout.isWeb && styles.storeListWithFab]}
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
                actionsAtBottom={false}
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

      {!layout.isWeb ? (
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
