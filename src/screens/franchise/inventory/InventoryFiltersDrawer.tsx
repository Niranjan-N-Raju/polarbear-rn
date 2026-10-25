import { Pressable, ScrollView, Text, View } from 'react-native';
import { X } from '../../../icons';
import { AdminFormField } from '../../../components/AdminFormField';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { salesStyles } from '../sales/salesStyles';
import type { InventoryFilter, InventoryFilters } from './utils';

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
    <ResponsiveDrawerModal
      visible={visible}
      closeLabel={t('adminCloseMenu')}
      onClose={onClose}
      onAfterClose={onAfterClose}
      panelStyle={!isWeb ? { height: Math.min(height * 0.8, 460) } : undefined}
    >
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeading}>
          <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t('franchiseInventoryFilter')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.userIconAction}>
            <X color={theme.colors.muted} size={18} />
          </Pressable>
        </View>
        <ScrollView style={styles.drawerFormScroll} contentContainerStyle={styles.filterDrawerFields} keyboardShouldPersistTaps="handled">
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
        </ScrollView>
        <View style={styles.modalActions}>
          <View style={styles.drawerActionSlot}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canClear }}
              disabled={!canClear}
              onPress={onClear}
              style={[styles.secondaryButton, styles.drawerActionButton, !canClear && styles.filterDrawerDisabledButton]}
            >
              <Text style={styles.secondaryButtonText}>{t('adminClearFilters')}</Text>
            </Pressable>
          </View>
          <View style={styles.drawerActionSlot}>
            <Pressable accessibilityRole="button" onPress={onApply} style={[styles.primaryButton, styles.drawerActionButton]}>
              <Text style={styles.primaryButtonText}>{t('adminApplyFilters')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ResponsiveDrawerModal>
  );
}
