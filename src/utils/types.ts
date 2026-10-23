export interface DashboardStats {
  totalStores: number;
  activeStores: number;
  inactiveStores: number;
  franchiseStores: number;
  companyStores: number;
  totalUsers: number;
  storeAdmins: number;
  subAdmins: number;
  employees: number;
}

export type DashboardCardColor = 'teal' | 'orange';

export type StoreCardStyleKey = 'storeCardSingle' | 'storeCardDouble' | 'storeCardTriple';
