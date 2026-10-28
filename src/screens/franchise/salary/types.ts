import { type SalaryEntry } from './SalaryEntryDrawer';
export interface Projection {
  employeeId: string; name: string; position: string; employmentType: string; salary: number;
  paidDays: number; absentDays: number; weekOffDays: number; missingDays: number; futureDays: number; eligibleDays: number;
  incentives: SalaryEntry[]; incentiveTotal: number; extraDays: SalaryEntry[]; extraDaysTotal: number;
  advances: SalaryEntry[]; advanceTotal: number; earnedSalary: number; projectedSalary: number;
}
export interface SalaryData { store: { id: string; name: string; }; cycle: { configured: boolean; type: 'calendar_month' | 'custom'; startDay: number; endDay: number; from: string; to: string; totalDays: number; }; projections: Projection[]; }
export interface SlipData { periodLabel?: string; store?: { name?: string; address?: string; phone?: string; }; employee?: Record<string, string>; attendance?: { totalWorkingDays?: number; presentDays?: number; weekOffDays?: number; absentDays?: number; extraDaysTotal?: number; extraDays?: Array<{ type: string; days: number; }>; }; earnings?: { basicSalary?: number; grossEarnings?: number; }; deductions?: { advanceTotal?: number; totalDeductions?: number; advances?: Array<{ type: string; amount: number; }>; }; incentives?: Array<{ type: string; amount: number; }>; incentiveTotal?: number; netPay?: number; }
