import { Building2, CircleCheck, Handshake, ShieldCheck, Store, UserRoundCog, UsersRound } from '../icons';
import { theme } from '../config/theme';
import type { TranslationKey } from '../i18n/types';
import { getAdminLayout } from './adminLayout';
import type { DashboardCardColor, DashboardStats } from './types';

export type { DashboardCardColor, DashboardStats } from './types';

export const dashboardStatCards: {
  key: keyof DashboardStats;
  label: TranslationKey;
  color: DashboardCardColor;
  Icon: typeof Store;
}[] = [
  { key: 'totalStores', label: 'adminStoreTotal', color: 'teal', Icon: Store },
  { key: 'activeStores', label: 'adminActiveStores', color: 'orange', Icon: CircleCheck },
  { key: 'franchiseStores', label: 'adminFranchiseStores', color: 'teal', Icon: Handshake },
  { key: 'companyStores', label: 'adminCompanyStores', color: 'orange', Icon: Building2 },
  { key: 'totalUsers', label: 'adminTotalUsers', color: 'teal', Icon: UsersRound },
  { key: 'subAdmins', label: 'adminSubAdmins', color: 'orange', Icon: ShieldCheck },
  { key: 'storeAdmins', label: 'adminStoreAdmins', color: 'teal', Icon: UserRoundCog },
  { key: 'employees', label: 'adminEmployees', color: 'orange', Icon: UsersRound },
];

export function getDashboardLayout(width: number) {
  const adminLayout = getAdminLayout(width);
  return {
    dashboardCardsTablet: width >= 768 && width < theme.layout.adminSidebarBreakpoint,
    dashboardCardsWide: adminLayout.hasSidebar,
    dashboardEyebrow: !adminLayout.isWeb || adminLayout.desktopWeb,
    dashboardIconSize: adminLayout.isWeb ? 16 : theme.layout.iconSize,
  } as const;
}