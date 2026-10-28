import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { X } from '../../../icons';
import { apiRequest } from '../../../api/auth';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
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
}

export function ProductsDrawer({ visible, storeId, onClose, onAfterClose }: ProductsDrawerProps) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!visible) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    apiRequest(`/products?storeId=${encodeURIComponent(storeId)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as { products?: InventoryProduct[]; message?: string };
        if (!response.ok || !Array.isArray(data.products)) {
          throw new Error(data.message || t('adminLoadFailed'));
        }
        if (!controller.signal.aborted) setProducts(data.products);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : t('adminNetworkError'));
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [visible, storeId, version]);

  return (
    <ResponsiveDrawerModal visible={visible} closeLabel={t('adminCloseMenu')} onClose={onClose} onAfterClose={onAfterClose}>
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeading}>
          <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t('franchiseInventoryProducts')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.userIconAction}>
            <X color={theme.colors.muted} size={18} />
          </Pressable>
        </View>
        <Text style={inventoryStyles.hint}>{t('franchiseInventoryProductsReadOnly')}</Text>
        {loading ? <AppLoader /> : error ? (
          <AppErrorState message={error} onRetry={() => setVersion((current) => current + 1)} />
        ) : (
          <ScrollView style={styles.drawerFormScroll} keyboardShouldPersistTaps="handled">
            {products.length === 0 ? <Text style={salesStyles.emptyExpenses}>{t('franchiseInventoryNoProducts')}</Text> : null}
            {products.map((product) => (
              <View key={product._id} style={inventoryStyles.actionSummary}>
                <Text style={inventoryStyles.actionSummaryTitle}>{product.name}</Text>
              </View>
            ))}
          </ScrollView>
        )}
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
