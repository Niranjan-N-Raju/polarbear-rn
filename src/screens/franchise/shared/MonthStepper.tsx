import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from '../../../icons';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { formatMonthLabel, monthRange, shiftMonth } from './months';
import { DateInput } from '../../../components/DateInput';

interface MonthStepperProps {
  month: string;
  onChange: (month: string) => void;
  maxMonth?: string;
}

export function MonthStepper({ month, onChange, maxMonth }: MonthStepperProps) {
  const next = shiftMonth(month, 1);
  const nextDisabled = Boolean(maxMonth && next > maxMonth);
  return (
    <View style={monthStyles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('franchisePreviousMonth')}
        onPress={() => onChange(shiftMonth(month, -1))}
        style={monthStyles.button}
      >
        <ChevronLeft color={theme.colors.teal} size={18} />
      </Pressable>
      <View style={monthStyles.selection}>
        <Text accessibilityRole="header" style={monthStyles.label}>{formatMonthLabel(month)}</Text>
        <DateInput
          accessibilityLabel={t('dateSelectMonth')}
          value={`${month}-01`}
          onChangeText={(value) => onChange(value.slice(0, 7))}
          allowClear={false}
          maximumDate={maxMonth ? monthRange(maxMonth).to : undefined}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('franchiseNextMonth')}
        accessibilityState={{ disabled: nextDisabled }}
        disabled={nextDisabled}
        onPress={() => onChange(next)}
        style={[monthStyles.button, nextDisabled && monthStyles.disabled]}
      >
        <ChevronRight color={theme.colors.teal} size={18} />
      </Pressable>
    </View>
  );
}

const monthStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.beige,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginBottom: 12,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.paleBackground,
  },
  disabled: { opacity: 0.4 },
  selection: { flex: 1, marginHorizontal: theme.spacing.md },
  label: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
});
