import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AppLoader } from '../../../components/AppLoader';
import { DateInput } from '../../../components/DateInput';
import { SearchableSelect } from '../../../components/SearchableSelect';
import { billingRequest, formatINR, type HistoryData, type SavedBill } from '../../../common/billing';
import { t } from '../../../i18n';
import { businessDate } from '../../../utils/businessDate';
import { BillingReceipt } from './BillingReceipt';
import { billingStyles as styles } from './billingStyles';

const todayFilters = () => {
  const today = businessDate();
  return { from: today, to: today, orderType: '', tableNumber: '', search: '' };
};
export function FranchiseBillingHistoryScreen({ storeId }: { storeId: string }) {
  const [filters, setFilters] = useState(todayFilters);
  const [applied, setApplied] = useState(todayFilters);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<HistoryData | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<SavedBill | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const receiptRequest = useRef<AbortController | null>(null);
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setData(null);
    const query = new URLSearchParams({ storeId, view: 'history', ...applied, page: String(page) });
    billingRequest<HistoryData>(`/bills?${query}`, { signal: controller.signal })
      .then(result => {
        if (!Array.isArray(result.bills) || !Array.isArray(result.tables)) throw new Error(t('adminLoadFailed'));
        if (!controller.signal.aborted) { setData(result); setTables(result.tables); }
      })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : t('adminLoadFailed')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [storeId, applied, page, reloadKey]);
  useEffect(() => () => receiptRequest.current?.abort(), []);
  function closeReceipt() { receiptRequest.current?.abort(); setOpeningId(null); setReceipt(null); }
  function apply() {
    const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
    if (!validDate(filters.from) || !validDate(filters.to) || filters.from > filters.to) { setError(t('billingInvalidDates')); return; }
    closeReceipt(); setPage(1); setApplied({ ...filters, search: filters.search.trim() });
  }
  async function openReceipt(id: string) {
    receiptRequest.current?.abort(); const controller = new AbortController(); receiptRequest.current = controller;
    setOpeningId(id); setError('');
    try {
      const result = await billingRequest<{ bill: SavedBill }>(`/bills?billId=${encodeURIComponent(id)}`, { signal: controller.signal });
      if (!controller.signal.aborted) { setReceipt(result.bill); scroll.current?.scrollTo({ y: 0, animated: true }); }
    } catch (reason) { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : t('adminLoadFailed')); }
    finally { if (!controller.signal.aborted) setOpeningId(null); }
  }
  return (
    <ScrollView ref={scroll} style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.panel}><Text style={styles.title}>{t('billingHistory')}</Text>{data?.storeName ? <Text style={styles.subtitle}>{data.storeName}</Text> : null}</View>
      {receipt ? <BillingReceipt bill={receipt} onClose={closeReceipt} /> : null}
      <View style={styles.panel}><Text style={styles.heading}>{t('billingApply')}</Text><View style={[styles.row, styles.wrap]}>
        {(['from', 'to'] as const).map(field => <View key={field} style={styles.field}><Text style={styles.muted}>{t(field === 'from' ? 'billingFrom' : 'billingTo')}</Text><DateInput value={filters[field]} onChangeText={value => setFilters(current => ({ ...current, [field]: value }))} accessibilityLabel={t(field === 'from' ? 'billingFrom' : 'billingTo')} allowClear={false} style={styles.input} /></View>)}
        <View style={styles.field}><Text style={styles.muted}>{t('billingOrderType')}</Text><SearchableSelect label={t('billingOrderType')} value={filters.orderType} allowClear placeholder={t('billingAll')} options={[{ value: 'dineIn', label: t('billingDineIn') }, { value: 'takeAway', label: t('billingTakeAway') }]} onChange={orderType => setFilters(current => ({ ...current, orderType }))} /></View>
        <View style={styles.field}><Text style={styles.muted}>{t('billingToken')}</Text><SearchableSelect label={t('billingToken')} value={filters.tableNumber} allowClear placeholder={t('billingAll')} options={tables.map(value => ({ value, label: value }))} onChange={tableNumber => setFilters(current => ({ ...current, tableNumber }))} /></View>
        <View style={styles.field}><Text style={styles.muted}>{t('billingBillNumber')}</Text><TextInput accessibilityLabel={t('billingBillNumber')} value={filters.search} maxLength={80} onChangeText={search => setFilters(current => ({ ...current, search }))} style={styles.input} /></View>
      </View><View style={[styles.row, styles.wrap]}><Pressable accessibilityRole="button" onPress={apply} style={[styles.button, styles.primary]}><Text style={styles.primaryText}>{t('billingApply')}</Text></Pressable><Pressable accessibilityRole="button" onPress={() => { const next = todayFilters(); closeReceipt(); setFilters(next); setApplied(next); setPage(1); }} style={styles.button}><Text style={styles.body}>{t('billingToday')}</Text></Pressable></View></View>
      {error ? <View style={styles.panel}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable accessibilityRole="button" onPress={() => setReloadKey(current => current + 1)} style={styles.button}><Text style={styles.body}>{t('adminRetry')}</Text></Pressable></View> : null}
      <View style={styles.panel}><Text style={styles.heading}>{applied.from} - {applied.to} (IST)</Text>{loading ? <AppLoader /> : data?.bills.length ? <>
        {data.bills.map(bill => <Pressable key={bill._id} accessibilityRole="button" disabled={openingId !== null} onPress={() => void openReceipt(bill._id)} style={styles.item}><View style={[styles.row, styles.spread]}><Text style={[styles.strong, styles.grow]}>{bill.billNumber}</Text><Text style={styles.strong}>{formatINR(bill.totalPaise)}</Text></View><Text style={styles.body}>{t(bill.orderType === 'dineIn' ? 'billingDineIn' : 'billingTakeAway')} / {bill.tableNumber || t('billingTokenMissing')}</Text><Text style={styles.muted}>{new Date(bill.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</Text>{openingId === bill._id ? <AppLoader /> : null}</Pressable>)}
        <View style={[styles.row, styles.spread, styles.wrap]}><Text style={styles.muted}>{t('billingPage', { page: data.page, pages: data.totalPages })} / {data.total}</Text><View style={styles.row}><Pressable accessibilityRole="button" disabled={page <= 1} onPress={() => { closeReceipt(); setPage(current => current - 1); }} style={[styles.button, page <= 1 && styles.disabled]}><Text style={styles.body}>{t('billingPrevious')}</Text></Pressable><Pressable accessibilityRole="button" disabled={page >= data.totalPages || page >= 10000} onPress={() => { closeReceipt(); setPage(current => current + 1); }} style={[styles.button, page >= data.totalPages && styles.disabled]}><Text style={styles.body}>{t('billingNext')}</Text></Pressable></View></View>
      </> : <Text style={styles.empty}>{t('billingNoBills')}</Text>}</View>
    </ScrollView>
  );
}