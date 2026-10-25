import { StyleSheet } from 'react-native';
import { theme } from '../../config/theme';

const { colors, spacing, typography } = theme;

export const storePickerStyles = StyleSheet.create({
  sheet: { flexShrink: 1, minHeight: 0, backgroundColor: colors.white },
  sheetFill: { flex: 1 },
  handle: {
    width: 40, height: 4, borderRadius: 2, alignSelf: 'center',
    marginTop: spacing.md, backgroundColor: colors.beige,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg,
    paddingHorizontal: spacing['2xl'], paddingTop: spacing.lg, paddingBottom: spacing['2xl'],
  },
  headerFill: { paddingTop: spacing['2xl'] },
  headerIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.welcomeTint,
  },
  headerCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  title: { color: colors.ink, fontSize: typography.xl, fontWeight: theme.fontWeight.bold },
  description: { color: colors.muted, fontSize: typography.sm, lineHeight: 20 },
  closeButton: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.paleBackground,
  },
  list: { flexGrow: 0, flexShrink: 1, minHeight: 0 },
  listFill: { flex: 1 },
  listContent: { paddingHorizontal: spacing['2xl'], paddingBottom: spacing['2xl'], gap: spacing.md },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
    paddingVertical: spacing.xl, paddingHorizontal: spacing['2xl'],
    borderWidth: 1, borderColor: colors.beige, borderRadius: theme.radius.small, backgroundColor: colors.white,
  },
  optionSelected: { borderColor: colors.teal, backgroundColor: colors.ice },
  optionIcon: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.ice,
  },
  optionIconSelected: { backgroundColor: colors.teal },
  optionCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  optionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  optionName: { flexShrink: 1, color: colors.ink, fontSize: typography.md, fontWeight: theme.fontWeight.bold },
  codePill: {
    paddingHorizontal: spacing.md, paddingVertical: 2, borderRadius: 999, overflow: 'hidden',
    backgroundColor: colors.paleBackground, color: colors.muted, fontSize: 11, fontWeight: theme.fontWeight.medium,
  },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  address: { flex: 1, color: colors.muted, fontSize: typography.xs },
  checkBadge: {
    width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.teal,
  },
  footer: {
    borderTopWidth: 1, borderColor: colors.beige, backgroundColor: colors.white,
    paddingHorizontal: spacing['2xl'], paddingVertical: spacing.lg,
  },
  signOut: {
    minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md,
    borderRadius: theme.radius.small, borderWidth: 1, borderColor: colors.errorBorder, backgroundColor: colors.white,
  },
  signOutText: { color: colors.error, fontSize: typography.sm, fontWeight: theme.fontWeight.medium },
  pressed: { opacity: theme.opacity.pressed },
});
