import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { LayoutDashboard, LogOut, Menu, Store, UserRound, UsersRound, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest, setAccessToken, type AuthenticatedUser } from '../../api/auth';
import { theme } from '../../config/theme';
import { t, translateRole } from '../../i18n';
import { adminStyles as styles, getAdminDrawerSafeAreaStyles, getAdminSafeAreaStyles } from '../../styles/adminStyles';
import { AdminDashboardScreen } from './AdminDashboardScreen';
import { AdminProfileScreen } from './AdminProfileScreen';
import { AdminStoresScreen } from './AdminStoresScreen';
import { AdminUsersScreen } from './AdminUsersScreen';

export type AdminTab = 'dashboard' | 'stores' | 'users' | 'profile';

interface AdminHomeScreenProps {
  user: AuthenticatedUser;
  onLogout: () => void;
}

export function AdminHomeScreen({ user: initialUser, onLogout }: AdminHomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const safeAreaStyles = getAdminSafeAreaStyles(insets.top, insets.bottom);
  const drawerSafeAreaStyles = getAdminDrawerSafeAreaStyles(insets.top, insets.bottom);

  async function logout(): Promise<void> {
    setIsLoggingOut(true);
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Clearing the local session is sufficient for the stateless bearer token.
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

  return (
    <View style={[styles.root, safeAreaStyles.root]}>
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
            <Text style={styles.headerName} numberOfLines={1}>{t('brandName')}</Text>
            <Text style={styles.headerUser} numberOfLines={1}>
              {user.name} · {translateRole(user.role)}
            </Text>
            <Text style={styles.headerTitle}>{t(tabs.find((tab) => tab.key === activeTab)!.label)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {activeTab === 'dashboard' ? <AdminDashboardScreen /> : null}
        {activeTab === 'stores' ? <AdminStoresScreen userId={user.id} /> : null}
        {activeTab === 'users' ? <AdminUsersScreen /> : null}
        {activeTab === 'profile' ? <AdminProfileScreen user={user} onUserUpdated={setUser} /> : null}
      </View>

      <Modal
        visible={isDrawerOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsDrawerOpen(false)}
      >
        <View style={styles.drawerRoot}>
          <View style={[styles.drawerPanel, drawerSafeAreaStyles.drawerTop]}>
            <View style={styles.drawerHeader}>
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

            <View style={styles.drawerList}>
              {tabs.map(({ key, label, Icon }) => {
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
                    style={[styles.drawerItem, active && styles.drawerItemActive]}
                  >
                    <Icon color={active ? theme.colors.orange : theme.colors.muted} size={theme.layout.iconSize} />
                    <Text style={[styles.drawerItemText, active && styles.drawerItemTextActive]}>{t(label)}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.drawerFooter, drawerSafeAreaStyles.drawerBottom]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('signOut')}
                disabled={isLoggingOut}
                onPress={() => void logout()}
                style={styles.drawerLogout}
              >
                {isLoggingOut ? <ActivityIndicator color={theme.colors.muted} /> : <LogOut color={theme.colors.muted} size={theme.layout.iconSize} />}
                <Text style={styles.logoutText}>{t('signOut')}</Text>
              </Pressable>
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
    </View>
  );
}
