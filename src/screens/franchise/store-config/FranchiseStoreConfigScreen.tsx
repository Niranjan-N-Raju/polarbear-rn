import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Building2, CalendarClock, Image as ImageIcon, UsersRound, Coffee } from '../../../icons';
import { apiRequest } from '../../../api/auth';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { StoreConfigDrawer, type StoreConfigPayload, type StoreConfigSection, type StoreConfigValues, type StoreShift } from './StoreConfigDrawer';

const initial: StoreConfigValues = { name: '', hasLogo: false, configured: false, cycleType: 'calendar_month', startDay: 1, endDay: 31, positions: [], shifts: [] };

function bytesToBase64(bytes: Uint8Array) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = bytes[index + 1];
    const c = bytes[index + 2];
    result += alphabet[Math.floor(a / 4)];
    result += alphabet[(a % 4) * 16 + (b === undefined ? 0 : Math.floor(b / 16))];
    result += b === undefined ? '=' : alphabet[(b % 16) * 4 + (c === undefined ? 0 : Math.floor(c / 64))];
    result += c === undefined ? '=' : alphabet[c % 64];
  }
  return result;
}

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function FranchiseStoreConfigScreen({ storeId }: { storeId: string }) {
  const [value, setValue] = useState(initial);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState<StoreConfigSection | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    if (!storeId) { setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    try {
      const paths = [
        `/stores/branding?storeId=${encodeURIComponent(storeId)}`,
        `/stores/cycle?storeId=${encodeURIComponent(storeId)}&period=${currentPeriod()}`,
        `/stores/positions?storeId=${encodeURIComponent(storeId)}`,
        `/stores/shifts?storeId=${encodeURIComponent(storeId)}`,
      ];
      const responses = await Promise.all(paths.map((path) => apiRequest(path)));
      const results = await Promise.all(responses.map(async (response) => {
        const data = await response.json() as { message?: string; store?: { name?: string; hasLogo?: boolean }; cycle?: { configured?: boolean; type?: StoreConfigValues['cycleType']; startDay?: number; endDay?: number }; positions?: string[]; shifts?: StoreShift[] };
        if (!response.ok) throw new Error(data.message ?? t('franchiseStoreConfigLoadFailed'));
        return data;
      }));
      const cycle = results[1].cycle ?? {};
      setValue({
        name: results[0].store?.name ?? '',
        hasLogo: Boolean(results[0].store?.hasLogo),
        configured: Boolean(cycle.configured),
        cycleType: cycle.type ?? 'calendar_month',
        startDay: cycle.startDay ?? 1,
        endDay: cycle.endDay ?? 31,
        positions: results[2].positions ?? [],
        shifts: results[3].shifts ?? [],
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t('franchiseStoreConfigLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  useEffect(() => {
    let current = true;
    if (!value.hasLogo || !storeId) { setLogoUri(null); return () => { current = false; }; }
    apiRequest(`/stores/logo?storeId=${encodeURIComponent(storeId)}`).then(async (response) => {
      if (!response.ok) return;
      const contentType = response.headers.get('content-type') ?? 'image/png';
      const encoded = bytesToBase64(new Uint8Array(await response.arrayBuffer()));
      if (current) setLogoUri(`data:${contentType};base64,${encoded}`);
    }).catch(() => { if (current) setLogoUri(null); });
    return () => { current = false; };
  }, [storeId, value.hasLogo]);

  const save = useCallback(async (sectionToSave: StoreConfigSection, payload: StoreConfigPayload) => {
    const path = sectionToSave === 'branding' ? '/stores/branding' : `/stores/${sectionToSave}`;
    setBusy(true);
    try {
      const response = await apiRequest(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeId, ...payload }) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? t('franchiseStoreConfigSaveFailed'));
      setSection(null);
      setToast({ message: result.message ?? t('franchiseStoreConfigSaved'), tone: 'success' });
      await loadConfig();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : t('franchiseStoreConfigSaveFailed'), tone: 'error' });
    } finally { setBusy(false); }
  }, [loadConfig, storeId]);

  const removeLogo = useCallback(async () => {
    setBusy(true);
    try {
      const response = await apiRequest(`/stores/logo?storeId=${encodeURIComponent(storeId)}`, { method: 'DELETE' });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? t('franchiseStoreConfigSaveFailed'));
      setSection(null);
      setValue((current) => ({ ...current, hasLogo: false }));
      setLogoUri(null);
      setToast({ message: result.message ?? t('franchiseStoreConfigSaved'), tone: 'success' });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : t('franchiseStoreConfigSaveFailed'), tone: 'error' });
    } finally { setBusy(false); }
  }, [storeId]);

  if (loading) return <View style={styles.content}><AppLoader /></View>;
  if (loadError) return <View style={styles.content}><AppErrorState message={loadError} onRetry={() => loadConfig()} /></View>;

  const cards: { section: StoreConfigSection; title: string; summary: string; Icon: typeof Building2 }[] = [
    { section: 'branding', title: t('franchiseStoreConfigBranding'), summary: value.name || t('franchiseStoreConfigNoStoreName'), Icon: Building2 },
    { section: 'cycle', title: t('franchiseStoreConfigCycle'), summary: value.configured ? (value.cycleType === 'calendar_month' ? t('franchiseStoreConfigCalendar') : t('franchiseStoreConfigCustomSummary', { start: value.startDay, end: value.endDay })) : t('franchiseStoreConfigNotConfigured'), Icon: CalendarClock },
    { section: 'positions', title: t('franchiseStoreConfigPositions'), summary: t('franchiseStoreConfigPositionCount', { count: value.positions.length }), Icon: UsersRound },
    { section: 'shifts', title: t('franchiseStoreConfigShifts'), summary: t('franchiseStoreConfigShiftCount', { count: value.shifts.length }), Icon: Coffee },
  ];

  return (
    <View style={styles.content}>
      <ScrollView contentContainerStyle={localStyles.list}>
        <View style={localStyles.hero}><Text style={localStyles.title}>{t('franchiseStoreConfigTitle')}</Text><Text style={localStyles.subtitle}>{value.name || t('franchiseStoreConfigDescription')}</Text></View>
        {cards.map(({ section: key, title, summary, Icon }) => <Pressable key={key} accessibilityRole="button" accessibilityLabel={t('franchiseStoreConfigEditItem', { item: title })} onPress={() => setSection(key)} style={localStyles.card}>
          <View style={localStyles.icon}><Icon color={theme.colors.teal} size={21} /></View>
          <View style={localStyles.cardText}><Text style={localStyles.cardTitle}>{title}</Text><Text style={localStyles.cardSummary}>{summary}</Text></View>
          {key === 'branding' ? (logoUri ? <Image accessibilityLabel={t('franchiseStoreConfigLogo')} source={{ uri: logoUri }} resizeMode="contain" style={localStyles.logo} /> : <ImageIcon color={theme.colors.iconMuted} size={22} />) : null}
          <Text style={localStyles.edit}>{t('franchiseStoreConfigEdit')}</Text>
        </Pressable>)}
      </ScrollView>
      <StoreConfigDrawer visible={Boolean(section)} section={section} value={value} busy={busy} onClose={() => setSection(null)} onSave={(key, payload) => { save(key, payload); }} onRemoveLogo={() => { removeLogo(); }} />
      {toast ? <AppToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} /> : null}
    </View>
  );
}

const localStyles = StyleSheet.create({
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
