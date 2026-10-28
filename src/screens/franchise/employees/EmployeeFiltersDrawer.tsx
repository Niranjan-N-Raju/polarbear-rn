import { Pressable, Text, View } from 'react-native';
import { AdminFormField } from '../../../components/AdminFormField';
import { FilterDrawer } from '../../../components/FilterDrawer';
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
    <FilterDrawer
      visible={visible}
      title={t('franchiseEmployeesFilter')}
      canClear={hasDraftFilters}
      clearLabel={t('franchiseEmployeesClearFilters')}
      applyLabel={t('franchiseEmployeesApplyFilters')}
      onClose={onClose}
      onClear={onClear}
      onApply={onApply}
    >
      <AdminFormField label={t('franchiseEmployeesSearch')} placeholder={t('franchiseEmployeesSearch')} value={search} onChangeText={onSearchChange} autoCorrect={false} />
      <Text style={styles.fieldLabel}>{t('franchiseEmployeesStatus')}</Text>
      <View style={styles.typeOptions}>
        {(['all', 'active', 'inactive'] as const).map((option) => (
          <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: status === option }} onPress={() => onStatusChange(option)} style={[styles.secondaryButton, styles.typeOption, status === option && styles.typeOptionSelected]}>
            <Text style={styles.secondaryButtonText}>{t(option === 'all' ? 'franchiseEmployeesAll' : option === 'active' ? 'franchiseEmployeesActive' : 'franchiseEmployeesArchived')}</Text>
          </Pressable>
        ))}
      </View>
    </FilterDrawer>
  );
}
