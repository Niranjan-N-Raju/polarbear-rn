import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { SearchableSelect } from '../../../components/SearchableSelect';
import { billingRequest, billTotals, EMPTY_CUSTOMER, formatINR, pricePaise, type BillingData, type BillCustomer, type SavedBill } from '../../../common/billing';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { Minus, Plus, Trash2 } from '../../../icons';
import { BillingReceipt } from './BillingReceipt';
import { billingStyles as styles } from './billingStyles';

function QuantityInput({ name, value, disabled, onChange }: { name: string; value: number; disabled: boolean; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return <TextInput accessibilityLabel={`${name} ${t('billingQuantity')}`} editable={!disabled} selectTextOnFocus keyboardType="number-pad" maxLength={3} value={draft ?? String(value)} onChangeText={text => {
    if (!/^\d{0,3}$/.test(text)) return;
    setDraft(text);
    const next = Number(text);
    if (Number.isInteger(next) && next >= 1 && next <= 999) onChange(next);
  }} onBlur={() => setDraft(null)} style={[styles.input, { width: 56, textAlign: 'center' }]} />;
}

export function FranchiseBillingScreen({ storeId }: { storeId: string }) {
  const { width } = useWindowDimensions();
  const wide = width >= 1100;
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [orderType, setOrderType] = useState<'dineIn' | 'takeAway'>('dineIn');
  const [token, setToken] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [includeCustomer, setIncludeCustomer] = useState(false);
  const [customer, setCustomer] = useState<BillCustomer>({ ...EMPTY_CUSTOMER });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [receipt, setReceipt] = useState<SavedBill | null>(null);
  const busy = useRef(false);
  const requestId = useRef('');
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError('');
    billingRequest<BillingData>(`/bills?storeId=${encodeURIComponent(storeId)}`, { signal: controller.signal })
      .then(result => {
        if (!Array.isArray(result.products) || !Array.isArray(result.tables)) throw new Error(t('adminLoadFailed'));
        if (!controller.signal.aborted) setData(result);
      })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setLoadError(reason instanceof Error ? reason.message : t('adminLoadFailed')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [storeId, reloadKey]);

  function reset() {
    setOrderType('dineIn'); setToken(''); setQuantities({}); setSearch(''); setCategory('');
    setIncludeCustomer(false); setCustomer({ ...EMPTY_CUSTOMER }); setReceipt(null); setConfirmDiscard(false); setError(''); requestId.current = '';
  }
  function quantity(productId: string, next: number) {
    setError(''); setQuantities(current => {
      const result = { ...current };
      if (next <= 0) delete result[productId];
      else if (current[productId] || Object.keys(current).length < 100) result[productId] = Math.min(999, next);
      return result;
    });
  }
  const rows = Object.entries(quantities).map(([productId, count]) => ({ productId, count, product: data?.products.find(product => product._id === productId) }));
  const totals = billTotals(rows.reduce((sum, row) => sum + (pricePaise(row.product?.price) ?? 0) * row.count, 0));
  const invalid = rows.some(row => pricePaise(row.product?.price) === null);
  async function save() {
    if (busy.current) return;
    if (!token || !rows.length || invalid) { setError(t('billingInvalidOrder')); return; }
    if (includeCustomer && (!/^\d{10}$/.test(customer.mobile.trim()) || !customer.firstName.trim())) { setError(t('billingInvalidCustomer')); return; }
    busy.current = true; setSaving(true); setError('');
    try {
      if (!requestId.current) requestId.current = (await billingRequest<{ requestId: string }>('/bills?newRequest=true')).requestId;
      const result = await billingRequest<{ bill: SavedBill }>('/bills', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: requestId.current, orderType, tableNumber: token, items: rows.map(row => ({ productId: row.productId, quantity: row.count })), expectedSubtotalPaise: totals.subtotalPaise, customer: includeCustomer ? customer : null }),
      });
      setReceipt(result.bill); setQuantities({}); setCustomer({ ...EMPTY_CUSTOMER }); requestId.current = '';
      scroll.current?.scrollTo({ y: 0, animated: true });
    } catch (reason) { setError(reason instanceof Error ? reason.message : t('adminSaveFailed')); }
    finally { busy.current = false; setSaving(false); }
  }
  if (loading) return <AppLoader variant="screen" />;
  if (loadError || !data) return <AppErrorState message={loadError || t('adminLoadFailed')} onRetry={() => setReloadKey(current => current + 1)} />;
  const visible = data.products.filter(product => (!category || category === product.category) && product.name.toLowerCase().includes(search.trim().toLowerCase()));
  const categories = [...new Set(data.products.map(product => product.category))].sort();
  return (
    <ScrollView ref={scroll} style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={[styles.panel, styles.header]}><View><Text style={styles.title}>{t('billingNewOrder')}</Text><Text style={styles.subtitle}>{data.storeName}</Text></View>{!receipt ? <View style={[styles.row, styles.wrap]}>{(['dineIn', 'takeAway'] as const).map(mode => <Pressable key={mode} accessibilityRole="button" accessibilityState={{ selected: orderType === mode }} disabled={saving} onPress={() => setOrderType(mode)} style={[styles.button, orderType === mode && styles.selected]}><Text style={styles.body}>{t(mode === 'dineIn' ? 'billingDineIn' : 'billingTakeAway')}</Text></Pressable>)}<SearchableSelect label={t('billingToken')} value={token} options={data.tables.map(value => ({ value, label: value }))} placeholder={t('billingSelectToken')} disabled={saving} onChange={setToken} /></View> : <Pressable accessibilityRole="button" onPress={reset} style={[styles.button, styles.primary]}><Plus color={theme.colors.white} size={16} /><Text style={styles.primaryText}>{t('billingNewOrder')}</Text></Pressable>}</View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {receipt ? <BillingReceipt bill={receipt} /> : <View style={wide ? styles.columns : { gap: 20 }}>
        <View style={[styles.panel, styles.grow]}><Text style={styles.heading}>{t('billingMenu')}</Text><View style={[styles.row, styles.wrap]}><TextInput accessibilityLabel={t('billingSearch')} editable={!saving} placeholder={t('billingSearch')} value={search} onChangeText={setSearch} style={[styles.input, styles.grow]} /><SearchableSelect label={t('billingCategory')} value={category} options={categories.map(value => ({ value, label: value }))} allowClear placeholder={t('billingAll')} disabled={saving} onChange={setCategory} /></View>
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.options}>
            {!visible.length ? <Text style={styles.empty}>{t('billingNoMatches')}</Text> : visible.map(product => {
              const paise = pricePaise(product.price); const count = quantities[product._id] ?? 0;
              return <Pressable key={product._id} accessibilityRole="button" accessibilityLabel={`${product.name}, ${t('billingQuantity')} ${count}`} disabled={saving || paise === null || count >= 999 || (!count && rows.length >= 100)} onPress={() => quantity(product._id, count + 1)} style={[styles.item, styles.row, count > 0 && styles.selected, (paise === null || saving) && styles.disabled]}><View style={styles.grow}><Text style={styles.strong}>{product.name}</Text><Text style={styles.muted}>{product.category}{count ? ` / ${count}` : ''}</Text></View><Text style={styles.strong}>{paise === null ? t('billingPriceMissing') : formatINR(paise)}</Text><Plus color={theme.colors.orange} size={18} /></Pressable>;
            })}
          </ScrollView>
        </View>
        <View style={[styles.panel, wide && styles.summary]}><Text style={styles.heading}>{t('billingCurrentBill')}</Text><Text style={styles.muted}>{t(orderType === 'dineIn' ? 'billingDineIn' : 'billingTakeAway')} / {token || t('billingSelectToken')}</Text>
          {!rows.length ? <Text style={styles.empty}>{t('billingNoItems')}</Text> : rows.map(row => (
            <View key={row.productId} style={styles.item}>
              <View style={[styles.row, styles.spread]}><Text style={[styles.strong, styles.grow]}>{row.product?.name}</Text><Text style={styles.strong}>{formatINR((pricePaise(row.product?.price) ?? 0) * row.count)}</Text></View>
              <View style={[styles.row, styles.spread]}>
                <View style={styles.row}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${t('billingRemove')} ${row.product?.name}`} disabled={saving} onPress={() => quantity(row.productId, row.count - 1)} style={styles.iconButton}><Minus size={18} color={theme.colors.ink} /></Pressable>
                  <QuantityInput name={row.product?.name ?? ''} value={row.count} disabled={saving} onChange={next => quantity(row.productId, next)} />
                  <Pressable accessibilityRole="button" accessibilityLabel={`${t('billingQuantity')} + ${row.product?.name}`} disabled={saving || row.count >= 999} onPress={() => quantity(row.productId, row.count + 1)} style={styles.iconButton}><Plus size={18} color={theme.colors.ink} /></Pressable>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={`${t('billingRemove')} ${row.product?.name}`} disabled={saving} onPress={() => quantity(row.productId, 0)} style={styles.iconButton}><Trash2 size={18} color={theme.colors.error} /></Pressable>
              </View>
            </View>
          ))}
          <View style={styles.totals}>{[[t('billingSubtotal'), totals.subtotalPaise], [t('billingGst'), totals.gstPaise], [t('billingTotal'), totals.totalPaise]].map(([label, amount]) => <View key={String(label)} style={[styles.row, styles.spread]}><Text style={styles.strong}>{label}</Text><Text style={styles.strong}>{formatINR(Number(amount))}</Text></View>)}</View>
          {totals.totalPaise > 100_000_000 ? <Text accessibilityRole="alert" style={styles.error}>{t('billingTooLarge')}</Text> : null}
          <View style={[styles.row, styles.spread]}><Text style={styles.body}>{t('billingCustomer')}</Text><Switch disabled={saving} value={includeCustomer} onValueChange={setIncludeCustomer} /></View>
          {includeCustomer ? (['mobile', 'firstName', 'middleName', 'lastName'] as const).map(field => <View key={field} style={styles.field}><Text style={styles.muted}>{t(field === 'mobile' ? 'billingMobile' : field === 'firstName' ? 'billingFirstName' : field === 'middleName' ? 'billingMiddleName' : 'billingLastName')}{field === 'mobile' || field === 'firstName' ? ' *' : ''}</Text><TextInput editable={!saving} keyboardType={field === 'mobile' ? 'phone-pad' : 'default'} maxLength={field === 'mobile' ? 10 : 80} value={customer[field]} onChangeText={value => setCustomer(current => ({ ...current, [field]: value }))} style={styles.input} /></View>) : null}
          {confirmDiscard ? <View style={{ gap: 12 }}><Text style={styles.strong}>{t('billingConfirmDiscard')}</Text><View style={styles.row}><Pressable accessibilityRole="button" onPress={() => setConfirmDiscard(false)} style={[styles.button, styles.grow]}><Text style={styles.body}>{t('billingKeep')}</Text></Pressable><Pressable accessibilityRole="button" onPress={reset} style={[styles.button, styles.danger, styles.grow]}><Text style={styles.error}>{t('billingDiscard')}</Text></Pressable></View></View> : <View style={styles.row}><Pressable accessibilityRole="button" disabled={saving} onPress={() => setConfirmDiscard(true)} style={styles.button}><Text style={styles.body}>{t('billingCancel')}</Text></Pressable><Pressable accessibilityRole="button" disabled={saving || !token || !rows.length || invalid || totals.totalPaise > 100_000_000} onPress={() => void save()} style={[styles.button, styles.primary, styles.grow, (saving || !token || !rows.length || invalid || totals.totalPaise > 100_000_000) && styles.disabled]}><Text style={styles.primaryText}>{t(saving ? 'adminSaving' : 'billingSave')}</Text></Pressable></View>}
        </View>
      </View>}
    </ScrollView>
  );
}