import { useEffect } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import { AppLoader } from '../../components/AppLoader';
import { AppToast } from '../../components/AppToast';
import { theme } from '../../config/theme';
import { t, translateRole } from '../../i18n';
import {
  ChevronRight,
  ChevronsLeft,
  LogOut,
  Menu,
  UserRound,
  X,
} from '../../icons';
import { adminStyles as styles } from '../../styles/adminStyles';
import { AdminDashboardScreen } from './AdminDashboardScreen';
import { AdminProductCategoriesScreen } from './product-categories/AdminProductCategoriesScreen';
import { AdminProductsScreen } from './menu-items/AdminProductsScreen';
import { AdminProfileScreen } from './AdminProfileScreen';
import { AdminRawMaterialsScreen } from './raw-materials/AdminRawMaterialsScreen';
import { AdminStoresScreen } from './stores/AdminStoresScreen';
import type { AdminHomeScreenProps } from './types';
import { useAdminHome } from './useAdminHome';
import { AdminUsersScreen } from './users/AdminUsersScreen';

export type { AdminTab } from './types';
export function AdminHomeScreen({
  user: initialUser,
  onLogout,
}: AdminHomeScreenProps) {
  const {
    layout,
    user,
    setUser,
    activeTab,
    setActiveTab,
    catalogExpanded,
    setCatalogExpanded,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isDrawerOpen,
    setIsDrawerOpen,
    isLoggingOut,
    appToast,
    safeAreaStyles,
    drawerSafeAreaStyles,
    dismissAppToast,
    showAppToast,
    logout,
    tabs,
    primaryTabs,
    catalogTabs,
  } = useAdminHome({ user: initialUser, onLogout });
  const activeLabel =
    [...tabs, ...catalogTabs].find(tab => tab.key === activeTab)?.label ??
    'adminDashboard';
  const documentTitle = `${t(activeLabel)} · ${t('brandName')}`;
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = documentTitle;
    }
  }, [documentTitle]);

  return (
    <View
      style={[
        styles.root,
        safeAreaStyles.root,
        layout.hasSidebar && styles.rootWeb,
      ]}
    >
      {layout.hasSidebar ? (
        <View
          style={[
            styles.webSidebar,
            isSidebarCollapsed && styles.webSidebarCollapsed,
            drawerSafeAreaStyles.drawerTop,
          ]}
        >
          <View
            style={[
              styles.webSidebarBrand,
              isSidebarCollapsed && styles.webSidebarBrandCollapsed,
            ]}
          >
            {!isSidebarCollapsed ? (
              <View style={styles.headerIdentity}>
                <View style={styles.headerBrand}>
                  <View style={styles.headerMark}>
                    <Text style={styles.headerMarkText}>
                      {t('brandInitials')}
                    </Text>
                  </View>
                  <Text style={styles.headerName}>{t('brandName')}</Text>
                </View>
                <Text style={styles.headerUser}>{user.name}</Text>
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isSidebarCollapsed
                  ? t('adminExpandSidebar')
                  : t('adminCollapseSidebar')
              }
              onPress={() => setIsSidebarCollapsed(collapsed => !collapsed)}
              style={styles.webSidebarCollapseButton}
            >
              {isSidebarCollapsed ? (
                <Menu color={theme.colors.muted} size={20} strokeWidth={1.8} />
              ) : (
                <ChevronsLeft
                  color={theme.colors.muted}
                  size={20}
                  strokeWidth={1.8}
                />
              )}
            </Pressable>
          </View>
          <View style={styles.webSidebarNav}>
            {primaryTabs.map(({ key, label, Icon }) => {
              const active = activeTab === key;
              if (key === 'catalog') {
                return (
                  <View key={key}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={isSidebarCollapsed ? t(label) : undefined}
                      accessibilityState={{ expanded: catalogExpanded }}
                      onPress={() => {
                        if (isSidebarCollapsed) {
                          setIsSidebarCollapsed(false);
                          setCatalogExpanded(true);
                        } else {
                          setCatalogExpanded(value => !value);
                        }
                      }}
                      style={[
                        styles.webSidebarItem,
                        isSidebarCollapsed && styles.webSidebarItemCollapsed,
                      ]}
                    >
                      <Icon
                        color={theme.colors.muted}
                        size={layout.sidebarIconSize}
                      />
                      {!isSidebarCollapsed ? (
                        <>
                          <Text style={styles.webSidebarItemText}>
                            {t(label)}
                          </Text>
                          <ChevronRight
                            color={theme.colors.muted}
                            size={14}
                            style={{ transform: [{ rotate: catalogExpanded ? '90deg' : '0deg' }] }}
                          />
                        </>
                      ) : null}
                    </Pressable>
                    {catalogExpanded && !isSidebarCollapsed ? (
                      <View>
                        {catalogTabs.map(({ key: childKey, label: childLabel, Icon: ChildIcon }) => {
                          const childActive = activeTab === childKey;
                          return (
                            <Pressable
                              key={childKey}
                              accessibilityRole="button"
                              accessibilityState={{ selected: childActive }}
                              onPress={() => {
                                setActiveTab(childKey);
                                setCatalogExpanded(true);
                              }}
                              style={[
                                styles.webSidebarItem,
                                { paddingLeft: 38 },
                                childActive && styles.webSidebarItemActive,
                              ]}
                            >
                              <ChildIcon color={childActive ? theme.colors.teal : theme.colors.muted} size={16} />
                              <Text style={[styles.webSidebarItemText, childActive && styles.webSidebarItemTextActive]}>
                                {t(childLabel)}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                );
              }
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setActiveTab(key)}
                  accessibilityLabel={isSidebarCollapsed ? t(label) : undefined}
                  style={[
                    styles.webSidebarItem,
                    key === 'dashboard' && styles.webSidebarGroupEnd,
                    isSidebarCollapsed && styles.webSidebarItemCollapsed,
                    active && styles.webSidebarItemActive,
                  ]}
                >
                  <Icon
                    color={active ? theme.colors.teal : theme.colors.muted}
                    size={layout.sidebarIconSize}
                  />
                  {!isSidebarCollapsed ? (
                    <Text
                      style={[
                        styles.webSidebarItemText,
                        active && styles.webSidebarItemTextActive,
                      ]}
                    >
                      {t(label)}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          <View style={styles.webSidebarFooter}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('adminProfile')}
              onPress={() => setActiveTab('profile')}
              style={[
                styles.webSidebarProfile,
                isSidebarCollapsed && styles.webSidebarProfileCollapsed,
              ]}
            >
              <UserRound
                color={
                  activeTab === 'profile'
                    ? theme.colors.teal
                    : theme.colors.muted
                }
                size={layout.sidebarIconSize}
              />
              {!isSidebarCollapsed ? (
                <Text
                  style={[
                    styles.webSidebarItemText,
                    activeTab === 'profile' && styles.webSidebarItemTextActive,
                  ]}
                >
                  {t('adminProfile')}
                </Text>
              ) : null}
            </Pressable>
            <View style={styles.webSidebarLogoutContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('signOut')}
                disabled={isLoggingOut}
                onPress={() => void logout()}
                style={[
                  styles.webSidebarLogout,
                  isSidebarCollapsed && styles.webSidebarItemCollapsed,
                ]}
              >
                {isLoggingOut ? (
                  <AppLoader variant="inline" color={theme.colors.muted} />
                ) : (
                  <LogOut
                    color={theme.colors.muted}
                    size={layout.sidebarIconSize}
                  />
                )}
                {!isSidebarCollapsed ? (
                  <Text style={styles.logoutText}>{t('signOut')}</Text>
                ) : null}
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
            <View style={styles.headerMark}>
              <Text style={styles.headerMarkText}>{t('brandInitials')}</Text>
            </View>
            <View style={styles.headerIdentity}>
              <Text style={styles.headerName} numberOfLines={1}>
                {t('brandName')}
              </Text>
              <Text style={styles.headerUser} numberOfLines={1}>
                {user.name} · {translateRole(user.role)}
              </Text>
              <Text style={styles.headerTitle}>{t(activeLabel)}</Text>
            </View>
          </View>
        </View>
      )}

      <View
        style={[styles.mainPanel, layout.hasSidebar && styles.mainPanelWeb]}
      >
        <View
          style={[styles.content, layout.compactWeb && styles.contentCompact]}
        >
          {activeTab === 'dashboard' ? <AdminDashboardScreen /> : null}
          {activeTab === 'stores' ? (
            <AdminStoresScreen userId={user.id} onToast={showAppToast} />
          ) : null}
          {activeTab === 'users' ? (
            <AdminUsersScreen onToast={showAppToast} />
          ) : null}
          {activeTab === 'raw-materials' && user.role === 'admin' ? (
            <AdminRawMaterialsScreen onToast={showAppToast} />
          ) : null}
          {activeTab === 'product-categories' && user.role === 'admin' ? (
            <AdminProductCategoriesScreen onToast={showAppToast} />
          ) : null}
          {activeTab === 'products' && user.role === 'admin' ? (
            <AdminProductsScreen onToast={showAppToast} />
          ) : null}
          {activeTab === 'profile' ? (
            <AdminProfileScreen
              user={user}
              onUserUpdated={setUser}
              onToast={showAppToast}
            />
          ) : null}
        </View>
      </View>

      {appToast ? (
        <AppToast
          message={appToast.message}
          tone={appToast.tone}
          onDismiss={dismissAppToast}
        />
      ) : null}

      {!layout.hasSidebar ? (
        <Modal
          visible={isDrawerOpen}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setIsDrawerOpen(false)}
        >
          <View style={styles.drawerRoot}>
            <View
              style={[
                styles.drawerPanel,
                layout.isWeb && styles.drawerPanelWeb,
                drawerSafeAreaStyles.drawerTop,
              ]}
            >
              <View
                style={[
                  styles.drawerHeader,
                  layout.isWeb && styles.drawerHeaderWeb,
                ]}
              >
                <View style={styles.headerBrand}>
                  <View style={styles.headerMark}>
                    <Text style={styles.headerMarkText}>
                      {t('brandInitials')}
                    </Text>
                  </View>
                  <View style={styles.headerIdentity}>
                    <Text style={styles.headerName}>{t('brandName')}</Text>
                    <Text style={styles.headerUser}>
                      {translateRole(user.role)}
                    </Text>
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

              <View
                style={[
                  styles.drawerList,
                  layout.isWeb && styles.drawerListWeb,
                ]}
              >
                {primaryTabs.map(({ key, label, Icon }) => {
                  const active = activeTab === key;
                  if (key === 'catalog') {
                    return (
                      <View key={key}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ expanded: catalogExpanded }}
                          onPress={() => setCatalogExpanded(value => !value)}
                          style={[
                            layout.isWeb ? styles.webSidebarItem : styles.drawerItem,
                          ]}
                        >
                          <Icon color={theme.colors.muted} size={layout.isWeb ? layout.sidebarIconSize : theme.layout.iconSize} />
                          <Text style={layout.isWeb ? styles.webSidebarItemText : styles.drawerItemText}>
                            {t(label)}
                          </Text>
                          <ChevronRight
                            color={theme.colors.muted}
                            size={14}
                            style={{ transform: [{ rotate: catalogExpanded ? '90deg' : '0deg' }] }}
                          />
                        </Pressable>
                        {catalogExpanded ? catalogTabs.map(({ key: childKey, label: childLabel, Icon: ChildIcon }) => {
                          const childActive = activeTab === childKey;
                          return (
                            <Pressable
                              key={childKey}
                              accessibilityRole="button"
                              accessibilityState={{ selected: childActive }}
                              onPress={() => {
                                setActiveTab(childKey);
                                setCatalogExpanded(true);
                                setIsDrawerOpen(false);
                              }}
                              style={[
                                layout.isWeb ? styles.webSidebarItem : styles.drawerItem,
                                { paddingLeft: layout.isWeb ? 38 : theme.spacing['3xl'] },
                                childActive && (layout.isWeb ? styles.webSidebarItemActive : styles.drawerItemActive),
                              ]}
                            >
                              <ChildIcon color={childActive ? theme.colors.teal : theme.colors.muted} size={layout.isWeb ? 16 : theme.layout.iconSize - 2} />
                              <Text style={[layout.isWeb ? styles.webSidebarItemText : styles.drawerItemText, childActive && (layout.isWeb ? styles.webSidebarItemTextActive : styles.drawerItemTextActive)]}>
                                {t(childLabel)}
                              </Text>
                            </Pressable>
                          );
                        }) : null}
                      </View>
                    );
                  }
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
                        layout.isWeb
                          ? styles.webSidebarItem
                          : styles.drawerItem,
                        layout.isWeb &&
                          key === 'dashboard' &&
                          styles.webSidebarGroupEnd,
                        active &&
                          (layout.isWeb
                            ? styles.webSidebarItemActive
                            : styles.drawerItemActive),
                      ]}
                    >
                      <Icon
                        color={active ? theme.colors.teal : theme.colors.muted}
                        size={
                          layout.isWeb
                            ? layout.sidebarIconSize
                            : theme.layout.iconSize
                        }
                      />
                      <Text
                        style={[
                          layout.isWeb
                            ? styles.webSidebarItemText
                            : styles.drawerItemText,
                          active &&
                            (layout.isWeb
                              ? styles.webSidebarItemTextActive
                              : styles.drawerItemTextActive),
                        ]}
                      >
                        {t(label)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View
                style={[
                  layout.isWeb ? styles.webSidebarFooter : styles.drawerFooter,
                  drawerSafeAreaStyles.drawerBottom,
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('adminProfile')}
                  onPress={() => {
                    setActiveTab('profile');
                    setIsDrawerOpen(false);
                  }}
                  style={
                    layout.isWeb ? styles.webSidebarProfile : styles.drawerItem
                  }
                >
                  <UserRound
                    color={
                      activeTab === 'profile'
                        ? theme.colors.teal
                        : theme.colors.muted
                    }
                    size={
                      layout.isWeb
                        ? layout.sidebarIconSize
                        : theme.layout.iconSize
                    }
                  />
                  <Text
                    style={[
                      layout.isWeb
                        ? styles.webSidebarItemText
                        : styles.drawerItemText,
                      activeTab === 'profile' &&
                        (layout.isWeb
                          ? styles.webSidebarItemTextActive
                          : styles.drawerItemTextActive),
                    ]}
                  >
                    {t('adminProfile')}
                  </Text>
                </Pressable>
                <View
                  style={
                    layout.isWeb
                      ? styles.webSidebarLogoutContainer
                      : styles.drawerSignOutContainer
                  }
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('signOut')}
                    disabled={isLoggingOut}
                    onPress={() => void logout()}
                    style={
                      layout.isWeb
                        ? styles.webSidebarLogout
                        : styles.drawerLogout
                    }
                  >
                    {isLoggingOut ? (
                      <AppLoader variant="inline" color={theme.colors.muted} />
                    ) : (
                      <LogOut
                        color={theme.colors.muted}
                        size={
                          layout.isWeb
                            ? layout.sidebarIconSize
                            : theme.layout.iconSize
                        }
                      />
                    )}
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
