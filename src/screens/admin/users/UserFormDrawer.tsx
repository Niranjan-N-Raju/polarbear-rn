import { Pressable, ScrollView, Text, View } from 'react-native';
import { Check } from '../../../icons';
import { AdminFormField } from '../../../components/AdminFormField';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import type { UserFormDrawerProps } from './types';

export function UserFormDrawer({
  visible,
  editing,
  form,
  stores,
  fieldErrors,
  isSaving,
  toastMessage,
  onClose,
  onAfterClose,
  onDismissToast,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onRoleChange,
  onToggleStore,
  onSave,
}: UserFormDrawerProps) {
  return (
    <ResponsiveDrawerModal
      visible={visible}
      closeLabel={t('adminCloseMenu')}
      onClose={onClose}
      onAfterClose={onAfterClose}
      overlay={toastMessage ? <AppToast message={toastMessage} onDismiss={onDismissToast} /> : null}
    >
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeading}>
          <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>
            {t(editing ? 'adminEditUser' : 'adminAddUser')}
          </Text>
        </View>
        <ScrollView style={styles.drawerFormScroll} keyboardShouldPersistTaps="handled">
          <AdminFormField
            label={t('adminFullName')}
            placeholder={t('adminFullNamePlaceholder')}
            value={form.name}
            onChangeText={onNameChange}
            error={fieldErrors.name}
            autoCorrect={false}
          />
          <AdminFormField
            label={t('adminEmail')}
            placeholder={t('adminUserEmailPlaceholder')}
            value={form.email}
            editable={!editing}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={onEmailChange}
            error={fieldErrors.email}
            autoCorrect={false}
          />
          {!editing ? (
            <AdminFormField
              label={t('adminPassword')}
              placeholder={t('adminUserPasswordPlaceholder')}
              value={form.password}
              secureTextEntry
              onChangeText={onPasswordChange}
              error={fieldErrors.password}
              autoCorrect={false}
            />
          ) : null}
          <Text style={styles.fieldLabel}>{t('adminRole')}</Text>
          <View style={styles.typeOptions}>
            {(['sub_admin', 'franchise_admin'] as const).map((role) => (
              <Pressable
                key={role}
                accessibilityRole="button"
                accessibilityState={{ selected: form.role === role }}
                onPress={() => onRoleChange(role)}
                style={[styles.secondaryButton, styles.typeOption, form.role === role && styles.typeOptionSelected]}
              >
                <Text style={styles.secondaryButtonText}>
                  {t(role === 'sub_admin' ? 'adminSubAdmin' : 'adminFranchiseAdmin')}
                </Text>
              </Pressable>
            ))}
          </View>
          {form.role === 'franchise_admin' ? (
            <View style={[styles.field, fieldErrors.franchiseIds && styles.userAssignmentError]}>
              <Text style={styles.fieldLabel}>{t('adminAssignStores')}</Text>
              {stores.map((store) => {
                const selected = form.franchiseIds.includes(store._id);
                return (
                  <Pressable
                    key={store._id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    onPress={() => onToggleStore(store._id)}
                    style={[styles.checkboxRow, selected && styles.checkboxRowSelected]}
                  >
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected ? <Check color={theme.colors.white} size={14} strokeWidth={3} style={{ transform: [{ translateY: 2 }] }} /> : null}
                    </View>
                    <Text style={styles.checkboxText}>{store.name}</Text>
                  </Pressable>
                );
              })}
              {fieldErrors.franchiseIds ? (
                <Text accessibilityRole="alert" style={styles.fieldError}>{fieldErrors.franchiseIds}</Text>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.modalActions}>
          <View style={styles.drawerActionSlot}>
            <Pressable onPress={onClose} style={[styles.secondaryButton, styles.drawerActionButton]}>
              <Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text>
            </Pressable>
          </View>
          <View style={styles.drawerActionSlot}>
            <Pressable
              disabled={isSaving}
              onPress={onSave}
              style={[styles.primaryButton, styles.drawerActionButton]}
            >
              {isSaving
                ? <AppLoader variant="inline" color={theme.colors.white} />
                : <Text style={styles.primaryButtonText}>{t('adminSave')}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </ResponsiveDrawerModal>
  );
}
