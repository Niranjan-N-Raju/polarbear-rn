import { Platform, Text, useWindowDimensions, View } from 'react-native';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { DashboardBars, formatMoney } from '../DashboardCharts';
import { franchiseStyles as styles } from '../franchiseStyles';
import type { FranchiseDashboardStats } from '../types';

export function DashboardInsights({ stats }: { stats: FranchiseDashboardStats }) {
  const { width } = useWindowDimensions();
  const compactCharts = Platform.OS !== 'web' || width < theme.layout.tabletBreakpoint;
  const maxExpense = Math.max(1, ...stats.expenseBreakdown.map((expense) => expense.amount));
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('franchiseAttrition')}</Text>
        <Text style={styles.body}>{t('franchiseAttritionDescription')}</Text>
        {stats.attritionTrend.every((month) => month.headcount === 0) ? <Text style={styles.body}>{t('franchiseNoEmployeeHistory')}</Text> : (
          <DashboardBars unit="percent" colors={[theme.colors.orange]} items={stats.attritionTrend.map((month) => ({
            label: month.monthLabel, values: [month.rate],
            description: `${month.rate}% (${month.leavers}/${month.headcount})`,
          }))} />
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('franchiseWeekdays')}</Text>
        <Text style={styles.body}>{t('franchiseWeekdaysDescription')}</Text>
        {stats.weekdayPerformance.every((day) => day.average === 0) ? <Text style={styles.body}>{t('franchiseNoSalesHistory')}</Text> : (
          <DashboardBars items={stats.weekdayPerformance.map((day) => ({
            label: day.day, values: [day.average], description: formatMoney(day.average),
          }))} />
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('franchiseExpenseBreakdown')}</Text>
        <Text style={styles.body}>{t('franchiseExpenseDescription')}</Text>
        {stats.expenseBreakdown.length === 0 ? <Text style={styles.body}>{t('franchiseNoExpenses')}</Text> : compactCharts ? (
          <DashboardBars items={stats.expenseBreakdown.map((item) => ({
            label: item.name, values: [item.amount], description: formatMoney(item.amount),
          }))} />
        ) : stats.expenseBreakdown.map((item) => (
          <View key={item.name} style={styles.expenseRow}>
            <Text style={styles.body}>{item.name}: {formatMoney(item.amount)}</Text>
            <View style={styles.expenseTrack}>
              <View style={[styles.expenseBar, { width: `${(item.amount / maxExpense) * 100}%` }]} />
            </View>
          </View>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('franchisePaymentMix')}</Text>
        <Text style={styles.body}>{t('franchisePaymentDescription')}</Text>
        <Text style={styles.body}>{t('franchisePaymentLegend')}</Text>
        {stats.paymentMixTrend.length === 0 ? <Text style={styles.body}>{t('franchiseNoSalesHistory')}</Text> : (
          <DashboardBars unit="percent" colors={[theme.colors.teal, '#3182CE', theme.colors.orange]} items={stats.paymentMixTrend.map((month) => ({
            label: month.monthLabel,
            values: [month.onlinePercent, month.upiPercent, month.cashPercent],
            description: `${month.onlinePercent}% / ${month.upiPercent}% / ${month.cashPercent}%`,
          }))} />
        )}
      </View>
    </>
  );
}
