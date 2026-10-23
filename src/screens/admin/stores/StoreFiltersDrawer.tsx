import { Pressable, ScrollView, Text, View } from 'react-native';
import { X } from '../../../icons';
import { AdminFilterDropdown } from '../../../components/AdminFilterDropdown';
import { AdminFormField } from '../../../components/AdminFormField';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
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
    <ResponsiveDrawerModal
      visible={visible}
      closeLabel={t('adminCloseMenu')}
      onClose={onClose}
      onAfterClose={onAfterClose}
      panelStyle={!isWeb ? { height: Math.min(height * 0.8, 390) } : undefined}
    >
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeading}>
          <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t('adminFilterStores')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.userIconAction}>
            <X color={theme.colors.muted} size={18} />
          </Pressable>
        </View>
        <ScrollView style={styles.drawerFormScroll} contentContainerStyle={styles.filterDrawerFields} keyboardShouldPersistTaps="handled">
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
