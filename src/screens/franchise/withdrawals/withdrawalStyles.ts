import { StyleSheet } from 'react-native';
import { theme } from '../../../config/theme';

const { colors, spacing, typography } = theme;

export const withdrawalStyles = StyleSheet.create({
  entryCard: { gap: spacing.md },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  typeIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  entryDetails: { flex: 1, minWidth: 0 },
  entryTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  entryAmount: { color: colors.ink, fontSize: typography.md, fontWeight: theme.fontWeight.bold, flexShrink: 1 },
  entryDate: { marginTop: spacing.xxs, color: colors.muted, fontSize: typography.xs },
  typeBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: 20 },
  withdrawalBadge: { backgroundColor: colors.welcomeTint },
  repaymentBadge: { backgroundColor: colors.ice },
  typeBadgeText: { fontSize: 10, fontWeight: theme.fontWeight.bold, textTransform: 'uppercase' },
  reason: { color: colors.muted, fontSize: typography.sm, lineHeight: typography.bodyLineHeight },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, paddingTop: spacing.sm, borderTopWidth: theme.border.width, borderTopColor: colors.beige },
  actionButton: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm },
  editText: { color: colors.teal, fontSize: typography.xs, fontWeight: theme.fontWeight.bold },
  deleteText: { color: colors.error, fontSize: typography.xs, fontWeight: theme.fontWeight.bold },
  typeOptions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  typeOption: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: theme.border.width, borderColor: colors.beige, borderRadius: 10, backgroundColor: colors.white },
  typeOptionSelected: { borderColor: colors.orange, backgroundColor: colors.welcomeTint },
  typeOptionText: { color: colors.muted, fontSize: typography.xs, fontWeight: theme.fontWeight.medium },
  typeOptionTextSelected: { color: colors.orange, fontWeight: theme.fontWeight.bold },
  characterCount: { marginTop: -spacing.md, marginBottom: spacing.lg, color: colors.muted, fontSize: 11, textAlign: 'right' },
  errorMessage: { marginBottom: spacing.md, color: colors.error, fontSize: typography.sm },
});
