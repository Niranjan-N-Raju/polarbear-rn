import { Pressable,ScrollView,Text,View } from 'react-native';
import { AdminFormField } from '../../components/AdminFormField';
import { AppLoader } from '../../components/AppLoader';
import { AppToast } from '../../components/AppToast';
import { ResponsiveDrawerModal } from '../../components/ResponsiveDrawerModal';
import { theme } from '../../config/theme';
import { getLanguage,t } from '../../i18n';
import { adminStyles as styles } from '../../styles/adminStyles';
import { ProfileIdentityCard } from './ProfileIdentityCard';
import type { AdminProfileScreenProps } from './types';
import { languageOptions,useAdminProfile } from './useAdminProfile';


export function AdminProfileScreen({ user: initialUser, onUserUpdated, onToast }: AdminProfileScreenProps) {
const { layout, user, isLoading, name, setName, nameError, setNameError, isSavingName, currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, currentPasswordError, setCurrentPasswordError, newPasswordError, setNewPasswordError, confirmPasswordError, setConfirmPasswordError, passwordError, isSavingPassword, showCurrent, setShowCurrent, showNew, setShowNew, showConfirm, setShowConfirm, showCurrentError, isSavingLanguage, languageError, pendingLanguage, setPendingLanguage, isLanguageDialogOpen, setIsLanguageDialogOpen, localToast, dismissLocalToast, requestLanguageChange, confirmLanguageChange, saveName, changePassword } = useAdminProfile({ user: initialUser, onUserUpdated, onToast });
if (isLoading) {
    return <AppLoader variant="screen" />;
  }
const pendingLanguageLabel = languageOptions.find((option) => option.value === pendingLanguage)?.label ?? '';
return (
    <View style={styles.screen}>
    <ScrollView contentContainerStyle={[styles.screenScroll, styles.profileScroll]}>
      <View style={styles.screenHeader}>
        {layout.desktopWeb ? <Text style={[styles.screenEyebrow, styles.screenEyebrowTeal]}>{t('adminProfileEyebrow')}</Text> : null}
        <Text style={styles.screenTitle}>{t('adminProfileTitle')}</Text>
        <Text style={styles.screenDescription}>{t('adminManageAccount')}</Text>
      </View>
      {showCurrentError ? <Text accessibilityRole="alert" style={[styles.formError, styles.stateError]}>{showCurrentError}</Text> : null}

      {layout.isWeb ? (
        <View style={[styles.profileColumns, !layout.profileTwoColumn && styles.profileColumnsStacked]}>
          <View style={styles.profileColumn}>
            <ProfileIdentityCard user={user} showAvatar />

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
          <ProfileIdentityCard user={user} showAvatar={false} />
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
      <View style={styles.profileCard}>
        <Text style={styles.sectionLabel}>{t('adminPreferredLanguage')}</Text>
        <Text style={styles.rowSubtext}>{t('adminPreferredLanguageDescription')}</Text>
        <View style={[styles.typeOptions, styles.languageOptions]}>
          {languageOptions.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ disabled: isSavingLanguage, selected: getLanguage() === option.value }}
              disabled={isSavingLanguage}
              onPress={() => requestLanguageChange(option.value)}
              style={[styles.secondaryButton, styles.typeOption, getLanguage() === option.value && styles.typeOptionSelected]}
            >
              <Text style={styles.secondaryButtonText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        {languageError ? <Text accessibilityRole="alert" style={[styles.formError, styles.stateError]}>{languageError}</Text> : null}
      </View>
    </ScrollView>

      <ResponsiveDrawerModal
        visible={isLanguageDialogOpen && pendingLanguage !== null}
        presentation="dialog"
        closeLabel={t('adminCancel')}
        onClose={() => setIsLanguageDialogOpen(false)}
        onAfterClose={() => setPendingLanguage(null)}
      >
        <View style={styles.confirmDialogContent}>
          <View style={styles.confirmDialogHeader}>
            <Text style={[styles.modalTitle, styles.confirmDialogTitle]}>{t('adminChangeLanguageTitle')}</Text>
          </View>
          <View style={styles.confirmDialogBody}>
            <Text style={styles.screenDescription}>{t('adminChangeLanguageConfirm', { language: pendingLanguageLabel })}</Text>
            {languageError ? <Text accessibilityRole="alert" style={[styles.formError, styles.stateError]}>{languageError}</Text> : null}
          </View>
          <View style={styles.confirmDialogActions}>
            <View style={styles.confirmDialogActionSlot}>
              <Pressable disabled={isSavingLanguage} onPress={() => setIsLanguageDialogOpen(false)} style={[styles.secondaryButton, styles.confirmDialogActionButton]}><Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text></Pressable>
            </View>
            <View style={styles.confirmDialogActionSlot}>
              <Pressable disabled={isSavingLanguage} onPress={() => void confirmLanguageChange()} style={[styles.primaryButton, styles.confirmDialogActionButton]}>
                {isSavingLanguage ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t('adminChangeLanguageAction')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </ResponsiveDrawerModal>
      {localToast ? <AppToast message={localToast.message} tone={localToast.tone} onDismiss={dismissLocalToast} /> : null}
    </View>
  );
}
