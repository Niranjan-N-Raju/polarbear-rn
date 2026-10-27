import { StyleSheet } from 'react-native';
import { theme } from '../../../config/theme';

const { colors, spacing, typography } = theme;

export const salesStyles = StyleSheet.create({
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 1440,
    alignSelf: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['2xl'],
  },
  contentCompact: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  cardSubtitle: {
    color: colors.muted,
    fontSize: typography.xs,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: theme.border.width,
    borderTopColor: colors.beige,
  },
  metric: {
    width: '33.33%',
    paddingRight: spacing.sm,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: theme.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metricValue: {
    marginTop: 2,
    color: colors.ink,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.bold,
  },
  bankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.paleBackground,
    borderLeftWidth: 3,
    borderLeftColor: colors.teal,
  },
  bankingLabel: {
    color: colors.muted,
    fontSize: typography.xs,
    fontWeight: theme.fontWeight.medium,
  },
  bankingValue: {
    color: colors.teal,
    fontSize: typography.md,
    fontWeight: theme.fontWeight.bold,
  },
  negativeValue: {
    color: colors.error,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetButton: {
    flexGrow: 1,
    minHeight: 40,
  },
  dateError: {
    color: colors.error,
    fontSize: typography.xs,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  formRowItem: {
    flex: 1,
  },
  readOnlyField: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderWidth: theme.border.width,
    borderColor: colors.beige,
    backgroundColor: colors.paleBackground,
  },
  readOnlyLabel: {
    color: colors.muted,
    fontSize: typography.xs,
    fontWeight: theme.fontWeight.medium,
  },
  readOnlyValue: {
    marginTop: spacing.xs,
    color: colors.ink,
    fontSize: typography.md,
    fontWeight: theme.fontWeight.bold,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  addExpenseText: {
    color: colors.teal,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.bold,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: theme.border.width,
    borderBottomColor: colors.beige,
  },
  expenseName: {
    flex: 1,
    color: colors.ink,
    fontSize: typography.sm,
  },
  expenseAmount: {
    color: colors.ink,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.bold,
  },
  expenseIconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseEditor: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderWidth: theme.border.width,
    borderColor: colors.beige,
    backgroundColor: colors.paleBackground,
  },
  expenseEditorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  smallButton: {
    minHeight: 36,
    paddingHorizontal: spacing.lg,
  },
  emptyExpenses: {
    color: colors.muted,
    fontSize: typography.xs,
    marginBottom: spacing.sm,
  },
  totalsBlock: {
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalsLabel: {
    color: colors.muted,
    fontSize: typography.sm,
  },
  totalsValue: {
    color: colors.ink,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.bold,
  },
  formActions: {
    flexWrap: 'wrap',
  },
});
