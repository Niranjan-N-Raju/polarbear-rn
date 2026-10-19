import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Archive, MapPin, Pencil, Phone, RotateCcw, Store as StoreIcon } from 'lucide-react-native';
import { apiRequest } from '../../api/auth';
import { theme } from '../../config/theme';
import { t } from '../../i18n';
import { adminStyles as styles } from '../../styles/adminStyles';
import { getAdminLayout } from '../../utils/adminLayout';
import { ResponsiveDrawerModal } from '../../components/ResponsiveDrawerModal';

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
  archivedAt?: string | null;
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
  const { width } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreRecord | null>(null);
  const [pendingArchive, setPendingArchive] = useState<StoreRecord | null>(null);
  const [form, setForm] = useState<StoreForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [updatingArchiveId, setUpdatingArchiveId] = useState<string | null>(null);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

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

  async function updateStoreArchive(store: StoreRecord, archived: boolean): Promise<void> {
    setUpdatingArchiveId(store._id);
    try {
      const response = await apiRequest(`/stores/archive?id=${encodeURIComponent(store._id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived }),
      });
      const data = await response.json() as { message?: string };
      if (!response.ok) {
        setError(data.message ?? t('adminSaveFailed'));
        return;
      }
      if (archived) setIsArchiveDialogOpen(false);
      await loadStores();
    } catch {
      setError(t('adminNetworkError'));
    } finally {
      setUpdatingArchiveId(null);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, layout.desktopWeb && styles.screenHeaderInline]}>
        <View style={layout.isWeb ? styles.screenHeaderCopy : undefined}>
          {layout.desktopWeb ? <Text style={[styles.screenEyebrow, styles.screenEyebrowTeal]}>Workspace setup</Text> : null}
          <Text style={styles.screenTitle}>{t('adminStores')}</Text>
          <Text style={styles.screenDescription}>{t('adminStoreCount', { count: stores.length })}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={openCreate} style={[styles.primaryButton, layout.desktopWeb && styles.screenHeaderAction, { marginTop: layout.desktopWeb ? 0 : theme.spacing.lg }]}>
          <Text style={styles.primaryButtonText}>{t('adminAddStore')}</Text>
        </Pressable>
      </View>

      {isLoading ? <ActivityIndicator color={theme.colors.orange} size="large" /> : null}
      {error ? <Text accessibilityRole="alert" style={[styles.stateMessage, styles.stateError]}>{error}</Text> : null}
      {!isLoading && !error && stores.length === 0 ? <Text style={styles.stateMessage}>{t('adminNoStores')}</Text> : null}

      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          layout.isWeb && styles.storeGrid,
        ]}
      >
        {stores.map((store) => {
          const canManage = store.createdBy === userId;
          return (
            <View
              key={store._id}
              style={[
                styles.storeCard,
                layout.storeCardStyle && styles[layout.storeCardStyle],
              ]}
            >
              <View style={styles.storeCardHeader}>
                <View style={styles.storeIconTile}><StoreIcon color={theme.colors.orange} size={20} /></View>
                <View style={styles.storeCardBody}>
                  <View style={styles.storeTitleRow}>
                    <Text numberOfLines={1} style={styles.storeTitle}>{store.name}</Text>
                    {store.storeCode ? <View style={styles.storeCodeBadge}><Text style={styles.storeCodeText}>{store.storeCode}</Text></View> : null}
                  </View>
                  <View style={styles.storeBadgeRow}>
                    <View style={[styles.storeTypeBadge, store.storeType === 'company' ? styles.storeCompanyBadge : styles.storeFranchiseBadge]}>
                      <Text style={[styles.storeTypeBadgeText, store.storeType === 'company' ? styles.storeCompanyBadgeText : styles.storeFranchiseBadgeText]}>
                        {store.storeType === 'company' ? t('adminCompanyStore') : t('adminFranchiseStore')}
                      </Text>
                    </View>
                    <View style={[styles.storeStatusBadge, store.isActive && !store.archivedAt ? styles.storeActiveBadge : styles.storeInactiveBadge]}>
                      <Text style={store.isActive && !store.archivedAt ? styles.storeActiveBadgeText : styles.storeInactiveBadgeText}>
                        {store.archivedAt ? t('adminArchived') : store.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              {store.description ? <Text style={styles.storeDescription}>{store.description}</Text> : null}
              {store.address || store.phone ? (
                <View style={styles.storeContactBlock}>
                  {store.address ? <View style={styles.storeContactRow}><MapPin color="#9CA3AF" size={14} /><Text style={styles.storeContactText}>{store.address}</Text></View> : null}
                  {store.phone ? <View style={styles.storeContactRow}><Phone color="#9CA3AF" size={14} /><Text style={styles.storeContactText}>{store.phone}</Text></View> : null}
                </View>
              ) : null}
              {canManage ? (
                <View style={styles.storeCardActions}>
                  <Pressable accessibilityRole="button" onPress={() => openEdit(store)} style={styles.storeCardAction}>
                    <Pencil color={theme.colors.teal} size={14} />
                    <Text style={styles.storeEditActionText}>Edit</Text>
                  </Pressable>
                  {store.archivedAt ? (
                    <Pressable accessibilityRole="button" disabled={updatingArchiveId === store._id} onPress={() => void updateStoreArchive(store, false)} style={styles.storeCardAction}>
                      <RotateCcw color={theme.colors.orange} size={14} />
                      <Text style={styles.storeArchiveActionText}>{updatingArchiveId === store._id ? t('adminSaving') : t('adminRestore')}</Text>
                    </Pressable>
                  ) : (
                    <Pressable accessibilityRole="button" onPress={() => { setPendingArchive(store); setIsArchiveDialogOpen(true); }} style={styles.storeCardAction}>
                      <Archive color={theme.colors.orange} size={14} />
                      <Text style={styles.storeArchiveActionText}>{t('adminArchive')}</Text>
                    </Pressable>
                  )}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      <ResponsiveDrawerModal visible={isFormOpen} closeLabel={t('adminCloseMenu')} onClose={() => setIsFormOpen(false)}>
        <View style={styles.drawerContent}>
          <Text style={styles.modalTitle}>{t(editingStore ? 'adminEditStore' : 'adminAddStore')}</Text>
          <ScrollView style={styles.drawerFormScroll} keyboardShouldPersistTaps="handled">
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
            <View style={styles.drawerActionSlot}>
              <Pressable onPress={() => setIsFormOpen(false)} style={[styles.secondaryButton, styles.drawerActionButton]}>
                <Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text>
              </Pressable>
            </View>
            <View style={styles.drawerActionSlot}>
              <Pressable disabled={isSaving} onPress={() => void saveStore()} style={[styles.primaryButton, styles.drawerActionButton]}>
                {isSaving ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t(editingStore ? 'adminSaveChanges' : 'adminCreateStore')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </ResponsiveDrawerModal>

      <ResponsiveDrawerModal visible={isArchiveDialogOpen && pendingArchive !== null} presentation="dialog" closeLabel={t('adminCloseMenu')} onClose={() => setIsArchiveDialogOpen(false)} onAfterClose={() => setPendingArchive(null)}>
        <View style={styles.confirmDialogContent}>
          <View style={styles.confirmDialogHeader}>
            <Text style={[styles.modalTitle, styles.confirmDialogTitle]}>{t('adminArchiveStore')}</Text>
          </View>
          <View style={styles.confirmDialogBody}>
            <Text style={styles.screenDescription}>
              {t('adminConfirmArchiveStore', { name: pendingArchive?.name ?? '' })}
            </Text>
          </View>
          <View style={styles.confirmDialogActions}>
            <View style={styles.confirmDialogActionSlot}>
              <Pressable onPress={() => setIsArchiveDialogOpen(false)} style={[styles.secondaryButton, styles.confirmDialogActionButton]}>
                <Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text>
              </Pressable>
            </View>
            <View style={styles.confirmDialogActionSlot}>
              <Pressable disabled={updatingArchiveId === pendingArchive?._id} onPress={() => pendingArchive && void updateStoreArchive(pendingArchive, true)} style={[styles.primaryButton, styles.confirmDialogActionButton]}>
                {updatingArchiveId === pendingArchive?._id ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t('adminArchive')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </ResponsiveDrawerModal>
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
