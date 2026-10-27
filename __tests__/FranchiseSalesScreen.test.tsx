import { DateInput } from '../src/components/DateInput';
import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { formatMoney } from '../src/screens/franchise/DashboardCharts';
import { FranchiseSalesScreen } from '../src/screens/franchise/sales/FranchiseSalesScreen';
import { defaultSaleRange } from '../src/screens/franchise/sales/utils';
import type { SaleRecord } from '../src/screens/franchise/types';
import { buttonByLabel, buttons, containsText, flushEffects, renderSafeArea, response } from './testUtils';

afterEach(() => jest.restoreAllMocks());

const sale = (overrides: Partial<SaleRecord>): SaleRecord => ({
  _id: 'sale-1', date: '2026-01-02', totalSale: 1000, swiggy: 100, zomato: 100, upi: 300, upiCharge: 3,
  cash: 500, expenses: [{ name: 'Milk', amount: 50 }], totalExpenses: 50, bankingCash: 450, ...overrides,
});

const texts = (renderer: ReturnType<typeof renderSafeArea>, value: string) => renderer.root.findAllByProps({ children: value });

describe('FranchiseSalesScreen', () => {
  it('loads sales for the selected store and current month, showing summary totals', async () => {
    const range = defaultSaleRange();
    const api = jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, {
      sales: [sale({}), sale({ _id: 'sale-2', date: '2026-01-03', totalSale: 2000, swiggy: 0, zomato: 0, totalExpenses: 0, bankingCash: 1700 })],
    }));
    const renderer = renderSafeArea(<FranchiseSalesScreen storeId="store-1" />);
    await flushEffects();

    expect(api.mock.calls[0][0]).toBe(`/sales?storeId=store-1&from=${range.from}&to=${range.to}`);
    expect(texts(renderer, formatMoney(3000)).length).toBeGreaterThan(0);
    expect(texts(renderer, formatMoney(200)).length).toBeGreaterThan(0);
    expect(texts(renderer, formatMoney(2150)).length).toBeGreaterThan(0);
    expect(texts(renderer, t('franchiseNoSales'))).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it('shows the empty state and applies custom date filters', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, { sales: [] }));
    const renderer = renderSafeArea(<FranchiseSalesScreen storeId="store-1" />);
    await flushEffects();
    expect(texts(renderer, t('franchiseNoSales')).length).toBeGreaterThan(0);

    act(() => buttonByLabel(renderer, t('franchiseFilterSales')).props.onPress());
    const dateInputs = renderer.root.findAllByType(DateInput).filter((input) => input.props.placeholder === t('franchiseDatePlaceholder'));
    act(() => {
      dateInputs[0].props.onChangeText('2025-12-01');
    });
    const toInput = renderer.root.findAllByType(DateInput).filter((input) => input.props.placeholder === t('franchiseDatePlaceholder'))[1];
    act(() => toInput.props.onChangeText('2025-12-31'));
    const apply = buttons(renderer).find((node) => containsText(node.props.children, t('adminApplyFilters')));
    act(() => apply!.props.onPress());
    await flushEffects();

    expect(api).toHaveBeenLastCalledWith('/sales?storeId=store-1&from=2025-12-01&to=2025-12-31', expect.anything());
    act(() => renderer.unmount());
  });

  it('shows load errors and retries', async () => {
    const api = jest.spyOn(authApi, 'apiRequest')
      .mockResolvedValueOnce(response(500, { message: 'Boom' }))
      .mockResolvedValueOnce(response(200, { sales: [sale({})] }));
    const renderer = renderSafeArea(<FranchiseSalesScreen storeId="store-1" />);
    await flushEffects();
    expect(texts(renderer, 'Boom').length).toBeGreaterThan(0);

    const retry = buttons(renderer).find((node) => containsText(node.props.children, t('adminRefresh')));
    act(() => retry!.props.onPress());
    await flushEffects();
    expect(api).toHaveBeenCalledTimes(2);
    expect(texts(renderer, 'Boom')).toHaveLength(0);
    expect(texts(renderer, formatMoney(1000)).length).toBeGreaterThan(0);
    act(() => renderer.unmount());
  });
});
