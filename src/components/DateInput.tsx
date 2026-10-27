import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { CalendarDays } from '../icons';
import { theme } from '../config/theme';
import { t } from '../i18n';
import { formatDateOnly, parseDateOnly } from '../utils/dateOnly';
import type { DateInputProps } from './DateInput.types';

export function DateInput({
  value, onChangeText, accessibilityLabel, placeholder, editable = true, allowClear = true,
  minimumDate, maximumDate, style,
}: DateInputProps) {
  const min = minimumDate ? parseDateOnly(minimumDate) : undefined;
  const max = maximumDate ? parseDateOnly(maximumDate) : undefined;
  let initial = parseDateOnly(value) ?? new Date();
  if (min && initial < min) initial = min;
  if (max && initial > max) initial = max;
  const open = () => {
    DateTimePickerAndroid.open({
      value: initial,
      mode: 'date',
      minimumDate: min,
      maximumDate: max,
      onValueChange: (_event, date) => onChangeText(formatDateOnly(date)),
      onError: (error) => Alert.alert(t('datePickerFailed'), error.message),
      ...(allowClear ? {
        neutralButton: { label: t('dateClear'), textColor: theme.colors.teal },
        onNeutralButtonPress: () => onChangeText(''),
      } : {}),
    });
  };
  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.input, style, styles.row]}>
        {value ? null : <Text style={[styles.text, styles.placeholder]} numberOfLines={1}>{placeholder || t('dateSelect')}</Text>}
        <DateTimePicker
          testID="ios-date-picker"
          accessibilityLabel={accessibilityLabel}
          value={initial}
          mode="date"
          display="compact"
          minimumDate={min}
          maximumDate={max}
          themeVariant="light"
          accentColor={theme.colors.teal}
          disabled={!editable}
          style={[styles.compact, !value && styles.compactEmpty]}
          onValueChange={(_event, date) => onChangeText(formatDateOnly(date))}
        />
        {allowClear && value && editable ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('dateClear')} onPress={() => onChangeText('')} hitSlop={8}>
            <Text style={styles.confirm}>{t('dateClear')}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: value }}
      accessibilityState={{ disabled: !editable }}
      disabled={!editable}
      onPress={open}
      style={[styles.input, style, styles.row]}
    >
      <Text style={[styles.text, !value && styles.placeholder]}>{value || placeholder || t('dateSelect')}</Text>
      <CalendarDays color={theme.colors.teal} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 44, borderWidth: 1, borderColor: theme.colors.inputBorder, borderRadius: 6, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.white },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md },
  text: { color: theme.colors.ink, fontSize: theme.typography.sm, flexShrink: 1 },
  placeholder: { color: theme.colors.placeholder },
  compact: { flexShrink: 0 },
  compactEmpty: { opacity: 0.6 },
  confirm: { color: theme.colors.teal, fontWeight: theme.fontWeight.bold },
});
