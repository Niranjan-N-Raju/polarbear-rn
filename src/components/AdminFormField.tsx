import { Pressable, Text, TextInput, View } from 'react-native';
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from 'react-native';
import { Eye, EyeOff } from '../icons';
import { theme } from '../config/theme';
import { t } from '../i18n';
import { adminStyles as styles } from '../styles/adminStyles';

interface AdminFormFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  errorTextStyle?: StyleProp<TextStyle>;
  phonePrefix?: string;
  containerStyle?: StyleProp<ViewStyle>;
  onToggleVisibility?: () => void;
  visible?: boolean;
  editable?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: TextInputProps['autoCorrect'];
  multiline?: boolean;
}

export function AdminFormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  errorTextStyle,
  phonePrefix,
  containerStyle,
  onToggleVisibility,
  visible,
  editable = true,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize,
  autoCorrect,
  multiline,
}: AdminFormFieldProps) {
  const input = (
    <TextInput
      value={value}
      placeholder={placeholder}
      onChangeText={onChangeText}
      editable={editable}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      multiline={multiline}
      style={[
        styles.fieldInput,
        multiline && styles.multilineField,
        phonePrefix && styles.phoneFieldInput,
        !phonePrefix && error && styles.inputError,
        !editable && styles.fieldInputDisabled,
      ]}
    />
  );

  const inputWithVisibility = onToggleVisibility ? (
    <View style={styles.inputWrap}>
      {input}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? t('hidePassword') : t('showPassword')}
        onPress={onToggleVisibility}
        style={styles.visibilityButton}
      >
        {visible
          ? <EyeOff color={theme.colors.iconMuted} size={theme.layout.iconSize} />
          : <Eye color={theme.colors.iconMuted} size={theme.layout.iconSize} />}
      </Pressable>
    </View>
  ) : input;

  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {phonePrefix ? (
        <View style={[styles.phoneInputWrap, error && styles.phoneInputWrapError]}>
          <View style={styles.phoneInputCode}>
            <Text style={styles.phoneInputPrefix}>{phonePrefix}</Text>
          </View>
          {inputWithVisibility}
        </View>
      ) : inputWithVisibility}
      {error ? (
        <Text accessibilityRole="alert" style={errorTextStyle ?? styles.fieldError}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
