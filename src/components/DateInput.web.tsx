import type { CSSProperties } from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../config/theme';
import type { DateInputProps } from './DateInput.types';

export function DateInput({
  value, onChangeText, accessibilityLabel, editable = true, allowClear = true,
  minimumDate, maximumDate, style,
}: DateInputProps) {
  return (
    <View style={[styles.input, style]}>
      <input
        type="date"
        aria-label={accessibilityLabel}
        value={value}
        disabled={!editable}
        required={!allowClear}
        min={minimumDate}
        max={maximumDate}
        onChange={(event) => {
          if (event.currentTarget.value || allowClear) onChangeText(event.currentTarget.value);
        }}
        style={inputStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.inputBorder, borderRadius: 6, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.white },
});
const inputStyle: CSSProperties = {
  boxSizing: 'border-box', width: '100%', minWidth: 0, minHeight: 40, border: 0,
  background: 'transparent', color: theme.colors.ink, fontFamily: 'inherit',
  fontSize: theme.typography.sm, colorScheme: 'light', accentColor: theme.colors.teal,
};
