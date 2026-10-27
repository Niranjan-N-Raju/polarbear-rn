import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { FranchiseAttendanceScreen } from '../src/screens/franchise/attendance/FranchiseAttendanceScreen';
import { DateInput } from '../src/components/DateInput';
import { buttonByLabel, containsText, flushEffects, renderSafeArea, response } from './testUtils';

afterEach(() => jest.restoreAllMocks());

describe('FranchiseAttendanceScreen', () => {
  it('loads roster data and writes a status update for an employee', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path) => {
      if (path.startsWith('/users?')) return response(200, { users: [{ _id: 'employee-1', name: 'Asha', isActive: true }] });
      if (path.startsWith('/stores/cycle?')) return response(200, { cycle: { from: '2026-10-01', to: '2026-10-31', type: 'calendar_month', startDay: 1 } });
      if (path.startsWith('/attendance?')) return response(200, { records: [] });
      if (path === '/attendance') return response(200, { message: 'Attendance updated.' });
      return response(200, {});
    });
    const renderer = renderSafeArea(<FranchiseAttendanceScreen storeId="store-1" />);
    await flushEffects();
    expect(api.mock.calls.some(([path]) => path === '/users?franchiseId=store-1&includeArchived=true&limit=500')).toBe(true);
    expect(api.mock.calls.some(([path]) => path === '/stores/cycle?franchiseId=store-1&period=' + new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'))).toBe(true);
    expect(api.mock.calls.some(([path]) => path === '/attendance?storeId=store-1&from=2026-10-01&to=2026-10-31')).toBe(true);
    const dateInput = renderer.root.findAllByType(DateInput).find((field) => field.props.accessibilityLabel === t('franchiseAttendanceDate'))!;
    expect(dateInput.props).toMatchObject({ minimumDate: '2026-10-01', maximumDate: '2026-10-31', allowClear: false });
    act(() => dateInput.props.onChangeText('2026-10-12'));

    await act(async () => { buttonByLabel(renderer, 'Asha: Present').props.onPress(); await new Promise((resolve) => setImmediate(resolve)); });
    await flushEffects();
    expect(api).toHaveBeenLastCalledWith('/attendance', expect.objectContaining({ method: 'PUT' }));
    expect(JSON.parse(api.mock.calls.at(-1)?.[1]?.body as string)).toMatchObject({ storeId: 'store-1', date: '2026-10-12', records: [{ employeeId: 'employee-1', status: 'Present' }] });
    expect(api.mock.calls.at(-1)?.[1]?.method).toBe('PUT');
    act(() => renderer.unmount());
  });

  it('shows a load error and supports retry', async () => {
    const api = jest.spyOn(authApi, 'apiRequest')
      .mockResolvedValueOnce(response(500, { message: 'Unable to load employees' }))
      .mockResolvedValueOnce(response(200, { users: [] }))
      .mockResolvedValueOnce(response(200, { cycle: { from: '2026-10-01', to: '2026-10-31' } }))
      .mockResolvedValueOnce(response(200, { records: [] }));
    const renderer = renderSafeArea(<FranchiseAttendanceScreen storeId="store-1" />);
    await flushEffects();
    expect(renderer.root.findAll((node) => node.props.children === 'Unable to load employees').length).toBeGreaterThan(0);
    act(() => renderer.root.find((node) => node.props.onPress && containsText(node.props.children, t('adminRefresh'))).props.onPress());
    await flushEffects();
    expect(api).toHaveBeenCalledTimes(4);
    act(() => renderer.unmount());
  });

  it('loads weekly roster options using store shifts', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path) => {
      if (path.startsWith('/users?')) return response(200, { users: [{ _id: 'employee-1', name: 'Asha', isActive: true }] });
      if (path.startsWith('/stores/cycle?')) return response(200, { cycle: { from: '2026-10-01', to: '2026-10-31', type: 'calendar_month', startDay: 1 } });
      if (path.startsWith('/attendance?')) return response(200, { records: [] });
      if (path.startsWith('/attendance/weekly-roster?')) return response(200, { shifts: [{ id: 'day', name: 'Day', startTime: '09:00', endTime: '18:00' }], roster: null });
      return response(200, {});
    });
    const renderer = renderSafeArea(<FranchiseAttendanceScreen storeId="store-1" />);
    await flushEffects();
    act(() => renderer.root.findAll((node) => node.props.accessibilityLabel === t('franchiseAttendanceWeeklyRoster'))[0].props.onPress());
    await flushEffects();
    expect(api.mock.calls.some(([path]) => path.startsWith('/attendance/weekly-roster?storeId=store-1&weekStart='))).toBe(true);
    const weekInput = renderer.root.findAllByType(DateInput).find((field) => field.props.accessibilityLabel === t('franchiseAttendanceWeeklyRoster'))!;
    act(() => weekInput.props.onChangeText('2026-10-21'));
    await flushEffects();
    expect(api.mock.calls.some(([path]) => path === '/attendance/weekly-roster?storeId=store-1&weekStart=2026-10-19')).toBe(true);
    expect(renderer.root.findAll((node) => typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('Asha ') && node.props.accessibilityLabel.endsWith('Off')).length).toBeGreaterThan(0);
    act(() => renderer.unmount());
  });

});
