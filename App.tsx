/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useState } from 'react';
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <LoginScreen />
    </SafeAreaProvider>
  );
}

function LoginScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(safeAreaInsets.top, 28),
            paddingBottom: Math.max(safeAreaInsets.bottom, 24),
          },
        ]}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>PB</Text>
          </View>
          <View>
            <Text style={styles.brand}>Polar Bear</Text>
            <Text style={styles.brandSubtitle}>Store Operations</Text>
          </View>
        </View>

        <View style={styles.headingBlock}>
          <Text style={styles.eyebrow}>WELCOME BACK</Text>
          <Text style={styles.heading}>Sign in to your workspace</Text>
          <Text style={styles.subtitle}>Use your account credentials to continue.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            accessibilityLabel="Email address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#8A8D85"
            returnKeyType="next"
            style={styles.input}
            value={email}
          />

          <View style={styles.passwordLabelRow}>
            <Text style={styles.label}>Password</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.showPassword}>
                {showPassword ? 'Hide password' : 'Show password'}
              </Text>
            </Pressable>
          </View>
          <TextInput
            accessibilityLabel="Password"
            autoCapitalize="none"
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#8A8D85"
            returnKeyType="done"
            secureTextEntry={!showPassword}
            style={styles.input}
            value={password}
          />

          <Pressable accessibilityRole="button" style={styles.signInButton}>
            <Text style={styles.signInText}>Sign in</Text>
            <Text style={styles.signInArrow}>{'\u203a'}</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>Protected access for authorized store teams.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEEDE1',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    marginVertical: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandMark: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#172238',
  },
  brandMarkText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  brand: {
    color: '#172238',
    fontSize: 16,
    fontWeight: '700',
  },
  brandSubtitle: {
    marginTop: 3,
    color: '#737986',
    fontSize: 12,
  },
  headingBlock: {
    marginTop: 52,
    marginBottom: 36,
  },
  eyebrow: {
    color: '#6F7785',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heading: {
    marginTop: 10,
    color: '#172238',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 39,
  },
  subtitle: {
    marginTop: 8,
    color: '#737986',
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  label: {
    color: '#343C4B',
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    height: 58,
    marginTop: 10,
    marginBottom: 25,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DEDED4',
    borderRadius: 2,
    backgroundColor: '#F8F7EF',
    color: '#172238',
    fontSize: 16,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  showPassword: {
    color: '#707887',
    fontSize: 12,
    fontWeight: '600',
  },
  signInButton: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    backgroundColor: '#F47716',
    shadowColor: '#F47716',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signInArrow: {
    position: 'absolute',
    right: 18,
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 30,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 36,
    paddingBottom: 38,
    color: '#9AA0A9',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default App;
