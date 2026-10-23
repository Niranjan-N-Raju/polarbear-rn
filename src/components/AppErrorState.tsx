import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RefreshCw } from '../icons';
import { theme } from '../config/theme';
import { t } from '../i18n';
import type { AppErrorStateProps } from './types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing['2xl'],
  },
  message: {
    color: theme.colors.error,
    fontSize: theme.typography.sm,
    textAlign: 'center',
  },
  button: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing['2xl'],
    borderWidth: theme.border.width,
    borderColor: theme.colors.beige,
    backgroundColor: theme.colors.white,
  },
  buttonText: {
    color: theme.colors.ink,
    fontSize: theme.typography.sm,
    fontWeight: theme.fontWeight.medium,
  },
});

export function AppErrorState({ message, onRetry }: AppErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="alert" style={styles.message}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.button}>
        <RefreshCw color={theme.colors.teal} size={16} />
        <Text style={styles.buttonText}>{t('adminRefresh')}</Text>
      </Pressable>
    </View>
  );
}