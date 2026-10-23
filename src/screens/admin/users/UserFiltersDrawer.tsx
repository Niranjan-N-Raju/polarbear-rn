import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { X } from '../../../icons';
import { AdminFilterDropdown } from '../../../components/AdminFilterDropdown';
import { AdminFormField } from '../../../components/AdminFormField';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
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
    <ResponsiveDrawerModal
      visible={visible}
      closeLabel={t('adminCloseMenu')}
      onClose={onClose}
      onAfterClose={onAfterClose}
      panelStyle={!isWeb ? { height: Math.min(height * 0.8, 470) } : undefined}
    >
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeading}>
          <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t('adminFilterUsers')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.userIconAction}>
            <X color={theme.colors.muted} size={18} />
          </Pressable>
        </View>
        <ScrollView style={styles.drawerFormScroll} contentContainerStyle={styles.filterDrawerFields} keyboardShouldPersistTaps="handled">
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
        </ScrollView>
        <View style={styles.modalActions}>
          <View style={styles.drawerActionSlot}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !hasDraftFilters }}
              disabled={!hasDraftFilters}
              onPress={onClearFilters}
              style={[
                styles.secondaryButton,
                styles.drawerActionButton,
                !hasDraftFilters && styles.filterDrawerDisabledButton,
              ]}
            >
              <Text style={styles.secondaryButtonText}>{t('adminClearFilters')}</Text>
            </Pressable>
          </View>
          <View style={styles.drawerActionSlot}>
            <Pressable onPress={onApplyFilters} style={[styles.primaryButton, styles.drawerActionButton]}>
              <Text style={styles.primaryButtonText}>{t('adminApplyFilters')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ResponsiveDrawerModal>
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
