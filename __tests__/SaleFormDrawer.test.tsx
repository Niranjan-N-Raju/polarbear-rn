import { TextInput } from 'react-native';
import { DateInput } from '../src/components/DateInput';
import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { localDateValue } from '../src/screens/franchise/dashboardDates';
import { SaleFormDrawer } from '../src/screens/franchise/sales/SaleFormDrawer';
import { nextDay } from '../src/screens/franchise/sales/utils';
import type { SaleRecord } from '../src/screens/franchise/types';
import { buttonByLabel, buttons, containsText, flushEffects, renderSafeArea, response } from './testUtils';

afterEach(() => jest.restoreAllMocks());

const today = localDateValue();
const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return localDateValue(d); })();

function fillForm(renderer: ReturnType<typeof renderSafeArea>, date: string) {
  const inputs = renderer.root.findAllByType(TextInput);
  act(() => {
    renderer.root.findByType(DateInput).props.onChangeText(date);
    inputs[0].props.onChangeText('1000');
    inputs[1].props.onChangeText('100');
    inputs[2].props.onChangeText('50');
    inputs[3].props.onChangeText('200');
    inputs[4].props.onChangeText('2');
  });
}

const pressText = (renderer: ReturnType<typeof renderSafeArea>, text: string) => {
  const button = buttons(renderer).find((node) => containsText(node.props.children, text));
  act(() => button!.props.onPress());
};

describe('SaleFormDrawer', () => {
  it('validates required fields, manages expenses, and posts a new sale with save & next day', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(201, {}));
    const onSaved = jest.fn();
    const renderer = renderSafeArea(
      <SaleFormDrawer visible storeId="store-1" editingSale={null} existingDates={[]} onClose={jest.fn()} onSaved={onSaved} />,
    );
    act(() => renderer.root.findByType(DateInput).props.onChangeText(''));
    pressText(renderer, t('franchiseSaveSale'));
    await flushEffects();
    expect(api).not.toHaveBeenCalled();
    expect(renderer.root.findAllByProps({ children: t('franchiseFieldRequired') }).length).toBeGreaterThan(0);

    fillForm(renderer, yesterday);
    act(() => buttonByLabel(renderer, t('franchiseAddExpense')).props.onPress());
    act(() => buttonByLabel(renderer, t('franchiseSaveExpense')).props.onPress());
    expect(renderer.root.findAllByProps({ children: t('franchiseExpenseInvalid') }).length).toBeGreaterThan(0);
    act(() => {
      renderer.root.findByProps({ accessibilityLabel: t('franchiseExpenseName') }).props.onChangeText('Milk');
      renderer.root.findByProps({ accessibilityLabel: t('franchiseExpenseAmount') }).props.onChangeText('40');
    });
    act(() => buttonByLabel(renderer, t('franchiseSaveExpense')).props.onPress());
    expect(renderer.root.findAllByProps({ accessibilityLabel: t('franchiseDeleteExpense', { name: 'Milk' }) }).length).toBeGreaterThan(0);

    pressText(renderer, t('franchiseSaveAddNextDay'));
    await flushEffects();
    expect(api).toHaveBeenCalledWith('/sales', expect.objectContaining({ method: 'POST' }));
    const body = JSON.parse(api.mock.calls[0][1]!.body as string);
    expect(body).toMatchObject({ storeId: 'store-1', date: yesterday, totalSale: 1000, swiggy: 100, zomato: 50, upi: 200, upiCharge: 2, expenses: [{ name: 'Milk', amount: 40 }] });
    expect(onSaved).toHaveBeenCalledWith(t('franchiseSaleSaved'), true);
    expect(renderer.root.findByType(DateInput).props.value).toBe(nextDay(yesterday));
    expect(renderer.root.findAllByProps({ message: t('franchiseSaleSaved') }).length).toBeGreaterThan(0);
    act(() => renderer.unmount());
  });

  it('updates an existing sale and surfaces duplicate-date conflicts', async () => {
    const sale: SaleRecord = {
      _id: 'sale-1', date: today, totalSale: 500, swiggy: 0, zomato: 0, upi: 100, upiCharge: 0,
      cash: 400, expenses: [], totalExpenses: 0, bankingCash: 400,
    };
    const api = jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(409, { message: 'Sale already exists' }));
    const onSaved = jest.fn();
    const renderer = renderSafeArea(
      <SaleFormDrawer visible storeId="store-1" editingSale={sale} existingDates={[today]} onClose={jest.fn()} onSaved={onSaved} />,
    );
    expect(buttons(renderer).some((node) => containsText(node.props.children, t('franchiseSaveAddNextDay')))).toBe(false);
    pressText(renderer, t('adminSaveChanges'));
    await flushEffects();
    expect(api).toHaveBeenCalledWith('/sales/sale-1', expect.objectContaining({ method: 'PUT' }));
    expect(onSaved).not.toHaveBeenCalled();
    expect(renderer.root.findAllByProps({ children: t('franchiseSaleDuplicateDate') }).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({ message: 'Sale already exists' }).length).toBeGreaterThan(0);
    act(() => renderer.unmount());
  });
});
