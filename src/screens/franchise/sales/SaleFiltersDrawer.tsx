import { Pressable, ScrollView, Text, View } from 'react-native';
import { X } from '../../../icons';
import { AdminFormField } from '../../../components/AdminFormField';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { salesStyles } from './salesStyles';
import { type SaleRange, salePresetRange, type SalePreset } from './utils';

interface SaleFiltersDrawerProps {
  visible: boolean;
  height: number;
  isWeb: boolean;
  draft: SaleRange;
  error: string | null;
  canClear: boolean;
  onClose: () => void;
  onAfterClose?: () => void;
  onDraftChange: (range: SaleRange) => void;
  onClear: () => void;
  onApply: () => void;
}

const presets: { key: SalePreset; label: 'franchiseToday' | 'franchiseThisWeek' | 'franchiseThisMonth' }[] = [
  { key: 'today', label: 'franchiseToday' },
  { key: 'week', label: 'franchiseThisWeek' },
  { key: 'month', label: 'franchiseThisMonth' },
];

export function SaleFiltersDrawer({
  visible,
  height,
  isWeb,
  draft,
  error,
  canClear,
  onClose,
  onAfterClose,
  onDraftChange,
  onClear,
  onApply,
}: SaleFiltersDrawerProps) {
  return (
    <ResponsiveDrawerModal
      visible={visible}
      closeLabel={t('adminCloseMenu')}
      onClose={onClose}
      onAfterClose={onAfterClose}
      panelStyle={!isWeb ? { height: Math.min(height * 0.8, 430) } : undefined}
    >
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeading}>
          <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t('franchiseFilterSales')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.userIconAction}>
            <X color={theme.colors.muted} size={18} />
          </Pressable>
        </View>
        <ScrollView style={styles.drawerFormScroll} contentContainerStyle={styles.filterDrawerFields} keyboardShouldPersistTaps="handled">
          <View style={[salesStyles.presetRow, styles.filterDrawerField]}>
            {presets.map((preset) => {
              const range = salePresetRange(preset.key);
              const selected = range.from === draft.from && range.to === draft.to;
              return (
                <Pressable
                  key={preset.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onDraftChange(range)}
                  style={[styles.secondaryButton, salesStyles.presetButton, selected && styles.storeOptionSelected]}
                >
                  <Text style={styles.secondaryButtonText}>{t(preset.label)}</Text>
                </Pressable>
              );
            })}
          </View>
          <AdminFormField
            label={t('franchiseFrom')}
            placeholder={t('franchiseDatePlaceholder')}
            value={draft.from}
            onChangeText={(from) => onDraftChange({ ...draft, from })}
            containerStyle={styles.filterDrawerField}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
          />
          <AdminFormField
            label={t('franchiseTo')}
            placeholder={t('franchiseDatePlaceholder')}
            value={draft.to}
            onChangeText={(to) => onDraftChange({ ...draft, to })}
            containerStyle={styles.filterDrawerField}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
          />
          {error ? <Text accessibilityRole="alert" style={salesStyles.dateError}>{error}</Text> : null}
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
