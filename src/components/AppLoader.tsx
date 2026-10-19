import { ActivityIndicator, StyleSheet, Text, View, type ColorValue } from 'react-native';
import { theme } from '../config/theme';
import { t } from '../i18n';

type AppLoaderVariant = 'section' | 'screen' | 'inline';

interface AppLoaderProps {
  variant?: AppLoaderVariant;
  color?: ColorValue;
}

const styles = StyleSheet.create({
  section: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  screen: {
    flex: 1,
    minHeight: 180,
  },
  label: {
    color: theme.colors.muted,
    fontSize: theme.typography.sm,
  },
});

export function AppLoader({ variant = 'section', color = theme.colors.orange }: AppLoaderProps) {
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
    <View style={[styles.section, variant === 'screen' && styles.screen]}>
      {indicator}
      <Text>{label}</Text>
    </View>
  );
}