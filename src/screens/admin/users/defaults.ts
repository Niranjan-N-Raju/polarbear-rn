import type { UserForm, UserListFilters } from './types';

export const blankForm: UserForm = {
  name: '',
  email: '',
  password: '',
  role: 'sub_admin',
  franchiseIds: [],
};

export const defaultUserFilters: UserListFilters = {
  search: '',
  franchiseId: '',
  status: 'all',
  role: 'all',
};
