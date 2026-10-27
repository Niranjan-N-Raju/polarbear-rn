import { Building2, CircleCheck, Handshake, ShieldCheck, Store, UserRoundCog, UsersRound } from '../icons';
import { theme } from '../config/theme';
import type { TranslationKey } from '../i18n/types';
import { getAdminLayout } from './adminLayout';
import type { DashboardCardColor, DashboardStats } from './types';

export type { DashboardCardColor, DashboardStats } from './types';

export const dashboardStatCards: {
  key: keyof DashboardStats;
  label: TranslationKey;
  Icon: typeof Store;
}[] = [
  { key: 'totalStores', label: 'adminStoreTotal', Icon: Store },
  { key: 'activeStores', label: 'adminActiveStores', Icon: CircleCheck },
  { key: 'franchiseStores', label: 'adminFranchiseStores', Icon: Handshake },
  { key: 'companyStores', label: 'adminCompanyStores', Icon: Building2 },
  { key: 'totalUsers', label: 'adminTotalUsers', Icon: UsersRound },
  { key: 'subAdmins', label: 'adminSubAdmins', Icon: ShieldCheck },
  { key: 'storeAdmins', label: 'adminStoreAdmins', Icon: UserRoundCog },
  { key: 'employees', label: 'adminEmployees', Icon: UsersRound },
];

export function getDashboardCardColor(index: number, perRow: number): DashboardCardColor {
  const row = Math.floor(index / perRow);
  const column = index % perRow;
  return (row + column) % 2 === 0 ? 'teal' : 'orange';
}

export function getDashboardLayout(width: number) {
  const adminLayout = getAdminLayout(width);
  return {
    dashboardCardsTablet: width >= 768 && width < theme.layout.adminSidebarBreakpoint,
    dashboardCardsWide: adminLayout.hasSidebar,
    dashboardEyebrow: !adminLayout.isWeb || adminLayout.desktopWeb,
    dashboardIconSize: adminLayout.isWeb ? 16 : theme.layout.iconSize,
  } as const;
}