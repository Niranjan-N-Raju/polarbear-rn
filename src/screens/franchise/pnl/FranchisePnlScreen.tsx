import { Pressable,ScrollView,Text,View } from 'react-native';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { SummaryCards } from '../../../components/SummaryCards';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { formatMoney } from '../DashboardCharts';
import { formatMonthLabel } from '../shared/months';
import { MonthStepper } from '../shared/MonthStepper';
import { PnlMonthDrawer } from './PnlMonthDrawer';
import { pnlStyles } from './pnlStyles';
import type { PnlMonth } from './types';
import { useFranchisePnl,type FranchisePnlScreenProps } from './useFranchisePnl';

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
export function FranchisePnlScreen({ storeId }: FranchisePnlScreenProps) {
const { layout, loading, error, setReloadKey, setSelectedPeriod, drawerMonth, drawerVisible, setPendingToast, toast, setToast, months, selected, lastPeriod, cards, openMonth, closeDrawer, finishDrawerClose } = useFranchisePnl({ storeId });
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
