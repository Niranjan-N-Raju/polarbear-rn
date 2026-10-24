export type { PageInfo } from '../../../common/types';
import type { StyleProp, ViewStyle } from 'react-native';

export interface StoreOption {
  _id: string;
  name: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive?: boolean;
  franchises: StoreOption[];
}

export interface UserForm {
  name: string;
  email: string;
  password: string;
  role: 'sub_admin' | 'franchise_admin';
  franchiseIds: string[];
}

export type UserFieldErrors = Partial<Record<'name' | 'email' | 'password' | 'franchiseIds', string>>;
export type UserStatusFilter = 'all' | 'active' | 'inactive';
export type OpenUserFilter = 'store' | 'status' | 'type' | null;

export interface UserListFilters {
  search: string;
  franchiseId: string;
  status: UserStatusFilter;
  role: string;
}

export interface AdminUsersScreenProps {
  onToast: (message: string, tone: 'success' | 'error') => void;
}

export interface UserFiltersDrawerProps {
  visible: boolean;
  height: number;
  isWeb: boolean;
  searchText: string;
  storeSearchText: string;
  filterStatus: UserStatusFilter;
  filterRole: string;
  stores: StoreOption[];
  openFilter: OpenUserFilter;
  hasDraftFilters: boolean;
  onClose: () => void;
  onAfterClose: () => void;
  onSearchChange: (value: string) => void;
  onStoreSearchChange: (value: string) => void;
  onStoreSelect: (store: StoreOption) => void;
  onFilterStatusChange: (value: UserStatusFilter) => void;
  onFilterRoleChange: (value: string) => void;
  onToggleFilter: (filter: Exclude<OpenUserFilter, null>) => void;
  onOpenStoreFilter: () => void;
  onDismissDropdown: () => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
  userRoleOptions: { value: string; label: string }[];
}

export interface UserStoreAutocompleteProps {
  stores: StoreOption[];
  value: string;
  expanded: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  onFocus: () => void;
  onChangeText: (value: string) => void;
  onSelect: (store: StoreOption) => void;
}

export interface UserFormDrawerProps {
  visible: boolean;
  editing: AdminUser | null;
  form: UserForm;
  stores: StoreOption[];
  fieldErrors: UserFieldErrors;
  isSaving: boolean;
  toastMessage: string;
  onClose: () => void;
  onAfterClose: () => void;
  onDismissToast: () => void;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRoleChange: (role: UserForm['role']) => void;
  onToggleStore: (id: string) => void;
  onSave: () => void;
}

export interface UserListProps {
  users: AdminUser[];
  isTable: boolean;
  isDesktopWeb: boolean;
  footer?: ReactNode;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}
import type { ReactNode } from 'react';
