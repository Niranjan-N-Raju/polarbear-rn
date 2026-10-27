import { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { AppLoader } from '../../components/AppLoader';
import { apiRequest } from '../../api/auth';
import { theme } from '../../config/theme';
import { t } from '../../i18n';
import { adminStyles as styles } from '../../styles/adminStyles';
import { SummaryCards } from '../../components/SummaryCards';
import { dashboardStatCards, getDashboardCardColor, getDashboardLayout } from '../../utils/dashboardConfig';
import type { DashboardStats } from '../../utils/types';

export function AdminDashboardScreen() {
  const { width } = useWindowDimensions();
  const layout = getDashboardLayout(width);
  const perRow = layout.dashboardCardsWide ? 4 : layout.dashboardCardsTablet ? 3 : 2;
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

  if (isLoading) return <AppLoader variant="screen" />;

  return (
    <ScrollView contentContainerStyle={styles.screenScroll}>
      <View style={styles.screenHeader}>
        {layout.dashboardEyebrow ? <Text style={styles.screenEyebrow}>{t('adminOverview')}</Text> : null}
        <Text style={styles.screenTitle}>{t('adminDashboard')}</Text>
        <Text style={styles.screenDescription}>{t('adminOverviewDescription')}</Text>
      </View>

      {hasError || !stats ? (
        <Text accessibilityRole="alert" style={[styles.stateMessage, styles.stateError]}>
          {t('adminLoadFailed')}
        </Text>
      ) : (
        <SummaryCards
          cards={dashboardStatCards.map((card, index) => ({
            key: card.key,
            label: t(card.label),
            value: stats[card.key] ?? 0,
            color: theme.colors[getDashboardCardColor(index, perRow)],
            Icon: card.Icon,
          }))}
          isWeb={Platform.OS === 'web'}
          perRow={perRow}
        />
      )}
    </ScrollView>
  );
}
