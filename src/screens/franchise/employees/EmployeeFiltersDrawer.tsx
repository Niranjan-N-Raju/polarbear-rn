import { Pressable, ScrollView, Text, View } from 'react-native';
import { X } from '../../../icons';
import { AdminFormField } from '../../../components/AdminFormField';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';

export type EmployeeStatusFilter = 'all' | 'active' | 'inactive';

interface EmployeeFiltersDrawerProps {
  visible: boolean;
  search: string;
  status: EmployeeStatusFilter;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: EmployeeStatusFilter) => void;
  onClear: () => void;
  onApply: () => void;
}

export function EmployeeFiltersDrawer({ visible, search, status, onClose, onSearchChange, onStatusChange, onClear, onApply }: EmployeeFiltersDrawerProps) {
  const hasDraftFilters = Boolean(search.trim() || status !== 'all');
  return (
    <ResponsiveDrawerModal visible={visible} closeLabel={t('adminCloseMenu')} onClose={onClose}>
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeading}>
          <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t('franchiseEmployeesFilter')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.userIconAction}>
            <X color={theme.colors.muted} size={18} />
          </Pressable>
        </View>
        <ScrollView style={styles.drawerFormScroll} contentContainerStyle={styles.filterDrawerFields} keyboardShouldPersistTaps="handled">
          <AdminFormField label={t('franchiseEmployeesSearch')} placeholder={t('franchiseEmployeesSearch')} value={search} onChangeText={onSearchChange} autoCorrect={false} />
          <Text style={styles.fieldLabel}>{t('franchiseEmployeesStatus')}</Text>
          <View style={styles.typeOptions}>
            {(['all', 'active', 'inactive'] as const).map((option) => (
              <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: status === option }} onPress={() => onStatusChange(option)} style={[styles.secondaryButton, styles.typeOption, status === option && styles.typeOptionSelected]}>
                <Text style={styles.secondaryButtonText}>{t(option === 'all' ? 'franchiseEmployeesAll' : option === 'active' ? 'franchiseEmployeesActive' : 'franchiseEmployeesArchived')}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <View style={styles.modalActions}>
          <View style={styles.drawerActionSlot}>
            <Pressable disabled={!hasDraftFilters} onPress={onClear} style={[styles.secondaryButton, styles.drawerActionButton, !hasDraftFilters && styles.filterDrawerDisabledButton]}>
              <Text style={styles.secondaryButtonText}>{t('franchiseEmployeesClearFilters')}</Text>
            </Pressable>
          </View>
          <View style={styles.drawerActionSlot}>
            <Pressable onPress={onApply} style={[styles.primaryButton, styles.drawerActionButton]}><Text style={styles.primaryButtonText}>{t('franchiseEmployeesApplyFilters')}</Text></Pressable>
          </View>
        </View>
      </View>
    </ResponsiveDrawerModal>
  );
}
