import { useCallback,useEffect,useRef,useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { apiRequest } from '../../../api/auth';
import { t,translateRole } from '../../../i18n';
import { getAdminLayout } from '../../../utils/adminLayout';
import { blankForm,defaultUserFilters } from './defaults';
import type {
AdminUser,
AdminUsersScreenProps,
OpenUserFilter,
PageInfo,
StoreOption,
UserFieldErrors,
UserForm,
UserListFilters,
UserStatusFilter,
} from './types';


export function useAdminUsers({ onToast }: AdminUsersScreenProps) {
const { width, height } = useWindowDimensions();
const layout = getAdminLayout(width);
const [users, setUsers] = useState<AdminUser[]>([]);
const [stores, setStores] = useState<StoreOption[]>([]);
const [filterStore, setFilterStore] = useState('');
const [filterStatus, setFilterStatus] = useState<UserStatusFilter>('all');
const [filterRole, setFilterRole] = useState('all');
const [storeSearchText, setStoreSearchText] = useState('');
const [openFilter, setOpenFilter] = useState<OpenUserFilter>(null);
const [searchText, setSearchText] = useState('');
const [appliedFilters, setAppliedFilters] = useState(defaultUserFilters);
const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
const [pageInfo, setPageInfo] = useState<PageInfo>({ page: 1, totalPages: 1, total: 0 });
const [isRefreshing, setIsRefreshing] = useState(false);
const [isLoadingMore, setIsLoadingMore] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [isLoadingStores, setIsLoadingStores] = useState(false);
const [hasLoadedStores, setHasLoadedStores] = useState(false);
const [loadError, setLoadError] = useState('');
const [form, setForm] = useState<UserForm>(blankForm);
const [editing, setEditing] = useState<AdminUser | null>(null);
const [isFormOpen, setIsFormOpen] = useState(false);
const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);
const [fieldErrors, setFieldErrors] = useState<UserFieldErrors>({});
const [toastMessage, setToastMessage] = useState('');
const [pendingFormSuccess, setPendingFormSuccess] = useState('');
const [pendingDeleteSuccess, setPendingDeleteSuccess] = useState('');
const [isSaving, setIsSaving] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const initialLoadComplete = useRef(false);
const dismissToast = useCallback(() => setToastMessage(''), []);
const showErrorToast = useCallback((message: string) => setToastMessage(message), []);
const load = useCallback(async (page: number, filters: UserListFilters, append = false): Promise<boolean> => {
    if (append) setIsLoadingMore(true);
    else setIsRefreshing(true);
    setLoadError('');
    try {
      const query = new URLSearchParams({
        excludeEmployees: 'true',
        includeArchived: 'true',
        page: String(page),
        limit: '9',
        status: filters.status,
      });
      if (filters.search.trim()) query.set('search', filters.search.trim());
      if (filters.franchiseId) query.set('franchiseId', filters.franchiseId);
      if (filters.role !== 'all') query.set('role', filters.role);
      const usersResponse = await apiRequest(`/users?${query.toString()}`);
      const usersData = await usersResponse.json() as {
        users?: AdminUser[];
        pagination?: PageInfo;
        message?: string;
      };
      if (!usersResponse.ok) throw new Error(usersData.message ?? t('adminLoadFailed'));
      const loadedUsers = usersData.users ?? [];
      setUsers((current) => append ? [...current, ...loadedUsers] : loadedUsers);
      setPageInfo(usersData.pagination ?? { page, totalPages: page, total: loadedUsers.length });
      initialLoadComplete.current = true;
      setStores((current) => {
        const options = new Map(current.map((store) => [store._id, store]));
        loadedUsers.forEach((user) => user.franchises.forEach((store) => options.set(store._id, store)));
        return [...options.values()];
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : t('adminLoadFailed');
      if (append || initialLoadComplete.current) onToast(message, 'error');
      else setLoadError(message);
      return false;
    } finally {
      if (append) setIsLoadingMore(false);
      else {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [onToast]);
useEffect(() => {
    void load(1, defaultUserFilters);
  }, [load]);
const visibleUsers = users;
const userRoleOptions = ['admin', 'sub_admin', 'franchise_admin']
    .map((role) => ({ value: role, label: translateRole(role) }));
const hasActiveFilters = Boolean(
    appliedFilters.search
    || appliedFilters.franchiseId
    || appliedFilters.status !== 'all'
    || appliedFilters.role !== 'all',
  );
const hasDraftFilters = Boolean(
    searchText.trim()
    || filterStore
    || filterStatus !== 'all'
    || filterRole !== 'all',
  );
function openFilters(): void {
    setSearchText(appliedFilters.search);
    setFilterStore(appliedFilters.franchiseId);
    setStoreSearchText(stores.find((store) => store._id === appliedFilters.franchiseId)?.name ?? '');
    setFilterStatus(appliedFilters.status);
    setFilterRole(appliedFilters.role);
    setOpenFilter(null);
    setIsFilterDrawerOpen(true);
    void loadStores();
  }
async function applyFilters(): Promise<void> {
    const filters: UserListFilters = {
      search: searchText.trim(),
      franchiseId: filterStore,
      status: filterStatus,
      role: filterRole,
    };
    setOpenFilter(null);
    setIsFilterDrawerOpen(false);
    if (!await load(1, filters)) return;
    setAppliedFilters(filters);
  }
async function clearFilters(): Promise<void> {
    setOpenFilter(null);
    setIsFilterDrawerOpen(false);
    if (!await load(1, defaultUserFilters)) return;
    setSearchText('');
    setStoreSearchText('');
    setFilterStore('');
    setFilterStatus('all');
    setFilterRole('all');
    setAppliedFilters(defaultUserFilters);
  }
function loadMore(): void {
    void load(pageInfo.page + 1, appliedFilters, true);
  }
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
      showErrorToast(error instanceof Error ? error.message : t('adminLoadFailed'));
    } finally {
      setIsLoadingStores(false);
    }
  }, [hasLoadedStores, isLoadingStores, showErrorToast]);
useEffect(() => {
    void loadStores();
  }, [loadStores]);
function openCreate(): void {
    setEditing(null);
    setForm(blankForm);
    setFieldErrors({});
    setToastMessage('');
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
    setFieldErrors({});
    setToastMessage('');
    setIsFormOpen(true);
    void loadStores();
  }
function updateField<Key extends keyof UserForm>(key: Key, value: UserForm[Key]): void {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      if (key === 'name') delete next.name;
      else if (key === 'email') delete next.email;
      else if (key === 'password') delete next.password;
      else if (key === 'franchiseIds') delete next.franchiseIds;
      return next;
    });
  }
function toggleStore(id: string): void {
    updateField('franchiseIds', form.franchiseIds.includes(id)
      ? form.franchiseIds.filter((storeId) => storeId !== id)
      : [...form.franchiseIds, id]);
  }
function updateRole(role: UserForm['role']): void {
    setForm((current) => ({ ...current, role, franchiseIds: role === 'sub_admin' ? [] : current.franchiseIds }));
    if (role === 'sub_admin') setFieldErrors((current) => ({ ...current, franchiseIds: undefined }));
  }
function validate(): UserFieldErrors {
    const errors: UserFieldErrors = {};
    if (!form.name.trim()) errors.name = t('adminUserNameRequired');
    if (!form.email.trim()) errors.email = t('adminUserEmailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = t('adminUserEmailInvalid');
    if (!editing) {
      if (!form.password) errors.password = t('adminUserPasswordRequired');
      else if (form.password.length < 12) errors.password = t('adminPasswordLength');
      else if (!/[A-Z]/.test(form.password)) errors.password = t('adminPasswordUppercase');
      else if (!/[a-z]/.test(form.password)) errors.password = t('adminPasswordLowercase');
      else if (!/\d/.test(form.password)) errors.password = t('adminPasswordNumber');
      else if (!/[^A-Za-z0-9]/.test(form.password)) errors.password = t('adminPasswordSpecial');
    }
    if (form.role === 'franchise_admin' && form.franchiseIds.length === 0) errors.franchiseIds = t('adminUserStoreRequired');
    return errors;
  }
async function save(): Promise<void> {
    const validationErrors = validate();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setIsSaving(true);
    setFieldErrors({});
    setToastMessage('');
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
      if (!response.ok) {
        showErrorToast(data.message ?? t('adminSaveFailed'));
        return;
      }
      setPendingFormSuccess(t('adminUserSaved'));
      setIsFormOpen(false);
      setEditing(null);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : t('adminSaveFailed'));
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
      if (!response.ok) {
        showErrorToast(data.message ?? t('adminSaveFailed'));
        return;
      }
      setPendingDeleteSuccess(t('adminUserDeleted'));
      setIsDeleteDialogOpen(false);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : t('adminNetworkError'));
    } finally {
      setIsDeleting(false);
    }
  }
return { height, layout, stores, setFilterStore, filterStatus, setFilterStatus, filterRole, setFilterRole, storeSearchText, setStoreSearchText, openFilter, setOpenFilter, searchText, setSearchText, appliedFilters, isFilterDrawerOpen, setIsFilterDrawerOpen, pageInfo, isRefreshing, isLoadingMore, isLoading, loadError, form, editing, isFormOpen, setIsFormOpen, pendingDelete, setPendingDelete, fieldErrors, toastMessage, pendingFormSuccess, setPendingFormSuccess, pendingDeleteSuccess, setPendingDeleteSuccess, isSaving, isDeleting, isDeleteDialogOpen, setIsDeleteDialogOpen, dismissToast, load, visibleUsers, userRoleOptions, hasActiveFilters, hasDraftFilters, openFilters, applyFilters, clearFilters, loadMore, openCreate, openEdit, updateField, toggleStore, updateRole, save, deleteUser };
}
