import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { X } from '../icons';
import { theme } from '../config/theme';
import { t } from '../i18n';
import { adminStyles as styles } from '../styles/adminStyles';
import { ResponsiveDrawerModal } from './ResponsiveDrawerModal';

interface FilterDrawerProps {
  visible: boolean;
  title: string;
  height?: number;
  isWeb?: boolean;
  maxHeight?: number;
  canClear?: boolean;
  clearLabel?: string;
  applyLabel?: string;
  automaticallyAdjustKeyboardInsets?: boolean;
  onClose: () => void;
  onAfterClose?: () => void;
  onClear: () => void;
  onApply: () => void;
  children: ReactNode;
}

export function FilterDrawer({
  visible, title, height, isWeb, maxHeight = 390, canClear = true,
  clearLabel = t('adminClearFilters'), applyLabel = t('adminApplyFilters'),
  automaticallyAdjustKeyboardInsets = false, onClose, onAfterClose, onClear, onApply, children,
}: FilterDrawerProps) {
  return (
    <ResponsiveDrawerModal
      visible={visible}
      closeLabel={t('adminCloseMenu')}
      onClose={onClose}
      onAfterClose={onAfterClose}
      panelStyle={!isWeb && height !== undefined ? { height: Math.min(height * 0.8, maxHeight) } : undefined}
    >
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeading}>
          <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.userIconAction}>
            <X color={theme.colors.muted} size={18} />
          </Pressable>
        </View>
        <ScrollView style={styles.drawerFormScroll} contentContainerStyle={styles.filterDrawerFields} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets={automaticallyAdjustKeyboardInsets}>
          {children}
        </ScrollView>
        <View style={styles.modalActions}>
          <View style={styles.drawerActionSlot}>
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canClear }} disabled={!canClear} onPress={onClear} style={[styles.secondaryButton, styles.drawerActionButton, !canClear && styles.filterDrawerDisabledButton]}>
              <Text style={styles.secondaryButtonText}>{clearLabel}</Text>
            </Pressable>
          </View>
          <View style={styles.drawerActionSlot}>
            <Pressable accessibilityRole="button" onPress={onApply} style={[styles.primaryButton, styles.drawerActionButton]}>
              <Text style={styles.primaryButtonText}>{applyLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ResponsiveDrawerModal>
  );
}
