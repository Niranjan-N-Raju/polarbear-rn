import { Pressable,ScrollView,Text,View } from 'react-native';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { Filter,Plus } from '../../../icons';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { StoreCard } from './StoreCard';
import { StoreFiltersDrawer } from './StoreFiltersDrawer';
import { StoreFormDrawer } from './StoreFormDrawer';
import type { AdminStoresScreenProps } from './types';
import { useAdminStores } from './useAdminStores';


export function AdminStoresScreen({ userId, onToast }: AdminStoresScreenProps) {
const { height, layout, searchText, setSearchText, statusFilter, setStatusFilter, typeFilter, setTypeFilter, openMobileFilter, setOpenMobileFilter, appliedFilters, isFilterDrawerOpen, setIsFilterDrawerOpen, pageInfo, isRefreshing, isLoadingMore, isLoading, error, isFormOpen, setIsFormOpen, editingStore, pendingArchive, setPendingArchive, pendingArchiveValue, setPendingArchiveValue, pendingArchiveToast, setPendingArchiveToast, form, formIsArchived, setFormIsArchived, toastMessage, toastTone, pendingSuccessMessage, setPendingSuccessMessage, fieldErrors, isSaving, updatingArchiveId, isArchiveDialogOpen, setIsArchiveDialogOpen, dismissToast, loadStores, visibleStores, hasActiveFilters, hasDraftFilters, openFilters, applyFilters, clearFilters, loadMore, openCreate, openEdit, updateField, saveStore, updateStoreArchive } = useAdminStores({ userId, onToast });
if (isLoading) return <AppLoader variant="screen" />;
if (error) return <AppErrorState message={error} onRetry={() => void loadStores(1, appliedFilters)} />;
return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, layout.desktopWeb && styles.screenHeaderInline, layout.compactWeb && styles.screenHeaderStack]}>
        <View style={layout.isWeb ? styles.screenHeaderCopy : styles.screenHeaderCopyNative}>
          {layout.desktopWeb ? <Text style={[styles.screenEyebrow, styles.screenEyebrowTeal]}>{t('adminStoresEyebrow')}</Text> : null}
          <View style={styles.screenTitleRow}>
            <Text style={[styles.screenTitle, styles.screenTitleInline]}>{t('adminStores')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('adminOpenFilters')}
              onPress={openFilters}
              style={styles.filterIconButton}
            >
              <Filter color={theme.colors.teal} size={18} />
              {hasActiveFilters ? <View style={styles.filterActiveDot} /> : null}
            </Pressable>
          </View>
          <Text style={styles.screenDescription}>{t('adminStoreCount', { count: pageInfo.total })}</Text>
        </View>
        <View style={styles.screenHeaderActions}>
          {layout.desktopWeb ? (
            <Pressable accessibilityRole="button" onPress={openCreate} style={[styles.primaryButton, styles.screenHeaderAction]}>
              <Text style={styles.primaryButtonText}>{t('adminAddStore')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {isRefreshing ? <AppLoader variant="inline" /> : null}

      {visibleStores.length === 0 ? <Text style={styles.stateMessage}>{hasActiveFilters ? t('adminNoMatchingStores') : t('adminNoStores')}</Text> : null}

      <ScrollView
        style={[styles.list, !layout.desktopWeb && styles.storeListFabViewport]}
        contentContainerStyle={[
          styles.listContent,
          !layout.desktopWeb && styles.storeListWithFab,
          layout.isWeb && styles.storeGrid,
        ]}
      >
        {visibleStores.map((store) => (
          <StoreCard
            key={store._id}
            store={store}
            userId={userId}
            storeCardStyle={layout.storeCardStyle}
            actionsAtBottom={layout.storeCardActionsAtBottom}
            isUpdatingArchive={updatingArchiveId === store._id}
            onEdit={openEdit}
            onArchive={(target) => {
              setPendingArchive(target);
              setPendingArchiveValue(!target.archivedAt);
              setIsArchiveDialogOpen(true);
            }}
          />
        ))}
        {pageInfo.page < pageInfo.totalPages ? (
          <View style={styles.loadMoreFooter}>
            <Pressable
              accessibilityRole="button"
              disabled={isLoadingMore}
              onPress={loadMore}
              style={[styles.loadMoreButton, isLoadingMore && styles.loadMoreButtonDisabled]}
            >
              {isLoadingMore
                ? <AppLoader variant="inline" />
                : <Text style={styles.loadMoreButtonText}>{t('adminLoadMore')}</Text>}
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {!layout.desktopWeb ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('adminAddStore')} onPress={openCreate} style={styles.fab}>
          <Plus color={theme.colors.white} size={24} />
        </Pressable>
      ) : null}

      <StoreFiltersDrawer
        visible={isFilterDrawerOpen}
        height={height}
        isWeb={layout.isWeb}
        searchText={searchText}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        openFilter={openMobileFilter}
        hasDraftFilters={hasDraftFilters}
        onClose={() => setIsFilterDrawerOpen(false)}
        onAfterClose={() => setOpenMobileFilter(null)}
        onSearchChange={setSearchText}
        onStatusChange={(value) => {
          setStatusFilter(value);
          setOpenMobileFilter(null);
        }}
        onTypeChange={(value) => {
          setTypeFilter(value);
          setOpenMobileFilter(null);
        }}
        onToggleFilter={(filter) => setOpenMobileFilter((current) => current === filter ? null : filter)}
        onDismissDropdown={() => setOpenMobileFilter(null)}
        onClearFilters={clearFilters}
        onApplyFilters={applyFilters}
      />

      <StoreFormDrawer
        visible={isFormOpen}
        editingStore={editingStore}
        form={form}
        formIsArchived={formIsArchived}
        fieldErrors={fieldErrors}
        isSaving={isSaving}
        toastMessage={toastMessage}
        toastTone={toastTone}
        onClose={() => setIsFormOpen(false)}
        onAfterClose={() => {
          if (!pendingSuccessMessage) return;
          onToast(pendingSuccessMessage, 'success');
          setPendingSuccessMessage('');
        }}
        onDismissToast={dismissToast}
        onFieldChange={updateField}
        onArchivedChange={setFormIsArchived}
        onSave={() => void saveStore()}
      />

      {!isFormOpen && toastMessage ? <AppToast message={toastMessage} tone={toastTone} onDismiss={dismissToast} /> : null}

      <ResponsiveDrawerModal
        visible={isArchiveDialogOpen && pendingArchive !== null}
        presentation="dialog"
        closeLabel={t('adminCloseMenu')}
        onClose={() => setIsArchiveDialogOpen(false)}
        onAfterClose={() => {
          setPendingArchive(null);
          if (!pendingArchiveToast) return;
          onToast(pendingArchiveToast, 'success');
          setPendingArchiveToast('');
        }}
      >
        <View style={styles.confirmDialogContent}>
          <View style={styles.confirmDialogHeader}>
            <Text style={[styles.modalTitle, styles.confirmDialogTitle]}>{t(pendingArchiveValue ? 'adminArchiveStore' : 'adminRestoreStore')}</Text>
          </View>
          <View style={styles.confirmDialogBody}>
            <Text style={styles.screenDescription}>
              {t(pendingArchiveValue ? 'adminConfirmArchiveStore' : 'adminConfirmRestoreStore', { name: pendingArchive?.name ?? '' })}
            </Text>
          </View>
          <View style={styles.confirmDialogActions}>
            <View style={styles.confirmDialogActionSlot}>
              <Pressable onPress={() => setIsArchiveDialogOpen(false)} style={[styles.secondaryButton, styles.confirmDialogActionButton]}>
                <Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text>
              </Pressable>
            </View>
            <View style={styles.confirmDialogActionSlot}>
              <Pressable disabled={updatingArchiveId === pendingArchive?._id || isSaving} onPress={() => {
                if (!pendingArchive) return;
                if (isFormOpen) {
                  setIsArchiveDialogOpen(false);
                  void saveStore(true);
                  return;
                }
                void updateStoreArchive(pendingArchive, pendingArchiveValue);
              }} style={[styles.primaryButton, styles.confirmDialogActionButton]}>
                {updatingArchiveId === pendingArchive?._id ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t(pendingArchiveValue ? 'adminArchive' : 'adminRestore')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </ResponsiveDrawerModal>
    </View>
  );
}
