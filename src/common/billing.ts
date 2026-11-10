import { apiRequest } from '../api/auth';

export interface BillingProduct { _id: string; name: string; category: string; price: number | null }
export interface BillCustomer { mobile: string; firstName: string; middleName: string; lastName: string }
export interface BillItem { productId: string; name: string; quantity: number; unitPricePaise: number; amountPaise: number }
export interface BillSummary { _id: string; billNumber: string; orderType: 'dineIn' | 'takeAway'; tableNumber: string | null; totalPaise: number; createdAt: string }
export interface SavedBill extends BillSummary { storeName: string; items: BillItem[]; subtotalPaise: number; gstPercent: number; gstPaise: number; customer: BillCustomer | null }
export interface BillingData { storeName: string; products: BillingProduct[]; tables: string[] }
export interface HistoryData { storeName: string; bills: BillSummary[]; tables: string[]; total: number; page: number; pageSize: number; totalPages: number }
export const EMPTY_CUSTOMER: BillCustomer = { mobile: '', firstName: '', middleName: '', lastName: '' };

export function pricePaise(price: unknown): number | null {
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0.01 || price > 1_000_000) return null;
  const paise = Math.round(price * 100);
  return Math.abs(price * 100 - paise) < 0.000001 ? paise : null;
}
export function billTotals(subtotalPaise: number) {
  const gstPaise = Math.round(subtotalPaise * 5 / 100);
  return { subtotalPaise, gstPaise, totalPaise: subtotalPaise + gstPaise };
}
const rupeeFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
export function formatINR(paise: number) {
  return rupeeFormatter.format(paise / 100);
}
export async function billingRequest<Body>(path: string, init?: RequestInit): Promise<Body> {
  const response = await apiRequest(path, init);
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== 'object') {
    const message = data && typeof data === 'object' ? (data as { message?: unknown }).message : null;
    throw new Error(typeof message === 'string' ? message : 'Unable to complete this request.');
  }
  return data as Body;
}