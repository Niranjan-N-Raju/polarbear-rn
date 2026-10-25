import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '../../api/auth';
import type { AuthenticatedUser } from '../../api/types';
import { AppLoader } from '../../components/AppLoader';
import { ResponsiveDrawerModal } from '../../components/ResponsiveDrawerModal';
import { theme } from '../../config/theme';
import { Banknote, CalendarCheck, ChartNoAxesCombined, ChevronsLeft, LayoutDashboard, LogOut, Menu, Package, Receipt, RefreshCw, Settings, Store, UserRound, UsersRound, Wallet, X } from '../../icons';
import { t } from '../../i18n';
import type { TranslationKey } from '../../i18n';
import { getAdminLayout } from '../../utils/adminLayout';
import { AdminProfileScreen } from '../admin/AdminProfileScreen';
import { FranchiseDashboardScreen } from './FranchiseDashboardScreen';
import { FranchiseMenuGroup } from './FranchiseMenuGroup';
import { franchiseStyles as styles } from './franchiseStyles';
import { FranchiseInventoryScreen } from './inventory/FranchiseInventoryScreen';
import { FranchiseSalesScreen } from './sales/FranchiseSalesScreen';
import { FranchiseAttendanceScreen } from './attendance/FranchiseAttendanceScreen';
import { FranchiseEmployeesScreen } from './employees/FranchiseEmployeesScreen';
import { FranchisePnlScreen } from './pnl/FranchisePnlScreen';
import { FranchiseSalaryScreen } from './salary/FranchiseSalaryScreen';
import { FranchiseStoreConfigScreen } from './store-config/FranchiseStoreConfigScreen';
import { StorePicker } from './StorePicker';
import { FranchiseWithdrawalsScreen } from './withdrawals/FranchiseWithdrawalsScreen';
import type { FranchiseStore } from './types';

const menuIcons = {
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

type MenuKey = keyof typeof menuIcons;
interface MenuItem { key: MenuKey; label: TranslationKey }

const menuGroups: { label?: TranslationKey; items: MenuItem[] }[] = [
  { items: [{ key: 'dashboard', label: 'adminDashboard' }] },
  { label: 'franchiseStoreGroup', items: [
    { key: 'sales', label: 'franchiseSales' },
    { key: 'inventory', label: 'franchiseInventory' },
    { key: 'pnl', label: 'franchisePnl' },
    { key: 'withdrawals', label: 'franchiseWithdrawals' },
  ] },
  { label: 'franchiseStaffGroup', items: [
    { key: 'employees', label: 'adminEmployees' },
    { key: 'attendance', label: 'franchiseAttendance' },
    { key: 'salary', label: 'franchiseSalary' },
  ] },
];

interface FranchiseHomeScreenProps {
  user: AuthenticatedUser;
  onLogout: () => void;
}

export function FranchiseHomeScreen({ user: initialUser, onLogout }: FranchiseHomeScreenProps) {
  const { width, height } = useWindowDimensions();
  const { hasSidebar } = getAdminLayout(width);
  const pickerPanelStyle = hasSidebar ? undefined : {
    height: 'auto' as const,
    maxHeight: height * 0.85,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden' as const,
  };
  const [user, setUser] = useState(initialUser);
  const [stores, setStores] = useState<FranchiseStore[]>([]);
  const [activeStore, setActiveStore] = useState<FranchiseStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [expandedGroup, setExpandedGroup] = useState<TranslationKey | null>(null);
  const allItems = [
    ...menuGroups.flatMap((group) => group.items),
    { key: 'profile', label: 'adminProfile' as const },
    { key: 'store-config', label: 'franchiseStoreConfig' as const },
  ];
  const currentLabel = allItems.find((item) => item.key === tab)?.label ?? 'adminDashboard';

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    apiRequest('/stores', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(t('franchiseStoresLoadFailed'));
        const data: { franchises: FranchiseStore[] } = await response.json();
        if (!active) return;
        setStores(data.franchises);
        setActiveStore((current) => data.franchises.find((store) => store._id === current?._id)
          ?? (data.franchises.length === 1 ? data.franchises[0] : null));
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : t('franchiseStoresLoadFailed'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [version]);

  function selectStore(store: FranchiseStore) {
    setActiveStore(store);
    setPickerOpen(false);
    setTab('dashboard');
  }

  function navigate(key: string) {
    setTab(key);
    setDrawerOpen(false);
  }

  function renderNavItem(item: MenuItem) {
    const Icon = menuIcons[item.key];
    const active = tab === item.key;
    const compact = hasSidebar && collapsed;
    return (
      <Pressable
        key={item.key}
        accessibilityRole="button"
        accessibilityLabel={t(item.label)}
        accessibilityState={{ selected: active }}
        onPress={() => navigate(item.key)}
        style={[
          styles.menuItem,
          hasSidebar && styles.menuItemSidebar,
          compact && styles.menuItemCollapsed,
          active && styles.activeNavItem,
          active && hasSidebar && styles.activeNavItemSidebar,
        ]}
      >
        <Icon size={20} color={active ? theme.colors.teal : theme.colors.muted} />
        {!compact ? (
          <View style={styles.navCopy}>
            <Text style={[styles.navLabel, active && (hasSidebar ? styles.navLabelActiveSidebar : styles.navLabelActive)]}>{t(item.label)}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  }

  function renderNavigation() {
    const compact = hasSidebar && collapsed;
    return (
      <SafeAreaView edges={hasSidebar ? [] : ['top', 'bottom', 'left']} style={[styles.sidebar, !hasSidebar && styles.drawerPanel, compact && styles.sidebarCollapsed]}>
        <View style={styles.sidebarHeading}>
          {!compact ? <Text style={styles.sectionTitle}>{t('brandName')}</Text> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hasSidebar ? t(compact ? 'franchiseExpandSidebar' : 'franchiseCollapseSidebar') : t('adminCloseMenu')}
            onPress={() => hasSidebar ? setCollapsed((value) => !value) : setDrawerOpen(false)}
            style={styles.navItem}
          >
            {hasSidebar ? compact ? <Menu size={20} color={theme.colors.muted} /> : <ChevronsLeft size={20} color={theme.colors.muted} /> : <X size={20} color={theme.colors.muted} />}
          </Pressable>
        </View>
        <ScrollView style={styles.nav} contentContainerStyle={styles.navigationContent} keyboardShouldPersistTaps="handled">
          <View style={styles.navContent}>
            {menuGroups.map((group, index) => (
              <View key={group.label ?? index}>
                {group.label && !compact ? (
                  <FranchiseMenuGroup
                    label={t(group.label)}
                    Icon={group.label === 'franchiseStoreGroup' ? Store : UsersRound}
                    expanded={expandedGroup === group.label}
                    onPress={() => setExpandedGroup((current) => current === group.label ? null : group.label ?? null)}
                  >
                    {group.items.map(renderNavItem)}
                  </FranchiseMenuGroup>
                ) : group.items.map(renderNavItem)}
              </View>
            ))}
          </View>
          <View style={styles.footer}>
            {renderNavItem({ key: 'profile', label: 'adminProfile' })}
            {renderNavItem({ key: 'store-config', label: 'franchiseStoreConfig' })}
            {!compact ? <Text numberOfLines={2} style={styles.activeStoreName}>{activeStore?.name}</Text> : null}
            {stores.length > 1 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('franchiseSwitchStore')}
                onPress={() => { setDrawerOpen(false); setPickerOpen(true); setVersion((value) => value + 1); }}
                style={[styles.navItem, compact && styles.compactAction]}
              >
                <RefreshCw size={20} color={theme.colors.muted} />
                {!compact ? <Text style={styles.actionText}>{t('franchiseSwitchStore')}</Text> : null}
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" accessibilityLabel={t('signOut')} onPress={onLogout} style={[styles.navItem, styles.signOutAction, compact && styles.compactAction]}>
              <LogOut size={20} color={theme.colors.muted} />
              {!compact ? <Text style={styles.actionText}>{t('signOut')}</Text> : null}
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loading || error || !activeStore) {
    return (
      <SafeAreaView style={styles.root}>
        {loading ? <AppLoader /> : error || stores.length === 0 ? (
          <View style={styles.content}>
            <Text accessibilityRole="alert" style={styles.error}>{error || t('franchiseNoStores')}</Text>
            <Pressable accessibilityRole="button" onPress={() => setVersion((value) => value + 1)} style={styles.button}>
              <Text style={styles.buttonText}>{t('adminRefresh')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('signOut')} onPress={onLogout} style={styles.button}>
              <Text style={styles.buttonText}>{t('signOut')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.pickerScreen}>
            <ResponsiveDrawerModal visible closeLabel={t('franchiseSelectStore')} onClose={() => undefined} panelStyle={pickerPanelStyle}>
              <StorePicker stores={stores} onSelect={selectStore} onSignOut={onLogout} fill={hasSidebar} />
            </ResponsiveDrawerModal>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, hasSidebar && styles.wideRoot]}>
      {hasSidebar ? renderNavigation() : null}
      <View style={styles.main}>
        <View style={styles.header}>
          {!hasSidebar ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t('adminOpenMenu')} onPress={() => setDrawerOpen(true)} style={styles.navItem}>
              <Menu size={22} color={theme.colors.ink} />
            </Pressable>
          ) : null}
          <View style={styles.headerCopy}>
            <Text style={styles.sectionTitle}>{t(currentLabel)}</Text>
            <Text numberOfLines={1} style={styles.subtitle}>{user.name} · {activeStore.name}</Text>
          </View>
        </View>
        {tab === 'dashboard' ? <FranchiseDashboardScreen key={activeStore._id} storeId={activeStore._id} /> : tab === 'sales' ? (
          <FranchiseSalesScreen key={activeStore._id} storeId={activeStore._id} />
        ) : tab === 'inventory' ? (
          <FranchiseInventoryScreen key={activeStore._id} storeId={activeStore._id} />
        ) : tab === 'pnl' ? (
          <FranchisePnlScreen key={activeStore._id} storeId={activeStore._id} />
        ) : tab === 'withdrawals' ? (
          <FranchiseWithdrawalsScreen key={activeStore._id} storeId={activeStore._id} />
        ) : tab === 'employees' ? (
          <FranchiseEmployeesScreen key={activeStore._id} storeId={activeStore._id} />
        ) : tab === 'attendance' ? (
          <FranchiseAttendanceScreen key={activeStore._id} storeId={activeStore._id} />
        ) : tab === 'salary' ? (
          <FranchiseSalaryScreen key={activeStore._id} storeId={activeStore._id} />
        ) : tab === 'store-config' ? (
          <FranchiseStoreConfigScreen key={activeStore._id} storeId={activeStore._id} />
        ) : (
          <AdminProfileScreen user={user} onUserUpdated={setUser} />
        )}
      </View>
      {!hasSidebar && !pickerOpen ? (
        <Modal transparent visible={drawerOpen} animationType="fade" onRequestClose={() => setDrawerOpen(false)}>
          <View style={styles.modalRoot}>
            {renderNavigation()}
            <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={() => setDrawerOpen(false)} style={styles.scrim} />
          </View>
        </Modal>
      ) : null}
      <ResponsiveDrawerModal
        visible={pickerOpen}
        closeLabel={t('franchiseSelectStore')}
        onClose={() => setPickerOpen(false)}
        panelStyle={pickerPanelStyle}
      >
        <StorePicker stores={stores} activeStoreId={activeStore._id} onSelect={selectStore} onCancel={() => setPickerOpen(false)} fill={hasSidebar} />
      </ResponsiveDrawerModal>
    </SafeAreaView>
  );
}
