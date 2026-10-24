import { datesBetween, thisWeekRange, validDateRange } from '../src/screens/franchise/dashboardDates';

describe('dashboard calendar date handling', () => {
  it('includes both endpoints and leap days without timezone shifts', () => {
    expect(datesBetween('2024-02-28', '2024-03-01')).toEqual(['2024-02-28', '2024-02-29', '2024-03-01']);
    expect(validDateRange('2026-02-30', '2026-03-01')).toBe(false);
    expect(validDateRange('2026-10-31', '2026-10-01')).toBe(false);
    expect(validDateRange('2020-01-01', '2026-10-01')).toBe(false);
    expect(datesBetween('invalid', '2026-10-01')).toEqual([]);
    expect(validDateRange('2024-01-01', '2025-01-01')).toBe(true);
    expect(datesBetween('2024-01-01', '2025-01-01')).toHaveLength(367);
    expect(validDateRange('2024-01-01', '2025-01-02')).toBe(false);
  });

  it('uses Sunday as the start of this week like the Next.js dashboard', () => {
    expect(thisWeekRange(new Date(2026, 9, 24, 12))).toEqual({ from: '2026-10-18', to: '2026-10-24' });
  });
});
