import { t } from '../src/i18n';
import {
  calculateCash, emptySaleForm, nextDay, salePayload, salePresetRange, saleRangeError,
  sanitizeAmount, summarizeSales, validateSaleForm,
} from '../src/screens/franchise/sales/utils';
import type { SaleRecord } from '../src/screens/franchise/types';

const sale = (overrides: Partial<SaleRecord>): SaleRecord => ({
  _id: 's1', date: '2026-01-10', totalSale: 1000, swiggy: 100, zomato: 100,
  upi: 300, upiCharge: 5, cash: 500, expenses: [], totalExpenses: 50, bankingCash: 450, ...overrides,
});

describe('sales utils', () => {
  it('summarizes sales totals and online percentage', () => {
    const summary = summarizeSales([sale({}), sale({ _id: 's2', totalSale: 1000, swiggy: 0, zomato: 0, totalExpenses: 0, bankingCash: 500 })]);
    expect(summary).toEqual({ totalSales: 2000, onlineSales: 200, onlinePercent: 10, totalExpenses: 50, bankingCash: 950 });
    expect(summarizeSales([]).onlinePercent).toBe(0);
  });

  it('validates required fields, numbers, future and duplicate dates', () => {
    const form = { ...emptySaleForm('2026-01-10'), totalSale: '1000', swiggy: '', zomato: 'x', upi: '1', upiCharge: '0' };
    const errors = validateSaleForm(form, ['2026-01-10'], null, '2026-01-20');
    expect(errors.date).toBe(t('franchiseSaleDuplicateDate'));
    expect(errors.swiggy).toBe(t('franchiseFieldRequired'));
    expect(errors.zomato).toBe(t('franchiseInvalidNumber'));
    expect(validateSaleForm(form, ['2026-01-10'], '2026-01-10', '2026-01-20').date).toBeUndefined();
    expect(validateSaleForm({ ...form, date: '2026-02-01' }, [], null, '2026-01-20').date).toBe(t('franchiseSaleFutureDate'));
    expect(validateSaleForm({ ...form, date: '2026-13-45' }, [], null, '2026-01-20').date).toBe(t('franchiseSaleDateInvalid'));
  });

  it('computes cash, next day, sanitized amounts and payload', () => {
    const form = { ...emptySaleForm('2026-01-31'), totalSale: '1000', swiggy: '100', zomato: '50.5', upi: '200', upiCharge: '2', expenses: [{ name: ' Milk ', amount: 20 }] };
    expect(calculateCash(form)).toBe(649.5);
    expect(nextDay('2026-01-31')).toBe('2026-02-01');
    expect(sanitizeAmount('12a.3.4')).toBe('12.34');
    expect(salePayload('store-1', form)).toEqual({
      storeId: 'store-1', date: '2026-01-31', totalSale: 1000, swiggy: 100, zomato: 50.5, upi: 200, upiCharge: 2,
      expenses: [{ name: 'Milk', amount: 20 }],
    });
  });

  it('builds preset ranges and validates ranges', () => {
    const now = new Date('2026-01-15T06:30:00Z'); // noon IST
    expect(salePresetRange('today', now)).toEqual({ from: '2026-01-15', to: '2026-01-15' });
    expect(saleRangeError({ from: '2026-01-10', to: '2026-01-01' }, '2026-01-15')).toBe(t('franchiseInvalidDates'));
    expect(saleRangeError({ from: '2026-01-10', to: '2026-01-20' }, '2026-01-15')).toBe(t('franchiseSaleFutureDate'));
    expect(saleRangeError({ from: '2026-01-01', to: '2026-01-15' }, '2026-01-15')).toBeNull();
  });
});
