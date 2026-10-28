import { StyleSheet } from 'react-native';
import { theme } from '../../../config/theme';
export const localStyles = StyleSheet.create({
  list: { padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: theme.spacing['3xl'] },
  hero: { backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.beige, padding: theme.spacing.lg, marginBottom: theme.spacing.xs },
  title: { color: theme.colors.ink, fontSize: theme.typography.xl, fontWeight: theme.fontWeight.bold },
  subtitle: { color: theme.colors.muted, marginTop: theme.spacing.xs },
  card: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.beige, padding: theme.spacing.md, minHeight: 78 },
  icon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.ice },
  cardText: { flex: 1, minWidth: 0 },
  cardTitle: { color: theme.colors.ink, fontWeight: theme.fontWeight.medium },
  cardSummary: { color: theme.colors.muted, fontSize: theme.typography.xs, marginTop: theme.spacing.xs },
  edit: { color: theme.colors.orange, fontSize: theme.typography.xs, fontWeight: theme.fontWeight.medium },
  logo: { width: 40, height: 40, backgroundColor: theme.colors.sand },
});
