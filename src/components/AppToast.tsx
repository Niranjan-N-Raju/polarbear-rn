import { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X } from '../icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { t } from '../i18n';
import type { AppToastProps } from './types';
import { useOverlayHost } from './OverlayHost';

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    zIndex: 100,
    elevation: 100,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: theme.border.width,
    shadowColor: theme.colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  message: {
    flex: 1,
    fontSize: theme.typography.sm,
  },
  error: {
    borderColor: theme.colors.errorBorder,
    backgroundColor: theme.colors.errorBackground,
  },
  errorText: {
    color: theme.colors.error,
  },
  success: {
    borderColor: theme.colors.teal,
    backgroundColor: theme.colors.ice,
  },
  successText: {
    color: theme.colors.teal,
  },
  dismissButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function AppToast({
  message,
  tone = 'error',
  onDismiss,
  durationMs = 4000,
}: AppToastProps) {
  const insets = useSafeAreaInsets();
  const hostOverlay = useOverlayHost();
  const hostKey = useId();
  const animation = useRef(new Animated.Value(0)).current;
  const isDismissing = useRef(false);
  const isWeb = Platform.OS === 'web';
  const useNativeDriver = !isWeb;

  const dismiss = useCallback(() => {
    if (isDismissing.current) return;
    isDismissing.current = true;
    Animated.timing(animation, {
      toValue: 0,
      duration: 160,
      useNativeDriver,
    }).start(({ finished }) => {
      if (finished) onDismiss();
    });
  }, [animation, onDismiss, useNativeDriver]);

  useEffect(() => {
    isDismissing.current = false;
    animation.setValue(0);
    const enterAnimation = Animated.timing(animation, {
      toValue: 1,
      duration: 200,
      useNativeDriver,
    });
    enterAnimation.start();
    const timeout = setTimeout(dismiss, durationMs);
    return () => {
      clearTimeout(timeout);
      enterAnimation.stop();
    };
  }, [animation, dismiss, durationMs, message, useNativeDriver]);

  const content = useMemo(
    () => (
      <View
        testID="app-toast-top"
        pointerEvents="box-none"
        style={[styles.viewport, { top: insets.top + theme.spacing['2xl'] }]}
      >
        <Animated.View
          accessibilityRole="alert"
          style={[
            styles.toast,
            tone === 'success' ? styles.success : styles.error,
            {
              opacity: animation,
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-12, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.message,
              tone === 'success' ? styles.successText : styles.errorText,
            ]}
          >
            {message}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('adminDismissToast')}
            onPress={dismiss}
            style={styles.dismissButton}
          >
            <X
              color={
                tone === 'success' ? theme.colors.teal : theme.colors.error
              }
              size={18}
            />
          </Pressable>
        </Animated.View>
      </View>
    ),
    [animation, dismiss, insets.top, message, tone],
  );

  useEffect(() => {
    if (!hostOverlay) return undefined;
    hostOverlay(hostKey, content);
    return () => hostOverlay(hostKey, null);
  }, [content, hostKey, hostOverlay]);

  return hostOverlay ? null : content;
}
