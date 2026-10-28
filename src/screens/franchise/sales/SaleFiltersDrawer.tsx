import { Pressable, Text, View } from 'react-native';
import { AdminFormField } from '../../../components/AdminFormField';
import { FilterDrawer } from '../../../components/FilterDrawer';
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

const presets: { key: SalePreset; label: 'franchiseToday' | 'franchiseThisWeek' | 'franchiseThisMonth'; }[] = [
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
    <FilterDrawer
      visible={visible}
      title={t('franchiseFilterSales')}
      height={height}
      isWeb={isWeb}
      maxHeight={430}
      canClear={canClear}
      onClose={onClose}
      onAfterClose={onAfterClose}
      onClear={onClear}
      onApply={onApply}
    >
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
        date
        label={t('franchiseFrom')}
        placeholder={t('franchiseDatePlaceholder')}
        value={draft.from}
        onChangeText={(from) => onDraftChange({ ...draft, from })}
        containerStyle={styles.filterDrawerField}
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
      />
      <AdminFormField
        date
        label={t('franchiseTo')}
        placeholder={t('franchiseDatePlaceholder')}
        value={draft.to}
        onChangeText={(to) => onDraftChange({ ...draft, to })}
        containerStyle={styles.filterDrawerField}
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
      />
      {error ? <Text accessibilityRole="alert" style={salesStyles.dateError}>{error}</Text> : null}
    </FilterDrawer>
  );
}
