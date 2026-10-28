import type { TranslationKey } from '../../i18n';
import { Banknote, CalendarCheck, ChartNoAxesCombined, LayoutDashboard, Package, Receipt, Settings, UserRound, UsersRound, Wallet } from '../../icons';
export const menuIcons = {
  dashboard: LayoutDashboard,
  sales: Receipt,
  inventory: Package,
  pnl: ChartNoAxesCombined,
  withdrawals: Wallet,
  employees: UsersRound,
  attendance: CalendarCheck,
  salary: Banknote,
  profile: UserRound,
  'store-config': Settings,
};
export type MenuKey = keyof typeof menuIcons;
export interface MenuItem { key: MenuKey; label: TranslationKey; }
export const menuGroups: { label?: TranslationKey; items: MenuItem[]; }[] = [
  { items: [{ key: 'dashboard', label: 'adminDashboard' }] },
  {
    label: 'franchiseStoreGroup', items: [
      { key: 'sales', label: 'franchiseSales' },
      { key: 'inventory', label: 'franchiseInventory' },
      { key: 'pnl', label: 'franchisePnl' },
      { key: 'withdrawals', label: 'franchiseWithdrawals' },
    ]
  },
  {
    label: 'franchiseStaffGroup', items: [
      { key: 'employees', label: 'adminEmployees' },
      { key: 'attendance', label: 'franchiseAttendance' },
      { key: 'salary', label: 'franchiseSalary' },
    ]
  },
];
