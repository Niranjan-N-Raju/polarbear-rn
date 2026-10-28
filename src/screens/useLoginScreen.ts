import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Platform,
  TextInput,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setPasswordChangeRequiredHandler, setUnauthorizedHandler } from '../api/auth';
import { theme } from '../config/theme';
import { useLogin } from '../hooks/useLogin';
import { t } from '../i18n';
import {
  getLoginSafeAreaStyles
} from '../styles/loginScreenStyles';


export function useLoginScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isWide = width >= theme.layout.desktopBreakpoint;
  const isWebCompact = Platform.OS === 'web' && !isWide;
  const isWebTablet =
    Platform.OS === 'web' && width >= theme.layout.tabletBreakpoint && !isWide;
  const loginState = useLogin();
  const signOut = loginState.signOut;
  const [authToastMessage, setAuthToastMessage] = useState('');
  const passwordInputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const dismissAuthToast = useCallback(() => setAuthToastMessage(''), []);
  const handleUnauthorized = useCallback(() => {
    signOut();
    setAuthToastMessage(t('sessionExpired'));
  }, [signOut]);
  // The API layer owns HTTP detection; the mounted login screen owns the session-expiry UX.
  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);
  const requirePasswordChange = loginState.requirePasswordChange;
  // Route back through the mandatory-change screen even when the server flags an existing session.
  useEffect(() => {
    setPasswordChangeRequiredHandler(requirePasswordChange);
    return () => setPasswordChangeRequiredHandler(null);
  }, [requirePasswordChange]);
  const safeAreaStyles = getLoginSafeAreaStyles(
    safeAreaInsets.top,
    safeAreaInsets.bottom,
    height,
  );
  return {
    isWide,
    isWebCompact,
    isWebTablet,
    loginState,
    authToastMessage,
    passwordInputRef,
    dismissAuthToast,
    safeAreaStyles,
  };
}
