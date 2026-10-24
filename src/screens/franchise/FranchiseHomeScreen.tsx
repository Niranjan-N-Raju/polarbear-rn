import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '../../api/auth';
import type { AuthenticatedUser } from '../../api/types';
import { AppLoader } from '../../components/AppLoader';
import { theme } from '../../config/theme';
import { ChevronsLeft, LayoutDashboard, Menu, Store, UserRound, X } from '../../icons';
import { t } from '../../i18n';
import type { TranslationKey } from '../../i18n';
import { getAdminLayout } from '../../utils/adminLayout';
import { AdminProfileScreen } from '../admin/AdminProfileScreen';
import { FranchiseDashboardScreen } from './FranchiseDashboardScreen';
import { franchiseStyles as styles } from './franchiseStyles';
import { StorePicker } from './StorePicker';
import type { FranchiseStore } from './types';

const menuGroups: { label?: TranslationKey; items: { key: string; label: TranslationKey }[] }[] = [
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
  const { width } = useWindowDimensions();
  const { hasSidebar } = getAdminLayout(width);
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

  function renderNavItem(item: { key: string; label: TranslationKey }) {
    const available = item.key === 'dashboard' || item.key === 'profile';
    const Icon = item.key === 'dashboard' ? LayoutDashboard : item.key === 'profile' ? UserRound : Store;
    return (
      <Pressable
        key={item.key}
        accessibilityRole="button"
        accessibilityLabel={t(item.label)}
        accessibilityState={{ selected: tab === item.key }}
        onPress={() => navigate(item.key)}
        style={[styles.navItem, tab === item.key && styles.activeNavItem]}
      >
        <Icon size={20} color={tab === item.key ? theme.colors.teal : theme.colors.muted} />
        {!collapsed || !hasSidebar ? (
          <View>
            <Text style={styles.navLabel}>{t(item.label)}</Text>
            {!available ? <Text style={styles.pending}>{t('franchiseNotMigratedBadge')}</Text> : null}
          </View>
        ) : null}
      </Pressable>
    );
  }

  function renderNavigation() {
    const compact = hasSidebar && collapsed;
    return (
      <View style={[styles.sidebar, compact && styles.sidebarCollapsed]}>
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
        <ScrollView style={styles.nav} contentContainerStyle={styles.navContent}>
          {menuGroups.map((group, index) => (
            <View key={group.label ?? index}>
              {group.label && !compact ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: expandedGroup === group.label }}
                  onPress={() => setExpandedGroup((current) => current === group.label ? null : group.label ?? null)}
                >
                  <Text style={styles.group}>{t(group.label)}</Text>
                </Pressable>
              ) : null}
              {!group.label || compact || expandedGroup === group.label ? group.items.map(renderNavItem) : null}
            </View>
          ))}
        </ScrollView>
        <View style={styles.footer}>
          {renderNavItem({ key: 'profile', label: 'adminProfile' })}
          {renderNavItem({ key: 'store-config', label: 'franchiseStoreConfig' })}
          {!compact ? <Text numberOfLines={2} style={styles.body}>{activeStore?.name}</Text> : null}
          {stores.length > 1 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('franchiseSwitchStore')}
              onPress={() => { setDrawerOpen(false); setPickerOpen(true); setVersion((value) => value + 1); }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{compact ? t('franchiseSwitchShort') : t('franchiseSwitchStore')}</Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" accessibilityLabel={t('signOut')} onPress={onLogout} style={styles.button}>
            <Text style={styles.buttonText}>{t('signOut')}</Text>
          </Pressable>
        </View>
      </View>
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
          </View>
        ) : (
          <View style={styles.pickerBackdrop}>
            <StorePicker stores={stores} onSelect={selectStore} />
          </View>
        )}
        <Pressable accessibilityRole="button" accessibilityLabel={t('signOut')} onPress={onLogout} style={styles.button}>
          <Text style={styles.buttonText}>{t('signOut')}</Text>
        </Pressable>
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
        {tab === 'dashboard' ? <FranchiseDashboardScreen key={activeStore._id} storeId={activeStore._id} /> : tab === 'profile' ? (
          <AdminProfileScreen user={user} onUserUpdated={setUser} />
        ) : (
          <View style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.title}>{t(currentLabel)}</Text>
              <Text style={styles.body}>{t('franchiseNotMigrated')}</Text>
            </View>
          </View>
        )}
      </View>
      {!hasSidebar && drawerOpen && !pickerOpen ? (
        <Modal transparent visible animationType="none" onRequestClose={() => setDrawerOpen(false)}>
          <SafeAreaView style={styles.modalRoot}>
            {renderNavigation()}
            <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={() => setDrawerOpen(false)} style={styles.scrim} />
          </SafeAreaView>
        </Modal>
      ) : null}
      {pickerOpen ? (
        <Modal transparent visible animationType="none" onRequestClose={() => setPickerOpen(false)}>
          <SafeAreaView style={styles.pickerBackdrop}>
            <StorePicker stores={stores} activeStoreId={activeStore._id} onSelect={selectStore} onCancel={() => setPickerOpen(false)} />
          </SafeAreaView>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}
