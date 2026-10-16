import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

export function SafeAreaProvider({ children }: PropsWithChildren) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

export function useSafeAreaInsets() {
  return { top: 0, right: 0, bottom: 0, left: 0 };
}