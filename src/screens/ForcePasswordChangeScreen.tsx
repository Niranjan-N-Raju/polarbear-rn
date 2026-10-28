import { Pressable,ScrollView,Text,View } from 'react-native';
import { AdminFormField } from '../components/AdminFormField';
import { AppLoader } from '../components/AppLoader';
import { theme } from '../config/theme';
import { t } from '../i18n';
import { adminStyles as styles } from '../styles/adminStyles';
import { useForcePasswordChange,type ForcePasswordChangeScreenProps } from './useForcePasswordChange';
export { validateNewPassword } from './useForcePasswordChange';

export function ForcePasswordChangeScreen({ onCompleted, onSignOut }: ForcePasswordChangeScreenProps) {
const { insets, currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, showCurrent, setShowCurrent, showNew, setShowNew, showConfirm, setShowConfirm, error, setError, isSaving, submit } = useForcePasswordChange({ onCompleted, onSignOut });
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
