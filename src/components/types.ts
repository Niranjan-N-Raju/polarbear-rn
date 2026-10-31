import type { ReactNode } from 'react';
import type { ColorValue, StyleProp, TextInputProps, TextStyle, ViewStyle } from 'react-native';

export interface AdminFilterDropdownProps<Value extends string> {
  label: string;
  value: Value;
  expanded: boolean;
  options: { value: Value; label: string }[];
  onToggle: () => void;
  onSelect: (value: Value) => void;
  optionsPlacement?: 'above' | 'below';
  containerStyle?: StyleProp<ViewStyle>;
}

export interface AdminFormFieldProps {
  date?: boolean;
  minimumDate?: string;
  maximumDate?: string;
  disabledDates?: string[];
  calendarLoading?: boolean;
  calendarError?: string | null;
  onMonthChange?: (from: string, to: string) => void;
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

export interface AppErrorStateProps {
  message: string;
  onRetry: () => void;
}

export interface AppToastProps {
  message: string;
  tone?: 'error' | 'success';
  onDismiss: () => void;
  durationMs?: number;
}

export type AppLoaderVariant = 'screen' | 'inline';

export interface AppLoaderProps {
  variant?: AppLoaderVariant;
  color?: ColorValue;
  artwork?: 'splash';
}

export interface ResponsiveDrawerModalProps {
  visible: boolean;
  closeLabel: string;
  onClose: () => void;
  onAfterClose?: () => void;
  overlay?: ReactNode;
  children: ReactNode;
  presentation?: 'drawer' | 'dialog';
  panelStyle?: StyleProp<ViewStyle>;
}
