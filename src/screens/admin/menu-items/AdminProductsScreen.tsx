import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { SearchableSelect } from '../../../components/SearchableSelect';
import { billingRequest, formatINR, pricePaise } from '../../../common/billing';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { Pencil, Plus, Trash2, X } from '../../../icons';
import { adminStyles as base } from '../../../styles/adminStyles';
import { billingStyles as styles } from '../../franchise/billing/billingStyles';

interface Category { _id: string; name: string }
interface Material { _id: string; name: string; unit: string }
interface Ingredient { productId: string; quantity: number }
interface Product { _id: string; name: string; categoryId: string; price?: number; dineIn: Ingredient[]; takeAway: Ingredient[] }
interface Draft { key: number; productId: string; quantity: string }
interface Catalog { products: Product[]; categories: Category[]; materials: Material[] }

export function AdminProductsScreen({ onToast }: { onToast: (message: string, tone: 'success' | 'error') => void }) {
  const [data, setData] = useState<Catalog>({ products: [], categories: [], materials: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dineIn, setDineIn] = useState<Draft[]>([]);
  const [takeAway, setTakeAway] = useState<Draft[]>([]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    Promise.all([
      billingRequest<{ products: Product[] }>('/menu-products', { signal: controller.signal }),
      billingRequest<{ categories: Category[] }>('/product-categories', { signal: controller.signal }),
      billingRequest<{ products: Material[] }>('/products', { signal: controller.signal }),
    ]).then(([menu, categories, materials]) => {
      if (!Array.isArray(menu.products) || !Array.isArray(categories.categories) || !Array.isArray(materials.products)) throw new Error(t('adminLoadFailed'));
      if (!controller.signal.aborted) setData({ products: menu.products, categories: categories.categories, materials: materials.products });
    })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : t('adminLoadFailed')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reloadKey]);
  function open(product?: Product) {
    const draft = (items?: Ingredient[]) => items?.map((item, index) => ({ key: index, productId: item.productId, quantity: String(item.quantity) })) ?? [{ key: 0, productId: '', quantity: '' }];
    setEditingId(product?._id ?? null); setName(product?.name ?? ''); setPrice(product?.price === undefined ? '' : String(product.price));
    setCategoryId(product?.categoryId ?? ''); setDineIn(draft(product?.dineIn)); setTakeAway(draft(product?.takeAway)); setFormError(''); setFormOpen(true);
  }
  async function save() {
    if (busy.current) return;
    const valid = (rows: Draft[]) => rows.length > 0 && rows.length <= 100 && new Set(rows.map(row => row.productId)).size === rows.length && rows.every(row => data.materials.some(material => material._id === row.productId) && Number.isFinite(Number(row.quantity)) && Number(row.quantity) > 0);
    if (!name.trim() || name.trim().length > 100 || !data.categories.some(category => category._id === categoryId) || pricePaise(Number(price)) === null || !valid(dineIn) || !valid(takeAway)) { setFormError(t('billingInvalidProduct')); return; }
    busy.current = true; setSaving(true); setFormError('');
    try {
      const rows = (items: Draft[]) => items.map(item => ({ productId: item.productId, quantity: Number(item.quantity) }));
      const result = await billingRequest<{ product: Product }>('/menu-products', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...(editingId ? { productId: editingId } : {}), name: name.trim(), price: Number(price), categoryId, dineIn: rows(dineIn), takeAway: rows(takeAway) }) });
      setData(current => ({ ...current, products: [...current.products.filter(product => product._id !== result.product._id), result.product].sort((left, right) => left.name.localeCompare(right.name)) }));
      setFormOpen(false); onToast(t('billingProductSaved'), 'success');
    } catch (reason) { setFormError(reason instanceof Error ? reason.message : t('adminSaveFailed')); }
    finally { busy.current = false; setSaving(false); }
  }
  function composition(mode: 'dineIn' | 'takeAway') {
    const rows = mode === 'dineIn' ? dineIn : takeAway;
    const setRows = mode === 'dineIn' ? setDineIn : setTakeAway;
    return <View style={{ gap: 12 }}><View style={[styles.row, styles.spread, styles.wrap]}><Text style={styles.heading}>{t(mode === 'dineIn' ? 'billingDineComposition' : 'billingTakeComposition')}</Text>{mode === 'takeAway' ? <Pressable accessibilityRole="button" disabled={saving} onPress={() => setTakeAway(dineIn.map(row => ({ ...row })))} style={styles.button}><Text style={styles.body}>{t('billingCopyComposition')}</Text></Pressable> : null}</View>
      {rows.map(row => {
        const material = data.materials.find(candidate => candidate._id === row.productId);
        return <View key={row.key} style={styles.item}><Text style={styles.muted}>{t('billingMaterial')} *</Text><SearchableSelect label={t('billingMaterial')} value={row.productId} disabled={saving} options={data.materials.filter(candidate => !rows.some(other => other.key !== row.key && other.productId === candidate._id)).map(candidate => ({ value: candidate._id, label: `${candidate.name} (${candidate.unit})` }))} onChange={productId => setRows(current => current.map(item => item.key === row.key ? { ...item, productId } : item))} />
          <View style={styles.row}><View style={styles.grow}><Text style={styles.muted}>{t('billingQuantity')} ({material?.unit ?? '-'}) *</Text><TextInput accessibilityLabel={t('billingQuantity')} editable={!saving} keyboardType="decimal-pad" value={row.quantity} onChangeText={quantity => setRows(current => current.map(item => item.key === row.key ? { ...item, quantity } : item))} style={styles.input} /></View><Pressable accessibilityRole="button" accessibilityLabel={t('billingRemove')} disabled={saving || rows.length === 1} onPress={() => setRows(current => current.filter(item => item.key !== row.key))} style={[styles.iconButton, rows.length === 1 && styles.disabled]}><Trash2 size={18} color={theme.colors.error} /></Pressable></View>
        </View>;
      })}
      <Pressable accessibilityRole="button" disabled={saving || rows.length >= 100} onPress={() => setRows(current => [...current, { key: Math.max(-1, ...current.map(row => row.key)) + 1, productId: '', quantity: '' }])} style={styles.button}><Plus size={16} color={theme.colors.orange} /><Text style={styles.body}>{t('billingAddMaterial')}</Text></Pressable>
    </View>;
  }
  if (loading) return <AppLoader variant="screen" />;
  if (error) return <AppErrorState message={error} onRetry={() => setReloadKey(current => current + 1)} />;
  return <View style={base.screen}>
    <View style={[base.screenHeader, base.screenHeaderInline]}><Text style={[base.screenTitle, base.screenTitleInline]}>{t('adminProducts')}</Text><Pressable accessibilityRole="button" disabled={!data.categories.length || !data.materials.length} onPress={() => open()} style={[base.primaryButton, (!data.categories.length || !data.materials.length) && styles.disabled]}><Plus color={theme.colors.white} size={16} /><Text style={base.primaryButtonText}>{t('adminAdd')}</Text></Pressable></View>
    <ScrollView contentContainerStyle={base.listContent}>{!data.products.length ? <Text style={styles.empty}>{t('billingNoMatches')}</Text> : data.products.map(product => <View key={product._id} style={base.storeCard}><View style={base.storeCardHeader}><View style={base.storeCardBody}><Text style={base.storeTitle}>{product.name}</Text><Text style={styles.muted}>{data.categories.find(category => category._id === product.categoryId)?.name}</Text><Text style={styles.strong}>{pricePaise(product.price) === null ? t('billingUnpriced') : formatINR(pricePaise(product.price)!)}</Text><Text style={styles.muted}>{t('billingDineComposition')}: {product.dineIn.map(item => `${data.materials.find(material => material._id === item.productId)?.name ?? '-'} ${item.quantity}`).join(', ')}</Text><Text style={styles.muted}>{t('billingTakeComposition')}: {product.takeAway.map(item => `${data.materials.find(material => material._id === item.productId)?.name ?? '-'} ${item.quantity}`).join(', ')}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`${t('adminEdit')} ${product.name}`} onPress={() => open(product)} style={base.storeCardHeaderAction}><Pencil color={theme.colors.teal} size={18} /></Pressable></View></View>)}</ScrollView>
    <ResponsiveDrawerModal visible={formOpen} closeLabel={t('adminCloseMenu')} onClose={() => { if (!saving) setFormOpen(false); }}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={[styles.row, styles.spread]}><Text style={styles.title}>{t('adminProducts')}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} disabled={saving} onPress={() => setFormOpen(false)} style={styles.iconButton}><X color={theme.colors.muted} size={20} /></Pressable></View>
      <Text style={styles.muted}>{t('billingCategory')} *</Text><SearchableSelect label={t('billingCategory')} value={categoryId} disabled={saving} options={data.categories.map(category => ({ value: category._id, label: category.name }))} onChange={setCategoryId} />
      <Text style={styles.muted}>{t('billingProductName')} *</Text><TextInput accessibilityLabel={t('billingProductName')} editable={!saving} maxLength={100} value={name} onChangeText={setName} style={styles.input} />
      <Text style={styles.muted}>{t('billingPrice')} *</Text><TextInput accessibilityLabel={t('billingPrice')} editable={!saving} keyboardType="decimal-pad" value={price} onChangeText={setPrice} style={styles.input} />
      {composition('dineIn')}{composition('takeAway')}{formError ? <Text accessibilityRole="alert" style={styles.error}>{formError}</Text> : null}
      <View style={styles.row}><Pressable accessibilityRole="button" disabled={saving} onPress={() => setFormOpen(false)} style={[base.secondaryButton, styles.grow]}><Text style={base.secondaryButtonText}>{t('adminCancel')}</Text></Pressable><Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={[base.primaryButton, styles.grow]}><Text style={base.primaryButtonText}>{t(saving ? 'adminSaving' : 'adminSave')}</Text></Pressable></View>
    </ScrollView></ResponsiveDrawerModal>
  </View>;
}