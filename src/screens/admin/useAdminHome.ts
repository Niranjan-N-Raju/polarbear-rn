import { useCallback,useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest,setAccessToken } from '../../api/auth';
import { LayoutDashboard,Store,UserRound,UsersRound } from '../../icons';
import { getAdminDrawerSafeAreaStyles,getAdminSafeAreaStyles } from '../../styles/adminStyles';
import { getAdminLayout } from '../../utils/adminLayout';
import type { AdminHomeScreenProps,AdminTab } from './types';


export function useAdminHome({ user: initialUser, onLogout }: AdminHomeScreenProps) {
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
return { layout, user, setUser, activeTab, setActiveTab, isSidebarCollapsed, setIsSidebarCollapsed, isDrawerOpen, setIsDrawerOpen, isLoggingOut, appToast, safeAreaStyles, drawerSafeAreaStyles, dismissAppToast, showAppToast, logout, tabs, primaryTabs };
}
