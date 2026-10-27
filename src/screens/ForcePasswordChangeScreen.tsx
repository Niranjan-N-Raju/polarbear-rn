import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest, setAccessToken } from '../api/auth';
import { AdminFormField } from '../components/AdminFormField';
import { AppLoader } from '../components/AppLoader';
import { theme } from '../config/theme';
import { t, type TranslationKey } from '../i18n';
import { adminStyles as styles } from '../styles/adminStyles';

type ForcePasswordChangeScreenProps = {
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

export function ForcePasswordChangeScreen({ onCompleted, onSignOut }: ForcePasswordChangeScreenProps) {
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

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.screenScroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>{t('forcePasswordTitle')}</Text>
        <Text style={styles.screenDescription}>{t('forcePasswordDescription')}</Text>
      </View>
      <View style={styles.profileCard}>
        <AdminFormField label={t('adminCurrentPassword')} value={currentPassword} onChangeText={(value) => { setCurrentPassword(value); setError(''); }} secureTextEntry={!showCurrent} onToggleVisibility={() => setShowCurrent((value) => !value)} visible={showCurrent} autoCapitalize="none" autoCorrect={false} />
        <AdminFormField label={t('adminNewPassword')} value={newPassword} onChangeText={(value) => { setNewPassword(value); setError(''); }} secureTextEntry={!showNew} onToggleVisibility={() => setShowNew((value) => !value)} visible={showNew} autoCapitalize="none" autoCorrect={false} />
        <AdminFormField label={t('adminConfirmPassword')} value={confirmPassword} onChangeText={(value) => { setConfirmPassword(value); setError(''); }} secureTextEntry={!showConfirm} onToggleVisibility={() => setShowConfirm((value) => !value)} visible={showConfirm} autoCapitalize="none" autoCorrect={false} />
        {error ? <Text accessibilityRole="alert" style={[styles.formError, styles.stateError]}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={isSaving} onPress={() => void submit()} style={styles.primaryButton}>
          {isSaving ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t('forcePasswordSubmit')}</Text>}
        </Pressable>
        <Pressable accessibilityRole="button" disabled={isSaving} onPress={onSignOut} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{t('signOut')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
