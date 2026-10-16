import {
  ActivityIndicator,
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
import { useRef } from 'react';
import { ChevronRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { useLogin } from '../hooks/useLogin';
import { t, translateRole } from '../i18n';
import {
  getLoginSafeAreaStyles,
  getSignInButtonStyle,
  styles,
} from '../styles/loginScreenStyles';

export function LoginScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= theme.layout.desktopBreakpoint;
  const loginState = useLogin();
  const passwordInputRef = useRef<TextInput>(null);
  const safeAreaStyles = getLoginSafeAreaStyles(
    safeAreaInsets.top,
    safeAreaInsets.bottom,
  );

  return (
    <View style={[styles.container, isWide && styles.containerWide]}>
      <StatusBar barStyle={isWide ? 'light-content' : 'dark-content'} />
      <View
        style={[
          styles.shell,
          isWide ? styles.shellWide : styles.shellCompact,
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
          style={[styles.formPanel, !isWide && styles.formPanelCompact]}
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
            style={[styles.scrollView, !isWide && styles.scrollViewCompact]}
            contentContainerStyle={[
              styles.scrollContent,
              !isWide && styles.scrollContentCompact,
              safeAreaStyles.scrollBottom,
              isWide && styles.scrollContentWide,
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {!isWide && !loginState.session ? (
              <View style={styles.mobileProgress}>
                <View style={styles.mobileProgressOrange} />
                <View style={styles.mobileProgressYellow} />
              </View>
            ) : null}
            {loginState.session ? (
              <View style={styles.successView}>
                <Text style={styles.eyebrow}>{t('loginSuccessEyebrow')}</Text>
                <Text style={styles.heading}>{t('signedIn')}</Text>
                <Text style={styles.subtitle}>
                  {t('welcomeUser', { name: loginState.session.user.name })}
                </Text>
                <View style={styles.userSummary}>
                  <Text style={styles.userEmail}>{loginState.session.user.email}</Text>
                  <Text style={styles.userRole}>
                    {translateRole(loginState.session.user.role)}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={loginState.signOut}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>{t('signOut')}</Text>
                </Pressable>
              </View>
            ) : (
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
                      <ActivityIndicator color={theme.colors.white} />
                    ) : (
                      <>
                        <Text style={styles.signInText}>{t('signIn')}</Text>
                        <ChevronRight
                          color={theme.colors.white}
                          size={theme.layout.iconSize}
                          strokeWidth={theme.layout.iconStrokeWidth}
                          style={styles.signInArrow}
                        />
                      </>
                    )}
                  </Pressable>
                </View>
              </>
            )}
            <Text style={styles.footer}>
              {t('protectedAccess')}
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
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
