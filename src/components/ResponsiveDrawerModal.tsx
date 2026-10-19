import type { ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleProp, useWindowDimensions, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import { responsiveDrawerStyles as styles } from '../styles/responsiveDrawerStyles';
import { getResponsiveDrawerLayout } from '../utils/adminLayout';

interface ResponsiveDrawerModalProps {
  visible: boolean;
  closeLabel: string;
  onClose: () => void;
  onAfterClose?: () => void;
  children: ReactNode;
  presentation?: 'drawer' | 'dialog';
  panelStyle?: StyleProp<ViewStyle>;
}

export function ResponsiveDrawerModal({ visible, closeLabel, onClose, onAfterClose, children, presentation = 'drawer', panelStyle }: ResponsiveDrawerModalProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const drawerLayout = getResponsiveDrawerLayout(width, height, presentation);
  const isWeb = drawerLayout.isWeb;
  const isDialog = drawerLayout.position === 'dialog';
  const [webMounted, setWebMounted] = useState(visible && isWeb);
  const [webOpen, setWebOpen] = useState(false);
  const [nativePresented, setNativePresented] = useState(visible && !isWeb);
  const webMountedRef = useRef(visible && isWeb);
  const nativePresentedRef = useRef(visible && !isWeb);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onAfterCloseRef = useRef(onAfterClose);

  useEffect(() => {
    onAfterCloseRef.current = onAfterClose;
  }, [onAfterClose]);

  useEffect(() => {
    if (isWeb) {
      if (visible) {
        if (openTimerRef.current) clearTimeout(openTimerRef.current);
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        webMountedRef.current = true;
        setWebMounted(true);
        setWebOpen(false);
        openTimerRef.current = setTimeout(() => {
          openTimerRef.current = null;
          setWebOpen(true);
        }, 30);
      } else if (webMountedRef.current) {
        if (openTimerRef.current) clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
        setWebOpen(false);
        closeTimerRef.current = setTimeout(() => {
          closeTimerRef.current = null;
          webMountedRef.current = false;
          setWebMounted(false);
          onAfterCloseRef.current?.();
        }, isDialog ? 180 : 260);
      }
    } else if (visible) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      nativePresentedRef.current = true;
      setNativePresented(true);
    } else if (nativePresentedRef.current) {
      nativePresentedRef.current = false;
      setNativePresented(false);
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null;
        onAfterCloseRef.current?.();
      }, 350);
    }

    return undefined;
  }, [isDialog, isWeb, visible]);

  useEffect(() => () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  return (
    <Modal
      visible={isWeb ? webMounted : nativePresented}
      transparent
      animationType={isWeb ? 'none' : isDialog ? 'fade' : 'slide'}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.root, isDialog ? styles.dialogRoot : drawerLayout.position === 'right' && styles.webRoot]}>
        <Pressable
          testID="responsive-drawer-scrim"
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          disabled={!visible}
          onPress={onClose}
          style={styles.scrim}
        />
        <View
          testID="responsive-drawer-panel"
          style={[
            styles.panel,
            isDialog ? styles.dialogPanel : drawerLayout.position === 'right' ? styles.webPanel : styles.nativePanel,
            drawerLayout.position === 'bottom' && !isDialog ? { paddingBottom: insets.bottom } : undefined,
            panelStyle,
            isWeb ? {
              opacity: webOpen ? 1 : 0,
              transform: [
                { translateX: drawerLayout.position === 'right' && !webOpen ? drawerLayout.hiddenOffset : 0 },
                { translateY: drawerLayout.position === 'bottom' && !webOpen ? drawerLayout.hiddenOffset : 0 },
              ],
            } : undefined,
          ]}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}