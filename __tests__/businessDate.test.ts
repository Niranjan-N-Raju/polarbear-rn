import { addDays, businessDate, businessMonth, dayOfWeek } from '../src/utils/businessDate';
import { currentMonthRange, thisWeekRange } from '../src/screens/franchise/dashboardDates';
import { salePresetRange } from '../src/screens/franchise/sales/utils';
import { currentMonthValue } from '../src/screens/franchise/shared/months';

describe('businessDate', () => {
  it('uses the Asia/Kolkata calendar day regardless of the device time zone', () => {
    // 2026-01-31T19:00Z is already 1 Feb 00:30 in India.
    const instant = new Date('2026-01-31T19:00:00Z');
    expect(businessDate(instant)).toBe('2026-02-01');
    expect(businessMonth(instant)).toBe('2026-02');
    expect(currentMonthValue(instant)).toBe('2026-02');
    expect(businessDate(new Date('2026-01-31T18:29:59Z'))).toBe('2026-01-31');
  });

  it('falls back to a fixed IST offset when Intl time zones are unavailable', () => {
    jest.isolateModules(() => {
      const original = Intl.DateTimeFormat;
      (Intl as { DateTimeFormat: unknown }).DateTimeFormat = jest.fn(() => { throw new RangeError('unsupported'); });
      try {
        const isolated = require('../src/utils/businessDate') as typeof import('../src/utils/businessDate');
        expect(isolated.businessDate(new Date('2026-01-31T19:00:00Z'))).toBe('2026-02-01');
      } finally {
        (Intl as { DateTimeFormat: unknown }).DateTimeFormat = original;
      }
    });
  });

  it('derives default ranges from the business date', () => {
    const instant = new Date('2026-02-28T20:00:00Z'); // 1 Mar 01:30 IST (Sunday)
    expect(currentMonthRange(instant)).toEqual({ from: '2026-03-01', to: '2026-03-31' });
    expect(thisWeekRange(instant)).toEqual({ from: '2026-03-01', to: '2026-03-01' });
    expect(salePresetRange('today', instant)).toEqual({ from: '2026-03-01', to: '2026-03-01' });
    expect(salePresetRange('month', instant)).toEqual({ from: '2026-03-01', to: '2026-03-01' });
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(dayOfWeek('2026-03-04')).toBe(3);
  });
});
