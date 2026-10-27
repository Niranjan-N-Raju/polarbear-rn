import { TextInput } from 'react-native';
import { DateInput } from '../src/components/DateInput';
import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { formatMoney } from '../src/screens/franchise/DashboardCharts';
import { FranchiseWithdrawalsScreen } from '../src/screens/franchise/withdrawals/FranchiseWithdrawalsScreen';
import { currentMonthValue, formatShortDate, monthRange, shiftMonth } from '../src/screens/franchise/shared/months';
import { buttonByLabel, buttons, containsText, flushEffects, renderSafeArea, response } from './testUtils';

afterEach(() => jest.restoreAllMocks());

const record = (overrides: Record<string, unknown> = {}) => ({
  id: 'withdrawal-1', date: '2026-10-03', amount: 1200, type: 'withdrawal', reason: 'Stock purchase', ...overrides,
});
const texts = (renderer: ReturnType<typeof renderSafeArea>, value: string) => renderer.root.findAllByProps({ children: value });

describe('FranchiseWithdrawalsScreen', () => {
  it('loads the selected month and displays monthly and all-time totals', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, {
      withdrawals: [record(), record({ id: 'repayment-1', type: 'repayment', amount: 200 })],
      totalWithdrawals: 5000,
      totalRepayments: 1250,
    }));
    const renderer = renderSafeArea(<FranchiseWithdrawalsScreen storeId="store-1" />);
    await flushEffects();

    const { from, to } = monthRange(currentMonthValue());
    expect(api.mock.calls[0][0]).toBe(`/withdrawals?storeId=store-1&from=${from}&to=${to}`);
    expect(texts(renderer, formatMoney(1200)).length).toBeGreaterThan(0);
    expect(texts(renderer, formatMoney(200)).length).toBeGreaterThan(0);
    expect(texts(renderer, formatMoney(5000)).length).toBeGreaterThan(0);
    expect(texts(renderer, formatMoney(1250)).length).toBeGreaterThan(0);
    expect(texts(renderer, 'Stock purchase').length).toBeGreaterThan(0);
    act(() => renderer.unmount());
  });

  it('requests the previous month using the month stepper', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, { withdrawals: [] }));
    const renderer = renderSafeArea(<FranchiseWithdrawalsScreen storeId="store-1" />);
    await flushEffects();
    act(() => buttonByLabel(renderer, t('franchisePreviousMonth')).props.onPress());
    await flushEffects();

    const previous = shiftMonth(currentMonthValue(), -1);
    expect(api.mock.calls[1][0]).toBe(`/withdrawals?storeId=store-1&from=${previous}-01&to=${monthRange(previous).to}`);
    act(() => renderer.unmount());
  });

  it('creates a withdrawal entry and reloads the list', async () => {
    const api = jest.spyOn(authApi, 'apiRequest')
      .mockResolvedValueOnce(response(200, { withdrawals: [] }))
      .mockResolvedValueOnce(response(201, { message: 'Entry added successfully.' }))
      .mockResolvedValueOnce(response(200, { withdrawals: [record()] }));
    const renderer = renderSafeArea(<FranchiseWithdrawalsScreen storeId="store-1" />);
    await flushEffects();

    act(() => buttonByLabel(renderer, t('franchiseWithdrawalsAdd')).props.onPress());
    const dateInput = renderer.root.findAllByType(DateInput).find((input) => input.props.accessibilityLabel === t('franchiseWithdrawalsDate'));
    const amountInput = renderer.root.findAllByType(TextInput).find((input) => input.props.placeholder === '0.00');
    const reasonInput = renderer.root.findAllByType(TextInput).find((input) => input.props.placeholder === t('franchiseWithdrawalsReasonPlaceholder'));
    expect(reasonInput?.props.maxLength).toBe(300);
    act(() => {
      dateInput!.props.onChangeText('2026-10-10');
      amountInput!.props.onChangeText('250.50');
      reasonInput!.props.onChangeText('Cash replenishment');
    });
    const save = buttons(renderer).find((node) => containsText(node.props.children, t('adminSave')));
    await act(async () => { await save!.props.onPress(); });
    await flushEffects();

    expect(api.mock.calls[1][0]).toMatch(/^\/withdrawals\?storeId=store-1$/);
    expect(api.mock.calls[1][1]).toEqual(expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ date: '2026-10-10', amount: 250.5, type: 'withdrawal', reason: 'Cash replenishment' }),
    }));
    expect(api).toHaveBeenCalledTimes(3);
    act(() => renderer.unmount());
  });

  it('edits an entry and sends the updated payload', async () => {
    const api = jest.spyOn(authApi, 'apiRequest')
      .mockResolvedValueOnce(response(200, { withdrawals: [record()] }))
      .mockResolvedValueOnce(response(200, { message: 'Entry updated successfully.' }))
      .mockResolvedValueOnce(response(200, { withdrawals: [record({ amount: 1600 })] }));
    const renderer = renderSafeArea(<FranchiseWithdrawalsScreen storeId="store-1" />);
    await flushEffects();
    act(() => buttonByLabel(renderer, t('franchiseWithdrawalsEdit', { date: formatShortDate('2026-10-03') })).props.onPress());
    const amountInput = renderer.root.findAllByType(TextInput).find((input) => input.props.placeholder === '0.00');
    act(() => amountInput!.props.onChangeText('1600'));
    const save = buttons(renderer).find((node) => containsText(node.props.children, t('adminSave')));
    await act(async () => { await save!.props.onPress(); });
    await flushEffects();

    expect(api.mock.calls[1][0]).toBe('/withdrawals/withdrawal-1?storeId=store-1');
    expect(api.mock.calls[1][1]).toEqual(expect.objectContaining({ method: 'PUT', body: expect.stringContaining('"amount":1600') }));
    act(() => renderer.unmount());
  });

  it('deletes an entry only after confirmation', async () => {
    const api = jest.spyOn(authApi, 'apiRequest')
      .mockResolvedValueOnce(response(200, { withdrawals: [record()] }))
      .mockResolvedValueOnce(response(200, { message: 'Entry removed.' }))
      .mockResolvedValueOnce(response(200, { withdrawals: [] }));
    const renderer = renderSafeArea(<FranchiseWithdrawalsScreen storeId="store-1" />);
    await flushEffects();
    act(() => buttonByLabel(renderer, t('franchiseWithdrawalsDelete', { date: formatShortDate('2026-10-03') })).props.onPress());
    const confirm = buttons(renderer).filter((node) => containsText(node.props.children, t('adminDelete'))).at(-1);
    await act(async () => { await confirm!.props.onPress(); });
    await flushEffects();

    expect(api.mock.calls[1][0]).toBe('/withdrawals/withdrawal-1?storeId=store-1');
    expect(api.mock.calls[1][1]).toEqual(expect.objectContaining({ method: 'DELETE' }));
    act(() => renderer.unmount());
  });
});
