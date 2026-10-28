import { Pressable,ScrollView,Text,View } from 'react-native';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { SummaryCards } from '../../../components/SummaryCards';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { Filter,Package,Plus } from '../../../icons';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { InventoryActionDrawer } from './InventoryActionDrawer';
import { InventoryCard } from './InventoryCard';
import { InventoryFiltersDrawer } from './InventoryFiltersDrawer';
import { inventoryStyles } from './inventoryStyles';
import { ProductsDrawer } from './ProductsDrawer';
import { StockFormDrawer } from './StockFormDrawer';
import { type FranchiseInventoryScreenProps,pageSize,useFranchiseInventory } from './useFranchiseInventory';
import {
defaultInventoryFilters
} from './utils';


export function FranchiseInventoryScreen({ storeId }: FranchiseInventoryScreenProps) {
const { height, layout, items, isLoading, error, setReloadKey, filters, draftFilters, setDraftFilters, visibleCount, setVisibleCount, drawer, setDrawer, lastAction, setLastAction, toast, setToast, filteredItems, visibleItems, hasActiveFilters, totalUnits, applyFilterState, openFilters, toggleStatus, openAction, completeWithToast, handleAfterClose, summaryCards } = useFranchiseInventory({ storeId });
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
          <SummaryCards
            cards={summaryCards.map((card) => ({ ...card, selected: filters.status === card.key, onPress: () => toggleStatus(card.key) }))}
            isWeb={layout.isWeb}
            perRow={layout.desktopWeb ? 4 : 2}
          />

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
