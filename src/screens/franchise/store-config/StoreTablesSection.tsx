import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AppLoader } from '../../../components/AppLoader';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { billingRequest } from '../../../common/billing';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { ClipboardList, Plus, X } from '../../../icons';
import { billingStyles as styles } from '../billing/billingStyles';
import { localStyles } from './storeConfigStyles';

export function StoreTablesSection({ storeId }: { storeId: string }) {
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const busy = useRef(false);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    billingRequest<{ tables: string[] }>(`/billing-tables?storeId=${encodeURIComponent(storeId)}`, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setTables(result.tables); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : t('adminLoadFailed')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [storeId, reloadKey]);
  async function add() {
    if (busy.current) return;
    busy.current = true;
    setSaving(true); setError(''); setNotice('');
    try {
      const result = await billingRequest<{ tableNumber: string }>('/billing-tables', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tableNumber: number }) });
      setTables(current => [...new Set([...current, result.tableNumber])].sort((left, right) => Number(left.slice(1)) - Number(right.slice(1))));
      setNumber(''); setNotice(t('billingTableAdded'));
    } catch (reason) { setError(reason instanceof Error ? reason.message : t('adminSaveFailed')); }
    finally { busy.current = false; setSaving(false); }
  }
  return (
    <>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={localStyles.card}><View style={localStyles.icon}><ClipboardList color={theme.colors.teal} size={21} /></View><View style={localStyles.cardText}><Text style={localStyles.cardTitle}>{t('billingTables')}</Text><Text style={localStyles.cardSummary}>{loading ? '...' : `${tables.length} ${t('billingToken')}`}</Text></View><Text style={localStyles.edit}>{t('franchiseStoreConfigEdit')}</Text></Pressable>
      <ResponsiveDrawerModal visible={open} closeLabel={t('adminCloseMenu')} onClose={() => { if (!saving) setOpen(false); }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={[styles.row, styles.spread]}><Text style={styles.title}>{t('billingTables')}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} disabled={saving} onPress={() => setOpen(false)} style={styles.iconButton}><X size={20} color={theme.colors.muted} /></Pressable></View>
          {loading ? <AppLoader /> : <View style={[styles.row, styles.wrap]}>{tables.map(table => <View key={table} style={styles.button}><Text style={styles.strong}>{table}</Text></View>)}</View>}
          {error ? <View style={{ gap: 12 }}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable accessibilityRole="button" onPress={() => setReloadKey(current => current + 1)} style={styles.button}><Text style={styles.body}>{t('adminRetry')}</Text></Pressable></View> : null}
          {notice ? <Text style={styles.body}>{notice}</Text> : null}
          <Text style={styles.muted}>{t('billingTableNumber')}</Text><TextInput accessibilityLabel={t('billingTableNumber')} placeholder="T11" autoCapitalize="characters" maxLength={5} editable={!saving} value={number} onChangeText={setNumber} style={styles.input} />
          <Pressable accessibilityRole="button" disabled={saving || loading || !/^T[1-9]\d{0,3}$/i.test(number.trim())} onPress={() => void add()} style={[styles.button, styles.primary, (saving || loading || !/^T[1-9]\d{0,3}$/i.test(number.trim())) && styles.disabled]}><Plus color={theme.colors.white} size={16} /><Text style={styles.primaryText}>{t(saving ? 'adminSaving' : 'billingAddTable')}</Text></Pressable>
        </ScrollView>
      </ResponsiveDrawerModal>
    </>
  );
}