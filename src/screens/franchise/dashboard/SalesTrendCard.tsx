import { Pressable, Text, View } from 'react-native';
import { AppLoader } from '../../../components/AppLoader';
import type { DateRange } from '../../../components/DateRangeFilterDrawer';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { Filter } from '../../../icons';
import { adminStyles } from '../../../styles/adminStyles';
import { DashboardBars, formatMoney } from '../DashboardCharts';
import { currentMonthRange, datesBetween, thisWeekRange } from '../dashboardDates';
import { franchiseStyles as styles } from '../franchiseStyles';
import type { DailySale } from '../types';

interface SalesTrendCardProps {
  compact: boolean;
  sales: DailySale[];
  range: DateRange;
  loading: boolean;
  loaded?: boolean;
  error: string;
  onApplyRange: (range: DateRange) => void;
  onOpenFilters: () => void;
}

export function SalesTrendCard({ compact, sales, range, loading, loaded = false, error, onApplyRange, onOpenFilters }: SalesTrendCardProps) {
  const salesByDate = new Map(sales.map((sale) => [sale.date, sale.totalSale]));
  const shortcuts = [
    { label: 'franchiseThisWeek', getRange: thisWeekRange },
    { label: 'franchiseThisMonth', getRange: currentMonthRange },
  ] as const;

  return (
    <View style={styles.card}>
      <View style={[styles.dashboardHeading, styles.salesHeading]}>
        <Text style={[styles.sectionTitle, styles.dashboardTitle]}>{t('franchiseSalesTrend')}</Text>
        <View style={[styles.filters, styles.salesShortcuts, compact && styles.salesShortcutsCompact]}>
          {shortcuts.map(({ label, getRange }) => (
            <Pressable key={label} accessibilityRole="button" hitSlop={compact ? 6 : undefined} onPress={() => onApplyRange(getRange())} style={[styles.button, compact && styles.salesShortcutButtonCompact]}>
              <Text style={[styles.buttonText, compact && styles.salesShortcutTextCompact]}>{t(label)}</Text>
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminOpenFilters')} onPress={onOpenFilters} style={adminStyles.filterIconButton}>
            <Filter color={theme.colors.teal} size={18} />
          </Pressable>
        </View>
      </View>
      <Text style={styles.subtitle}>{range.from} - {range.to}</Text>
      {loading && !loaded ? <AppLoader variant="inline" /> : error ? (
        <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
      ) : (
        <DashboardBars items={datesBetween(range.from, range.to).map((date) => {
          const value = salesByDate.get(date) ?? 0;
          return { label: date, values: [value], description: formatMoney(value) };
        })} />
      )}
    </View>
  );
}
