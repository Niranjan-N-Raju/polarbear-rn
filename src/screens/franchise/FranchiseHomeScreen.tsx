import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLoader } from '../../components/AppLoader';
import { ResponsiveDrawerModal } from '../../components/ResponsiveDrawerModal';
import { theme } from '../../config/theme';
import { t } from '../../i18n';
import { ChevronsLeft, LogOut, Menu, RefreshCw, Store, UsersRound, X } from '../../icons';
import { AdminProfileScreen } from '../admin/AdminProfileScreen';
import { FranchiseAttendanceScreen } from './attendance/FranchiseAttendanceScreen';
import { FranchiseEmployeesScreen } from './employees/FranchiseEmployeesScreen';
import { FranchiseDashboardScreen } from './FranchiseDashboardScreen';
import { FranchiseMenuGroup } from './FranchiseMenuGroup';
import { franchiseStyles as styles } from './franchiseStyles';
import { FranchiseInventoryScreen } from './inventory/FranchiseInventoryScreen';
import { menuGroups, menuIcons, type MenuItem } from './navigation';
import { FranchisePnlScreen } from './pnl/FranchisePnlScreen';
import { FranchiseSalaryScreen } from './salary/FranchiseSalaryScreen';
import { FranchiseSalesScreen } from './sales/FranchiseSalesScreen';
import { FranchiseStoreConfigScreen } from './store-config/FranchiseStoreConfigScreen';
import { StorePicker } from './StorePicker';
import { useFranchiseHome, type FranchiseHomeScreenProps } from './useFranchiseHome';
import { FranchiseWithdrawalsScreen } from './withdrawals/FranchiseWithdrawalsScreen';


export function FranchiseHomeScreen({ user: initialUser, onLogout }: FranchiseHomeScreenProps) {
  const {
    hasSidebar,
    pickerPanelStyle,
    user,
    setUser,
    stores,
    activeStore,
    loading,
    error,
    isLoggingOut,
    setVersion,
    pickerOpen,
    setPickerOpen,
    drawerOpen,
    setDrawerOpen,
    collapsed,
    setCollapsed,
    tab,
    expandedGroup,
    setExpandedGroup,
    currentLabel,
    selectStore,
    navigate,
    logout,
  } = useFranchiseHome({ user: initialUser, onLogout });
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
            <Pressable accessibilityRole="button" accessibilityLabel={t('signOut')} disabled={isLoggingOut} onPress={logout} style={[styles.navItem, styles.signOutAction, compact && styles.compactAction]}>
              {isLoggingOut ? <AppLoader variant="inline" /> : <LogOut size={20} color={theme.colors.muted} />}
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
            <Pressable accessibilityRole="button" accessibilityLabel={t('signOut')} disabled={isLoggingOut} onPress={logout} style={styles.button}>
              <Text style={styles.buttonText}>{t('signOut')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.pickerScreen}>
            <ResponsiveDrawerModal visible closeLabel={t('franchiseSelectStore')} onClose={() => undefined} panelStyle={pickerPanelStyle}>
              <StorePicker stores={stores} onSelect={selectStore} onSignOut={logout} fill={hasSidebar} />
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
        <View style={[styles.page, Platform.OS === 'web' && tab !== 'dashboard' && styles.pageWeb]}>
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
