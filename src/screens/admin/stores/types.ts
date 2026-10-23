export type { PageInfo } from '../../../common/types';

export interface StoreRecord {
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

export interface StoreForm {
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

export type StoreStatusFilter = 'active' | 'archived' | 'all';
export type StoreTypeFilter = 'all' | 'company' | 'franchise';

export interface StoreListFilters {
  search: string;
  status: StoreStatusFilter;
  type: StoreTypeFilter;
}

export type StoreFormErrors = Partial<Record<keyof StoreForm, string>>;

export interface AdminStoresScreenProps {
  userId: string;
  onToast: (message: string, tone: 'success' | 'error') => void;
}

export interface StoreFiltersDrawerProps {
  visible: boolean;
  height: number;
  isWeb: boolean;
  searchText: string;
  statusFilter: StoreStatusFilter;
  typeFilter: StoreTypeFilter;
  openFilter: 'status' | 'type' | null;
  hasDraftFilters: boolean;
  onClose: () => void;
  onAfterClose: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StoreStatusFilter) => void;
  onTypeChange: (value: StoreTypeFilter) => void;
  onToggleFilter: (filter: 'status' | 'type') => void;
  onDismissDropdown: () => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
}

export interface StoreFormDrawerProps {
  visible: boolean;
  editingStore: StoreRecord | null;
  form: StoreForm;
  formIsArchived: boolean;
  fieldErrors: StoreFormErrors;
  isSaving: boolean;
  toastMessage: string;
  toastTone: 'error' | 'success';
  onClose: () => void;
  onAfterClose: () => void;
  onDismissToast: () => void;
  onFieldChange: <Key extends keyof StoreForm>(key: Key, value: StoreForm[Key]) => void;
  onArchivedChange: (archived: boolean) => void;
  onSave: () => void;
}

export const emptyForm: StoreForm = {
  name: '',
  storeCode: '',
  address: '',
  phone: '',
  description: '',
  storeType: 'company',
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
};

export const defaultStoreFilters: StoreListFilters = {
  search: '',
  status: 'active',
  type: 'all',
};
