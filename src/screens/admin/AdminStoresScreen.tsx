import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { apiRequest } from '../../api/auth';
import { theme } from '../../config/theme';
import { t } from '../../i18n';
import { adminStyles as styles } from '../../styles/adminStyles';

interface StoreRecord {
  _id: string;
  name: string;
  storeCode: string;
  storeType: 'company' | 'franchise';
  address?: string;
  phone?: string;
  description?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  createdBy?: string;
  isActive?: boolean;
}

interface StoreForm {
  name: string;
  storeCode: string;
  address: string;
  phone: string;
  description: string;
  storeType: 'company' | 'franchise';
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
}

const emptyForm: StoreForm = {
  name: '', storeCode: '', address: '', phone: '', description: '',
  storeType: 'franchise', ownerName: '', ownerPhone: '', ownerEmail: '',
};

interface AdminStoresScreenProps {
  userId: string;
}

export function AdminStoresScreen({ userId }: AdminStoresScreenProps) {
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StoreRecord | null>(null);
  const [form, setForm] = useState<StoreForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadStores = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiRequest('/stores?limit=100');
      if (!response.ok) throw new Error(t('adminLoadFailed'));
      const data = await response.json() as { franchises?: StoreRecord[] };
      setStores(data.franchises ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('adminLoadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  function openCreate(): void {
    setEditingStore(null);
    setForm(emptyForm);
    setFormError('');
    setIsFormOpen(true);
  }

  function openEdit(store: StoreRecord): void {
    setEditingStore(store);
    setForm({
      name: store.name,
      storeCode: store.storeCode,
      address: store.address ?? '',
      phone: store.phone ?? '',
      description: store.description ?? '',
      storeType: store.storeType,
      ownerName: store.ownerName ?? '',
      ownerPhone: store.ownerPhone ?? '',
      ownerEmail: store.ownerEmail ?? '',
    });
    setFormError('');
    setIsFormOpen(true);
  }

  function updateField<Key extends keyof StoreForm>(key: Key, value: StoreForm[Key]): void {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError('');
  }

  function validate(): string | null {
    if (!form.name.trim()) return t('adminStoreNameRequired');
    if (!form.storeCode.trim()) return t('adminStoreCodeRequired');
    if (form.phone && !/^\d{10}$/.test(form.phone)) return t('adminPhoneInvalid');
    if (form.storeType === 'franchise' && form.ownerPhone && !/^\d{10}$/.test(form.ownerPhone)) {
      return t('adminOwnerPhoneInvalid');
    }
    if (form.ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail)) {
      return t('adminOwnerEmailInvalid');
    }
    return null;
  }

  async function saveStore(): Promise<void> {
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setIsSaving(true);
    setFormError('');
    try {
      const response = await apiRequest(
        editingStore ? `/stores?id=${encodeURIComponent(editingStore._id)}` : '/stores',
        {
          method: editingStore ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            storeCode: form.storeCode.trim().toUpperCase(),
            ownerName: form.storeType === 'franchise' ? form.ownerName : '',
            ownerPhone: form.storeType === 'franchise' ? form.ownerPhone : '',
            ownerEmail: form.storeType === 'franchise' ? form.ownerEmail : '',
          }),
        },
      );
      const data = await response.json() as { message?: string };
      if (!response.ok) {
        setFormError(data.message ?? t('adminSaveFailed'));
        return;
      }
      setIsFormOpen(false);
      setEditingStore(null);
      setForm(emptyForm);
      await loadStores();
    } catch {
      setFormError(t('adminNetworkError'));
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteStore(): Promise<void> {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const response = await apiRequest(`/stores?id=${encodeURIComponent(pendingDelete._id)}`, { method: 'DELETE' });
      const data = await response.json() as { message?: string };
      if (!response.ok) {
        setError(data.message ?? t('adminSaveFailed'));
        return;
      }
      setPendingDelete(null);
      await loadStores();
    } catch {
      setError(t('adminNetworkError'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>{t('adminStores')}</Text>
        <Text style={styles.screenDescription}>{t('adminStoreCount', { count: stores.length })}</Text>
        <Pressable accessibilityRole="button" onPress={openCreate} style={[styles.primaryButton, { marginTop: theme.spacing.lg }]}>
          <Text style={styles.primaryButtonText}>{t('adminAddStore')}</Text>
        </Pressable>
      </View>

      {isLoading ? <ActivityIndicator color={theme.colors.orange} size="large" /> : null}
      {error ? <Text accessibilityRole="alert" style={[styles.stateMessage, styles.stateError]}>{error}</Text> : null}
      {!isLoading && !error && stores.length === 0 ? <Text style={styles.stateMessage}>{t('adminNoStores')}</Text> : null}

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {stores.map((store) => {
          const canManage = store.createdBy === userId;
          return (
            <View key={store._id} style={styles.row}>
              <View style={styles.rowHeader}>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{store.name}</Text>
                  <Text style={styles.rowSubtext}>{store.storeCode} · {store.storeType === 'company' ? t('adminCompanyStore') : t('adminFranchiseStore')}</Text>
                </View>
                <View style={[styles.statusDot, store.isActive ? styles.statusActive : styles.statusInactive]} />
              </View>
              {store.address ? <Text style={styles.rowSubtext}>{store.address}</Text> : null}
              {canManage ? (
                <View style={styles.rowActions}>
                  <Pressable accessibilityRole="button" onPress={() => openEdit(store)} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>{t('adminEditStore')}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => setPendingDelete(store)} style={styles.dangerButton}>
                    <Text style={styles.dangerButtonText}>{t('adminDelete')}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={isFormOpen} transparent animationType="slide" onRequestClose={() => setIsFormOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t(editingStore ? 'adminEditStore' : 'adminAddStore')}</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {formError ? <Text accessibilityRole="alert" style={[styles.formError, styles.stateError]}>{formError}</Text> : null}
              <Text style={styles.fieldLabel}>{t('adminStoreType')}</Text>
              <View style={styles.typeOptions}>
                <Pressable onPress={() => updateField('storeType', 'company')} style={[styles.secondaryButton, styles.typeOption, form.storeType === 'company' && styles.typeOptionSelected]}>
                  <Text style={styles.secondaryButtonText}>{t('adminCompanyStore')}</Text>
                </Pressable>
                <Pressable onPress={() => updateField('storeType', 'franchise')} style={[styles.secondaryButton, styles.typeOption, form.storeType === 'franchise' && styles.typeOptionSelected]}>
                  <Text style={styles.secondaryButtonText}>{t('adminFranchiseStore')}</Text>
                </Pressable>
              </View>
              <Field label={t('adminStoreName')} value={form.name} onChangeText={(value) => updateField('name', value)} />
              <Field label={t('adminStoreCode')} value={form.storeCode} onChangeText={(value) => updateField('storeCode', value.toUpperCase())} autoCapitalize="characters" />
              <Field label={t('adminPhone')} value={form.phone} onChangeText={(value) => updateField('phone', value.replace(/\D/g, '').slice(0, 10))} keyboardType="phone-pad" />
              <Field label={t('adminAddress')} value={form.address} onChangeText={(value) => updateField('address', value)} />
              <Field label={t('adminDescription')} value={form.description} onChangeText={(value) => updateField('description', value)} multiline />
              {form.storeType === 'franchise' ? (
                <>
                  <Text style={styles.sectionLabel}>{t('adminOwnerDetails')}</Text>
                  <Field label={t('adminOwnerName')} value={form.ownerName} onChangeText={(value) => updateField('ownerName', value)} />
                  <Field label={t('adminOwnerPhone')} value={form.ownerPhone} onChangeText={(value) => updateField('ownerPhone', value.replace(/\D/g, '').slice(0, 10))} keyboardType="phone-pad" />
                  <Field label={t('adminOwnerEmail')} value={form.ownerEmail} onChangeText={(value) => updateField('ownerEmail', value)} keyboardType="email-address" autoCapitalize="none" />
                </>
              ) : null}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setIsFormOpen(false)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text>
              </Pressable>
              <Pressable disabled={isSaving} onPress={() => void saveStore()} style={styles.primaryButton}>
                {isSaving ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t(editingStore ? 'adminSaveChanges' : 'adminCreateStore')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={pendingDelete !== null} transparent animationType="fade" onRequestClose={() => setPendingDelete(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmModal}>
            <Text style={styles.modalTitle}>{t('adminDeleteStore')}</Text>
            <Text style={styles.screenDescription}>
              {t('adminConfirmDeleteStore', { name: pendingDelete?.name ?? '' })}
            </Text>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setPendingDelete(null)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text>
              </Pressable>
              <Pressable disabled={isDeleting} onPress={() => void deleteStore()} style={styles.dangerButton}>
                {isDeleting ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.dangerButtonText}>{t('adminDelete')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'characters';
  multiline?: boolean;
}

function Field({ label, value, onChangeText, keyboardType = 'default', autoCapitalize, multiline }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        style={[styles.fieldInput, multiline && styles.multilineField]}
      />
    </View>
  );
}
