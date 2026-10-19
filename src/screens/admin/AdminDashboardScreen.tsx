import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { apiRequest } from '../../api/auth';
import { theme } from '../../config/theme';
import { t } from '../../i18n';
import { adminStyles as styles } from '../../styles/adminStyles';
import { dashboardStyles as cardStyles } from '../../styles/dashboardStyles';
import { dashboardStatCards, getDashboardCardColor, getDashboardLayout, type DashboardStats } from '../../utils/dashboardConfig';

export function AdminDashboardScreen() {
  const { width } = useWindowDimensions();
  const layout = getDashboardLayout(width);
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
        <View style={cardStyles.cardGrid}>
          {dashboardStatCards.map((card, index) => {
            const color = getDashboardCardColor(index, card.color, layout.useWebAlternatingColors);
            const isTeal = color === 'teal';
            return (
              <View
                key={card.key}
                style={[
                  cardStyles.statCard,
                  isTeal ? cardStyles.statCardTeal : cardStyles.statCardOrange,
                  layout.dashboardCardsTablet && cardStyles.statCardTablet,
                  layout.dashboardCardsWide && cardStyles.statCardWide,
                ]}
              >
                <View style={[cardStyles.statIconTile, isTeal ? cardStyles.statIconTeal : cardStyles.statIconOrange]}>
                  <card.Icon color={isTeal ? theme.colors.teal : theme.colors.orange} size={layout.dashboardIconSize} />
                </View>
                <Text style={cardStyles.statLabel}>{t(card.label)}</Text>
                <Text style={[cardStyles.statValue, isTeal ? cardStyles.statValueTeal : cardStyles.statValueOrange]}>
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
