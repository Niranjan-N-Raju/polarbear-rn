import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { AppLoader } from '../../components/AppLoader';
import { DateRangeFilterDrawer } from '../../components/DateRangeFilterDrawer';
import { SummaryCards } from '../../components/SummaryCards';
import { theme } from '../../config/theme';
import { t } from '../../i18n';
import { CalendarCheck, IndianRupee, RefreshCw, Store, UsersRound } from '../../icons';
import { getAdminLayout } from '../../utils/adminLayout';
import { getDashboardCardColor } from '../../utils/dashboardConfig';
import { formatMoney } from './DashboardCharts';
import { DashboardInsights } from './dashboard/DashboardInsights';
import { SalesTrendCard } from './dashboard/SalesTrendCard';
import { useFranchiseDashboard } from './dashboard/useFranchiseDashboard';
import { franchiseStyles as styles } from './franchiseStyles';

export function FranchiseDashboardScreen({ storeId }: { storeId: string }) {
  const { width, height } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const perRow = layout.desktopWeb ? 4 : 2;
  const dashboard = useFranchiseDashboard(storeId);
  const { stats } = dashboard;
  const summaryCards = stats ? [
    { label: t('franchiseMyStores'), value: stats.storeCount, Icon: Store },
    { label: t('franchiseEmployeeSummary'), value: stats.employeeSummary, Icon: UsersRound },
    { label: t('franchiseMonthlySales'), value: formatMoney(stats.salesSummary), Icon: IndianRupee },
    { label: t('franchiseAttendanceSummary'), value: stats.attendanceSummary, Icon: CalendarCheck },
  ].map((card, index) => ({ ...card, color: theme.colors[getDashboardCardColor(index, perRow)] })) : [];

  return (
    <>
      {dashboard.loading || dashboard.salesLoading ? <AppLoader variant="screen" /> : null}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.dashboardHeading}>
            <Text style={[styles.title, styles.dashboardTitle]}>{t('adminDashboard')}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('adminRefresh')} onPress={dashboard.refresh} style={styles.dashboardRefreshButton}>
              <RefreshCw size={20} color={theme.colors.teal} />
            </Pressable>
          </View>
          <Text style={styles.body}>{t('adminOverviewDescription')}</Text>
        </View>
        {dashboard.error ? (
          <Text accessibilityRole="alert" style={styles.error}>{dashboard.error}</Text>
        ) : null}
        {stats ? (
          <>
            <SummaryCards cards={summaryCards} isWeb={layout.isWeb} perRow={perRow} />
            <Text style={styles.subtitle}>{t('franchiseAttendancePending')}</Text>
            <SalesTrendCard
              compact={!layout.desktopWeb}
              sales={dashboard.sales}
              range={dashboard.appliedRange}
              loading={dashboard.salesLoading}
              loaded={dashboard.salesLoaded}
              error={dashboard.salesError}
              onApplyRange={dashboard.applyRange}
              onOpenFilters={dashboard.openFilters}
            />
            <DashboardInsights stats={stats} />
          </>
        ) : null}
      </ScrollView>
      <DateRangeFilterDrawer
        visible={dashboard.filtersOpen}
        title={t('franchiseFilterSales')}
        height={height}
        isWeb={layout.isWeb}
        range={dashboard.range}
        error={dashboard.filterError}
        onChange={dashboard.changeRange}
        onClose={dashboard.closeFilters}
        onClear={dashboard.clearFilters}
        onApply={() => dashboard.applyRange()}
      />
    </>
  );
}
