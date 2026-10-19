import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { AppLoader } from '../../components/AppLoader';
import { apiRequest } from '../../api/auth';
import { theme } from '../../config/theme';
import { t, translateRole } from '../../i18n';
import { adminStyles as styles } from '../../styles/adminStyles';
import { getAdminLayout } from '../../utils/adminLayout';
import { ResponsiveDrawerModal } from '../../components/ResponsiveDrawerModal';

interface StoreOption {
  _id: string;
  name: string;
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  franchises: StoreOption[];
}

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: 'sub_admin' | 'franchise_admin';
  franchiseIds: string[];
}

const blankForm: UserForm = { name: '', email: '', password: '', role: 'sub_admin', franchiseIds: [] };

export function AdminUsersScreen() {
  const { width } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [filterStore, setFilterStore] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [hasLoadedStores, setHasLoadedStores] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState<UserForm>(blankForm);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const query = new URLSearchParams({ excludeEmployees: 'true', limit: '500' });
      if (filterStore) query.set('franchiseId', filterStore);
      const usersResponse = await apiRequest(`/users?${query.toString()}`);
      const usersData = await usersResponse.json() as { users?: AdminUser[]; message?: string };
      if (!usersResponse.ok) throw new Error(usersData.message ?? t('adminLoadFailed'));
      const loadedUsers = usersData.users ?? [];
      setUsers(loadedUsers);
      setStores((current) => {
        const options = new Map(current.map((store) => [store._id, store]));
        loadedUsers.forEach((user) => user.franchises.forEach((store) => options.set(store._id, store)));
        return [...options.values()];
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t('adminLoadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [filterStore]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadStores = useCallback(async () => {
    if (hasLoadedStores || isLoadingStores) return;
    setIsLoadingStores(true);
    try {
      const response = await apiRequest('/stores?limit=100');
      const data = await response.json() as { franchises?: StoreOption[]; message?: string };
      if (!response.ok) throw new Error(data.message ?? t('adminLoadFailed'));
      setStores(data.franchises ?? []);
      setHasLoadedStores(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t('adminLoadFailed'));
    } finally {
      setIsLoadingStores(false);
    }
  }, [hasLoadedStores, isLoadingStores]);

  function openCreate(): void {
    setEditing(null);
    setForm(blankForm);
    setFormError('');
    setIsFormOpen(true);
    void loadStores();
  }

  function openEdit(user: AdminUser): void {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role === 'franchise_admin' ? 'franchise_admin' : 'sub_admin',
      franchiseIds: user.franchises.map((store) => store._id),
    });
    setFormError('');
    setIsFormOpen(true);
    void loadStores();
  }

  function toggleStore(id: string): void {
    setForm((current) => ({
      ...current,
      franchiseIds: current.franchiseIds.includes(id)
        ? current.franchiseIds.filter((storeId) => storeId !== id)
        : [...current.franchiseIds, id],
    }));
  }

  function validate(): string | null {
    if (!form.name.trim()) return t('adminUserNameRequired');
    if (!form.email.trim()) return t('adminUserEmailRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return t('adminUserEmailInvalid');
    if (!editing) {
      if (!form.password) return t('adminUserPasswordRequired');
      if (form.password.length < 12) return t('adminPasswordLength');
      if (!/[A-Z]/.test(form.password)) return t('adminPasswordUppercase');
      if (!/[a-z]/.test(form.password)) return t('adminPasswordLowercase');
      if (!/\d/.test(form.password)) return t('adminPasswordNumber');
      if (!/[^A-Za-z0-9]/.test(form.password)) return t('adminPasswordSpecial');
    }
    if (form.role === 'franchise_admin' && form.franchiseIds.length === 0) return t('adminUserStoreRequired');
    return null;
  }

  async function save(): Promise<void> {
    const validation = validate();
    if (validation) {
      setFormError(validation);
      return;
    }
    setIsSaving(true);
    setFormError('');
    try {
      const response = await apiRequest(
        editing ? `/users/${encodeURIComponent(editing._id)}` : '/users',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editing
            ? { name: form.name.trim(), role: form.role, franchiseIds: form.role === 'sub_admin' ? [] : form.franchiseIds }
            : { name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role, franchiseIds: form.role === 'sub_admin' ? [] : form.franchiseIds }),
        },
      );
      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message ?? t('adminSaveFailed'));
      setIsFormOpen(false);
      setEditing(null);
      await load();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t('adminSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteUser(): Promise<void> {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const response = await apiRequest(`/users/${encodeURIComponent(pendingDelete._id)}`, { method: 'DELETE' });
      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message ?? t('adminSaveFailed'));
      setIsDeleteDialogOpen(false);
      await load();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t('adminNetworkError'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, layout.desktopWeb && styles.screenHeaderInline, layout.compactWeb && styles.screenHeaderStack]}>
        <View style={layout.isWeb ? styles.screenHeaderCopy : undefined}>
          {layout.desktopWeb ? <Text style={[styles.screenEyebrow, styles.screenEyebrowTeal]}>Access management</Text> : null}
          <Text style={styles.screenTitle}>{t('adminUsers')}</Text>
          <Text style={styles.screenDescription}>{t('adminManageUsers')}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={openCreate} style={[styles.primaryButton, layout.desktopWeb && styles.screenHeaderAction, { marginTop: layout.desktopWeb ? 0 : theme.spacing.lg }]}>
          <Text style={styles.primaryButtonText}>{t('adminAddUser')}</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterOptions}>
        <Pressable onPress={() => setFilterStore('')} style={[styles.filterChip, !filterStore && styles.filterChipActive]}>
          <Text style={[styles.filterChipText, !filterStore && styles.filterChipTextActive]}>{t('adminAllStores')}</Text>
        </Pressable>
        {stores.map((store) => (
          <Pressable key={store._id} onPress={() => setFilterStore(store._id)} style={[styles.filterChip, filterStore === store._id && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, filterStore === store._id && styles.filterChipTextActive]}>{store.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? <AppLoader variant="section" /> : null}
      {loadError ? <Text accessibilityRole="alert" style={[styles.stateMessage, styles.stateError]}>{loadError}</Text> : null}
      {!isLoading && !loadError && users.length === 0 ? <Text style={styles.stateMessage}>{t('adminNoUsers')}</Text> : null}
      {!isLoading && !loadError && users.length > 0 ? (layout.usersTable ? (
        <View style={styles.usersTable}>
          <View style={[styles.usersTableRow, styles.usersTableHeader]}>
            <Text style={[styles.usersTableCell, styles.usersTableHeaderText, styles.usersTableName]}>Name</Text>
            <Text style={[styles.usersTableCell, styles.usersTableHeaderText, styles.usersTableEmail]}>Email</Text>
            <Text style={[styles.usersTableCell, styles.usersTableHeaderText, styles.usersTableRole]}>Role</Text>
            <Text style={[styles.usersTableCell, styles.usersTableHeaderText, styles.usersTableStores]}>Stores</Text>
            <View style={styles.usersTableActions} />
          </View>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {users.map((user) => (
              <View key={user._id} style={styles.usersTableRow}>
                <View style={[styles.usersTableCell, styles.usersTableName]}>
                  <View style={styles.userAvatar}><Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text></View>
                  <Text numberOfLines={1} style={styles.userTableNameText}>{user.name}</Text>
                </View>
                <Text numberOfLines={1} style={[styles.usersTableCell, styles.usersTableEmail]}>{user.email}</Text>
                <View style={[styles.usersTableCell, styles.usersTableRole]}><Text style={styles.userTableRole}>{translateRole(user.role)}</Text></View>
                <View style={[styles.usersTableCell, styles.usersTableStores]}>
                  {user.franchises.length === 0
                    ? <Text style={styles.rowSubtext}>{t('adminNoStore')}</Text>
                    : user.franchises.map((store) => <Text key={store._id} style={styles.userTableStore}>{store.name}</Text>)}
                </View>
                <View style={styles.usersTableActions}>
                  <Pressable accessibilityRole="button" onPress={() => openEdit(user)} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>{t('adminEditUser')}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => { setPendingDelete(user); setIsDeleteDialogOpen(true); }} style={styles.dangerButton}>
                    <Text style={styles.dangerButtonText}>{t('adminDelete')}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {users.map((user) => (
          <View key={user._id} style={styles.row}>
            <Text style={styles.rowTitle}>{user.name}</Text>
            <Text style={styles.rowSubtext}>{user.email}</Text>
            <Text style={styles.rowRole}>{translateRole(user.role)}</Text>
            <View style={styles.storePills}>
              {user.franchises.length === 0 ? <Text style={styles.rowSubtext}>{t('adminNoStore')}</Text> : user.franchises.map((store) => (
                <View key={store._id} style={styles.storePill}><Text style={styles.storePillText}>{store.name}</Text></View>
              ))}
            </View>
            <View style={styles.rowActions}>
              <Pressable accessibilityRole="button" onPress={() => openEdit(user)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{t('adminEditUser')}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => { setPendingDelete(user); setIsDeleteDialogOpen(true); }} style={styles.dangerButton}>
                <Text style={styles.dangerButtonText}>{t('adminDelete')}</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
      )) : null}

      <ResponsiveDrawerModal visible={isFormOpen} closeLabel={t('adminCloseMenu')} onClose={() => setIsFormOpen(false)}>
        <View style={styles.drawerContent}>
          <View style={styles.drawerHeading}>
            <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t(editing ? 'adminEditUser' : 'adminAddUser')}</Text>
          </View>
          <ScrollView style={styles.drawerFormScroll} keyboardShouldPersistTaps="handled">
              {formError ? <Text accessibilityRole="alert" style={[styles.formError, styles.stateError]}>{formError}</Text> : null}
              <Field label={t('adminFullName')} value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} />
              <Field label={t('adminEmail')} value={form.email} editable={!editing} keyboardType="email-address" autoCapitalize="none" onChangeText={(email) => setForm((current) => ({ ...current, email }))} />
              {!editing ? <Field label={t('adminPassword')} value={form.password} secureTextEntry keyboardType="default" onChangeText={(password) => setForm((current) => ({ ...current, password }))} /> : null}
              <Text style={styles.fieldLabel}>{t('adminRole')}</Text>
              <View style={styles.typeOptions}>
                {(['sub_admin', 'franchise_admin'] as const).map((role) => (
                  <Pressable key={role} onPress={() => setForm((current) => ({ ...current, role, franchiseIds: role === 'sub_admin' ? [] : current.franchiseIds }))} style={[styles.secondaryButton, styles.typeOption, form.role === role && styles.typeOptionSelected]}>
                    <Text style={styles.secondaryButtonText}>{t(role === 'sub_admin' ? 'adminSubAdmin' : 'adminFranchiseAdmin')}</Text>
                  </Pressable>
                ))}
              </View>
              {form.role === 'franchise_admin' ? (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>{t('adminAssignStores')}</Text>
                  {stores.map((store) => {
                    const selected = form.franchiseIds.includes(store._id);
                    return (
                      <Pressable key={store._id} onPress={() => toggleStore(store._id)} style={[styles.checkboxRow, selected && styles.checkboxRowSelected]}>
                        <View style={[styles.checkbox, selected && styles.checkboxSelected]} />
                        <Text style={styles.checkboxText}>{store.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
          </ScrollView>
          <View style={styles.modalActions}>
            <View style={styles.drawerActionSlot}>
              <Pressable onPress={() => setIsFormOpen(false)} style={[styles.secondaryButton, styles.drawerActionButton]}><Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text></Pressable>
            </View>
            <View style={styles.drawerActionSlot}>
              <Pressable disabled={isSaving} onPress={() => void save()} style={[styles.primaryButton, styles.drawerActionButton]}>
                {isSaving ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t('adminSave')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </ResponsiveDrawerModal>

      <ResponsiveDrawerModal visible={isDeleteDialogOpen && pendingDelete !== null} presentation="dialog" closeLabel={t('adminCloseMenu')} onClose={() => setIsDeleteDialogOpen(false)} onAfterClose={() => setPendingDelete(null)}>
        <View style={styles.confirmDialogContent}>
          <View style={styles.confirmDialogHeader}>
            <Text style={[styles.modalTitle, styles.confirmDialogTitle]}>{t('adminDeleteUser')}</Text>
          </View>
          <View style={styles.confirmDialogBody}>
            <Text style={styles.screenDescription}>{t('adminConfirmDeleteUser', { name: pendingDelete?.name ?? '' })}</Text>
          </View>
          <View style={styles.confirmDialogActions}>
            <View style={styles.confirmDialogActionSlot}>
              <Pressable onPress={() => setIsDeleteDialogOpen(false)} style={[styles.secondaryButton, styles.confirmDialogActionButton]}><Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text></Pressable>
            </View>
            <View style={styles.confirmDialogActionSlot}>
              <Pressable disabled={isDeleting} onPress={() => void deleteUser()} style={[styles.dangerButton, styles.confirmDialogActionButton]}>
                {isDeleting ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.dangerButtonText}>{t('adminDelete')}</Text>}
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
  editable?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
}

function Field({ label, value, onChangeText, editable = true, secureTextEntry, keyboardType = 'default', autoCapitalize }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        style={[styles.fieldInput, !editable && styles.fieldInputDisabled]}
      />
    </View>
  );
}
