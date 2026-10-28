import { act } from 'react-test-renderer';
import { Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { SummaryCards } from '../src/components/SummaryCards';
import { ResponsiveDrawerModal } from '../src/components/ResponsiveDrawerModal';
import { theme } from '../src/config/theme';
import { RefreshCw } from '../src/icons';
import { FranchiseDashboardScreen } from '../src/screens/franchise/FranchiseDashboardScreen';
import { franchiseStyles as styles } from '../src/screens/franchise/franchiseStyles';
import { currentMonthRange, thisWeekRange } from '../src/screens/franchise/dashboardDates';
import { buttons, flushEffects, initialMetrics, renderSafeArea as render, response } from './testUtils';

const stats = {
  storeCount: 2, employeeSummary: 3, salesSummary: 1200, attendanceSummary: 0,
  attritionTrend: [{ month: '2026-10', monthLabel: 'Oct 2026', headcount: 2, leavers: 1, rate: 50 }],
  weekdayPerformance: [{ day: 'Sun', average: 1200 }],
  expenseBreakdown: [{ name: 'Milk', amount: 100 }],
  paymentMixTrend: [{ month: '2026-10', monthLabel: 'Oct 2026', onlinePercent: 30, upiPercent: 40, cashPercent: 30 }],
};
const originalPlatform = Platform.OS;
afterEach(() => {
  Platform.OS = originalPlatform;
  jest.restoreAllMocks();
});

describe('FranchiseDashboardScreen', () => {
  it.each([
    ['android', 390, true],
    ['ios', 390, true],
    ['web', 390, true],
    ['web', 900, true],
    ['web', 1440, false],
  ] as const)('sizes sales shortcuts on %s at width %i', async (platform, width, compact) => {
    Platform.OS = platform;
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
    jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path) => (
      response(200, path.startsWith('/dashboard') ? stats : { sales: [] })
    ));
    const renderer = render(<FranchiseDashboardScreen storeId="store-1" />);
    await flushEffects();
    for (const label of ['franchiseThisWeek', 'franchiseThisMonth'] as const) {
      const button = buttons(renderer).find((node) => node.props.children?.props?.children === t(label))!;
      const buttonStyle = StyleSheet.flatten(button.props.style);
      expect(buttonStyle.minHeight).toBe(compact ? 32 : 44);
      expect(buttonStyle.paddingHorizontal).toBe(compact ? 8 : 12);
      expect(StyleSheet.flatten(button.props.children.props.style).fontSize).toBe(compact ? 12 : 14);
      expect(button.props.hitSlop).toBe(compact ? 6 : undefined);
    }
    expect(renderer.root.findByType(ResponsiveDrawerModal).props.visible).toBe(false);
    expect(renderer.root.findAllByProps({ accessibilityLabel: t('franchiseFrom') })).toHaveLength(0);
    act(() => renderer.root.findByProps({ accessibilityLabel: t('adminOpenFilters') }).props.onPress());
    expect(renderer.root.findByType(ResponsiveDrawerModal).props.visible).toBe(true);
    expect(renderer.root.findByProps({ accessibilityLabel: t('franchiseFrom') }).props.value).toBe(currentMonthRange().from);
    expect(renderer.root.findByProps({ accessibilityLabel: t('franchiseTo') }).props.value).toBe(currentMonthRange().to);
    act(() => renderer.root.findByType(ResponsiveDrawerModal).props.onClose());
    expect(renderer.root.findByType(ResponsiveDrawerModal).props.visible).toBe(false);
    act(() => renderer.unmount());
  });

  it('places working week and month shortcuts to the right of the sales heading, separate from date filters', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path) => (
      response(200, path.startsWith('/dashboard') ? stats : { sales: [] })
    ));
    const renderer = render(<FranchiseDashboardScreen storeId="store-1" />);
    await flushEffects();
    const week = buttons(renderer).find((button) => button.props.children?.props?.children === t('franchiseThisWeek'))!;
    const month = buttons(renderer).find((button) => button.props.children?.props?.children === t('franchiseThisMonth'))!;
    const heading = renderer.root.findAll((node) => (
      Array.isArray(node.props.style) && node.props.style.includes(styles.salesHeading)
    ))[0];
    expect(heading.findByProps({ children: t('franchiseSalesTrend') })).toBeDefined();
    expect(StyleSheet.flatten(heading.props.style).justifyContent).toBe('space-between');
    expect(heading.findAllByProps({ children: t('franchiseThisWeek') }).length).toBeGreaterThan(0);
    expect(heading.findAllByProps({ children: t('franchiseThisMonth') }).length).toBeGreaterThan(0);
    expect(heading.findAllByProps({ children: t('adminApplyFilters') })).toHaveLength(0);
    expect(styles.salesShortcuts.marginLeft).toBe('auto');
    for (const [button, range] of [[week, thisWeekRange()], [month, currentMonthRange()]] as const) {
      act(() => button.props.onPress());
      await flushEffects();
      expect(api).toHaveBeenLastCalledWith(
        `/sales?storeId=store-1&from=${range.from}&to=${range.to}`,
        expect.objectContaining({ signal: expect.anything() }),
      );
      act(() => renderer.root.findByProps({ accessibilityLabel: t('adminOpenFilters') }).props.onPress());
      expect(renderer.root.findByProps({ accessibilityLabel: t('franchiseFrom') }).props.value).toBe(range.from);
      expect(renderer.root.findByProps({ accessibilityLabel: t('franchiseTo') }).props.value).toBe(range.to);
      act(() => renderer.root.findByType(ResponsiveDrawerModal).props.onClose());
    }
    act(() => renderer.unmount());
  });

  it('loads all dashboard sections for the selected store and applies validated sales dates', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path) => (
      response(200, path.startsWith('/dashboard') ? stats : { sales: [{ date: currentMonthRange().from, totalSale: 1200 }] })
    ));
    const renderer = render(<FranchiseDashboardScreen storeId="store-1" />);
    await flushEffects();
    const refresh = renderer.root.findByProps({ accessibilityLabel: t('adminRefresh') });
    const refreshStyle = StyleSheet.flatten(refresh.props.style);
    expect(refreshStyle.width).toBe(44);
    expect(refreshStyle.minHeight).toBeGreaterThanOrEqual(44);
    expect(refresh.findByType(RefreshCw).props.size).toBe(20);
    expect(refresh.parent!.findByProps({ children: t('adminDashboard') })).toBeDefined();
    expect(StyleSheet.flatten(refresh.parent!.props.style).flexDirection).toBe('row');
    expect(StyleSheet.flatten(refresh.parent!.props.style).justifyContent).toBe('space-between');
    expect(renderer.root.findAllByProps({ children: t('adminRefresh') })).toHaveLength(0);
    expect(renderer.root.findByType(SummaryCards).props.cards).toEqual([
      expect.objectContaining({ label: t('franchiseMyStores'), color: theme.colors.teal }),
      expect.objectContaining({ label: t('franchiseEmployeeSummary'), color: theme.colors.orange }),
      expect.objectContaining({ label: t('franchiseMonthlySales'), color: theme.colors.orange }),
      expect.objectContaining({ label: t('franchiseAttendanceSummary'), color: theme.colors.teal }),
    ]);
    expect(api.mock.calls.every(([path]) => path.includes('storeId=store-1'))).toBe(true);
    for (const label of [
      'franchiseMyStores', 'franchiseEmployeeSummary', 'franchiseMonthlySales',
      'franchiseAttendanceSummary', 'franchiseSalesTrend', 'franchiseAttrition',
      'franchiseWeekdays', 'franchiseExpenseBreakdown', 'franchisePaymentMix',
    ] as const) {
      expect(renderer.root.findAllByProps({ children: t(label) }).length).toBeGreaterThan(0);
    }
    act(() => renderer.root.findByProps({ accessibilityLabel: t('adminOpenFilters') }).props.onPress());
    expect(renderer.root.findByType(ResponsiveDrawerModal).props.visible).toBe(true);
    act(() => {
      renderer.root.findByProps({ accessibilityLabel: t('franchiseFrom') }).props.onChangeText('2026-10-01');
      renderer.root.findByProps({ accessibilityLabel: t('franchiseTo') }).props.onChangeText('2026-10-08');
    });
    const apply = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminApplyFilters'))!;
    act(() => apply.props.onPress());
    await flushEffects();
    expect(api.mock.calls.some(([path]) => path === '/sales?storeId=store-1&from=2026-10-01&to=2026-10-08')).toBe(true);
    expect(renderer.root.findByType(ResponsiveDrawerModal).props.visible).toBe(false);
    const count = api.mock.calls.length;
    act(() => renderer.root.findByProps({ accessibilityLabel: t('adminOpenFilters') }).props.onPress());
    act(() => renderer.root.findByProps({ accessibilityLabel: t('franchiseFrom') }).props.onChangeText('invalid'));
    act(() => buttons(renderer).find((button) => button.props.children?.props?.children === t('adminApplyFilters'))!.props.onPress());
    await flushEffects();
    expect(api).toHaveBeenCalledTimes(count);
    expect(renderer.root.findByType(ResponsiveDrawerModal).props.visible).toBe(true);
    expect(renderer.root.findAllByProps({ children: t('franchiseInvalidDates') }).length).toBeGreaterThan(0);
    act(() => renderer.root.findByType(ResponsiveDrawerModal).props.onClose());
    act(() => renderer.root.findByProps({ accessibilityLabel: t('adminOpenFilters') }).props.onPress());
    expect(renderer.root.findByProps({ accessibilityLabel: t('franchiseFrom') }).props.value).toBe('2026-10-01');
    expect(api).toHaveBeenCalledTimes(count);
    act(() => buttons(renderer).find((button) => button.props.children?.props?.children === t('adminClearFilters'))!.props.onPress());
    await flushEffects();
    const reset = currentMonthRange();
    expect(api).toHaveBeenLastCalledWith(`/sales?storeId=store-1&from=${reset.from}&to=${reset.to}`, expect.anything());
    expect(renderer.root.findByType(ResponsiveDrawerModal).props.visible).toBe(false);
    act(() => renderer.unmount());
  });

  it('does not display failed requests as zero-sales success and can refresh', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(403, { message: 'Forbidden' }));
    const renderer = render(<FranchiseDashboardScreen storeId="store-1" />);
    await flushEffects();
    expect(renderer.root.findAllByProps({ children: t('adminLoadFailed') }).length).toBeGreaterThan(0);
    api.mockImplementation(async (path) => response(200, path.startsWith('/dashboard') ? {
      ...stats, attritionTrend: [], weekdayPerformance: [], expenseBreakdown: [], paymentMixTrend: [],
    } : { sales: [] }));
    api.mockClear();
    act(() => renderer.root.findByProps({ accessibilityLabel: t('adminRefresh') }).props.onPress());
    await flushEffects();
    expect(api).toHaveBeenCalledTimes(2);
    expect(api.mock.calls.some(([path]) => path === '/dashboard?storeId=store-1')).toBe(true);
    expect(api.mock.calls.some(([path]) => path.startsWith('/sales?storeId=store-1'))).toBe(true);
    expect(renderer.root.findAllByProps({ children: t('franchiseNoSalesHistory') }).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({ children: t('franchiseNoExpenses') }).length).toBeGreaterThan(0);
    act(() => renderer.unmount());
  });

  it('ignores stale store responses and refetches every query when the store changes', async () => {
    let resolveOld!: (value: Response) => void;
    const api = jest.spyOn(authApi, 'apiRequest').mockImplementation((path) => {
      if (path === '/dashboard?storeId=store-1') return new Promise((resolve) => { resolveOld = resolve; });
      return Promise.resolve(response(200, path.startsWith('/dashboard') ? stats : { sales: [] }));
    });
    const renderer = render(<FranchiseDashboardScreen storeId="store-1" />);
    await flushEffects();
    act(() => renderer.update(<SafeAreaProvider initialMetrics={initialMetrics}><FranchiseDashboardScreen storeId="store-2" /></SafeAreaProvider>));
    await flushEffects();
    await act(async () => resolveOld(response(200, { ...stats, employeeSummary: 999 })));
    expect(api.mock.calls.some(([path]) => path === '/dashboard?storeId=store-2')).toBe(true);
    expect(api.mock.calls.some(([path]) => path.startsWith('/sales?storeId=store-2'))).toBe(true);
    expect(renderer.root.findAllByProps({ children: '999' })).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it('keeps summary metrics but reports a sales-only request failure explicitly', async () => {
    jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path) => (
      path.startsWith('/dashboard') ? response(200, stats) : response(500, { message: 'Sales failed' })
    ));
    const renderer = render(<FranchiseDashboardScreen storeId="store-1" />);
    await flushEffects();
    expect(renderer.root.findAllByProps({ children: t('franchiseMonthlySales') }).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({ children: t('franchiseSalesLoadFailed') }).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({ children: t('franchiseNoSalesHistory') })).toHaveLength(0);
    act(() => renderer.unmount());
  });
});
