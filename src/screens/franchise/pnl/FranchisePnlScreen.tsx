import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { ChartNoAxesCombined, IndianRupee, Receipt, Users } from '../../../icons';
import { apiRequest } from '../../../api/auth';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { getAdminLayout } from '../../../utils/adminLayout';
import { formatMoney } from '../DashboardCharts';
import { MonthStepper } from '../shared/MonthStepper';
import { SummaryCards } from '../shared/SummaryCards';
import { formatMonthLabel } from '../shared/months';
import type { SummaryCardItem } from '../shared/SummaryCards';
import type { PnlData, PnlMonth } from './types';
import { PnlMonthDrawer } from './PnlMonthDrawer';
import { pnlStyles } from './pnlStyles';

interface FranchisePnlScreenProps {
  storeId: string;
}

export function FranchisePnlScreen({ storeId }: FranchisePnlScreenProps) {
  const { width } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const [data, setData] = useState<PnlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [drawerMonth, setDrawerMonth] = useState<PnlMonth | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [pendingToast, setPendingToast] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);
    apiRequest(`/pnl?${new URLSearchParams({ storeId }).toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json().catch(() => ({})) as PnlData & { message?: string };
        if (!active) return;
        if (!response.ok) throw new Error(result.message || t('franchisePnlLoadFailed'));
        setData(result);
        setSelectedPeriod((current) => result.months.some((month) => month.period === current)
          ? current
          : result.months.find((month) => month.isCurrent)?.period ?? result.months[0]?.period ?? '');
      })
      .catch((reason: unknown) => {
        if (active && !controller.signal.aborted) setError(reason instanceof Error ? reason.message : t('franchisePnlLoadFailed'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [storeId, reloadKey]);

  const months = data?.months ?? [];
  const latest = months.find((month) => month.isCurrent) ?? months[0];
  const selected = months.find((month) => month.period === selectedPeriod) ?? latest;
  const lastPeriod = months[0]?.period ?? '';

  const cards: SummaryCardItem[] = latest ? [
    { label: t('franchisePnlRevenue'), value: formatMoney(latest.revenue), color: theme.colors.teal, Icon: IndianRupee },
    { label: t('franchisePnlStoreExpenses'), value: formatMoney(latest.storeExpenses), color: theme.colors.orange, Icon: Receipt },
    { label: t('franchisePnlPayroll'), value: formatMoney(latest.payroll), color: theme.colors.orange, Icon: Users },
    { label: t('franchisePnlNetProfit'), value: formatMoney(latest.netProfit), color: latest.netProfit >= 0 ? theme.colors.teal : theme.colors.yellow, Icon: ChartNoAxesCombined },
  ] : [];

  const openMonth = useCallback((month: PnlMonth) => {
    setDrawerMonth(month);
    setDrawerVisible(true);
  }, []);

  const closeDrawer = () => setDrawerVisible(false);
  const finishDrawerClose = () => {
    setDrawerMonth(null);
    if (pendingToast) {
      setToast(pendingToast);
      setPendingToast('');
    }
  };


  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, layout.desktopWeb && styles.screenHeaderInline, layout.compactWeb && styles.screenHeaderStack]}>
        <View style={layout.isWeb ? styles.screenHeaderCopy : styles.screenHeaderCopyNative}>
          <Text style={[styles.screenTitle, styles.screenTitleInline]}>{t('franchisePnlTitle')}</Text>
          <Text style={styles.screenDescription}>{t('franchisePnlDescription')}</Text>
        </View>
      </View>

      {loading && months.length === 0 ? <AppLoader /> : error ? (
        <AppErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : (
        <ScrollView style={[styles.list, !layout.desktopWeb && styles.storeListFabViewport]} contentContainerStyle={styles.listContent}>
          {loading ? <AppLoader variant="inline" /> : null}
          {cards.length ? <SummaryCards cards={cards} isWeb={layout.isWeb} perRow={layout.desktopWeb ? 4 : 2} /> : null}
          {!months.length ? <Text style={pnlStyles.placeholder}>{t('franchisePnlNoSales')}</Text> : (
            <>
              {selected ? (
                <>
                  <Text style={styles.sectionLabel}>{t('franchisePnlSelectedPeriod')}</Text>
                  <MonthStepper
                    month={selected.period}
                    maxMonth={lastPeriod}
                    onChange={(period) => {
                      if (months.some((month) => month.period === period)) setSelectedPeriod(period);
                    }}
                  />
                  <MonthSummaryCard month={selected} onView={() => openMonth(selected)} />
                </>
              ) : null}
              <Text style={styles.sectionLabel}>{t('franchisePnlAllPeriods')}</Text>
              <View style={layout.isWeb ? styles.storeGrid : undefined}>
                {months.map((month) => (
                  <MonthSummaryCard key={month.period} month={month} onView={() => openMonth(month)} />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
      {drawerMonth ? (
        <PnlMonthDrawer
          visible={drawerVisible}
          storeId={storeId}
          month={drawerMonth}
          onClose={closeDrawer}
          onAfterClose={finishDrawerClose}
          onSaved={(message) => {
            setPendingToast(message);
            setReloadKey((key) => key + 1);
          }}
        />
      ) : null}
      {toast ? <AppToast message={toast} tone="success" onDismiss={() => setToast(null)} /> : null}
    </View>
  );
}

function MonthSummaryCard({ month, onView }: { month: PnlMonth; onView: () => void }) {
  return (
    <View style={[pnlStyles.monthCard, month.isCurrent && pnlStyles.monthCardCurrent]}>
      <View style={pnlStyles.monthHeading}>
        <View style={pnlStyles.flex}>
          <Text style={pnlStyles.monthLabel}>{formatMonthLabel(month.period)}</Text>
          <Text style={pnlStyles.monthRange}>{month.from} – {month.to}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('franchisePnlViewPeriod', { period: month.period })} onPress={onView} style={pnlStyles.viewButton}>
          <Text style={pnlStyles.viewButtonText}>{t('franchisePnlView')}</Text>
        </Pressable>
      </View>
      <View style={pnlStyles.monthMetricGrid}>
        <Metric label={t('franchisePnlRevenue')} value={month.revenue} />
        <Metric label={t('franchisePnlStoreExpenses')} value={month.storeExpenses} />
        <Metric label={t('franchisePnlPayroll')} value={month.payroll} />
        <Metric label={t('franchisePnlNetProfit')} value={month.netProfit} />
        <Metric label={t('franchisePnlTotalExpenses')} value={month.totalExpenses} />
        <View style={pnlStyles.monthMetric}>
          <Text style={pnlStyles.metricLabel}>{t('franchisePnlMargin')}</Text>
          <Text style={pnlStyles.metricValue}>{month.margin.toFixed(1)}%</Text>
        </View>
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={pnlStyles.monthMetric}>
      <Text style={pnlStyles.metricLabel}>{label}</Text>
      <Text style={pnlStyles.metricValue}>{formatMoney(value)}</Text>
    </View>
  );
}
