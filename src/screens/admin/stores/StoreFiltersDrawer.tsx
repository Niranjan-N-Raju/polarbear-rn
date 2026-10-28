import { Pressable } from 'react-native';
import { AdminFilterDropdown } from '../../../components/AdminFilterDropdown';
import { AdminFormField } from '../../../components/AdminFormField';
import { FilterDrawer } from '../../../components/FilterDrawer';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import type { StoreFiltersDrawerProps } from './types';

export function StoreFiltersDrawer({
  visible,
  height,
  isWeb,
  searchText,
  statusFilter,
  typeFilter,
  openFilter,
  hasDraftFilters,
  onClose,
  onAfterClose,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onToggleFilter,
  onDismissDropdown,
  onClearFilters,
  onApplyFilters,
}: StoreFiltersDrawerProps) {
  return (
    <FilterDrawer
      visible={visible}
      title={t('adminFilterStores')}
      height={height}
      isWeb={isWeb}
      maxHeight={390}
      canClear={hasDraftFilters}
      onClose={onClose}
      onAfterClose={onAfterClose}
      onClear={onClearFilters}
      onApply={onApplyFilters}
    >
      <AdminFormField
        label={t('adminSearchStoresPlaceholder')}
        placeholder={t('adminSearchStoresPlaceholder')}
        value={searchText}
        onChangeText={onSearchChange}
        containerStyle={styles.filterDrawerField}
      />
      <AdminFilterDropdown
        label={t('adminStatus')}
        value={statusFilter}
        expanded={openFilter === 'status'}
        onToggle={() => onToggleFilter('status')}
        onSelect={onStatusChange}
        containerStyle={styles.filterDrawerDropdown}
        options={[
          { value: 'active', label: t('adminActive') },
          { value: 'archived', label: t('adminArchived') },
          { value: 'all', label: t('adminAllStores') },
        ]}
      />
      <AdminFilterDropdown
        label={t('adminStoreType')}
        value={typeFilter}
        expanded={openFilter === 'type'}
        optionsPlacement="above"
        onToggle={() => onToggleFilter('type')}
        onSelect={onTypeChange}
        containerStyle={styles.filterDrawerDropdown}
        options={[
          { value: 'all', label: t('adminAllTypes') },
          { value: 'company', label: t('adminCompanyStore') },
          { value: 'franchise', label: t('adminFranchiseStore') },
        ]}
      />
      {openFilter ? (
        <Pressable
          testID="store-filter-dropdown-dismiss"
          accessibilityRole="button"
          accessibilityLabel={t('adminCloseMenu')}
          onPress={onDismissDropdown}
          style={styles.filterDropdownDismissOverlay}
        />
      ) : null}
    </FilterDrawer>
  );
}
