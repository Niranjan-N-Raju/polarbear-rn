import { useState } from 'react';
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
  const [draft, setDraft] = useState<Date | null>(null);
  const min = minimumDate ? parseDateOnly(minimumDate) : undefined;
  const max = maximumDate ? parseDateOnly(maximumDate) : undefined;
  const open = () => {
    let initial = parseDateOnly(value) ?? new Date();
    if (min && initial < min) initial = min;
    if (max && initial > max) initial = max;
    if (Platform.OS === 'android') {
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
    } else {
      setDraft(initial);
    }
  };
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: value }}
        accessibilityState={{ disabled: !editable, expanded: draft !== null }}
        disabled={!editable}
        onPress={open}
        style={[styles.input, style, styles.row]}
      >
        <Text style={[styles.text, !value && styles.placeholder]}>{value || placeholder || t('dateSelect')}</Text>
        <CalendarDays color={theme.colors.teal} size={18} />
      </Pressable>
      {draft && editable ? (
        <View style={styles.picker}>
          <DateTimePicker
            accessibilityLabel={accessibilityLabel}
            value={draft}
            mode="date"
            display="spinner"
            minimumDate={min}
            maximumDate={max}
            themeVariant="light"
            onValueChange={(_event, date) => setDraft(date)}
          />
          <View style={styles.actions}>
            {allowClear ? <Pressable accessibilityRole="button" onPress={() => { onChangeText(''); setDraft(null); }} style={styles.action}><Text style={styles.text}>{t('dateClear')}</Text></Pressable> : null}
            <Pressable accessibilityRole="button" onPress={() => setDraft(null)} style={styles.action}><Text style={styles.text}>{t('adminCancel')}</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => { onChangeText(formatDateOnly(draft)); setDraft(null); }} style={styles.action}><Text style={styles.confirm}>{t('dateConfirm')}</Text></Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 44, borderWidth: 1, borderColor: theme.colors.inputBorder, borderRadius: 6, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.white },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md },
  text: { color: theme.colors.ink, fontSize: theme.typography.sm, flexShrink: 1 },
  placeholder: { color: theme.colors.placeholder },
  picker: { backgroundColor: theme.colors.white },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap' },
  action: { minHeight: 44, justifyContent: 'center', paddingHorizontal: theme.spacing.lg },
  confirm: { color: theme.colors.teal, fontWeight: theme.fontWeight.bold },
});
