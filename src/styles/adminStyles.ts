import { StyleSheet } from 'react-native';
import { theme } from '../config/theme';

const { colors, spacing, typography } = theme;

export const adminStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: theme.border.width,
    borderBottomColor: colors.beige,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    flex: 1,
  },
  headerIdentity: {
    flex: 1,
  },
  headerMark: {
    width: theme.layout.compactBrandMarkSize,
    height: theme.layout.compactBrandMarkSize,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal,
  },
  headerMarkText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.extraBold,
  },
  headerName: {
    color: colors.ink,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.bold,
  },
  headerUser: {
    marginTop: spacing.xxs,
    color: colors.muted,
    fontSize: typography.xs,
  },
  logoutButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderWidth: theme.border.width,
    borderColor: colors.beige,
  },
  logoutText: {
    color: colors.muted,
    fontSize: typography.xs,
    fontWeight: theme.fontWeight.medium,
  },
  menuButton: {
    width: theme.layout.iconButtonSize + spacing['2xl'],
    height: theme.layout.iconButtonSize + spacing['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: theme.border.width,
    borderColor: colors.beige,
  },
  headerTitle: {
    marginTop: spacing.xxs,
    color: colors.orange,
    fontSize: typography.xs,
    fontWeight: theme.fontWeight.medium,
  },
  drawerRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  drawerScrim: {
    flex: 1,
  },
  drawerPanel: {
    width: '84%',
    maxWidth: 320,
    backgroundColor: colors.white,
    borderRightWidth: theme.border.width,
    borderRightColor: colors.beige,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.lg,
    borderBottomWidth: theme.border.width,
    borderBottomColor: colors.beige,
  },
  drawerTitle: {
    color: colors.ink,
    fontSize: typography.md,
    fontWeight: theme.fontWeight.bold,
  },
  drawerClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
  },
  drawerItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  drawerItemActive: {
    backgroundColor: colors.welcomeTint,
    borderLeftWidth: 3,
    borderLeftColor: colors.orange,
  },
  drawerItemText: {
    color: colors.muted,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.medium,
  },
  drawerItemTextActive: {
    color: colors.orange,
    fontWeight: theme.fontWeight.bold,
  },
  drawerFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: theme.border.width,
    borderTopColor: colors.beige,
  },
  drawerLogout: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  drawerSafeAreaTop: {
    paddingTop: spacing['2xl'],
  },
  drawerSafeAreaBottom: {
    paddingBottom: spacing['2xl'],
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: theme.layout.loginMaxWidth,
    alignSelf: 'center',
  },
  screen: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['2xl'],
  },
  screenWide: {
    paddingHorizontal: spacing['8xl'],
  },
  screenHeader: {
    marginBottom: spacing['2xl'],
  },
  screenTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    lineHeight: typography.headingLineHeight,
    fontWeight: theme.fontWeight.medium,
  },
  screenDescription: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.sm,
    lineHeight: typography.bodyLineHeight,
  },
  refreshButton: {
    minHeight: 40,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: theme.border.width,
    borderColor: colors.teal,
  },
  refreshText: {
    color: colors.teal,
    fontSize: typography.xs,
    fontWeight: theme.fontWeight.medium,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statCard: {
    width: '48%',
    minHeight: 112,
    justifyContent: 'space-between',
    padding: spacing['2xl'],
    borderWidth: theme.border.width,
    borderColor: colors.beige,
    backgroundColor: colors.white,
    ...theme.shadows.brandMark,
  },
  statCardWide: {
    width: '23.5%',
  },
  statLabel: {
    color: colors.muted,
    fontSize: typography.xs,
    fontWeight: theme.fontWeight.medium,
  },
  statValue: {
    marginTop: spacing.lg,
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: theme.fontWeight.bold,
  },
  stateMessage: {
    paddingVertical: spacing['5xl'],
    color: colors.muted,
    fontSize: typography.sm,
    textAlign: 'center',
  },
  stateError: {
    color: colors.error,
  },
  filterScroll: {
    flexGrow: 0,
    marginBottom: spacing.lg,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing['2xl'],
  },
  filterChip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: theme.border.width,
    borderColor: colors.beige,
    backgroundColor: colors.white,
  },
  filterChipActive: {
    borderColor: colors.orange,
    backgroundColor: colors.welcomeTint,
  },
  filterChipText: {
    color: colors.muted,
    fontSize: typography.xs,
  },
  filterChipTextActive: {
    color: colors.orange,
    fontWeight: theme.fontWeight.bold,
  },
  fab: {
    position: 'absolute',
    right: spacing['2xl'],
    bottom: spacing['2xl'],
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
    ...theme.shadows.button,
  },
  row: {
    marginBottom: spacing.md,
    padding: spacing['2xl'],
    borderWidth: theme.border.width,
    borderColor: colors.beige,
    backgroundColor: colors.white,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing['5xl'],
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  rowMain: {
    flex: 1,
  },
  statusDot: {
    width: spacing.sm,
    height: spacing.sm,
  },
  statusActive: {
    backgroundColor: colors.teal,
  },
  statusInactive: {
    backgroundColor: colors.muted,
  },
  rowTitle: {
    color: colors.ink,
    fontSize: typography.md,
    fontWeight: theme.fontWeight.bold,
  },
  rowRole: {
    marginTop: spacing.sm,
    color: colors.orange,
    fontSize: typography.xs,
    fontWeight: theme.fontWeight.medium,
  },
  storePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  storePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.paleBackground,
  },
  storePillText: {
    color: colors.ink,
    fontSize: typography.xs,
  },
  rowSubtext: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.xs,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  typeOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeOption: {
    flex: 1,
  },
  typeOptionSelected: {
    borderColor: colors.orange,
    backgroundColor: colors.welcomeTint,
  },
  sectionLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    color: colors.ink,
    fontSize: typography.md,
    fontWeight: theme.fontWeight.bold,
  },
  field: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    marginBottom: spacing.xs,
    color: colors.ink,
    fontSize: typography.xs,
    fontWeight: theme.fontWeight.medium,
  },
  fieldInput: {
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    borderWidth: theme.border.width,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
    color: colors.primaryText,
    fontSize: typography.sm,
  },
  inputWrap: {
    position: 'relative',
  },
  inputError: {
    borderColor: colors.error,
  },
  visibilityButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: theme.layout.iconButtonSize,
    height: theme.layout.iconButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldInputDisabled: {
    opacity: theme.opacity.pressed,
  },
  multilineField: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.lg,
  },
  primaryButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    backgroundColor: colors.orange,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.bold,
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    borderWidth: theme.border.width,
    borderColor: colors.beige,
  },
  secondaryButtonText: {
    color: colors.muted,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.medium,
  },
  dangerButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    backgroundColor: colors.error,
  },
  dangerButtonText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: theme.fontWeight.bold,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  confirmModal: {
    padding: spacing['2xl'],
    backgroundColor: colors.white,
  },
  formError: {
    marginBottom: spacing.lg,
    color: colors.error,
    fontSize: typography.xs,
    lineHeight: typography.bodyLineHeight,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    padding: spacing['2xl'],
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modal: {
    maxHeight: '90%',
    padding: spacing['2xl'],
    backgroundColor: colors.white,
  },
  modalTitle: {
    marginBottom: spacing['2xl'],
    color: colors.ink,
    fontSize: typography.xl,
    fontWeight: theme.fontWeight.bold,
  },
  checkboxRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: theme.border.width,
    borderColor: colors.beige,
  },
  checkboxRowSelected: {
    borderColor: colors.orange,
    backgroundColor: colors.welcomeTint,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: theme.border.width,
    borderColor: colors.muted,
  },
  checkboxSelected: {
    borderColor: colors.orange,
    backgroundColor: colors.orange,
  },
  checkboxText: {
    color: colors.ink,
    fontSize: typography.xs,
  },
  profileCard: {
    marginBottom: spacing['2xl'],
    padding: spacing['2xl'],
    borderWidth: theme.border.width,
    borderColor: colors.beige,
    backgroundColor: colors.white,
  },
});

export function getAdminSafeAreaStyles(topInset: number, bottomInset: number) {
  return {
    root: {
      paddingTop: topInset,
      paddingBottom: bottomInset,
    },
  };
}

export function getAdminDrawerSafeAreaStyles(topInset: number, bottomInset: number) {
  return {
    drawerTop: {
      paddingTop: topInset + theme.spacing['2xl'],
    },
    drawerBottom: {
      paddingBottom: Math.max(bottomInset, theme.spacing['2xl']),
    },
  };
}

