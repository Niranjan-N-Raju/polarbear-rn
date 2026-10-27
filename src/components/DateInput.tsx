import { useEffect, useId, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { IosDatePickerSheet } from './IosDatePickerSheet';
import { useOverlayHost } from './OverlayHost';
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
  const hostOverlay = useOverlayHost();
  const hostKey = useId();
  const [iosDraft, setIosDraft] = useState<Date | null>(null);
  const closeIos = () => setIosDraft(null);
  const iosSheet = iosDraft ? (
    <IosDatePickerSheet
      value={iosDraft}
      minimumDate={min}
      maximumDate={max}
      allowClear={allowClear}
      onDraftChange={setIosDraft}
      onCancel={closeIos}
      onClear={() => { closeIos(); onChangeText(''); }}
      onConfirm={() => { closeIos(); onChangeText(formatDateOnly(iosDraft)); }}
    />
  ) : null;
  useEffect(() => {
    hostOverlay?.(hostKey, iosSheet);
    // iosSheet is derived from iosDraft; re-host only when the draft or bounds change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostOverlay, hostKey, iosDraft, allowClear, minimumDate, maximumDate, onChangeText]);
  useEffect(() => () => hostOverlay?.(hostKey, null), [hostOverlay, hostKey]);
  const open = () => {
    if (Platform.OS === 'ios') {
      setIosDraft(initial);
      return;
    }
    DateTimePickerAndroid.open({
      value: initial,
      mode: 'date',
      minimumDate: min,
      maximumDate: max,
      onValueChange: (_event, date) => onChangeText(formatDateOnly(date)),
      onError: (error) => Alert.alert(t('datePickerFailed'), error.message),
      positiveButton: { textColor: theme.colors.orange },
      negativeButton: { textColor: theme.colors.orange },
      ...(allowClear ? {
        neutralButton: { label: t('dateClear'), textColor: theme.colors.orange },
        onNeutralButtonPress: () => onChangeText(''),
      } : {}),
    });
  };
  return (
    <>
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
    {iosSheet && !hostOverlay ? (
      <Modal visible transparent animationType="slide" onRequestClose={closeIos}>{iosSheet}</Modal>
    ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 44, borderWidth: 1, borderColor: theme.colors.inputBorder, borderRadius: 6, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.white },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md },
  text: { color: theme.colors.ink, fontSize: theme.typography.sm, flexShrink: 1 },
  placeholder: { color: theme.colors.placeholder },
});
