import { useCallback, useState } from 'react';
import { Keyboard } from 'react-native';
import { login, setAccessToken } from '../api/auth';
import { defaultLoginCredentials } from '../config/testLoginCredentials';
import { defaultLanguage, setLanguage, t } from '../i18n';

export function useLogin() {
  const [email, setEmail] = useState(defaultLoginCredentials.email);
  const [password, setPassword] = useState(defaultLoginCredentials.password);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [session, setSession] = useState<Awaited<ReturnType<typeof login>> | null>(null);

  async function submit(): Promise<void> {
    const normalizedEmail = email.trim();
    setEmailError(normalizedEmail ? '' : t('emailRequired'));
    setPasswordError(password ? '' : t('passwordRequired'));
    setFormError('');
    if (!normalizedEmail || !password) return;

    setIsPending(true);
    try {
      const result = await login(normalizedEmail, password);
      // Backend authentication supports more roles than this client exposes workspaces for.
      if (!['admin', 'franchise_admin'].includes(result.user.role)) {
        setAccessToken(null);
        setFormError(t('mobileRoleNotSupported'));
        return;
      }
      setLanguage(result.user.preferredLanguage ?? defaultLanguage);
      Keyboard.dismiss();
      setSession(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('loginFailed');
      if (message === t('invalidCredentials')) {
        setPasswordError(message);
      } else {
        setFormError(message);
      }
    } finally {
      setIsPending(false);
    }
  }

  function updateEmail(value: string): void {
    setEmail(value);
    setEmailError('');
    setFormError('');
  }

  function updatePassword(value: string): void {
    setPassword(value);
    setPasswordError('');
    setFormError('');
  }

  const completePasswordChange = useCallback((): void => {
    setSession((current) => current ? { ...current, user: { ...current.user, mustChangePassword: false } } : current);
  }, []);

  const requirePasswordChange = useCallback((): void => {
    setSession((current) => current ? { ...current, user: { ...current.user, mustChangePassword: true } } : current);
  }, []);

  const signOut = useCallback((): void => {
    // Tokens and session state stay in memory; workspace callers handle remote revocation first.
    setAccessToken(null);
    setSession(null);
    // Never leave the previous user's credentials (or dev defaults) in the form after a real sign-out.
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setEmailError('');
    setPasswordError('');
    setFormError('');
  }, []);

  return {
    email,
    password,
    showPassword,
    isPending,
    emailError,
    passwordError,
    formError,
    session,
    setShowPassword,
    updateEmail,
    updatePassword,
    submit,
    signOut,
    completePasswordChange,
    requirePasswordChange,
  };
}