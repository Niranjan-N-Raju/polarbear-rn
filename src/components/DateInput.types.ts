import type { StyleProp, TextStyle } from 'react-native';

export interface DateInputProps {
  value: string;
  onChangeText: (value: string) => void;
  accessibilityLabel: string;
  placeholder?: string;
  editable?: boolean;
  allowClear?: boolean;
  minimumDate?: string;
  maximumDate?: string;
  style?: StyleProp<TextStyle>;
}
