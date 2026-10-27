import { useCallback, useState } from 'react';
import { Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { ChevronsLeft, LayoutDashboard, LogOut, Menu, Store, UserRound, UsersRound, X } from '../../icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppToast } from '../../components/AppToast';
import { AppLoader } from '../../components/AppLoader';
import { apiRequest, setAccessToken } from '../../api/auth';
import { theme } from '../../config/theme';
import { t, translateRole } from '../../i18n';
import { adminStyles as styles, getAdminDrawerSafeAreaStyles, getAdminSafeAreaStyles } from '../../styles/adminStyles';
import { getAdminLayout } from '../../utils/adminLayout';
import { AdminDashboardScreen } from './AdminDashboardScreen';
import { AdminProfileScreen } from './AdminProfileScreen';
import { AdminStoresScreen } from './stores/AdminStoresScreen';
import { AdminUsersScreen } from './users/AdminUsersScreen';
import type { AdminHomeScreenProps, AdminTab } from './types';

export type { AdminTab } from './types';

export function AdminHomeScreen({ user: initialUser, onLogout }: AdminHomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [appToast, setAppToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const safeAreaStyles = getAdminSafeAreaStyles(insets.top, insets.bottom);
  const drawerSafeAreaStyles = getAdminDrawerSafeAreaStyles(insets.top, insets.bottom);
  const dismissAppToast = useCallback(() => setAppToast(null), []);
  const showAppToast = useCallback((message: string, tone: 'success' | 'error') => {
    setAppToast({ message, tone });
  }, []);

  async function logout(): Promise<void> {
    setIsLoggingOut(true);
    try {
      const response = await apiRequest('/auth/logout', { method: 'POST' });
      if (!response.ok && response.status !== 401) {
        if (__DEV__) console.warn('[auth.logout] Server revocation failed; only the local session will be cleared.');
      }
    } catch {
      if (__DEV__) console.warn('[auth.logout] Server unreachable; only the local session will be cleared.');
    } finally {
      setAccessToken(null);
      onLogout();
      setIsLoggingOut(false);
    }
  }

  const tabs = [
    { key: 'dashboard' as const, label: 'adminDashboard' as const, Icon: LayoutDashboard },
    { key: 'stores' as const, label: 'adminStores' as const, Icon: Store },
    { key: 'users' as const, label: 'adminUsers' as const, Icon: UsersRound },
    { key: 'profile' as const, label: 'adminProfile' as const, Icon: UserRound },
  ];
  const primaryTabs = tabs.filter((tab) => tab.key !== 'profile');

  return (
    <View style={[styles.root, safeAreaStyles.root, layout.hasSidebar && styles.rootWeb]}>
      {layout.hasSidebar ? (
        <View style={[styles.webSidebar, isSidebarCollapsed && styles.webSidebarCollapsed, drawerSafeAreaStyles.drawerTop]}>
          <View style={[styles.webSidebarBrand, isSidebarCollapsed && styles.webSidebarBrandCollapsed]}>
            {!isSidebarCollapsed ? (
              <View style={styles.headerIdentity}>
                <View style={styles.headerBrand}>
                  <View style={styles.headerMark}><Text style={styles.headerMarkText}>{t('brandInitials')}</Text></View>
                  <Text style={styles.headerName}>{t('brandName')}</Text>
                </View>
                <Text style={styles.headerUser}>{user.name}</Text>
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isSidebarCollapsed ? t('adminExpandSidebar') : t('adminCollapseSidebar')}
              onPress={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
              style={styles.webSidebarCollapseButton}
            >
              {isSidebarCollapsed ? <Menu color={theme.colors.muted} size={20} strokeWidth={1.8} /> : <ChevronsLeft color={theme.colors.muted} size={20} strokeWidth={1.8} />}
            </Pressable>
          </View>
          <View style={styles.webSidebarNav}>
            {primaryTabs.map(({ key, label, Icon }) => {
              const active = activeTab === key;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setActiveTab(key)}
                  accessibilityLabel={isSidebarCollapsed ? t(label) : undefined}
                  style={[styles.webSidebarItem, key === 'dashboard' && styles.webSidebarGroupEnd, isSidebarCollapsed && styles.webSidebarItemCollapsed, active && styles.webSidebarItemActive]}
                >
                  <Icon color={active ? theme.colors.teal : theme.colors.muted} size={layout.sidebarIconSize} />
                  {!isSidebarCollapsed ? <Text style={[styles.webSidebarItemText, active && styles.webSidebarItemTextActive]}>{t(label)}</Text> : null}
                </Pressable>
              );
            })}
          </View>
          <View style={styles.webSidebarFooter}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('adminProfile')}
              onPress={() => setActiveTab('profile')}
              style={[styles.webSidebarProfile, isSidebarCollapsed && styles.webSidebarProfileCollapsed]}
            >
              <UserRound color={activeTab === 'profile' ? theme.colors.teal : theme.colors.muted} size={layout.sidebarIconSize} />
              {!isSidebarCollapsed ? <Text style={[styles.webSidebarItemText, activeTab === 'profile' && styles.webSidebarItemTextActive]}>{t('adminProfile')}</Text> : null}
            </Pressable>
            <View style={styles.webSidebarLogoutContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('signOut')}
                disabled={isLoggingOut}
                onPress={() => void logout()}
                style={[styles.webSidebarLogout, isSidebarCollapsed && styles.webSidebarItemCollapsed]}
              >
                {isLoggingOut ? <AppLoader variant="inline" color={theme.colors.muted} /> : <LogOut color={theme.colors.muted} size={layout.sidebarIconSize} />}
                {!isSidebarCollapsed ? <Text style={styles.logoutText}>{t('signOut')}</Text> : null}
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('adminOpenMenu')}
            onPress={() => setIsDrawerOpen(true)}
            style={styles.menuButton}
          >
            <Menu color={theme.colors.ink} size={theme.layout.iconSize} />
          </Pressable>
          <View style={styles.headerBrand}>
            <View style={styles.headerMark}><Text style={styles.headerMarkText}>{t('brandInitials')}</Text></View>
            <View style={styles.headerIdentity}>
              <Text style={styles.headerName} numberOfLines={1}>{t('brandName')}</Text>
              <Text style={styles.headerUser} numberOfLines={1}>{user.name} · {translateRole(user.role)}</Text>
              <Text style={styles.headerTitle}>{t(tabs.find((tab) => tab.key === activeTab)!.label)}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.mainPanel, layout.hasSidebar && styles.mainPanelWeb]}>
      <View style={[styles.content, layout.compactWeb && styles.contentCompact]}>
        {activeTab === 'dashboard' ? <AdminDashboardScreen /> : null}
        {activeTab === 'stores' ? <AdminStoresScreen userId={user.id} onToast={showAppToast} /> : null}
        {activeTab === 'users' ? <AdminUsersScreen onToast={showAppToast} /> : null}
        {activeTab === 'profile' ? <AdminProfileScreen user={user} onUserUpdated={setUser} onToast={showAppToast} /> : null}
      </View>

      </View>

      {appToast ? <AppToast message={appToast.message} tone={appToast.tone} onDismiss={dismissAppToast} /> : null}

      {!layout.hasSidebar ? (
        <Modal
          visible={isDrawerOpen}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setIsDrawerOpen(false)}
        >
          <View style={styles.drawerRoot}>
            <View style={[styles.drawerPanel, layout.isWeb && styles.drawerPanelWeb, drawerSafeAreaStyles.drawerTop]}>
            <View style={[styles.drawerHeader, layout.isWeb && styles.drawerHeaderWeb]}>
              <View style={styles.headerBrand}>
                <View style={styles.headerMark}>
                  <Text style={styles.headerMarkText}>{t('brandInitials')}</Text>
                </View>
                <View style={styles.headerIdentity}>
                  <Text style={styles.headerName}>{t('brandName')}</Text>
                  <Text style={styles.headerUser}>{translateRole(user.role)}</Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('adminCloseMenu')}
                onPress={() => setIsDrawerOpen(false)}
                style={styles.drawerClose}
              >
                <X color={theme.colors.muted} size={theme.layout.iconSize} />
              </Pressable>
            </View>

            <View style={[styles.drawerList, layout.isWeb && styles.drawerListWeb]}>
              {primaryTabs.map(({ key, label, Icon }) => {
                const active = activeTab === key;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      setActiveTab(key);
                      setIsDrawerOpen(false);
                    }}
                    style={[
                      layout.isWeb ? styles.webSidebarItem : styles.drawerItem,
                      layout.isWeb && key === 'dashboard' && styles.webSidebarGroupEnd,
                      active && (layout.isWeb ? styles.webSidebarItemActive : styles.drawerItemActive),
                    ]}
                  >
                    <Icon color={active ? theme.colors.teal : theme.colors.muted} size={layout.isWeb ? layout.sidebarIconSize : theme.layout.iconSize} />
                    <Text style={[
                      layout.isWeb ? styles.webSidebarItemText : styles.drawerItemText,
                      active && (layout.isWeb ? styles.webSidebarItemTextActive : styles.drawerItemTextActive),
                    ]}>{t(label)}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={[layout.isWeb ? styles.webSidebarFooter : styles.drawerFooter, drawerSafeAreaStyles.drawerBottom]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('adminProfile')}
                onPress={() => {
                  setActiveTab('profile');
                  setIsDrawerOpen(false);
                }}
                style={layout.isWeb ? styles.webSidebarProfile : styles.drawerItem}
              >
                <UserRound color={activeTab === 'profile' ? theme.colors.teal : theme.colors.muted} size={layout.isWeb ? layout.sidebarIconSize : theme.layout.iconSize} />
                <Text style={[
                  layout.isWeb ? styles.webSidebarItemText : styles.drawerItemText,
                  activeTab === 'profile' && (layout.isWeb ? styles.webSidebarItemTextActive : styles.drawerItemTextActive),
                ]}>{t('adminProfile')}</Text>
              </Pressable>
              <View style={layout.isWeb ? styles.webSidebarLogoutContainer : styles.drawerSignOutContainer}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('signOut')}
                  disabled={isLoggingOut}
                  onPress={() => void logout()}
                  style={layout.isWeb ? styles.webSidebarLogout : styles.drawerLogout}
                >
                  {isLoggingOut ? <AppLoader variant="inline" color={theme.colors.muted} /> : <LogOut color={theme.colors.muted} size={layout.isWeb ? layout.sidebarIconSize : theme.layout.iconSize} />}
                  <Text style={styles.logoutText}>{t('signOut')}</Text>
                </Pressable>
              </View>
            </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('adminCloseMenu')}
              onPress={() => setIsDrawerOpen(false)}
              style={styles.drawerScrim}
            />
          </View>
        </Modal>
      ) : null}
    </View>
  );
}
