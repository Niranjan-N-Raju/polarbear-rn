import { Text, TextInput } from 'react-native';
import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { formatMoney } from '../src/screens/franchise/DashboardCharts';
import { FranchiseSalaryScreen } from '../src/screens/franchise/salary/FranchiseSalaryScreen';
import { buttonByLabel, buttons, containsText, flushEffects, renderSafeArea, response } from './testUtils';

afterEach(() => jest.restoreAllMocks());

const projection = {
  employeeId: 'employee-1', name: 'Ada Lovelace', position: 'Chef', employmentType: 'full_time', salary: 3100,
  paidDays: 2, absentDays: 0, weekOffDays: 1, missingDays: 0, futureDays: 0, eligibleDays: 31,
  incentives: [{ id: 'incentive-1', employeeId: 'employee-1', type: 'Sales', amount: 100 }], incentiveTotal: 100,
  extraDays: [{ id: 'extra-1', employeeId: 'employee-1', type: 'Comp Off', days: 1 }], extraDaysTotal: 1,
  advances: [{ id: 'advance-1', employeeId: 'employee-1', type: 'Cash Advance', amount: 250 }], advanceTotal: 250,
  earnedSalary: 150, projectedSalary: 150,
};
const data = {
  store: { id: 'store-1', name: 'North' },
  cycle: { configured: true, type: 'calendar_month', startDay: 1, endDay: 31, from: '2026-01-01', to: '2026-01-31', totalDays: 31 },
  projections: [projection],
};

describe('FranchiseSalaryScreen', () => {
  it('loads salary projections and displays an employee salary slip', async () => {
    const api = jest.spyOn(authApi, 'apiRequest')
      .mockResolvedValueOnce(response(200, data))
      .mockResolvedValueOnce(response(200, {
        periodLabel: 'January 2026', store: { name: 'North' }, employee: { position: 'Chef', employmentType: 'full_time' },
        attendance: { presentDays: 2, weekOffDays: 1, absentDays: 0, extraDaysTotal: 1 },
        earnings: { basicSalary: 300 }, deductions: { advanceTotal: 250 }, incentiveTotal: 100, netPay: 150,
      }));
    const renderer = renderSafeArea(<FranchiseSalaryScreen storeId="store-1" />);
    await flushEffects();
    expect(api.mock.calls[0][0]).toContain('/salary?storeId=store-1&period=');
    expect(containsText(renderer.root.findAllByType(Text).map((node) => node.props.children), 'Ada Lovelace')).toBe(true);
    act(() => buttonByLabel(renderer, t('franchiseSalaryDetails')).props.onPress());
    await flushEffects();
    await act(async () => { await buttonByLabel(renderer, t('franchiseSalaryViewSlip')).props.onPress(); });
    expect(api.mock.calls[1][0]).toContain('/salary/slip?');
    expect(api.mock.calls[1][0]).toContain('employeeId=employee-1');
    expect(containsText(renderer.root.findAllByType(Text).map((node) => node.props.children), formatMoney(150))).toBe(true);
    act(() => renderer.unmount());
  });

  it('adds an advance for the selected employee and salary period', async () => {
    const api = jest.spyOn(authApi, 'apiRequest')
      .mockResolvedValueOnce(response(200, data))
      .mockResolvedValueOnce(response(201, { message: 'Advance added successfully.' }));
    const renderer = renderSafeArea(<FranchiseSalaryScreen storeId="store-1" />);
    await flushEffects();
    act(() => buttonByLabel(renderer, t('franchiseSalaryAddEntry', { entry: t('franchiseSalaryAdvance') })).props.onPress());
    const amount = renderer.root.findByType(TextInput);
    act(() => amount.props.onChangeText('75'));
    const addButton = buttons(renderer).find((node) => containsText(node.props.children, t('franchiseSalaryAddEntryAction')));
    expect(addButton).toBeDefined();
    await act(async () => { await addButton!.props.onPress(); });
    expect(api.mock.calls[1][0]).toBe('/advances');
    expect(JSON.parse(String(api.mock.calls[1][1]?.body))).toMatchObject({ storeId: 'store-1', employeeId: 'employee-1', period: expect.any(String), amount: 75 });
    act(() => renderer.unmount());
  });

  it('ignores a salary slip response that arrives after the drawer was closed', async () => {
    let resolveSlip!: (value: Response) => void;
    let slipSignal: AbortSignal | undefined;
    const api = jest.spyOn(authApi, 'apiRequest').mockImplementation((path, init) => {
      if (path.startsWith('/salary/slip?')) {
        slipSignal = init?.signal ?? undefined;
        return new Promise<Response>((resolve) => { resolveSlip = resolve; });
      }
      return Promise.resolve(response(200, data));
    });
    const renderer = renderSafeArea(<FranchiseSalaryScreen storeId="store-1" />);
    await flushEffects();
    act(() => buttonByLabel(renderer, t('franchiseSalaryDetails')).props.onPress());
    await flushEffects();
    let pending!: Promise<void>;
    act(() => { pending = buttonByLabel(renderer, t('franchiseSalaryViewSlip')).props.onPress(); });
    act(() => renderer.root.findAll((node) => node.props.accessibilityLabel === t('adminCloseMenu') && typeof node.props.onPress === 'function')[0].props.onPress());
    expect(slipSignal?.aborted).toBe(true);
    await act(async () => {
      resolveSlip(response(200, { periodLabel: 'Stale slip', netPay: 999 }));
      await pending;
    });
    expect(containsText(renderer.root.findAllByType(Text).map((node) => node.props.children), 'Stale slip')).toBe(false);
    expect(api.mock.calls.filter(([path]) => path.startsWith('/salary/slip?'))).toHaveLength(1);
    act(() => renderer.unmount());
  });
});
