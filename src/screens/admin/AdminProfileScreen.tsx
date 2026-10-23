import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { apiRequest, setAccessToken } from '../../api/auth';
import type { AuthenticatedUser } from '../../api/auth';
import { AdminFormField } from '../../components/AdminFormField';
import { AppLoader } from '../../components/AppLoader';
import { theme } from '../../config/theme';
import { t, translateRole } from '../../i18n';
import { adminStyles as styles } from '../../styles/adminStyles';
import { getAdminLayout } from '../../utils/adminLayout';

interface AdminProfileScreenProps {
  user: AuthenticatedUser;
  onUserUpdated: (user: AuthenticatedUser) => void;
}

export function AdminProfileScreen({ user: initialUser, onUserUpdated }: AdminProfileScreenProps) {
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

  useEffect(() => {
    let active = true;
    apiRequest('/me')
      .then(async (response) => {
        const data = await response.json() as AuthenticatedUser & { message?: string };
        if (!response.ok) throw new Error(data.message ?? t('adminLoadFailed'));
        if (!active) return;
        setUser(data);
        setName(data.name);
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
      const data = await response.json() as { message?: string; token?: string };
      if (!response.ok) throw new Error(data.message ?? t('adminSaveFailed'));
      if (data.token) setAccessToken(data.token);
      const updated = { ...user, name: name.trim() };
      setUser(updated);
      onUserUpdated(updated);
    } catch (error) {
      setNameError(error instanceof Error ? error.message : t('adminSaveFailed'));
    } finally {
      setIsSavingName(false);
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
      const data = await response.json() as { message?: string; token?: string };
      if (!response.ok) {
        const message = data.message ?? t('adminSaveFailed');
        if (/current password|incorrect/i.test(message)) setCurrentPasswordError(message);
        else setPasswordError(message);
        return;
      }
      if (data.token) setAccessToken(data.token);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : t('adminNetworkError'));
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (isLoading) {
    return <AppLoader variant="screen" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.screenScroll}>
      <View style={styles.screenHeader}>
        {layout.desktopWeb ? <Text style={[styles.screenEyebrow, styles.screenEyebrowTeal]}>Account settings</Text> : null}
        <Text style={styles.screenTitle}>{t('adminProfileTitle')}</Text>
        <Text style={styles.screenDescription}>{t('adminManageAccount')}</Text>
      </View>
      {showCurrentError ? <Text accessibilityRole="alert" style={[styles.formError, styles.stateError]}>{showCurrentError}</Text> : null}

      {layout.isWeb ? (
        <View style={[styles.profileColumns, !layout.profileTwoColumn && styles.profileColumnsStacked]}>
          <View style={styles.profileColumn}>
            <View style={[styles.profileCard, styles.profileIdentity]}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{user.name}</Text>
                <Text style={styles.rowSubtext}>{user.email}</Text>
                <View style={styles.profileRoleBadge}><Text style={styles.profileRoleText}>{translateRole(user.role)}</Text></View>
              </View>
            </View>

            <View style={styles.profileCard}>
              <Text style={styles.sectionLabel}>{t('adminUpdateName')}</Text>
              <AdminFormField label={t('adminFullName')} value={name} onChangeText={(value) => { setName(value); setNameError(''); }} error={nameError} errorTextStyle={[styles.formError, styles.stateError]} />
              <Pressable disabled={isSavingName} onPress={() => void saveName()} style={styles.primaryButton}>
                {isSavingName ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t('adminSaveName')}</Text>}
              </Pressable>
            </View>
          </View>

          <View style={styles.profileColumn}>
            <View style={styles.profileCard}>
              <Text style={styles.sectionLabel}>{t('adminChangePassword')}</Text>
              <AdminFormField label={t('adminCurrentPassword')} value={currentPassword} onChangeText={(value) => { setCurrentPassword(value); setCurrentPasswordError(''); }} error={currentPasswordError} errorTextStyle={[styles.formError, styles.stateError]} secureTextEntry={!showCurrent} onToggleVisibility={() => setShowCurrent((value) => !value)} visible={showCurrent} autoCapitalize="none" />
              <AdminFormField label={t('adminNewPassword')} value={newPassword} onChangeText={(value) => { setNewPassword(value); setNewPasswordError(''); }} error={newPasswordError} errorTextStyle={[styles.formError, styles.stateError]} secureTextEntry={!showNew} onToggleVisibility={() => setShowNew((value) => !value)} visible={showNew} autoCapitalize="none" />
              <AdminFormField label={t('adminConfirmPassword')} value={confirmPassword} onChangeText={(value) => { setConfirmPassword(value); setConfirmPasswordError(''); }} error={confirmPasswordError} errorTextStyle={[styles.formError, styles.stateError]} secureTextEntry={!showConfirm} onToggleVisibility={() => setShowConfirm((value) => !value)} visible={showConfirm} autoCapitalize="none" />
              {passwordError ? <Text accessibilityRole="alert" style={[styles.formError, styles.stateError]}>{passwordError}</Text> : null}
              <Pressable disabled={isSavingPassword} onPress={() => void changePassword()} style={styles.primaryButton}>
                {isSavingPassword ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t('adminUpdatePassword')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.profileCard}>
            <Text style={styles.rowTitle}>{user.name}</Text>
            <Text style={styles.rowSubtext}>{user.email}</Text>
            <Text style={styles.rowRole}>{translateRole(user.role)}</Text>
          </View>
          <View style={styles.profileCard}>
            <Text style={styles.sectionLabel}>{t('adminUpdateName')}</Text>
            <AdminFormField label={t('adminFullName')} value={name} onChangeText={(value) => { setName(value); setNameError(''); }} error={nameError} errorTextStyle={[styles.formError, styles.stateError]} />
            <Pressable disabled={isSavingName} onPress={() => void saveName()} style={styles.primaryButton}>
              {isSavingName ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t('adminSaveName')}</Text>}
            </Pressable>
          </View>
          <View style={styles.profileCard}>
            <Text style={styles.sectionLabel}>{t('adminChangePassword')}</Text>
            <AdminFormField label={t('adminCurrentPassword')} value={currentPassword} onChangeText={(value) => { setCurrentPassword(value); setCurrentPasswordError(''); }} error={currentPasswordError} errorTextStyle={[styles.formError, styles.stateError]} secureTextEntry={!showCurrent} onToggleVisibility={() => setShowCurrent((value) => !value)} visible={showCurrent} autoCapitalize="none" />
            <AdminFormField label={t('adminNewPassword')} value={newPassword} onChangeText={(value) => { setNewPassword(value); setNewPasswordError(''); }} error={newPasswordError} errorTextStyle={[styles.formError, styles.stateError]} secureTextEntry={!showNew} onToggleVisibility={() => setShowNew((value) => !value)} visible={showNew} autoCapitalize="none" />
            <AdminFormField label={t('adminConfirmPassword')} value={confirmPassword} onChangeText={(value) => { setConfirmPassword(value); setConfirmPasswordError(''); }} error={confirmPasswordError} errorTextStyle={[styles.formError, styles.stateError]} secureTextEntry={!showConfirm} onToggleVisibility={() => setShowConfirm((value) => !value)} visible={showConfirm} autoCapitalize="none" />
            {passwordError ? <Text accessibilityRole="alert" style={[styles.formError, styles.stateError]}>{passwordError}</Text> : null}
            <Pressable disabled={isSavingPassword} onPress={() => void changePassword()} style={styles.primaryButton}>
              {isSavingPassword ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t('adminUpdatePassword')}</Text>}
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}
