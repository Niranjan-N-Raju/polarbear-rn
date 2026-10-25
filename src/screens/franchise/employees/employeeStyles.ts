import { StyleSheet } from 'react-native';
import { theme } from '../../../config/theme';

export const employeeStyles = StyleSheet.create({
  employeeCard: { marginBottom: theme.spacing.md },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  identityCopy: { flex: 1, minWidth: 0 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.sand },
  avatarText: { color: theme.colors.teal, fontSize: 16, fontWeight: '700' },
  detail: { color: theme.colors.muted, fontSize: 13, marginTop: theme.spacing.xs },
  metrics: { gap: theme.spacing.xs, marginTop: theme.spacing.sm },
  badge: { alignSelf: 'flex-start', paddingHorizontal: theme.spacing.sm, paddingVertical: 3, borderRadius: 20, marginTop: theme.spacing.md },
  activeBadge: { backgroundColor: theme.colors.ice },
  inactiveBadge: { backgroundColor: theme.colors.sand },
  badgeText: { color: theme.colors.teal, fontSize: 11, fontWeight: '700' },
  error: { color: theme.colors.error, marginVertical: theme.spacing.md },
  documentStatus: { marginBottom: theme.spacing.md, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.beige, backgroundColor: theme.colors.paleBackground },
  documentStatusLabel: { color: theme.colors.muted, fontSize: 12, fontWeight: '600' },
  documentStatusValue: { marginTop: theme.spacing.xs, color: theme.colors.teal, fontSize: 14, fontWeight: '700' },
  loadMore: { alignSelf: 'center', marginTop: theme.spacing.md, marginBottom: theme.spacing['3xl'] },
});
