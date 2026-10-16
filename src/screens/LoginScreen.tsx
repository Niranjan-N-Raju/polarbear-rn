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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLogin } from '../hooks/useLogin';
import { colors, styles } from '../styles/loginStyles';

export function LoginScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 820;
  const loginState = useLogin();

  return (
    <View style={[styles.container, isWide && styles.containerWide]}>
      <StatusBar barStyle={isWide ? 'light-content' : 'dark-content'} />
      <View style={[styles.shell, isWide && styles.shellWide]}>
        {isWide ? (
          <View style={[styles.hero, { paddingTop: Math.max(safeAreaInsets.top, 36) }]}>
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
          style={styles.formPanel}
        >
          {!isWide ? (
            <View
              style={[
                styles.mobileBrand,
                { paddingTop: Math.max(safeAreaInsets.top, 28) },
              ]}
            >
              <Brand compact />
              <View style={styles.brandAccent} />
            </View>
          ) : null}
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(safeAreaInsets.bottom, 28) },
              isWide && styles.scrollContentWide,
            ]}
            keyboardShouldPersistTaps="handled"
          >
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
                  <Text style={styles.eyebrow}>WELCOME BACK</Text>
                  <Text style={styles.heading}>Sign in to your workspace</Text>
                  <Text style={styles.subtitle}>Use your account credentials to continue.</Text>
                </View>

                {loginState.formError ? (
                  <Text accessibilityRole="alert" style={styles.formError}>
                    {loginState.formError}
                  </Text>
                ) : null}

                <View style={styles.form}>
                  <Text style={styles.label}>Email address</Text>
                  <TextInput
                    accessibilityLabel="Email address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    keyboardType="email-address"
                    onChangeText={loginState.updateEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#92999B"
                    returnKeyType="next"
                    style={[styles.input, loginState.emailError ? styles.inputError : null]}
                    value={loginState.email}
                  />
                  {loginState.emailError ? (
                    <Text style={styles.fieldError}>{loginState.emailError}</Text>
                  ) : null}

                  <View style={styles.passwordLabelRow}>
                    <Text style={styles.label}>Password</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={loginState.showPassword ? 'Hide password' : 'Show password'}
                      onPress={() => loginState.setShowPassword(!loginState.showPassword)}
                    >
                      <Text style={styles.showPassword}>
                        {loginState.showPassword ? 'Hide password' : 'Show password'}
                      </Text>
                    </Pressable>
                  </View>
                  <TextInput
                    accessibilityLabel="Password"
                    autoCapitalize="none"
                    autoComplete="current-password"
                    onChangeText={loginState.updatePassword}
                    onSubmitEditing={() => void loginState.submit()}
                    placeholder="Enter your password"
                    placeholderTextColor="#92999B"
                    returnKeyType="done"
                    secureTextEntry={!loginState.showPassword}
                    style={[styles.input, loginState.passwordError ? styles.inputError : null]}
                    value={loginState.password}
                  />
                  {loginState.passwordError ? (
                    <Text style={styles.fieldError}>{loginState.passwordError}</Text>
                  ) : null}

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
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.signInText}>Sign in</Text>
                        <Text style={styles.signInArrow}>{'\u203a'}</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </>
            )}
            <Text style={styles.footer}>Protected access for authorized store teams.</Text>
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
        <Text style={styles.brand}>Polar Bear</Text>
        <Text style={styles.brandSubtitle}>Store Operations</Text>
      </View>
    </View>
  );
}