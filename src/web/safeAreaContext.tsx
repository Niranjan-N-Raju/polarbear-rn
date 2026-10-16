import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { styles } from './safeAreaStyles';

export function SafeAreaProvider({ children }: PropsWithChildren) {
  return <View style={styles.container}>{children}</View>;
}

export function useSafeAreaInsets() {
  return { top: 0, right: 0, bottom: 0, left: 0 };
}