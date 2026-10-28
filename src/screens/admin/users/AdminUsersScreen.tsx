import { Pressable,Text,View } from 'react-native';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { Filter,Plus } from '../../../icons';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { UserFiltersDrawer } from './UserFiltersDrawer';
import { UserFormDrawer } from './UserFormDrawer';
import { UserList } from './UserList';
import type {
AdminUsersScreenProps
} from './types';
import { useAdminUsers } from './useAdminUsers';


export function AdminUsersScreen({ onToast }: AdminUsersScreenProps) {
const { height, layout, stores, setFilterStore, filterStatus, setFilterStatus, filterRole, setFilterRole, storeSearchText, setStoreSearchText, openFilter, setOpenFilter, searchText, setSearchText, appliedFilters, isFilterDrawerOpen, setIsFilterDrawerOpen, pageInfo, isRefreshing, isLoadingMore, isLoading, loadError, form, editing, isFormOpen, setIsFormOpen, pendingDelete, setPendingDelete, fieldErrors, toastMessage, pendingFormSuccess, setPendingFormSuccess, pendingDeleteSuccess, setPendingDeleteSuccess, isSaving, isDeleting, isDeleteDialogOpen, setIsDeleteDialogOpen, dismissToast, load, visibleUsers, userRoleOptions, hasActiveFilters, hasDraftFilters, openFilters, applyFilters, clearFilters, loadMore, openCreate, openEdit, updateField, toggleStore, updateRole, save, deleteUser } = useAdminUsers({ onToast });
if (isLoading) return <AppLoader variant="screen" />;
if (loadError) return <AppErrorState message={loadError} onRetry={() => void load(1, appliedFilters)} />;
return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, layout.desktopWeb && styles.screenHeaderInline, layout.compactWeb && styles.screenHeaderStack]}>
        <View style={layout.isWeb ? styles.screenHeaderCopy : styles.screenHeaderCopyNative}>
          {layout.desktopWeb ? <Text style={[styles.screenEyebrow, styles.screenEyebrowTeal]}>{t('adminUsersEyebrow')}</Text> : null}
          <View style={styles.screenTitleRow}>
            <Text style={[styles.screenTitle, styles.screenTitleInline]}>{t('adminUsers')}</Text>
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
          <Text style={styles.screenDescription}>{t('adminManageUsers')}</Text>
        </View>
        <View style={styles.screenHeaderActions}>
          {layout.desktopWeb ? (
            <Pressable accessibilityRole="button" onPress={openCreate} style={[styles.primaryButton, styles.screenHeaderAction]}>
              <Text style={styles.primaryButtonText}>{t('adminAddUser')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {isRefreshing ? <AppLoader variant="inline" /> : null}
      {visibleUsers.length === 0 ? <Text style={styles.stateMessage}>{hasActiveFilters ? t('adminNoMatchingUsers') : t('adminNoUsers')}</Text> : null}
      {visibleUsers.length > 0 ? (
        <UserList
          users={visibleUsers}
          isTable={layout.usersTable}
          isDesktopWeb={layout.desktopWeb}
          footer={pageInfo.page < pageInfo.totalPages ? (
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
          onEdit={openEdit}
          onDelete={(user) => {
            setPendingDelete(user);
            setIsDeleteDialogOpen(true);
          }}
        />
      ) : null}

      {!layout.desktopWeb ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('adminAddUser')} onPress={openCreate} style={styles.fab}>
          <Plus color={theme.colors.white} size={24} />
        </Pressable>
      ) : null}

      <UserFiltersDrawer
        visible={isFilterDrawerOpen}
        height={height}
        isWeb={layout.isWeb}
        searchText={searchText}
        storeSearchText={storeSearchText}
        filterStatus={filterStatus}
        filterRole={filterRole}
        stores={stores}
        openFilter={openFilter}
        hasDraftFilters={hasDraftFilters}
        userRoleOptions={userRoleOptions}
        onClose={() => setIsFilterDrawerOpen(false)}
        onAfterClose={() => setOpenFilter(null)}
        onSearchChange={setSearchText}
        onStoreSearchChange={(value) => {
          setStoreSearchText(value);
          setFilterStore('');
          setOpenFilter('store');
        }}
        onStoreSelect={(store) => {
          setStoreSearchText(store.name);
          setFilterStore(store._id);
          setOpenFilter(null);
        }}
        onFilterStatusChange={(value) => {
          setFilterStatus(value);
          setOpenFilter(null);
        }}
        onFilterRoleChange={(value) => {
          setFilterRole(value);
          setOpenFilter(null);
        }}
        onToggleFilter={(filter) => setOpenFilter((current) => current === filter ? null : filter)}
        onOpenStoreFilter={() => setOpenFilter('store')}
        onDismissDropdown={() => setOpenFilter(null)}
        onClearFilters={clearFilters}
        onApplyFilters={applyFilters}
      />

      <UserFormDrawer
        visible={isFormOpen}
        editing={editing}
        form={form}
        stores={stores}
        fieldErrors={fieldErrors}
        isSaving={isSaving}
        toastMessage={toastMessage}
        onClose={() => setIsFormOpen(false)}
        onAfterClose={() => {
          if (!pendingFormSuccess) return;
          onToast(pendingFormSuccess, 'success');
          setPendingFormSuccess('');
          void load(1, appliedFilters);
        }}
        onDismissToast={dismissToast}
        onNameChange={(value) => updateField('name', value)}
        onEmailChange={(value) => updateField('email', value)}
        onPasswordChange={(value) => updateField('password', value)}
        onRoleChange={updateRole}
        onToggleStore={toggleStore}
        onSave={() => void save()}
      />

      <ResponsiveDrawerModal
        visible={isDeleteDialogOpen && pendingDelete !== null}
        presentation="dialog"
        closeLabel={t('adminCloseMenu')}
        onClose={() => setIsDeleteDialogOpen(false)}
        onAfterClose={() => {
          setPendingDelete(null);
          if (!pendingDeleteSuccess) return;
          onToast(pendingDeleteSuccess, 'success');
          setPendingDeleteSuccess('');
          void load(1, appliedFilters);
        }}
        overlay={toastMessage ? <AppToast message={toastMessage} onDismiss={dismissToast} /> : null}
      >
        <View style={styles.confirmDialogContent}>
          <View style={styles.confirmDialogHeader}>
            <Text style={[styles.modalTitle, styles.confirmDialogTitle]}>{t('adminDeleteUser')}</Text>
          </View>
          <View style={styles.confirmDialogBody}>
            <Text style={styles.screenDescription}>{t('adminConfirmDeleteUser', { name: pendingDelete?.name ?? '' })}</Text>
          </View>
          <View style={styles.confirmDialogActions}>
            <View style={styles.confirmDialogActionSlot}>
              <Pressable onPress={() => setIsDeleteDialogOpen(false)} style={[styles.secondaryButton, styles.confirmDialogActionButton]}><Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text></Pressable>
            </View>
            <View style={styles.confirmDialogActionSlot}>
              <Pressable disabled={isDeleting} onPress={() => void deleteUser()} style={[styles.dangerButton, styles.confirmDialogActionButton]}>
                {isDeleting ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.dangerButtonText}>{t('adminDelete')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </ResponsiveDrawerModal>
    </View>
  );
}
