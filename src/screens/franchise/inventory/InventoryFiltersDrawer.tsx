import { Pressable,Text,View } from 'react-native';
import { AdminFormField } from '../../../components/AdminFormField';
import { FilterDrawer } from '../../../components/FilterDrawer';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { salesStyles } from '../sales/salesStyles';
import type { InventoryFilter,InventoryFilters } from './utils';

interface InventoryFiltersDrawerProps {
  visible: boolean;
  height: number;
  isWeb: boolean;
  draft: InventoryFilters;
  canClear: boolean;
  onClose: () => void;
  onAfterClose?: () => void;
  onDraftChange: (filters: InventoryFilters) => void;
  onClear: () => void;
  onApply: () => void;
}

export const inventoryFilterOptions: { key: InventoryFilter; label: Parameters<typeof t>[0] }[] = [
  { key: 'all', label: 'franchiseInventoryFilterAll' },
  { key: 'expired', label: 'franchiseInventoryFilterExpired' },
  { key: 'oneDay', label: 'franchiseInventoryFilterOneDay' },
  { key: 'sevenDays', label: 'franchiseInventoryFilterSevenDays' },
  { key: 'thirtyDays', label: 'franchiseInventoryFilterThirtyDays' },
  { key: 'healthy', label: 'franchiseInventoryFilterHealthy' },
];

export function InventoryFiltersDrawer({
  visible,
  height,
  isWeb,
  draft,
  canClear,
  onClose,
  onAfterClose,
  onDraftChange,
  onClear,
  onApply,
}: InventoryFiltersDrawerProps) {
  return (
    <FilterDrawer
      visible={visible}
      title={t('franchiseInventoryFilter')}
      height={height}
      isWeb={isWeb}
      maxHeight={460}
      canClear={canClear}
      onClose={onClose}
      onAfterClose={onAfterClose}
      onClear={onClear}
      onApply={onApply}
    >
      <View style={[salesStyles.presetRow, styles.filterDrawerField]}>
        {inventoryFilterOptions.map((option) => {
          const selected = draft.status === option.key;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onDraftChange({ ...draft, status: option.key })}
              style={[styles.secondaryButton, salesStyles.presetButton, selected && styles.storeOptionSelected]}
            >
              <Text style={styles.secondaryButtonText}>{t(option.label)}</Text>
            </Pressable>
          );
        })}
      </View>
      <AdminFormField
        label={t('franchiseInventoryProduct')}
        placeholder={t('franchiseInventorySearchProduct')}
        value={draft.search}
        onChangeText={(search) => onDraftChange({ ...draft, search })}
        containerStyle={styles.filterDrawerField}
        autoCapitalize="none"
      />
    </FilterDrawer>
  );
}
