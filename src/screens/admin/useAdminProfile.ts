import { useCallback, useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { apiRequest, setAccessToken } from '../../api/auth';
import type { AuthenticatedUser } from '../../api/types';
import { getLanguage, setLanguage, t, type AppLanguage } from '../../i18n';
import { getAdminLayout } from '../../utils/adminLayout';
import type { AdminProfileScreenProps } from './types';
export const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'kn', label: 'ಕನ್ನಡ' },
] as const;

export function useAdminProfile({ user: initialUser, onUserUpdated, onToast }: AdminProfileScreenProps) {
  const { width } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const [user, setUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState(initialUser.name);
  const [nameError, setNameError] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCurrentError, setShowCurrentError] = useState('');
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const [languageError, setLanguageError] = useState('');
  const [pendingLanguage, setPendingLanguage] = useState<AppLanguage | null>(null);
  const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false);
  const [localToast, setLocalToast] = useState<{ message: string; tone: 'success' | 'error'; } | null>(null);
  const dismissLocalToast = useCallback(() => setLocalToast(null), []);
  const showToast = useCallback((message: string, tone: 'success' | 'error') => {
    if (onToast) onToast(message, tone);
    else setLocalToast({ message, tone });
  }, [onToast]);
  function requestLanguageChange(language: AppLanguage): void {
    if (language === getLanguage()) return;
    setPendingLanguage(language);
    setIsLanguageDialogOpen(true);
  }
  async function confirmLanguageChange(): Promise<void> {
    if (!pendingLanguage) return;
    const saved = await savePreferredLanguage(pendingLanguage);
    setIsLanguageDialogOpen(false);
    if (saved) showToast(t('adminLanguageUpdated'), 'success');
  }
  useEffect(() => {
    let active = true;
    apiRequest('/me')
      .then(async (response) => {
        const data = await response.json() as AuthenticatedUser & { message?: string; };
        if (!response.ok) throw new Error(data.message ?? t('adminLoadFailed'));
        if (!active) return;
        setUser(data);
        setName(data.name);
        setLanguage(data.preferredLanguage ?? 'en');
        onUserUpdated(data);
      })
      .catch((error) => {
        if (active) setShowCurrentError(error instanceof Error ? error.message : t('adminLoadFailed'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [onUserUpdated]);
  async function saveName(): Promise<void> {
    setNameError('');
    if (!name.trim()) {
      setNameError(t('adminNameRequired'));
      return;
    }
    setIsSavingName(true);
    try {
      const response = await apiRequest('/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await response.json() as { message?: string; token?: string; };
      if (!response.ok) throw new Error(data.message ?? t('adminSaveFailed'));
      if (data.token) setAccessToken(data.token);
      const updated = { ...user, name: name.trim() };
      setUser(updated);
      onUserUpdated(updated);
      showToast(t('adminNameUpdated'), 'success');
    } catch (error) {
      setNameError(error instanceof Error ? error.message : t('adminSaveFailed'));
    } finally {
      setIsSavingName(false);
    }
  }
  async function savePreferredLanguage(language: AppLanguage): Promise<boolean> {
    if (language === getLanguage()) return false;
    setLanguageError('');
    setIsSavingLanguage(true);
    try {
      const response = await apiRequest('/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredLanguage: language }),
      });
      const data = await response.json() as { message?: string; token?: string; };
      if (!response.ok) throw new Error(data.message ?? t('adminLanguageSaveFailed'));
      if (data.token) setAccessToken(data.token);
      const updated = { ...user, preferredLanguage: language };
      setUser(updated);
      onUserUpdated(updated);
      // Switch the whole application's locale only after the preference is persisted successfully.
      setLanguage(language);
      return true;
    } catch (error) {
      setLanguageError(error instanceof Error ? error.message : t('adminLanguageSaveFailed'));
      return false;
    } finally {
      setIsSavingLanguage(false);
    }
  }
  function validatePassword(): string | null {
    if (!currentPassword.trim()) return t('adminPasswordRequired');
    if (!newPassword.trim()) return t('adminNewPasswordRequired');
    if (!confirmPassword.trim()) return t('adminConfirmPasswordRequired');
    if (newPassword !== confirmPassword) return t('adminPasswordMismatch');
    if (newPassword.length < 12) return t('adminPasswordLength');
    if (!/[A-Z]/.test(newPassword)) return t('adminPasswordUppercase');
    if (!/[a-z]/.test(newPassword)) return t('adminPasswordLowercase');
    if (!/[^A-Za-z0-9]/.test(newPassword)) return t('adminPasswordSpecial');
    if (!/\d/.test(newPassword)) return t('adminPasswordNumber');
    if (currentPassword === newPassword) return t('adminPasswordSame');
    return null;
  }
  async function changePassword(): Promise<void> {
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    setPasswordError('');
    const validationError = validatePassword();
    if (validationError) {
      if (!currentPassword.trim()) setCurrentPasswordError(validationError);
      else if (!newPassword.trim() || newPassword.length < 12 || /uppercase|lowercase|special|number|same/i.test(validationError)) setNewPasswordError(validationError);
      else setConfirmPasswordError(validationError);
      return;
    }

    setIsSavingPassword(true);
    try {
      const response = await apiRequest('/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json() as { message?: string; token?: string; };
      if (!response.ok) {
        const message = data.message ?? t('adminSaveFailed');
        if (/current password|incorrect/i.test(message)) setCurrentPasswordError(message);
        else setPasswordError(message);
        return;
      }
      // Password changes revoke the previous session version; continue with the replacement token.
      if (data.token) setAccessToken(data.token);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      showToast(t('adminPasswordUpdated'), 'success');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : t('adminNetworkError'));
    } finally {
      setIsSavingPassword(false);
    }
  }
  return {
    layout,
    user,
    isLoading,
    name,
    setName,
    nameError,
    setNameError,
    isSavingName,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    currentPasswordError,
    setCurrentPasswordError,
    newPasswordError,
    setNewPasswordError,
    confirmPasswordError,
    setConfirmPasswordError,
    passwordError,
    isSavingPassword,
    showCurrent,
    setShowCurrent,
    showNew,
    setShowNew,
    showConfirm,
    setShowConfirm,
    showCurrentError,
    isSavingLanguage,
    languageError,
    pendingLanguage,
    setPendingLanguage,
    isLanguageDialogOpen,
    setIsLanguageDialogOpen,
    localToast,
    dismissLocalToast,
    requestLanguageChange,
    confirmLanguageChange,
    saveName,
    changePassword,
  };
}
