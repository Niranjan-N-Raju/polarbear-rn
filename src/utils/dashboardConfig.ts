import { Building2, CircleCheck, Handshake, ShieldCheck, Store, UserRoundCog, UsersRound } from 'lucide-react-native';
import { theme } from '../config/theme';
import type { TranslationKey } from '../i18n';
import { getAdminLayout } from './adminLayout';

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

export const dashboardStatCards: {
  key: keyof DashboardStats;
  label: TranslationKey;
  color: DashboardCardColor;
  Icon: typeof Store;
}[] = [
  { key: 'totalStores', label: 'adminStoreTotal', color: 'teal', Icon: Store },
  { key: 'activeStores', label: 'adminActiveStores', color: 'orange', Icon: CircleCheck },
  { key: 'franchiseStores', label: 'adminFranchiseStores', color: 'orange', Icon: Handshake },
  { key: 'companyStores', label: 'adminCompanyStores', color: 'teal', Icon: Building2 },
  { key: 'totalUsers', label: 'adminTotalUsers', color: 'teal', Icon: UsersRound },
  { key: 'subAdmins', label: 'adminSubAdmins', color: 'orange', Icon: ShieldCheck },
  { key: 'storeAdmins', label: 'adminStoreAdmins', color: 'orange', Icon: UserRoundCog },
  { key: 'employees', label: 'adminEmployees', color: 'teal', Icon: UsersRound },
];

export function getDashboardCardColor(index: number, nativeColor: DashboardCardColor, useWebAlternatingColors: boolean): DashboardCardColor {
  if (!useWebAlternatingColors) return nativeColor;
  return index % 2 === 0 ? 'teal' : 'orange';
}

export function getDashboardLayout(width: number) {
  const adminLayout = getAdminLayout(width);
  return {
    dashboardCardsTablet: width >= 768 && width < theme.layout.adminSidebarBreakpoint,
    dashboardCardsWide: adminLayout.hasSidebar,
    dashboardEyebrow: !adminLayout.isWeb || adminLayout.desktopWeb,
    dashboardIconSize: adminLayout.isWeb ? 16 : theme.layout.iconSize,
    useWebAlternatingColors: adminLayout.isWeb && width >= 768,
  } as const;
}