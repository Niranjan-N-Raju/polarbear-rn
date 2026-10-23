import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../config/theme';
import { t } from '../i18n';
import type { AppLoaderProps } from './types';

export type { AppLoaderVariant } from './types';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  label: {
    color: theme.colors.white,
    fontSize: theme.typography.sm,
  },
});

export function AppLoader({ variant = 'screen', color = theme.colors.orange }: AppLoaderProps) {
  const label = t('adminLoading');
  const indicator = (
    <ActivityIndicator
      accessibilityLabel={label}
      color={color}
      size={variant === 'inline' ? 'small' : 'large'}
    />
  );

  if (variant === 'inline') return indicator;

  return (
    <View style={styles.screen}>
      {indicator}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}