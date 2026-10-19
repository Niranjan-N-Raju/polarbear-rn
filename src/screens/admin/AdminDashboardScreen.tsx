import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Building2, CircleCheck, Handshake, ShieldCheck, Store, UserRoundCog, UsersRound } from 'lucide-react-native';
import { apiRequest } from '../../api/auth';
import { theme } from '../../config/theme';
import { t, type TranslationKey } from '../../i18n';
import { adminStyles as styles } from '../../styles/adminStyles';
import { getAdminLayout, getDashboardCardColor } from '../../utils/adminLayout';

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
  const layout = getAdminLayout(width);
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

  return (
    <ScrollView contentContainerStyle={styles.screenScroll}>
      <View style={styles.screenHeader}>
        {layout.dashboardEyebrow ? <Text style={styles.screenEyebrow}>{t('adminOverview')}</Text> : null}
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
          {statCards.map((card, index) => {
            const color = getDashboardCardColor(index, card.color, layout.isWeb && width >= 768);
            const isTeal = color === 'teal';
            return (
              <View
                key={card.key}
                style={[
                  styles.statCard,
                  isTeal ? styles.statCardTeal : styles.statCardOrange,
                  layout.dashboardCardsTablet && styles.statCardTablet,
                  layout.dashboardCardsWide && styles.statCardWide,
                ]}
              >
                <View style={[styles.statIconTile, isTeal ? styles.statIconTeal : styles.statIconOrange]}>
                  <card.Icon color={isTeal ? theme.colors.teal : theme.colors.orange} size={layout.dashboardIconSize} />
                </View>
                <Text style={styles.statLabel}>{t(card.label)}</Text>
                <Text style={[styles.statValue, isTeal ? styles.statValueTeal : styles.statValueOrange]}>
                  {stats[card.key] ?? 0}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
