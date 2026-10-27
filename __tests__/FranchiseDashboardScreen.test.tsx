import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { SummaryCards } from '../src/components/SummaryCards';
import { theme } from '../src/config/theme';
import { FranchiseDashboardScreen } from '../src/screens/franchise/FranchiseDashboardScreen';
import { currentMonthRange } from '../src/screens/franchise/dashboardDates';
import { buttons, flushEffects, render, response } from './testUtils';

const stats = {
  storeCount: 2, employeeSummary: 3, salesSummary: 1200, attendanceSummary: 0,
  attritionTrend: [{ month: '2026-10', monthLabel: 'Oct 2026', headcount: 2, leavers: 1, rate: 50 }],
  weekdayPerformance: [{ day: 'Sun', average: 1200 }],
  expenseBreakdown: [{ name: 'Milk', amount: 100 }],
  paymentMixTrend: [{ month: '2026-10', monthLabel: 'Oct 2026', onlinePercent: 30, upiPercent: 40, cashPercent: 30 }],
};
afterEach(() => jest.restoreAllMocks());

describe('FranchiseDashboardScreen', () => {
  it('loads all dashboard sections for the selected store and applies validated sales dates', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path) => (
      response(200, path.startsWith('/dashboard') ? stats : { sales: [{ date: currentMonthRange().from, totalSale: 1200 }] })
    ));
    const renderer = render(<FranchiseDashboardScreen storeId="store-1" />);
    await flushEffects();
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
    act(() => {
      renderer.root.findByProps({ accessibilityLabel: t('franchiseFrom') }).props.onChangeText('2026-10-01');
      renderer.root.findByProps({ accessibilityLabel: t('franchiseTo') }).props.onChangeText('2026-10-08');
    });
    const apply = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminApplyFilters'))!;
    act(() => apply.props.onPress());
    await flushEffects();
    expect(api.mock.calls.some(([path]) => path === '/sales?storeId=store-1&from=2026-10-01&to=2026-10-08')).toBe(true);
    const count = api.mock.calls.length;
    act(() => renderer.root.findByProps({ accessibilityLabel: t('franchiseFrom') }).props.onChangeText('invalid'));
    act(() => apply.props.onPress());
    await flushEffects();
    expect(api).toHaveBeenCalledTimes(count);
    expect(renderer.root.findAllByProps({ children: t('franchiseInvalidDates') }).length).toBeGreaterThan(0);
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
    act(() => buttons(renderer).find((button) => button.props.children?.props?.children === t('adminRefresh'))!.props.onPress());
    await flushEffects();
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
    act(() => renderer.update(<FranchiseDashboardScreen storeId="store-2" />));
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
