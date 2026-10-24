import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { apiRequest } from '../../api/auth';
import { AppLoader } from '../../components/AppLoader';
import { theme } from '../../config/theme';
import { t } from '../../i18n';
import { dashboardStyles } from '../../styles/dashboardStyles';
import { currentMonthRange, datesBetween, thisWeekRange, validDateRange } from './dashboardDates';
import { DashboardBars, formatMoney } from './DashboardCharts';
import { franchiseStyles as styles } from './franchiseStyles';
import type { DailySale, FranchiseDashboardStats } from './types';

export function FranchiseDashboardScreen({ storeId }: { storeId: string }) {
  const { width } = useWindowDimensions();
  const [stats, setStats] = useState<FranchiseDashboardStats | null>(null);
  const [sales, setSales] = useState<DailySale[]>([]);
  const [range, setRange] = useState(currentMonthRange);
  const [appliedRange, setAppliedRange] = useState(currentMonthRange);
  const [error, setError] = useState('');
  const [salesError, setSalesError] = useState('');
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setStats(null);
    apiRequest(`/dashboard?storeId=${encodeURIComponent(storeId)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(t('adminLoadFailed'));
        const data: FranchiseDashboardStats = await response.json();
        if (active) setStats(data);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : t('adminLoadFailed'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [storeId, version]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setSalesLoading(true);
    setSalesError('');
    setSales([]);
    apiRequest(`/sales?storeId=${encodeURIComponent(storeId)}&from=${appliedRange.from}&to=${appliedRange.to}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(t('franchiseSalesLoadFailed'));
        const data: { sales: DailySale[] } = await response.json();
        if (active) setSales(data.sales);
      })
      .catch((reason: unknown) => {
        if (active) setSalesError(reason instanceof Error ? reason.message : t('franchiseSalesLoadFailed'));
      })
      .finally(() => { if (active) setSalesLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [storeId, appliedRange, version]);

  function applyRange(next = range) {
    setRange(next);
    if (validDateRange(next.from, next.to)) setAppliedRange(next);
  }

  const salesByDate = new Map(sales.map((sale) => [sale.date, sale.totalSale]));
  const summaryCards = stats ? [
    { label: t('franchiseMyStores'), value: String(stats.storeCount) },
    { label: t('franchiseEmployeeSummary'), value: String(stats.employeeSummary) },
    { label: t('franchiseMonthlySales'), value: formatMoney(stats.salesSummary) },
    { label: t('franchiseAttendanceSummary'), value: String(stats.attendanceSummary) },
  ] : [];

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>{t('adminDashboard')}</Text>
        <Text style={styles.body}>{t('adminOverviewDescription')}</Text>
        <Pressable accessibilityRole="button" onPress={() => setVersion((value) => value + 1)} style={styles.button}>
          <Text style={styles.buttonText}>{t('adminRefresh')}</Text>
        </Pressable>
      </View>
      {loading ? <AppLoader /> : error ? (
        <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
      ) : stats ? (
        <>
          <View style={dashboardStyles.cardGrid}>
            {summaryCards.map((card, index) => (
              <View key={card.label} style={[
                dashboardStyles.statCard,
                width >= 1200 && dashboardStyles.statCardWide,
                index % 2 ? dashboardStyles.statCardOrange : dashboardStyles.statCardTeal,
              ]}>
                <Text style={dashboardStyles.statLabel}>{card.label}</Text>
                <Text style={dashboardStyles.statValue}>{card.value}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.subtitle}>{t('franchiseAttendancePending')}</Text>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('franchiseSalesTrend')}</Text>
            <View style={styles.filters}>
              {(['from', 'to'] as const).map((field) => (
                <View key={field} style={styles.dateField}>
                  <Text style={styles.body}>{t(field === 'from' ? 'franchiseFrom' : 'franchiseTo')}</Text>
                  <TextInput
                    accessibilityLabel={t(field === 'from' ? 'franchiseFrom' : 'franchiseTo')}
                    value={range[field]}
                    placeholder="YYYY-MM-DD"
                    autoCapitalize="none"
                    maxLength={10}
                    onChangeText={(value) => setRange((current) => ({ ...current, [field]: value }))}
                    style={styles.dateInput}
                  />
                </View>
              ))}
            </View>
            <View style={styles.filters}>
              <Pressable accessibilityRole="button" onPress={() => applyRange()} style={styles.button}>
                <Text style={styles.buttonText}>{t('adminApplyFilters')}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => applyRange(thisWeekRange())} style={styles.button}>
                <Text style={styles.buttonText}>{t('franchiseThisWeek')}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => applyRange(currentMonthRange())} style={styles.button}>
                <Text style={styles.buttonText}>{t('franchiseThisMonth')}</Text>
              </Pressable>
            </View>
            {!validDateRange(range.from, range.to) ? <Text accessibilityRole="alert" style={styles.error}>{t('franchiseInvalidDates')}</Text> : null}
            <Text style={styles.subtitle}>{appliedRange.from} - {appliedRange.to}</Text>
            {salesLoading ? <AppLoader variant="inline" /> : salesError ? (
              <Text accessibilityRole="alert" style={styles.error}>{salesError}</Text>
            ) : (
              <DashboardBars items={datesBetween(appliedRange.from, appliedRange.to).map((date) => {
                const value = salesByDate.get(date) ?? 0;
                return { label: date, values: [value], description: formatMoney(value) };
              })} />
            )}
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('franchiseAttrition')}</Text>
            <Text style={styles.body}>{t('franchiseAttritionDescription')}</Text>
            {stats.attritionTrend.every((month) => month.headcount === 0) ? <Text style={styles.body}>{t('franchiseNoEmployeeHistory')}</Text> : (
              <DashboardBars colors={[theme.colors.orange]} items={stats.attritionTrend.map((month) => ({
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
            {stats.expenseBreakdown.length === 0 ? <Text style={styles.body}>{t('franchiseNoExpenses')}</Text> : stats.expenseBreakdown.map((item) => (
              <View key={item.name} style={styles.expenseRow}>
                <Text style={styles.body}>{item.name}: {formatMoney(item.amount)}</Text>
                <View style={styles.expenseTrack}>
                  <View style={[styles.expenseBar, { width: `${(item.amount / Math.max(1, ...stats.expenseBreakdown.map((expense) => expense.amount))) * 100}%` }]} />
                </View>
              </View>
            ))}
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('franchisePaymentMix')}</Text>
            <Text style={styles.body}>{t('franchisePaymentDescription')}</Text>
            <Text style={styles.body}>{t('franchisePaymentLegend')}</Text>
            {stats.paymentMixTrend.length === 0 ? <Text style={styles.body}>{t('franchiseNoSalesHistory')}</Text> : (
              <DashboardBars colors={[theme.colors.teal, '#3182CE', theme.colors.orange]} items={stats.paymentMixTrend.map((month) => ({
                label: month.monthLabel,
                values: [month.onlinePercent, month.upiPercent, month.cashPercent],
                description: `${month.onlinePercent}% / ${month.upiPercent}% / ${month.cashPercent}%`,
              }))} />
            )}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
