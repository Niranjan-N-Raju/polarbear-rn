import { Pressable, Text, View } from 'react-native';
import { X } from '../../../icons';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { inventoryStyles } from '../inventory/inventoryStyles';

interface ConfirmDrawerProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  busy: boolean;
  error?: string | null;
  onDismissError?: () => void;
  onClose: () => void;
  onAfterClose?: () => void;
  onConfirm: () => void;
}

export function ConfirmDrawer({
  visible,
  title,
  message,
  confirmLabel,
  danger = true,
  busy,
  error,
  onDismissError,
  onClose,
  onAfterClose,
  onConfirm,
}: ConfirmDrawerProps) {
  return (
    <ResponsiveDrawerModal
      visible={visible}
      closeLabel={t('adminCloseMenu')}
      onClose={onClose}
      onAfterClose={onAfterClose}
      overlay={visible && error ? <AppToast message={error} tone="error" onDismiss={() => onDismissError?.()} /> : null}
    >
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeading}>
          <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.userIconAction}>
            <X color={theme.colors.muted} size={18} />
          </Pressable>
        </View>
        <View style={inventoryStyles.actionSummary}>
          <Text style={inventoryStyles.actionSummaryText}>{message}</Text>
        </View>
        <View style={styles.modalActions}>
          <View style={styles.drawerActionSlot}>
            <Pressable accessibilityRole="button" onPress={onClose} style={[styles.secondaryButton, styles.drawerActionButton]}>
              <Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text>
            </Pressable>
          </View>
          <View style={styles.drawerActionSlot}>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={onConfirm}
              style={[styles.primaryButton, styles.drawerActionButton, danger && inventoryStyles.dangerButton]}
            >
              {busy
                ? <AppLoader variant="inline" color={theme.colors.white} />
                : <Text style={styles.primaryButtonText}>{confirmLabel}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </ResponsiveDrawerModal>
  );
}
