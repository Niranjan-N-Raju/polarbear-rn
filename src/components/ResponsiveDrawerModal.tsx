import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { responsiveDrawerStyles as styles } from '../styles/responsiveDrawerStyles';
import { getResponsiveDrawerLayout } from '../utils/adminLayout';
import { AppLoaderProvider } from './AppLoader';
import { OverlayHostContext } from './OverlayHost';

import type { ResponsiveDrawerModalProps } from './types';

export function ResponsiveDrawerModal({ visible, closeLabel, onClose, onAfterClose, overlay, children, presentation = 'drawer', panelStyle }: ResponsiveDrawerModalProps) {
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
  const [hosted, setHosted] = useState<Record<string, ReactNode>>({});
  const hostOverlay = useCallback((key: string, node: ReactNode | null) => {
    setHosted((current) => {
      if (node === null || node === undefined) {
        if (!(key in current)) return current;
        const rest = { ...current };
        delete rest[key];
        return rest;
      }
      return { ...current, [key]: node };
    });
  }, []);

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
      <AppLoaderProvider>
        <OverlayHostContext.Provider value={hostOverlay}>
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
            {overlay}
            {Object.entries(hosted).map(([key, node]) => <View key={key} style={StyleSheet.absoluteFill} pointerEvents="box-none">{node}</View>)}
          </View>
        </OverlayHostContext.Provider>
      </AppLoaderProvider>
    </Modal>
  );
}