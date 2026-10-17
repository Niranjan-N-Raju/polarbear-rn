import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Building2, CircleCheck, Handshake, ShieldCheck, Store, UserRoundCog, UsersRound } from 'lucide-react-native';
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

const statCards: { key: keyof DashboardStats; label: TranslationKey; color: 'teal' | 'orange'; Icon: typeof Store }[] = [
  { key: 'totalStores', label: 'adminStoreTotal', color: 'teal', Icon: Store },
  { key: 'activeStores', label: 'adminActiveStores', color: 'orange', Icon: CircleCheck },
  { key: 'franchiseStores', label: 'adminFranchiseStores', color: 'orange', Icon: Handshake },
  { key: 'companyStores', label: 'adminCompanyStores', color: 'teal', Icon: Building2 },
  { key: 'totalUsers', label: 'adminTotalUsers', color: 'teal', Icon: UsersRound },
  { key: 'subAdmins', label: 'adminSubAdmins', color: 'orange', Icon: ShieldCheck },
  { key: 'storeAdmins', label: 'adminStoreAdmins', color: 'orange', Icon: UserRoundCog },
  { key: 'employees', label: 'adminEmployees', color: 'teal', Icon: UsersRound },
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

  const cardsWide = width >= (Platform.OS === 'web' ? 640 : theme.layout.tabletBreakpoint);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenEyebrow}>{t('adminOverview')}</Text>
        <Text style={styles.screenTitle}>{t('adminDashboard')}</Text>
        <Text style={styles.screenDescription}>{t('adminOverviewDescription')}</Text>
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
            <View
              key={card.key}
              style={[
                styles.statCard,
                card.color === 'teal' ? styles.statCardTeal : styles.statCardOrange,
                cardsWide && styles.statCardWide,
              ]}
            >
              <View style={[styles.statIconTile, card.color === 'teal' ? styles.statIconTeal : styles.statIconOrange]}>
                <card.Icon color={card.color === 'teal' ? theme.colors.teal : theme.colors.orange} size={Platform.OS === 'web' ? 16 : theme.layout.iconSize} />
              </View>
              <Text style={styles.statLabel}>{t(card.label)}</Text>
              <Text style={[styles.statValue, card.color === 'teal' ? styles.statValueTeal : styles.statValueOrange]}>
                {stats[card.key] ?? 0}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
