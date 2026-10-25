import { TextInput } from 'react-native';
import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { formatMoney } from '../src/screens/franchise/DashboardCharts';
import { FranchisePnlScreen } from '../src/screens/franchise/pnl/FranchisePnlScreen';
import type { PnlMonth } from '../src/screens/franchise/pnl/types';
import { buttons, containsText, flushEffects, renderSafeArea, response } from './testUtils';

afterEach(() => jest.restoreAllMocks());

const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
const month: PnlMonth = {
  period, from: `${period}-01`, to: `${period}-${String(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()).padStart(2, '0')}`,
  revenue: 1000, netSales: 950, grossProfit: 950, salesExpenses: 50, storeExpenses: 100, payroll: 200,
  totalExpenses: 300, netProfit: 650, margin: 68.4, swiggyRevenue: 100, zomatoRevenue: 100, isCurrent: true,
};
const pnlData = { store: { id: 'store-1', name: 'Test Store' }, cycle: { type: 'calendar_month' as const, startDay: 1 }, months: [month] };
const texts = (renderer: ReturnType<typeof renderSafeArea>, value: string) => renderer.root.findAllByProps({ children: value });

describe('FranchisePnlScreen', () => {
  it('loads P&L periods and displays teal/orange summary data', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, pnlData));
    const renderer = renderSafeArea(<FranchisePnlScreen storeId="store-1" />);
    await flushEffects();

    expect(api.mock.calls[0][0]).toBe('/pnl?storeId=store-1');
    expect(texts(renderer, formatMoney(1000)).length).toBeGreaterThan(0);
    expect(texts(renderer, formatMoney(650)).length).toBeGreaterThan(0);
    expect(texts(renderer, t('franchisePnlDescription')).length).toBeGreaterThan(0);
    expect(texts(renderer, t('franchisePnlNoSales'))).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it('loads editable period inputs and saves the changed values', async () => {
    const api = jest.spyOn(authApi, 'apiRequest')
      .mockResolvedValueOnce(response(200, pnlData))
      .mockResolvedValueOnce(response(200, { input: { period, values: { rent: 100 } } }))
      .mockResolvedValueOnce(response(200, { message: 'P&L inputs saved.' }))
      .mockResolvedValueOnce(response(200, pnlData));
    const renderer = renderSafeArea(<FranchisePnlScreen storeId="store-1" />);
    await flushEffects();

    act(() => renderer.root.findAll((node) => node.props.accessibilityLabel === t('franchisePnlViewPeriod', { period }))[0].props.onPress());
    await flushEffects();
    expect(api.mock.calls[1][0]).toBe(`/pnl/inputs?storeId=store-1&period=${period}`);
    const rentInput = renderer.root.findAllByType(TextInput).find((input) => input.props.value === '100');
    expect(rentInput).toBeDefined();
    act(() => rentInput!.props.onChangeText('175'));
    const save = buttons(renderer).find((node) => containsText(node.props.children, t('adminSave')));
    await act(async () => { await save!.props.onPress(); });
    await flushEffects();

    expect(api.mock.calls[2][0]).toBe('/pnl/inputs');
    expect(api.mock.calls[2][1]).toEqual(expect.objectContaining({
      method: 'PUT',
      body: expect.stringContaining('"rent":175'),
    }));
    expect(api).toHaveBeenCalledTimes(4);
    act(() => renderer.unmount());
  });
});
