import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Check, X } from '../../../icons';
import { apiRequest } from '../../../api/auth';
import { AdminFormField } from '../../../components/AdminFormField';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { salesStyles } from '../sales/salesStyles';
import type { InventoryProduct } from '../types';
import { inventoryStyles } from './inventoryStyles';
import { digitsOnly, isValidDateValue } from './utils';

interface StockFormDrawerProps {
  visible: boolean;
  storeId: string;
  onClose: () => void;
  onAfterClose?: () => void;
  onSaved: (message: string) => void;
}

interface StockErrors {
  product?: string;
  expiryDate?: string;
  quantity?: string;
}

export function StockFormDrawer({ visible, storeId, onClose, onAfterClose, onSaved }: StockFormDrawerProps) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState('');
  const [productId, setProductId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [errors, setErrors] = useState<StockErrors>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (!visible) return undefined;
    setSearch('');
    setProductId('');
    setExpiryDate('');
    setQuantity('');
    setErrors({});
    setToast(null);
    const controller = new AbortController();
    let active = true;
    setLoadingProducts(true);
    apiRequest(`/products?storeId=${encodeURIComponent(storeId)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as { products?: InventoryProduct[]; message?: string };
        if (!active) return;
        if (!response.ok) {
          setToast({ message: data.message || t('adminLoadFailed'), tone: 'error' });
          return;
        }
        setProducts(data.products ?? []);
      })
      .catch(() => {
        if (active) setToast({ message: t('adminNetworkError'), tone: 'error' });
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [visible, storeId]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? products.filter((product) => product.name.toLowerCase().includes(query)) : products;
  }, [products, search]);

  const save = async () => {
    if (saving) return;
    const nextErrors: StockErrors = {
      product: productId ? undefined : t('franchiseInventoryChooseProduct'),
      expiryDate: isValidDateValue(expiryDate) ? undefined : t('franchiseInventoryInvalidDate'),
      quantity: Number(quantity) > 0 ? undefined : t('franchiseInventoryInvalidQuantity'),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSaving(true);
    try {
      const response = await apiRequest('/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, productId, expiryDate, quantity: Number(quantity) }),
      });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) {
        setToast({ message: data.message || t('adminSaveFailed'), tone: 'error' });
        return;
      }
      onSaved(data.message || t('franchiseInventoryStockAdded'));
    } catch {
      setToast({ message: t('adminNetworkError'), tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResponsiveDrawerModal
      visible={visible}
      closeLabel={t('adminCloseMenu')}
      onClose={onClose}
      onAfterClose={onAfterClose}
      overlay={visible && toast ? <AppToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} /> : null}
    >
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeading}>
          <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t('franchiseInventoryAddStock')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.userIconAction}>
            <X color={theme.colors.muted} size={18} />
          </Pressable>
        </View>
        <ScrollView style={styles.drawerFormScroll} keyboardShouldPersistTaps="handled">
          <Text style={inventoryStyles.fieldLabel}>{t('franchiseInventoryProduct')}</Text>
          <TextInput
            accessibilityLabel={t('franchiseInventorySearchProduct')}
            placeholder={t('franchiseInventorySearchProduct')}
            placeholderTextColor={theme.colors.muted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            style={[styles.fieldInput, { marginBottom: theme.spacing.sm }]}
          />
          <View style={inventoryStyles.pickerList}>
            {loadingProducts ? (
              <View style={{ padding: theme.spacing.md }}>
                <AppLoader variant="inline" color={theme.colors.teal} />
              </View>
            ) : (
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {filteredProducts.length === 0 ? (
                  <Text style={inventoryStyles.pickerEmpty}>
                    {t(products.length === 0 ? 'franchiseInventoryNoProducts' : 'franchiseInventoryNoProductMatch')}
                  </Text>
                ) : filteredProducts.map((product) => {
                  const selected = product._id === productId;
                  return (
                    <Pressable
                      key={product._id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => { setProductId(product._id); setErrors((current) => ({ ...current, product: undefined })); }}
                      style={[inventoryStyles.pickerOption, selected && inventoryStyles.pickerOptionSelected]}
                    >
                      <Text numberOfLines={1} style={inventoryStyles.pickerOptionText}>{product.name}</Text>
                      {selected ? <Check color={theme.colors.teal} size={16} /> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
          {errors.product ? <Text accessibilityRole="alert" style={[salesStyles.dateError, { marginTop: -theme.spacing.sm, marginBottom: theme.spacing.md }]}>{errors.product}</Text> : null}
          <View style={salesStyles.formRow}>
            <AdminFormField
              label={t('franchiseInventoryExpiry')}
              placeholder={t('franchiseDatePlaceholder')}
              value={expiryDate}
              onChangeText={(value) => { setExpiryDate(value); setErrors((current) => ({ ...current, expiryDate: undefined })); }}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              error={errors.expiryDate}
              containerStyle={salesStyles.formRowItem}
            />
            <AdminFormField
              label={t('franchiseInventoryQuantity')}
              placeholder="0"
              value={quantity}
              onChangeText={(value) => { setQuantity(digitsOnly(value)); setErrors((current) => ({ ...current, quantity: undefined })); }}
              keyboardType="number-pad"
              error={errors.quantity}
              containerStyle={salesStyles.formRowItem}
            />
          </View>
        </ScrollView>
        <View style={styles.modalActions}>
          <View style={styles.drawerActionSlot}>
            <Pressable accessibilityRole="button" onPress={onClose} style={[styles.secondaryButton, styles.drawerActionButton]}>
              <Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text>
            </Pressable>
          </View>
          <View style={styles.drawerActionSlot}>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => void save()}
              style={[styles.primaryButton, styles.drawerActionButton]}
            >
              {saving
                ? <AppLoader variant="inline" color={theme.colors.white} />
                : <Text style={styles.primaryButtonText}>{t('franchiseInventoryAddStock')}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </ResponsiveDrawerModal>
  );
}
