import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { apiRequest } from '../../api/auth';
import { theme } from '../../config/theme';
import { t, type TranslationKey } from '../../i18n';
import { adminStyles as styles } from '../../styles/adminStyles';

interface DashboardStats {
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

const statCards: { key: keyof DashboardStats; label: TranslationKey }[] = [
  { key: 'totalStores', label: 'adminStoreTotal' },
  { key: 'activeStores', label: 'adminActiveStores' },
  { key: 'franchiseStores', label: 'adminFranchiseStores' },
  { key: 'companyStores', label: 'adminCompanyStores' },
  { key: 'totalUsers', label: 'adminTotalUsers' },
  { key: 'subAdmins', label: 'adminSubAdmins' },
  { key: 'storeAdmins', label: 'adminStoreAdmins' },
  { key: 'employees', label: 'adminEmployees' },
];

export function AdminDashboardScreen() {
  const { width } = useWindowDimensions();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const response = await apiRequest('/dashboard');
      if (!response.ok) throw new Error('dashboard request failed');
      setStats((await response.json()) as DashboardStats);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const cardsWide = width >= theme.layout.tabletBreakpoint;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>{t('adminOverview')}</Text>
        <Text style={styles.screenDescription}>{t('adminOverviewDescription')}</Text>
        <Pressable accessibilityRole="button" onPress={() => void loadStats()} style={styles.refreshButton}>
          <RefreshCw color={theme.colors.teal} size={theme.layout.iconSize} />
          <Text style={styles.refreshText}>{t('adminRefresh')}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.colors.orange} size="large" />
      ) : hasError || !stats ? (
        <Text accessibilityRole="alert" style={[styles.stateMessage, styles.stateError]}>
          {t('adminLoadFailed')}
        </Text>
      ) : (
        <View style={styles.cardGrid}>
          {statCards.map((card) => (
            <View key={card.key} style={[styles.statCard, cardsWide && styles.statCardWide]}>
              <Text style={styles.statLabel}>{t(card.label)}</Text>
              <Text style={styles.statValue}>{stats[card.key] ?? 0}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
