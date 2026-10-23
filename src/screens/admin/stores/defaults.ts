import type { StoreForm, StoreListFilters } from './types';

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
