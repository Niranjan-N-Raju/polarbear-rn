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
import { styles } from '../styles/loginScreenStyles';

export function LoginScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= theme.layout.desktopBreakpoint;
  const loginState = useLogin();
  const passwordInputRef = useRef<TextInput>(null);

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
          <View style={[styles.hero, { paddingTop: Math.max(safeAreaInsets.top, theme.spacing['9xl']) }]}>
            <View pointerEvents="none" style={styles.heroRingTop} />
            <View pointerEvents="none" style={styles.heroRingBottom} />
            <View>
              <Brand />
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>STORE OPERATIONS</Text>
                <Text style={styles.heroHeading}>Keep every shift moving.</Text>
                <Text style={styles.heroText}>
                  One focused workspace for people, attendance, inventory, and the details that keep your stores ready.
                </Text>
              </View>
            </View>
            <Text style={styles.heroFooter}>Polar Bear Management Platform · Secure workspace</Text>
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
                {
                  paddingTop:
                    Math.max(safeAreaInsets.top, theme.spacing['7xl']) + theme.spacing.lg,
                },
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
              {
                paddingBottom: Math.max(
                  safeAreaInsets.bottom + theme.spacing['2xl'],
                  theme.spacing['7xl'],
                ),
              },
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
                <Text style={styles.eyebrow}>LOGIN SUCCESSFUL</Text>
                <Text style={styles.heading}>You’re signed in.</Text>
                <Text style={styles.subtitle}>Welcome, {loginState.session.user.name}.</Text>
                <View style={styles.userSummary}>
                  <Text style={styles.userEmail}>{loginState.session.user.email}</Text>
                  <Text style={styles.userRole}>
                    {loginState.session.user.role.replaceAll('_', ' ')}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={loginState.signOut}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Sign out</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.headingBlock}>
                  <Text style={[styles.eyebrow, !isWide && styles.eyebrowMobile]}>
                    WELCOME BACK
                  </Text>
                  <Text style={styles.heading}>Sign in to your workspace</Text>
                  <Text style={styles.subtitle}>Use your account credentials to continue.</Text>
                </View>

                {loginState.formError ? (
                  <Text accessibilityRole="alert" style={styles.formError}>
                    {loginState.formError}
                  </Text>
                ) : null}

                <View style={styles.form}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Email address</Text>
                    <View style={styles.inputWrap}>
                      <Mail
                        color={theme.colors.placeholder}
                        size={theme.layout.iconSize}
                        strokeWidth={theme.layout.iconStrokeWidth}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        accessibilityLabel="Email address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                        keyboardType="email-address"
                        onChangeText={loginState.updateEmail}
                        placeholder="you@example.com"
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
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrap}>
                      <LockKeyhole
                        color={theme.colors.placeholder}
                        size={theme.layout.iconSize}
                        strokeWidth={theme.layout.iconStrokeWidth}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        ref={passwordInputRef}
                        accessibilityLabel="Password"
                        autoCapitalize="none"
                        autoComplete="current-password"
                        onChangeText={loginState.updatePassword}
                        onSubmitEditing={() => void loginState.submit()}
                        placeholder="Enter your password"
                        placeholderTextColor={theme.colors.placeholder}
                        returnKeyType="done"
                        secureTextEntry={!loginState.showPassword}
                        style={[styles.input, loginState.passwordError ? styles.inputError : null]}
                        value={loginState.password}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={loginState.showPassword ? 'Hide password' : 'Show password'}
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
                    style={({ pressed }) => [
                      styles.signInButton,
                      (pressed || loginState.isPending) && styles.signInButtonPressed,
                    ]}
                  >
                    {loginState.isPending ? (
                      <ActivityIndicator color={theme.colors.white} />
                    ) : (
                      <>
                        <Text style={styles.signInText}>Sign in</Text>
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
              Protected access for authorized store teams.
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
        <Text style={styles.brandMarkText}>PB</Text>
      </View>
      <View>
        {compact ? (
          <>
            <Text style={styles.brandCompactName}>POLAR BEAR</Text>
            <Text style={styles.brandSubtitle}>Store Operations</Text>
          </>
        ) : (
          <Text style={styles.brand}>Polar Bear</Text>
        )}
      </View>
    </View>
  );
}
