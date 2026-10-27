import { StyleSheet } from 'react-native';
import { theme } from '../config/theme';

const { colors, spacing, typography } = theme;

export const summaryCardStyles = StyleSheet.create({
  grid: {
    gap: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  card: {
    flex: 1,
    minWidth: 0,
    minHeight: 96,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: theme.radius.small,
    borderWidth: theme.border.width,
    borderColor: colors.beige,
    borderTopWidth: 3,
  },
  cardWeb: {
    padding: spacing['2xl'],
  },
  cardSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.paleBackground,
  },
  placeholder: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  icon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.sand,
  },
  value: {
    marginTop: spacing.md,
    fontSize: typography.xl,
    fontWeight: theme.fontWeight.bold,
  },
  valueWeb: {
    fontSize: 22,
  },
});
