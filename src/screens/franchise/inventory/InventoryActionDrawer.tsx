import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { X } from '../../../icons';
import { apiRequest } from '../../../api/auth';
import { AdminFormField } from '../../../components/AdminFormField';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import type { InventoryStockItem } from '../types';
import type { InventoryAction } from './InventoryCard';
import { inventoryStyles } from './inventoryStyles';
import { digitsOnly, formatInventoryDate } from './utils';

interface InventoryActionDrawerProps {
  visible: boolean;
  storeId: string;
  item: InventoryStockItem | null;
  action: InventoryAction | null;
  onClose: () => void;
  onAfterClose?: () => void;
  onDone: (message: string) => void;
}

const titles: Record<InventoryAction, Parameters<typeof t>[0]> = {
  useOne: 'franchiseInventoryUseOneTitle',
  useMany: 'franchiseInventoryUseManyTitle',
  dump: 'franchiseInventoryDumpTitle',
};

export function InventoryActionDrawer({ visible, storeId, item, action, onClose, onAfterClose, onDone }: InventoryActionDrawerProps) {
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setQuantity(action === 'useMany' && item ? String(Math.min(2, item.quantity)) : '');
    setError(null);
    setToast(null);
  }, [visible, action, item]);

  const confirm = async () => {
    if (!item || !action || saving) return;
    let amount = action === 'useOne' ? 1 : item.quantity;
    if (action === 'useMany') {
      amount = Number(quantity);
      if (!Number.isInteger(amount) || amount < 2 || amount > item.quantity) {
        setError(t('franchiseInventoryQuantityRange', { max: item.quantity }));
        return;
      }
    }
    setSaving(true);
    try {
      const response = await apiRequest('/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          action: action === 'dump' ? 'dump' : 'consume',
          inventoryItemId: item._id,
          quantity: amount,
        }),
      });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) {
        setToast(data.message || t('adminSaveFailed'));
        return;
      }
      onDone(data.message || t(action === 'dump' ? 'franchiseInventoryDumped' : 'franchiseInventoryConsumed'));
    } catch {
      setToast(t('adminNetworkError'));
    } finally {
      setSaving(false);
    }
  };

  const dump = action === 'dump';

  return (
    <ResponsiveDrawerModal
      visible={visible}
      closeLabel={t('adminCloseMenu')}
      onClose={onClose}
      onAfterClose={onAfterClose}
      overlay={visible && toast ? <AppToast message={toast} tone="error" onDismiss={() => setToast(null)} /> : null}
    >
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeading}>
          <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{action ? t(titles[action]) : ''}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.userIconAction}>
            <X color={theme.colors.muted} size={18} />
          </Pressable>
        </View>
        {item ? (
          <View style={inventoryStyles.actionSummary}>
            <Text style={inventoryStyles.actionSummaryTitle}>{item.product}</Text>
            <Text style={inventoryStyles.actionSummaryText}>
              {t('franchiseInventoryActionSummary', { date: formatInventoryDate(item.expiryDate), count: item.quantity })}
            </Text>
            <Text style={inventoryStyles.actionSummaryText}>
              {dump
                ? t('franchiseInventoryDumpMessage', { count: item.quantity })
                : action === 'useOne' ? t('franchiseInventoryUseOneMessage') : t('franchiseInventoryUseManyMessage')}
            </Text>
          </View>
        ) : null}
        {action === 'useMany' && item ? (
          <AdminFormField
            label={t('franchiseInventoryQuantityToUse', { max: item.quantity })}
            placeholder="2"
            value={quantity}
            onChangeText={(value) => { setQuantity(digitsOnly(value)); setError(null); }}
            keyboardType="number-pad"
            error={error ?? undefined}
          />
        ) : null}
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
              onPress={() => void confirm()}
              style={[styles.primaryButton, styles.drawerActionButton, dump && inventoryStyles.dangerButton]}
            >
              {saving
                ? <AppLoader variant="inline" color={theme.colors.white} />
                : <Text style={styles.primaryButtonText}>{t(dump ? 'franchiseInventoryConfirmDump' : 'franchiseInventoryConfirmUse')}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </ResponsiveDrawerModal>
  );
}
