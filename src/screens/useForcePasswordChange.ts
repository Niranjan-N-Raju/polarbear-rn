import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest,setAccessToken } from '../api/auth';
import { t,type TranslationKey } from '../i18n';
export type ForcePasswordChangeScreenProps = {
  onCompleted: () => void;
  onSignOut: () => void;
};
export function validateNewPassword(currentPassword: string, newPassword: string, confirmPassword: string): TranslationKey | null {
  if (!currentPassword.trim()) return 'adminPasswordRequired';
  if (!newPassword.trim()) return 'adminNewPasswordRequired';
  if (!confirmPassword.trim()) return 'adminConfirmPasswordRequired';
  if (newPassword !== confirmPassword) return 'adminPasswordMismatch';
  if (newPassword.length < 12) return 'adminPasswordLength';
  if (!/[A-Z]/.test(newPassword)) return 'adminPasswordUppercase';
  if (!/[a-z]/.test(newPassword)) return 'adminPasswordLowercase';
  if (!/[^A-Za-z0-9]/.test(newPassword)) return 'adminPasswordSpecial';
  if (!/\d/.test(newPassword)) return 'adminPasswordNumber';
  if (currentPassword === newPassword) return 'adminPasswordSame';
  return null;
}

export function useForcePasswordChange({ onCompleted, onSignOut }: ForcePasswordChangeScreenProps) {
const insets = useSafeAreaInsets();
const [currentPassword, setCurrentPassword] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [showCurrent, setShowCurrent] = useState(false);
const [showNew, setShowNew] = useState(false);
const [showConfirm, setShowConfirm] = useState(false);
const [error, setError] = useState('');
const [isSaving, setIsSaving] = useState(false);
async function submit(): Promise<void> {
    setError('');
    const validationError = validateNewPassword(currentPassword, newPassword, confirmPassword);
    if (validationError) {
      setError(t(validationError));
      return;
    }
    setIsSaving(true);
    try {
      const response = await apiRequest('/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json() as { message?: string; token?: string; mustChangePassword?: boolean };
      if (!response.ok || !data.token) {
        setError(data.message ?? t('adminSaveFailed'));
        return;
      }
      setAccessToken(data.token);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onCompleted();
    } catch {
      setError(t('adminNetworkError'));
    } finally {
      setIsSaving(false);
    }
  }
return { insets, currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, showCurrent, setShowCurrent, showNew, setShowNew, showConfirm, setShowConfirm, error, setError, isSaving, submit };
}
