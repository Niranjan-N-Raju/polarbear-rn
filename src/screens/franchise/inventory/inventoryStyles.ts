import { StyleSheet } from 'react-native';
import { theme } from '../../../config/theme';

const { colors, spacing, typography } = theme;

export const inventoryStyles = StyleSheet.create({
  summaryCardSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.paleBackground,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: theme.border.width,
    borderColor: colors.beige,
    backgroundColor: colors.white,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  useNowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(242, 106, 33, 0.12)',
  },
  useNowText: {
    color: colors.orange,
    fontSize: typography.xs,
    fontWeight: theme.fontWeight.bold,
  },
  detailRow: {
    flexDirection: 'row',
    paddingTop: spacing.md,
    borderTopWidth: theme.border.width,
    borderTopColor: colors.beige,
  },
  detail: {
    flex: 1,
    minWidth: 0,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  detailValue: {
    marginTop: 2,
    color: colors.ink,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.bold,
  },
  expiredValue: {
    color: colors.error,
  },
  urgentValue: {
    color: colors.orange,
  },
  dumpActionText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: theme.fontWeight.medium,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  addInput: {
    flex: 1,
  },
  addButton: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  hint: {
    color: colors.muted,
    fontSize: typography.xs,
    marginBottom: spacing.lg,
  },
  productIndex: {
    width: 24,
    color: colors.muted,
    fontSize: typography.xs,
    fontWeight: theme.fontWeight.bold,
  },
  confirmBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: theme.border.width,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    backgroundColor: 'rgba(220, 38, 38, 0.06)',
  },
  confirmText: {
    color: colors.ink,
    fontSize: typography.sm,
  },
  dangerButton: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  pickerList: {
    maxHeight: 220,
    marginBottom: spacing.lg,
    borderWidth: theme.border.width,
    borderColor: colors.beige,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: theme.border.width,
    borderBottomColor: colors.beige,
  },
  pickerOptionSelected: {
    backgroundColor: colors.paleBackground,
  },
  pickerOptionText: {
    flex: 1,
    color: colors.ink,
    fontSize: typography.sm,
  },
  pickerEmpty: {
    padding: spacing.md,
    color: colors.muted,
    fontSize: typography.xs,
  },
  fieldLabel: {
    marginBottom: spacing.xs,
    color: colors.ink,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.medium,
  },
  actionSummary: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: theme.border.width,
    borderColor: colors.beige,
    backgroundColor: colors.paleBackground,
  },
  actionSummaryTitle: {
    color: colors.ink,
    fontSize: typography.md,
    fontWeight: theme.fontWeight.bold,
  },
  actionSummaryText: {
    color: colors.muted,
    fontSize: typography.sm,
  },
});
