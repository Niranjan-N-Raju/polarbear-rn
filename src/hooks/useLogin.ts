import { useState } from 'react';
import { Keyboard } from 'react-native';
import { login } from '../api/auth';

export function useLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [session, setSession] = useState<Awaited<ReturnType<typeof login>> | null>(null);

  async function submit(): Promise<void> {
    const normalizedEmail = email.trim();
    setEmailError(normalizedEmail ? '' : 'Email address is required.');
    setPasswordError(password ? '' : 'Password is required.');
    setFormError('');
    if (!normalizedEmail || !password) return;

    setIsPending(true);
    try {
      const result = await login(normalizedEmail, password);
      Keyboard.dismiss();
      setSession(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
      if (/email or password|password/i.test(message)) {
        setPasswordError(message);
      } else if (/email/i.test(message)) {
        setEmailError(message);
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
    signOut: () => setSession(null),
  };
}