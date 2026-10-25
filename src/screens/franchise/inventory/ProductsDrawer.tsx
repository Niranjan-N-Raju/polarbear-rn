import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Check, Pencil, Plus, Trash2, X } from '../../../icons';
import { apiRequest } from '../../../api/auth';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { salesStyles } from '../sales/salesStyles';
import type { InventoryProduct } from '../types';
import { inventoryStyles } from './inventoryStyles';

interface ProductsDrawerProps {
  visible: boolean;
  storeId: string;
  onClose: () => void;
  onAfterClose?: () => void;
  onChanged: () => void;
}

type ToastState = { message: string; tone: 'error' | 'success' } | null;

export function ProductsDrawer({ visible, storeId, onClose, onAfterClose, onChanged }: ProductsDrawerProps) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNames, setNewNames] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/products?storeId=${encodeURIComponent(storeId)}`, { signal });
      const data = await response.json().catch(() => ({})) as { products?: InventoryProduct[]; message?: string };
      if (signal?.aborted) return;
      if (!response.ok) {
        setToast({ message: data.message || t('adminLoadFailed'), tone: 'error' });
        return;
      }
      setProducts(data.products ?? []);
    } catch {
      if (!signal?.aborted) setToast({ message: t('adminNetworkError'), tone: 'error' });
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (!visible) return undefined;
    setNewNames('');
    setEditing(null);
    setConfirmDeleteId(null);
    setToast(null);
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [visible, load]);

  const mutate = async (key: string, method: 'POST' | 'PATCH' | 'DELETE', body: Record<string, string>, fallback: string) => {
    if (busy) return false;
    setBusy(key);
    try {
      const response = await apiRequest('/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, ...body }),
      });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) {
        setToast({ message: data.message || t('adminSaveFailed'), tone: 'error' });
        return false;
      }
      setToast({ message: data.message || fallback, tone: 'success' });
      await load();
      onChanged();
      return true;
    } catch {
      setToast({ message: t('adminNetworkError'), tone: 'error' });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const addProducts = async () => {
    if (!newNames.trim()) {
      setToast({ message: t('franchiseInventoryProductNameRequired'), tone: 'error' });
      return;
    }
    if (await mutate('add', 'POST', { name: newNames }, t('franchiseInventoryProductsAdded'))) setNewNames('');
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      setToast({ message: t('franchiseInventoryProductNameRequired'), tone: 'error' });
      return;
    }
    if (await mutate(`edit-${editing.id}`, 'PATCH', { productId: editing.id, name: editing.name.trim() }, t('franchiseInventoryProductUpdated'))) {
      setEditing(null);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (await mutate(`delete-${productId}`, 'DELETE', { productId }, t('franchiseInventoryProductDeleted'))) {
      setConfirmDeleteId(null);
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
          <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t('franchiseInventoryProducts')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.userIconAction}>
            <X color={theme.colors.muted} size={18} />
          </Pressable>
        </View>
        <View style={inventoryStyles.addRow}>
          <TextInput
            accessibilityLabel={t('franchiseInventoryNewProducts')}
            placeholder={t('franchiseInventoryNewProductsPlaceholder')}
            placeholderTextColor={theme.colors.muted}
            value={newNames}
            onChangeText={setNewNames}
            onSubmitEditing={() => void addProducts()}
            returnKeyType="done"
            style={[styles.fieldInput, inventoryStyles.addInput]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('franchiseInventoryAddProducts')}
            disabled={Boolean(busy)}
            onPress={() => void addProducts()}
            style={[styles.primaryButton, inventoryStyles.addButton]}
          >
            {busy === 'add' ? <AppLoader variant="inline" color={theme.colors.white} /> : <Plus color={theme.colors.white} size={18} />}
          </Pressable>
        </View>
        <Text style={inventoryStyles.hint}>{t('franchiseInventoryProductsHint')}</Text>
        <ScrollView style={styles.drawerFormScroll} keyboardShouldPersistTaps="handled">
          {loading && products.length === 0 ? (
            <View style={{ padding: theme.spacing.lg }}>
              <AppLoader variant="inline" color={theme.colors.teal} />
            </View>
          ) : null}
          {!loading && products.length === 0 ? (
            <Text style={salesStyles.emptyExpenses}>{t('franchiseInventoryNoProducts')}</Text>
          ) : null}
          {products.map((product, index) => {
            const isEditing = editing?.id === product._id;
            const confirming = confirmDeleteId === product._id;
            return (
              <View key={product._id}>
                {isEditing ? (
                  <View style={salesStyles.expenseEditor}>
                    <TextInput
                      accessibilityLabel={t('franchiseInventoryProductName')}
                      value={editing.name}
                      onChangeText={(name) => setEditing((current) => current && { ...current, name })}
                      autoFocus
                      style={styles.fieldInput}
                    />
                    <View style={salesStyles.expenseEditorActions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('adminCancel')}
                        onPress={() => setEditing(null)}
                        style={[styles.secondaryButton, salesStyles.smallButton]}
                      >
                        <X color={theme.colors.muted} size={14} />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('franchiseInventorySaveProduct')}
                        disabled={Boolean(busy)}
                        onPress={() => void saveEdit()}
                        style={[styles.primaryButton, salesStyles.smallButton]}
                      >
                        {busy === `edit-${product._id}`
                          ? <AppLoader variant="inline" color={theme.colors.white} />
                          : <Check color={theme.colors.white} size={14} />}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={salesStyles.expenseRow}>
                    <Text style={inventoryStyles.productIndex}>{index + 1}.</Text>
                    <Text numberOfLines={1} style={salesStyles.expenseName}>{product.name}</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('franchiseInventoryEditProduct', { name: product.name })}
                      onPress={() => { setEditing({ id: product._id, name: product.name }); setConfirmDeleteId(null); }}
                      style={salesStyles.expenseIconButton}
                    >
                      <Pencil color={theme.colors.teal} size={14} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('franchiseInventoryDeleteProduct', { name: product.name })}
                      onPress={() => { setConfirmDeleteId(confirming ? null : product._id); setEditing(null); }}
                      style={salesStyles.expenseIconButton}
                    >
                      <Trash2 color={theme.colors.error} size={14} />
                    </Pressable>
                  </View>
                )}
                {confirming ? (
                  <View style={[inventoryStyles.confirmBox, { marginBottom: theme.spacing.sm }]}>
                    <Text style={inventoryStyles.confirmText}>{t('franchiseInventoryDeleteWarning', { name: product.name })}</Text>
                    <View style={salesStyles.expenseEditorActions}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setConfirmDeleteId(null)}
                        style={[styles.secondaryButton, salesStyles.smallButton]}
                      >
                        <Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        disabled={Boolean(busy)}
                        onPress={() => void deleteProduct(product._id)}
                        style={[styles.primaryButton, salesStyles.smallButton, inventoryStyles.dangerButton]}
                      >
                        {busy === `delete-${product._id}`
                          ? <AppLoader variant="inline" color={theme.colors.white} />
                          : <Text style={styles.primaryButtonText}>{t('franchiseInventoryConfirmDelete')}</Text>}
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.modalActions}>
          <View style={styles.drawerActionSlot}>
            <Pressable accessibilityRole="button" onPress={onClose} style={[styles.secondaryButton, styles.drawerActionButton]}>
              <Text style={styles.secondaryButtonText}>{t('franchiseInventoryDone')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ResponsiveDrawerModal>
  );
}
