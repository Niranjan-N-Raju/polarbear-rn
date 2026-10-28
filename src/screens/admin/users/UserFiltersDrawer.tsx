import { Pressable, Text, TextInput, View } from 'react-native';
import { AdminFilterDropdown } from '../../../components/AdminFilterDropdown';
import { AdminFormField } from '../../../components/AdminFormField';
import { FilterDrawer } from '../../../components/FilterDrawer';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import type { UserFiltersDrawerProps, UserStoreAutocompleteProps } from './types';

export function UserFiltersDrawer({
  visible,
  height,
  isWeb,
  searchText,
  storeSearchText,
  filterStatus,
  filterRole,
  stores,
  openFilter,
  hasDraftFilters,
  onClose,
  onAfterClose,
  onSearchChange,
  onStoreSearchChange,
  onStoreSelect,
  onFilterStatusChange,
  onFilterRoleChange,
  onToggleFilter,
  onOpenStoreFilter,
  onDismissDropdown,
  onClearFilters,
  onApplyFilters,
  userRoleOptions,
}: UserFiltersDrawerProps) {
  return (
    <FilterDrawer
      visible={visible}
      title={t('adminFilterUsers')}
      height={height}
      isWeb={isWeb}
      maxHeight={470}
      canClear={hasDraftFilters}
      onClose={onClose}
      onAfterClose={onAfterClose}
      onClear={onClearFilters}
      onApply={onApplyFilters}
    >
      <AdminFormField
        label={t('adminSearchUsers')}
        placeholder={t('adminSearchUsers')}
        value={searchText}
        onChangeText={onSearchChange}
        autoCorrect={false}
        containerStyle={styles.filterDrawerField}
      />
      <StoreAutocomplete
        stores={stores}
        value={storeSearchText}
        expanded={openFilter === 'store'}
        containerStyle={styles.filterDrawerDropdown}
        onFocus={onOpenStoreFilter}
        onChangeText={onStoreSearchChange}
        onSelect={onStoreSelect}
      />
      <AdminFilterDropdown
        label={t('adminStatus')}
        value={filterStatus}
        expanded={openFilter === 'status'}
        containerStyle={[styles.userFilterDropdown, styles.filterDrawerDropdown]}
        onToggle={() => onToggleFilter('status')}
        onSelect={onFilterStatusChange}
        options={[
          { value: 'all', label: t('adminAllUsers') },
          { value: 'active', label: t('adminActive') },
          { value: 'inactive', label: t('adminInactive') },
        ]}
      />
      <AdminFilterDropdown
        label={t('adminUserTypeFilter')}
        value={filterRole}
        expanded={openFilter === 'type'}
        containerStyle={[styles.userFilterDropdown, styles.filterDrawerDropdown]}
        optionsPlacement="above"
        onToggle={() => onToggleFilter('type')}
        onSelect={onFilterRoleChange}
        options={[
          { value: 'all', label: t('adminAllUserTypes') },
          ...userRoleOptions,
        ]}
      />
      {openFilter ? (
        <Pressable
          testID="user-filter-dropdown-dismiss"
          accessibilityRole="button"
          accessibilityLabel={t('adminCloseMenu')}
          onPress={onDismissDropdown}
          style={styles.filterDropdownDismissOverlay}
        />
      ) : null}
    </FilterDrawer>
  );
}

function StoreAutocomplete({ stores, value, expanded, containerStyle, onFocus, onChangeText, onSelect }: UserStoreAutocompleteProps) {
  const normalizedSearch = value.trim().toLocaleLowerCase();
  const matches = stores
    .filter((store) => store.name.toLocaleLowerCase().includes(normalizedSearch))
    .slice(0, 8);

  return (
    <View style={[styles.storeFilterDropdown, styles.userStoreAutocomplete, expanded && styles.storeFilterDropdownOpen, containerStyle]}>
      <TextInput
        value={value}
        placeholder={t('adminSearchStores')}
        onFocus={onFocus}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.fieldInput, styles.storeSearch, styles.userFilterInput]}
      />
      {expanded && matches.length > 0 ? (
        <View style={[styles.storeFilterDropdownOptions, styles.userStoreAutocompleteOptions]}>
          {matches.map((store) => (
            <Pressable key={store._id} accessibilityRole="button" onPress={() => onSelect(store)} style={styles.storeFilterDropdownOption}>
              <Text style={styles.storeFilterDropdownOptionText}>{store.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
