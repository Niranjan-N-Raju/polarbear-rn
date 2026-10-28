import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { AdminFormField } from '../../components/AdminFormField';
import { ResponsiveDrawerModal } from '../../components/ResponsiveDrawerModal';
import { apiRequest } from '../../api/auth';
import { AppLoader } from '../../components/AppLoader';
import { theme } from '../../config/theme';
import { t } from '../../i18n';
import { SummaryCards } from '../../components/SummaryCards';
import { CalendarCheck, Filter, IndianRupee, RefreshCw, Store, UsersRound, X } from '../../icons';
import { adminStyles } from '../../styles/adminStyles';
import { getAdminLayout } from '../../utils/adminLayout';
import { getDashboardCardColor } from '../../utils/dashboardConfig';
import { currentMonthRange, datesBetween, thisWeekRange, validDateRange } from './dashboardDates';
import { DashboardBars, formatMoney } from './DashboardCharts';
import { franchiseStyles as styles } from './franchiseStyles';
import type { DailySale, FranchiseDashboardStats } from './types';

export function FranchiseDashboardScreen({ storeId }: { storeId: string }) {
  const { width, height } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const compactShortcuts = !layout.desktopWeb;
  const perRow = layout.desktopWeb ? 4 : 2;
  const [stats, setStats] = useState<FranchiseDashboardStats | null>(null);
  const [sales, setSales] = useState<DailySale[]>([]);
  const [range, setRange] = useState(currentMonthRange);
  const [appliedRange, setAppliedRange] = useState(currentMonthRange);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterError, setFilterError] = useState('');
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
    if (!validDateRange(next.from, next.to)) {
      setFilterError(t('franchiseInvalidDates'));
      return;
    }
    setAppliedRange(next);
    setFilterError('');
    setFiltersOpen(false);
  }

  function openFilters() {
    setRange(appliedRange);
    setFilterError('');
    setFiltersOpen(true);
  }

  const salesByDate = new Map(sales.map((sale) => [sale.date, sale.totalSale]));
  const summaryCards = stats ? [
    { label: t('franchiseMyStores'), value: stats.storeCount, Icon: Store },
    { label: t('franchiseEmployeeSummary'), value: stats.employeeSummary, Icon: UsersRound },
    { label: t('franchiseMonthlySales'), value: formatMoney(stats.salesSummary), Icon: IndianRupee },
    { label: t('franchiseAttendanceSummary'), value: stats.attendanceSummary, Icon: CalendarCheck },
  ].map((card, index) => ({ ...card, color: theme.colors[getDashboardCardColor(index, perRow)] })) : [];

  return (
    <>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={styles.dashboardHeading}>
          <Text style={[styles.title, styles.dashboardTitle]}>{t('adminDashboard')}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('adminRefresh')}
            onPress={() => setVersion((value) => value + 1)}
            style={styles.dashboardRefreshButton}
          >
            <RefreshCw size={20} color={theme.colors.teal} />
          </Pressable>
        </View>
        <Text style={styles.body}>{t('adminOverviewDescription')}</Text>
      </View>
      {loading ? <AppLoader /> : error ? (
        <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
      ) : stats ? (
        <>
          <SummaryCards cards={summaryCards} isWeb={layout.isWeb} perRow={perRow} />
          <Text style={styles.subtitle}>{t('franchiseAttendancePending')}</Text>
          <View style={styles.card}>
            <View style={[styles.dashboardHeading, styles.salesHeading]}>
              <Text style={[styles.sectionTitle, styles.dashboardTitle]}>{t('franchiseSalesTrend')}</Text>
              <View style={[styles.filters, styles.salesShortcuts, compactShortcuts && styles.salesShortcutsCompact]}>
                <Pressable accessibilityRole="button" hitSlop={compactShortcuts ? 6 : undefined} onPress={() => applyRange(thisWeekRange())} style={[styles.button, compactShortcuts && styles.salesShortcutButtonCompact]}>
                  <Text style={[styles.buttonText, compactShortcuts && styles.salesShortcutTextCompact]}>{t('franchiseThisWeek')}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" hitSlop={compactShortcuts ? 6 : undefined} onPress={() => applyRange(currentMonthRange())} style={[styles.button, compactShortcuts && styles.salesShortcutButtonCompact]}>
                  <Text style={[styles.buttonText, compactShortcuts && styles.salesShortcutTextCompact]}>{t('franchiseThisMonth')}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={t('adminOpenFilters')} onPress={openFilters} style={adminStyles.filterIconButton}>
                  <Filter color={theme.colors.teal} size={18} />
                </Pressable>
              </View>
            </View>
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
    <ResponsiveDrawerModal
      visible={filtersOpen}
      closeLabel={t('adminCloseMenu')}
      onClose={() => setFiltersOpen(false)}
      panelStyle={!layout.isWeb ? { height: Math.min(height * 0.8, 390) } : undefined}
    >
      <View style={adminStyles.drawerContent}>
        <View style={adminStyles.drawerHeading}>
          <Text style={[adminStyles.modalTitle, adminStyles.drawerHeadingTitle]}>{t('franchiseFilterSales')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={() => setFiltersOpen(false)} style={adminStyles.userIconAction}>
            <X color={theme.colors.muted} size={18} />
          </Pressable>
        </View>
        <ScrollView style={adminStyles.drawerFormScroll} contentContainerStyle={adminStyles.filterDrawerFields} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          {(['from', 'to'] as const).map((field) => (
            <AdminFormField
              key={field}
              date
              label={t(field === 'from' ? 'franchiseFrom' : 'franchiseTo')}
              placeholder={t('franchiseDatePlaceholder')}
              value={range[field]}
              onChangeText={(value) => {
                setRange((current) => ({ ...current, [field]: value }));
                setFilterError('');
              }}
              containerStyle={adminStyles.filterDrawerField}
            />
          ))}
          {filterError ? <Text accessibilityRole="alert" style={styles.error}>{filterError}</Text> : null}
        </ScrollView>
        <View style={adminStyles.modalActions}>
          <View style={adminStyles.drawerActionSlot}>
            <Pressable accessibilityRole="button" onPress={() => applyRange(currentMonthRange())} style={[adminStyles.secondaryButton, adminStyles.drawerActionButton]}>
              <Text style={adminStyles.secondaryButtonText}>{t('adminClearFilters')}</Text>
            </Pressable>
          </View>
          <View style={adminStyles.drawerActionSlot}>
            <Pressable accessibilityRole="button" onPress={() => applyRange()} style={[adminStyles.primaryButton, adminStyles.drawerActionButton]}>
              <Text style={adminStyles.primaryButtonText}>{t('adminApplyFilters')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ResponsiveDrawerModal>
    </>
  );
}
