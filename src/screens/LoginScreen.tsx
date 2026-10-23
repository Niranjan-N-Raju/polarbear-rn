import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail } from '../icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppToast } from '../components/AppToast';
import { AppLoader } from '../components/AppLoader';
import { setUnauthorizedHandler } from '../api/auth';
import { theme } from '../config/theme';
import { useLogin } from '../hooks/useLogin';
import { t, translateRole } from '../i18n';
import { AdminHomeScreen } from './admin/AdminHomeScreen';
import {
  getLoginSafeAreaStyles,
  getSignInButtonStyle,
  styles,
} from '../styles/loginScreenStyles';

export function LoginScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isWide = width >= theme.layout.desktopBreakpoint;
  const isWebCompact = Platform.OS === 'web' && !isWide;
  const isWebTablet =
    Platform.OS === 'web' && width >= theme.layout.tabletBreakpoint && !isWide;
  const loginState = useLogin();
  const [authToastMessage, setAuthToastMessage] = useState('');
  const passwordInputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const dismissAuthToast = useCallback(() => setAuthToastMessage(''), []);
  const handleUnauthorized = useCallback(() => {
    loginState.signOut();
    setAuthToastMessage(t('sessionExpired'));
  }, [loginState.signOut]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);
  const safeAreaStyles = getLoginSafeAreaStyles(
    safeAreaInsets.top,
    safeAreaInsets.bottom,
    height,
  );

  if (loginState.session) {
    return (
      <>
        <AdminHomeScreen user={loginState.session.user} onLogout={loginState.signOut} />
        {authToastMessage ? <AppToast message={authToastMessage} onDismiss={dismissAuthToast} /> : null}
      </>
    );
  }

  return (
    <View
      style={[
        styles.container,
        isWide && styles.containerWide,
        isWebCompact && styles.webCompactContainer,
        isWebTablet && styles.webTabletContainer,
      ]}
    >
      <StatusBar barStyle={isWide ? 'light-content' : 'dark-content'} />
      <View
        style={[
          styles.shell,
          isWide ? styles.shellWide : styles.shellCompact,
          isWebCompact && styles.webCompactShell,
          isWebCompact && safeAreaStyles.webCompactShell,
        ]}
      >
        {isWide ? (
          <View style={[styles.hero, safeAreaStyles.heroTop]}>
            <View pointerEvents="none" style={styles.heroRingTop} />
            <View pointerEvents="none" style={styles.heroRingBottom} />
            <View>
              <Brand />
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>{t('heroEyebrow')}</Text>
                <Text style={styles.heroHeading}>{t('heroHeadline')}</Text>
                <Text style={styles.heroText}>
                  {t('heroDescription')}
                </Text>
              </View>
            </View>
            <Text style={styles.heroFooter}>{t('heroFooter')}</Text>
          </View>
        ) : null}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[
            styles.formPanel,
            !isWide && styles.formPanelCompact,
            isWebCompact && styles.webCompactFormPanel,
          ]}
        >
          {!isWide ? (
            <View
              style={[
                styles.mobileBrand,
                safeAreaStyles.mobileBrandTop,
              ]}
            >
              <Brand compact />
            </View>
          ) : null}
          <ScrollView
            style={[
              styles.scrollView,
              !isWide && styles.scrollViewCompact,
              isWebCompact && styles.webCompactScrollView,
            ]}
            contentContainerStyle={[
              styles.scrollContent,
              !isWide && styles.scrollContentCompact,
              isWebCompact && styles.webCompactScrollContent,
              safeAreaStyles.scrollBottom,
              isWide && styles.scrollContentWide,
            ]}
            keyboardShouldPersistTaps="always"
          >
            {!isWide ? (
              <View style={styles.mobileProgress}>
                <View style={styles.mobileProgressOrange} />
                <View style={styles.mobileProgressYellow} />
              </View>
            ) : null}
            <>
                <View style={styles.headingBlock}>
                  <Text style={[styles.eyebrow, !isWide && styles.eyebrowMobile]}>
                    {t('welcomeBack')}
                  </Text>
                  <Text style={styles.heading}>{t('loginHeading')}</Text>
                  <Text style={styles.subtitle}>{t('loginDescription')}</Text>
                </View>

                {loginState.formError ? (
                  <Text accessibilityRole="alert" style={styles.formError}>
                    {loginState.formError}
                  </Text>
                ) : null}

                <View style={styles.form}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>{t('emailLabel')}</Text>
                    <View style={styles.inputWrap}>
                      <Mail
                        color={theme.colors.placeholder}
                        size={theme.layout.iconSize}
                        strokeWidth={theme.layout.iconStrokeWidth}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        accessibilityLabel={t('emailLabel')}
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                        keyboardType="email-address"
                        onChangeText={loginState.updateEmail}
                        placeholder={t('emailPlaceholder')}
                        placeholderTextColor={theme.colors.placeholder}
                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                        returnKeyType="next"
                        style={[styles.input, loginState.emailError ? styles.inputError : null]}
                        value={loginState.email}
                      />
                    </View>
                    {loginState.emailError ? (
                      <Text style={styles.fieldError}>{loginState.emailError}</Text>
                    ) : null}
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>{t('passwordLabel')}</Text>
                    <View style={styles.inputWrap}>
                      <LockKeyhole
                        color={theme.colors.placeholder}
                        size={theme.layout.iconSize}
                        strokeWidth={theme.layout.iconStrokeWidth}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        ref={passwordInputRef}
                        accessibilityLabel={t('passwordLabel')}
                        autoCapitalize="none"
                        autoComplete="current-password"
                        onChangeText={loginState.updatePassword}
                        onSubmitEditing={() => void loginState.submit()}
                        placeholder={t('passwordPlaceholder')}
                        placeholderTextColor={theme.colors.placeholder}
                        returnKeyType="done"
                        secureTextEntry={!loginState.showPassword}
                        style={[styles.input, loginState.passwordError ? styles.inputError : null]}
                        value={loginState.password}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          loginState.showPassword ? t('hidePassword') : t('showPassword')
                        }
                        onPress={() => loginState.setShowPassword(!loginState.showPassword)}
                        style={styles.visibilityButton}
                      >
                        {loginState.showPassword ? (
                          <EyeOff
                            color={theme.colors.iconMuted}
                            size={theme.layout.iconSize}
                            strokeWidth={theme.layout.iconStrokeWidth}
                          />
                        ) : (
                          <Eye
                            color={theme.colors.iconMuted}
                            size={theme.layout.iconSize}
                            strokeWidth={theme.layout.iconStrokeWidth}
                          />
                        )}
                      </Pressable>
                    </View>
                    {loginState.passwordError ? (
                      <Text style={styles.fieldError}>{loginState.passwordError}</Text>
                    ) : null}
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: loginState.isPending }}
                    disabled={loginState.isPending}
                    onPress={() => void loginState.submit()}
                    style={getSignInButtonStyle(loginState.isPending)}
                  >
                    {loginState.isPending ? (
                      <AppLoader variant="inline" color={theme.colors.white} />
                    ) : (
                      <>
                        <Text style={styles.signInText}>{t('signIn')}</Text>
                      </>
                    )}
                  </Pressable>
                </View>
            </>
            <Text style={styles.footer}>
              {t('protectedAccess')}
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      {authToastMessage ? <AppToast message={authToastMessage} onDismiss={dismissAuthToast} /> : null}
    </View>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.brandRow}>
      <View style={[styles.brandMark, compact && styles.brandMarkCompact]}>
        <Text style={styles.brandMarkText}>{t('brandInitials')}</Text>
      </View>
      <View>
        {compact ? (
          <>
            <Text style={styles.brandCompactName}>{t('brandShortName')}</Text>
            <Text style={styles.brandSubtitle}>{t('brandSubtitle')}</Text>
          </>
        ) : (
          <Text style={styles.brand}>{t('brandName')}</Text>
        )}
      </View>
    </View>
  );
}
