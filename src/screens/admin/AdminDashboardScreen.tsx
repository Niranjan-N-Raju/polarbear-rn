import { Platform,ScrollView,Text,View } from 'react-native';
import { AppLoader } from '../../components/AppLoader';
import { SummaryCards } from '../../components/SummaryCards';
import { theme } from '../../config/theme';
import { t } from '../../i18n';
import { adminStyles as styles } from '../../styles/adminStyles';
import { dashboardStatCards,getDashboardCardColor } from '../../utils/dashboardConfig';
import { useAdminDashboard } from './useAdminDashboard';


export function AdminDashboardScreen() {
const { layout, perRow, stats, isLoading, hasError } = useAdminDashboard();
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
