import { t } from '../../../i18n';
import { currentMonthRange, localDateValue, thisWeekRange, validDateRange } from '../dashboardDates';
import type { SaleExpense, SaleRecord } from '../types';

export const saleAmountFields = ['totalSale', 'swiggy', 'zomato', 'upi', 'upiCharge'] as const;
export type SaleAmountField = typeof saleAmountFields[number];

export interface SaleForm {
  date: string;
  totalSale: string;
  swiggy: string;
  zomato: string;
  upi: string;
  upiCharge: string;
  expenses: SaleExpense[];
}

export type SaleFormErrors = Partial<Record<'date' | SaleAmountField, string>>;

const numberPattern = /^\d*\.?\d*$/;

export function emptySaleForm(date = localDateValue()): SaleForm {
  return { date, totalSale: '', swiggy: '', zomato: '', upi: '', upiCharge: '', expenses: [] };
}

export function saleToForm(sale: SaleRecord): SaleForm {
  return {
    date: sale.date,
    totalSale: String(sale.totalSale),
    swiggy: String(sale.swiggy),
    zomato: String(sale.zomato),
    upi: String(sale.upi),
    upiCharge: String(sale.upiCharge ?? 0),
    expenses: sale.expenses.map((expense) => ({ ...expense })),
  };
}

export function sanitizeAmount(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  return rest.length ? `${whole}.${rest.join('')}` : whole;
}

export function parseAmount(value: string): number {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? amount : 0;
}

export function isValidAmount(value: string): boolean {
  return value.trim() !== '' && value.trim() !== '.' && numberPattern.test(value.trim());
}

export function calculateCash(form: Pick<SaleForm, 'totalSale' | 'swiggy' | 'zomato' | 'upi'>): number {
  return parseAmount(form.totalSale) - parseAmount(form.swiggy) - parseAmount(form.zomato) - parseAmount(form.upi);
}

export function sumExpenses(expenses: SaleExpense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

export function onlinePercent(total: number, swiggy: number, zomato: number): number {
  return total > 0 ? ((swiggy + zomato) / total) * 100 : 0;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function summarizeSales(sales: SaleRecord[]) {
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalSale, 0);
  const onlineSales = sales.reduce((sum, sale) => sum + sale.swiggy + sale.zomato, 0);
  return {
    totalSales,
    onlineSales,
    onlinePercent: totalSales > 0 ? (onlineSales / totalSales) * 100 : 0,
    totalExpenses: sales.reduce((sum, sale) => sum + sale.totalExpenses, 0),
    bankingCash: sales.reduce((sum, sale) => sum + sale.bankingCash, 0),
  };
}

export function validateSaleForm(
  form: SaleForm,
  existingDates: string[],
  editingDate: string | null,
  today = localDateValue(),
): SaleFormErrors {
  const errors: SaleFormErrors = {};
  if (!form.date.trim()) errors.date = t('franchiseFieldRequired');
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date) || Number.isNaN(Date.parse(`${form.date}T00:00:00Z`))) {
    errors.date = t('franchiseSaleDateInvalid');
  } else if (form.date > today) errors.date = t('franchiseSaleFutureDate');
  else if (form.date !== editingDate && existingDates.includes(form.date)) errors.date = t('franchiseSaleDuplicateDate');

  for (const field of saleAmountFields) {
    if (!form[field].trim()) errors[field] = t('franchiseFieldRequired');
    else if (!isValidAmount(form[field])) errors[field] = t('franchiseInvalidNumber');
  }
  return errors;
}

export function nextDay(date: string): string {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + 1);
  return localDateValue(value);
}

export function salePayload(storeId: string, form: SaleForm) {
  return {
    storeId,
    date: form.date,
    totalSale: parseAmount(form.totalSale),
    swiggy: parseAmount(form.swiggy),
    zomato: parseAmount(form.zomato),
    upi: parseAmount(form.upi),
    upiCharge: parseAmount(form.upiCharge),
    expenses: form.expenses.map((expense) => ({ name: expense.name.trim(), amount: expense.amount })),
  };
}

export function formatSaleDate(date: string): string {
  const value = new Date(`${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return date;
  return value.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' });
}

export interface SaleRange {
  from: string;
  to: string;
}

export type SalePreset = 'today' | 'week' | 'month';

export function salePresetRange(preset: SalePreset, now = new Date()): SaleRange {
  const today = localDateValue(now);
  if (preset === 'today') return { from: today, to: today };
  if (preset === 'week') return thisWeekRange(now);
  const month = currentMonthRange();
  return { from: month.from, to: month.to > today ? today : month.to };
}

export function defaultSaleRange(): SaleRange {
  return salePresetRange('month');
}

export function saleRangeError(range: SaleRange, today = localDateValue()): string | null {
  if (!validDateRange(range.from.trim(), range.to.trim())) return t('franchiseInvalidDates');
  if (range.to.trim() > today) return t('franchiseSaleFutureDate');
  return null;
}
