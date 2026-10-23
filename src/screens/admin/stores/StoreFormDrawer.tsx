import { Pressable, ScrollView, Text, View } from 'react-native';
import { AdminFormField } from '../../../components/AdminFormField';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import type { StoreFormDrawerProps } from './types';

export function StoreFormDrawer({
  visible,
  editingStore,
  form,
  formIsArchived,
  fieldErrors,
  isSaving,
  toastMessage,
  toastTone,
  onClose,
  onAfterClose,
  onDismissToast,
  onFieldChange,
  onArchivedChange,
  onSave,
}: StoreFormDrawerProps) {
  return (
    <ResponsiveDrawerModal
      visible={visible}
      closeLabel={t('adminCloseMenu')}
      onClose={onClose}
      onAfterClose={onAfterClose}
      overlay={visible && toastMessage ? <AppToast message={toastMessage} tone={toastTone} onDismiss={onDismissToast} /> : null}
    >
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeading}>
          <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>
            {t(editingStore ? 'adminEditStore' : 'adminAddStore')}
          </Text>
        </View>
        <ScrollView style={styles.drawerFormScroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>{t('adminStoreType')}</Text>
          <View style={styles.typeOptions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: form.storeType === 'company' }}
              onPress={() => onFieldChange('storeType', 'company')}
              style={[styles.secondaryButton, styles.typeOption, styles.storeChoiceOption, form.storeType === 'company' && styles.storeOptionSelected]}
            >
              <Text style={styles.secondaryButtonText}>{t('adminCompanyStore')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: form.storeType === 'franchise' }}
              onPress={() => onFieldChange('storeType', 'franchise')}
              style={[styles.secondaryButton, styles.typeOption, styles.storeChoiceOption, form.storeType === 'franchise' && styles.storeOptionSelected]}
            >
              <Text style={styles.secondaryButtonText}>{t('adminFranchiseStore')}</Text>
            </Pressable>
          </View>
          <AdminFormField label={t('adminStoreName')} placeholder={t('adminStoreNamePlaceholder')} value={form.name} onChangeText={(value) => onFieldChange('name', value)} error={fieldErrors.name} />
          <AdminFormField label={t('adminStoreCode')} placeholder={t('adminStoreCodePlaceholder')} value={form.storeCode} onChangeText={(value) => onFieldChange('storeCode', value.toUpperCase())} autoCapitalize="characters" error={fieldErrors.storeCode} />
          <AdminFormField label={t('adminPhone')} placeholder={t('adminPhonePlaceholder')} value={form.phone} onChangeText={(value) => onFieldChange('phone', value.replace(/\D/g, '').slice(0, 10))} keyboardType="phone-pad" phonePrefix="+91" error={fieldErrors.phone} />
          <AdminFormField label={t('adminAddress')} placeholder={t('adminAddressPlaceholder')} value={form.address} onChangeText={(value) => onFieldChange('address', value)} />
          <AdminFormField label={t('adminDescription')} placeholder={t('adminDescriptionPlaceholder')} value={form.description} onChangeText={(value) => onFieldChange('description', value)} multiline />
          {form.storeType === 'franchise' ? (
            <>
              <Text style={styles.sectionLabel}>{t('adminOwnerDetails')}</Text>
              <AdminFormField label={t('adminOwnerName')} placeholder={t('adminOwnerNamePlaceholder')} value={form.ownerName} onChangeText={(value) => onFieldChange('ownerName', value)} />
              <AdminFormField label={t('adminOwnerPhone')} placeholder={t('adminOwnerPhonePlaceholder')} value={form.ownerPhone} onChangeText={(value) => onFieldChange('ownerPhone', value.replace(/\D/g, '').slice(0, 10))} keyboardType="phone-pad" phonePrefix="+91" error={fieldErrors.ownerPhone} />
              <AdminFormField label={t('adminOwnerEmail')} placeholder={t('adminOwnerEmailPlaceholder')} value={form.ownerEmail} onChangeText={(value) => onFieldChange('ownerEmail', value)} keyboardType="email-address" autoCapitalize="none" error={fieldErrors.ownerEmail} />
            </>
          ) : null}
          {editingStore ? (
            <>
              <Text style={styles.fieldLabel}>{t('adminStatus')}</Text>
              <View style={styles.typeOptions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: !formIsArchived }}
                  onPress={() => onArchivedChange(false)}
                  style={[styles.secondaryButton, styles.typeOption, styles.storeChoiceOption, !formIsArchived && styles.storeOptionSelected]}
                >
                  <Text style={styles.secondaryButtonText}>{t('adminActive')}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: formIsArchived }}
                  onPress={() => onArchivedChange(true)}
                  style={[styles.secondaryButton, styles.typeOption, styles.storeChoiceOption, formIsArchived && styles.storeOptionSelected]}
                >
                  <Text style={styles.secondaryButtonText}>{t('adminArchived')}</Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </ScrollView>
        <View style={styles.modalActions}>
          <View style={styles.drawerActionSlot}>
            <Pressable onPress={onClose} style={[styles.secondaryButton, styles.drawerActionButton]}>
              <Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text>
            </Pressable>
          </View>
          <View style={styles.drawerActionSlot}>
            <Pressable disabled={isSaving} onPress={onSave} style={[styles.primaryButton, styles.drawerActionButton]}>
              {isSaving
                ? <AppLoader variant="inline" color={theme.colors.white} />
                : <Text style={styles.primaryButtonText}>{t(editingStore ? 'adminSaveChanges' : 'adminCreateStore')}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </ResponsiveDrawerModal>
  );
}
