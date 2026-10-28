import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { apiRequest } from '../../api/auth';
import type { AuthenticatedUser } from '../../api/types';
import type { TranslationKey } from '../../i18n';
import { t } from '../../i18n';
import { getAdminLayout } from '../../utils/adminLayout';
import { menuGroups } from './navigation';
import type { FranchiseStore } from './types';
export interface FranchiseHomeScreenProps {
  user: AuthenticatedUser;
  onLogout: () => void;
}
export function useFranchiseHome({ user: initialUser, onLogout }: FranchiseHomeScreenProps) {
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
        const data = await response.json().catch(() => { throw new Error(t('franchiseStoresLoadFailed')); }) as { franchises: FranchiseStore[]; };
        if (!active) return;
        setStores(data.franchises);
        // Refresh preserves an accessible selection; multiple stores require an explicit choice.
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
    // Enter the new store at a predictable screen rather than retaining the previous feature.
    setTab('dashboard');
  }
  function navigate(key: string) {
    setTab(key);
    setDrawerOpen(false);
  }
  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const response = await apiRequest('/auth/logout', { method: 'POST' });
      if (!response.ok && response.status !== 401) {
        if (__DEV__) console.warn('[auth.logout] Server revocation failed; only the local session will be cleared.');
      }
    } catch {
      if (__DEV__) console.warn('[auth.logout] Server unreachable; only the local session will be cleared.');
    } finally {
      onLogout();
      setIsLoggingOut(false);
    }
  }
  return {
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
  };
}
