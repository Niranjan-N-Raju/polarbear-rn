import { Text } from 'react-native';
import { theme } from '../config/theme';
import { t } from '../i18n';
import { adminStyles as styles } from '../styles/adminStyles';
import { AdminFormField } from './AdminFormField';
import { FilterDrawer } from './FilterDrawer';

export interface DateRange {
  from: string;
  to: string;
}

interface DateRangeFilterDrawerProps {
  visible: boolean;
  title: string;
  height: number;
  isWeb: boolean;
  range: DateRange;
  error?: string;
  onChange: (range: DateRange) => void;
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
}

export function DateRangeFilterDrawer({
  visible, title, height, isWeb, range, error, onChange, onClose, onClear, onApply,
}: DateRangeFilterDrawerProps) {
  return (
    <FilterDrawer
      visible={visible}
      title={title}
      height={height}
      isWeb={isWeb}
      onClose={onClose}
      onClear={onClear}
      onApply={onApply}
      automaticallyAdjustKeyboardInsets
    >
      {(['from', 'to'] as const).map((field) => (
        <AdminFormField
          key={field}
          date
          label={t(field === 'from' ? 'franchiseFrom' : 'franchiseTo')}
          placeholder={t('franchiseDatePlaceholder')}
          value={range[field]}
          onChangeText={(value) => onChange({ ...range, [field]: value })}
          containerStyle={styles.filterDrawerField}
        />
      ))}
      {error ? <Text accessibilityRole="alert" style={{ color: theme.colors.error, fontSize: theme.typography.sm }}>{error}</Text> : null}
    </FilterDrawer>
  );
}
