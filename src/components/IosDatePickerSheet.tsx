import { Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { t } from '../i18n';

interface IosDatePickerSheetProps {
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  allowClear: boolean;
  onDraftChange: (date: Date) => void;
  onCancel: () => void;
  onClear: () => void;
  onConfirm: () => void;
}

export function IosDatePickerSheet({ value, minimumDate, maximumDate, allowClear, onDraftChange, onCancel, onClear, onConfirm }: IosDatePickerSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <Pressable testID="ios-date-sheet-scrim" accessibilityRole="button" accessibilityLabel={t('dateCancel')} onPress={onCancel} style={styles.scrim} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + theme.spacing.lg }]}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('dateCancel')} onPress={onCancel} hitSlop={8}>
            <Text style={styles.action}>{t('dateCancel')}</Text>
          </Pressable>
          {allowClear ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t('dateClear')} onPress={onClear} hitSlop={8}>
              <Text style={styles.action}>{t('dateClear')}</Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" accessibilityLabel={t('dateConfirm')} onPress={onConfirm} hitSlop={8}>
            <Text style={[styles.action, styles.confirm]}>{t('dateConfirm')}</Text>
          </Pressable>
        </View>
        <DateTimePicker
          testID="ios-date-picker"
          value={value}
          mode="date"
          display="inline"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          themeVariant="light"
          accentColor={theme.colors.orange}
          style={styles.picker}
          onValueChange={(_event, date) => onDraftChange(date)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.radius.card,
    borderTopRightRadius: theme.radius.card,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.inputBorder,
  },
  action: { color: theme.colors.orange, fontSize: theme.typography.sm, fontWeight: theme.fontWeight.medium },
  confirm: { fontWeight: theme.fontWeight.bold },
  picker: { alignSelf: 'center', width: '100%' },
});
