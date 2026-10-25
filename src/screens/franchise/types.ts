export interface FranchiseStore {
  _id: string;
  name: string;
  storeCode?: string;
  address?: string;
}

export interface FranchiseDashboardStats {
  storeCount: number;
  employeeSummary: number;
  salesSummary: number;
  attendanceSummary: number;
  attritionTrend: { month: string; monthLabel: string; headcount: number; leavers: number; rate: number }[];
  weekdayPerformance: { day: string; average: number }[];
  expenseBreakdown: { name: string; amount: number }[];
  paymentMixTrend: { month: string; monthLabel: string; onlinePercent: number; upiPercent: number; cashPercent: number }[];
}

export interface DailySale {
  date: string;
  totalSale: number;
}

export interface SaleExpense {
  name: string;
  amount: number;
}

export interface SaleRecord {
  _id: string;
  date: string;
  totalSale: number;
  swiggy: number;
  zomato: number;
  upi: number;
  upiCharge: number;
  cash: number;
  expenses: SaleExpense[];
  totalExpenses: number;
  bankingCash: number;
}

export interface InventoryProduct {
  _id: string;
  name: string;
  normalizedName?: string;
}

export interface InventoryStockItem {
  _id: string;
  productId: string;
  product: string;
  quantity: number;
  expiryDate: string;
}
