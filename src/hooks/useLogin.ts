import { useCallback, useState } from 'react';
import { Keyboard } from 'react-native';
import { login, setAccessToken } from '../api/auth';
import { defaultLoginCredentials } from '../config/testLoginCredentials';
import { t } from '../i18n';

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
      if (!['admin', 'franchise_admin'].includes(result.user.role)) {
        setAccessToken(null);
        setFormError(t('mobileRoleNotSupported'));
        return;
      }
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

  const signOut = useCallback((): void => {
    setAccessToken(null);
    setSession(null);
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
  };
}