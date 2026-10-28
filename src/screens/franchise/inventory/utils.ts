import { getLocale } from '../../../i18n';
import { localDateValue } from '../dashboardDates';
import type { InventoryStockItem } from '../types';

export type InventoryFilter = 'all' | 'expired' | 'oneDay' | 'sevenDays' | 'thirtyDays' | 'healthy';

export interface InventoryFilters {
  status: InventoryFilter;
  search: string;
}

export const defaultInventoryFilters: InventoryFilters = { status: 'all', search: '' };

const dayMs = 86400000;

function dateOnly(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function daysUntil(expiryDate: string, today = new Date()): number {
  const start = dateOnly(localDateValue(today));
  return Math.ceil((dateOnly(expiryDate).getTime() - start.getTime()) / dayMs);
}

export function formatInventoryDate(value: string): string {
  const date = dateOnly(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(getLocale(), { day: 'numeric', month: 'short', year: 'numeric' });
}

export function isValidDateValue(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function matchesInventoryFilter(item: InventoryStockItem, filter: InventoryFilter, today = new Date()): boolean {
  const days = daysUntil(item.expiryDate, today);
  if (filter === 'expired') return days < 0;
  if (filter === 'oneDay') return days >= 0 && days <= 1;
  if (filter === 'sevenDays') return days >= 0 && days <= 7;
  if (filter === 'thirtyDays') return days >= 0 && days <= 30;
  if (filter === 'healthy') return days > 30;
  return true;
}

export function filterInventory(items: InventoryStockItem[], filters: InventoryFilters, today = new Date()) {
  const search = filters.search.trim().toLowerCase();
  return items.filter((item) => matchesInventoryFilter(item, filters.status, today)
    && (!search || item.product.toLowerCase().includes(search)));
}

export function summarizeInventory(items: InventoryStockItem[], today = new Date()) {
  const summary = { expired: 0, oneDay: 0, sevenDays: 0, thirtyDays: 0 };
  for (const item of items) {
    const days = daysUntil(item.expiryDate, today);
    if (days < 0) summary.expired += item.quantity;
    if (days >= 0 && days <= 1) summary.oneDay += item.quantity;
    if (days >= 0 && days <= 7) summary.sevenDays += item.quantity;
    if (days >= 0 && days <= 30) summary.thirtyDays += item.quantity;
  }
  return summary;
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

