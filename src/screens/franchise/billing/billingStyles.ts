import { StyleSheet } from 'react-native';
import { theme } from '../../../config/theme';

export const billingStyles = StyleSheet.create({
  screen: { flex: 1 }, content: { padding: 16, gap: 20 },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { color: theme.colors.ink, fontSize: 22, fontWeight: '600' },
  subtitle: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
  panel: { padding: 16, gap: 16, borderWidth: 1, borderColor: theme.colors.beige, backgroundColor: theme.colors.white },
  heading: { color: theme.colors.ink, fontSize: 16, fontWeight: '600', paddingBottom: 12, borderBottomWidth: 1, borderColor: theme.colors.beige },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, wrap: { flexWrap: 'wrap' },
  spread: { justifyContent: 'space-between' }, grow: { flex: 1, minWidth: 0 },
  body: { color: theme.colors.ink, fontSize: 14 }, muted: { color: theme.colors.muted, fontSize: 13 },
  strong: { color: theme.colors.ink, fontSize: 14, fontWeight: '600' },
  field: { minWidth: 140, flexGrow: 1, gap: 6 },
  input: { minHeight: 44, borderWidth: 1, borderColor: theme.colors.beige, backgroundColor: theme.colors.white, paddingHorizontal: 12, paddingVertical: 10, color: theme.colors.ink, fontSize: 14 },
  button: { minHeight: 44, borderWidth: 1, borderColor: theme.colors.beige, backgroundColor: theme.colors.white, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primary: { backgroundColor: theme.colors.orange, borderColor: theme.colors.orange },
  primaryText: { color: theme.colors.white, fontSize: 14, fontWeight: '600' },
  selected: { borderColor: theme.colors.orange, backgroundColor: theme.colors.sand },
  disabled: { opacity: 0.5 }, error: { color: theme.colors.error, fontSize: 13 },
  item: { paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderColor: theme.colors.beige },
  options: { maxHeight: 420 }, empty: { paddingVertical: 28, textAlign: 'center', color: theme.colors.muted },
  totals: { gap: 10, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.beige },
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: 20 }, summary: { width: 340 },
  danger: { borderColor: theme.colors.error }, iconButton: { width: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
});