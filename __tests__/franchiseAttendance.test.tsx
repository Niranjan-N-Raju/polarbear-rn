import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { setLanguage, t } from '../src/i18n';
import { dateLabel } from '../src/screens/franchise/attendance/attendanceUtils';
import { ConfirmDrawer } from '../src/screens/franchise/shared/ConfirmDrawer';
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

  it('confirms attendance removal in-app instead of a native-only alert', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path, init) => {
      if (path.startsWith('/users?')) return response(200, { users: [{ _id: 'employee-1', name: 'Asha', isActive: true }] });
      if (path.startsWith('/stores/cycle?')) return response(200, { cycle: { from: '2026-10-01', to: '2026-10-31', type: 'calendar_month', startDay: 1 } });
      if (path.startsWith('/attendance?') && init?.method === 'DELETE') return response(200, { message: 'Removed.' });
      if (path.startsWith('/attendance?')) return response(200, { records: [{ employeeId: 'employee-1', date: '2026-10-12', status: 'Present', comment: '' }] });
      return response(200, {});
    });
    const renderer = renderSafeArea(<FranchiseAttendanceScreen storeId="store-1" />);
    await flushEffects();
    const dateInput = renderer.root.findAllByType(DateInput).find((field) => field.props.accessibilityLabel === t('franchiseAttendanceDate'))!;
    act(() => dateInput.props.onChangeText('2026-10-12'));
    act(() => buttonByLabel(renderer, `${t('franchiseAttendanceRemove')} Asha`).props.onPress());
    const drawer = renderer.root.findByType(ConfirmDrawer);
    expect(drawer.props.visible).toBe(true);
    expect(drawer.props.message).toBe(t('franchiseAttendanceRemoveConfirm', { name: 'Asha', date: dateLabel('2026-10-12') }));
    expect(api.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);

    await act(async () => { drawer.props.onConfirm(); await new Promise((resolve) => setImmediate(resolve)); });
    expect(api).toHaveBeenLastCalledWith('/attendance?storeId=store-1&date=2026-10-12&employeeId=employee-1', { method: 'DELETE' });
    expect(renderer.root.findByType(ConfirmDrawer).props.visible).toBe(false);
    expect(renderer.root.findAll((node) => node.props.accessibilityLabel === `${t('franchiseAttendanceRemove')} Asha`)).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it('keeps the confirmation open with an error when removal fails, and cancels without deleting', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path, init) => {
      if (path.startsWith('/users?')) return response(200, { users: [{ _id: 'employee-1', name: 'Asha', isActive: true }] });
      if (path.startsWith('/stores/cycle?')) return response(200, { cycle: { from: '2026-10-01', to: '2026-10-31' } });
      if (path.startsWith('/attendance?') && init?.method === 'DELETE') return response(500, { message: 'Delete failed' });
      if (path.startsWith('/attendance?')) return response(200, { records: [{ employeeId: 'employee-1', date: '2026-10-12', status: 'Present', comment: '' }] });
      return response(200, {});
    });
    const renderer = renderSafeArea(<FranchiseAttendanceScreen storeId="store-1" />);
    await flushEffects();
    const dateInput = renderer.root.findAllByType(DateInput).find((field) => field.props.accessibilityLabel === t('franchiseAttendanceDate'))!;
    act(() => dateInput.props.onChangeText('2026-10-12'));
    act(() => buttonByLabel(renderer, `${t('franchiseAttendanceRemove')} Asha`).props.onPress());
    await act(async () => { renderer.root.findByType(ConfirmDrawer).props.onConfirm(); await new Promise((resolve) => setImmediate(resolve)); });
    expect(renderer.root.findByType(ConfirmDrawer).props).toMatchObject({ visible: true, error: 'Delete failed' });
    act(() => renderer.root.findByType(ConfirmDrawer).props.onClose());
    expect(renderer.root.findByType(ConfirmDrawer).props.visible).toBe(false);
    expect(api.mock.calls.filter(([, init]) => init?.method === 'DELETE')).toHaveLength(1);
    act(() => renderer.unmount());
  });

  it('formats attendance dates in the selected app language', () => {
    const date = '2026-01-05';
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
    try {
      setLanguage('kn');
      expect(dateLabel(date)).toBe(new Intl.DateTimeFormat('kn-IN', options).format(new Date(`${date}T00:00:00`)));
      setLanguage('en');
      expect(dateLabel(date)).toBe(new Intl.DateTimeFormat('en-IN', options).format(new Date(`${date}T00:00:00`)));
    } finally {
      setLanguage('en');
    }
  });

  it('does not save a previous week roster when the next week fails to load', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path, init) => {
      if (path.startsWith('/users?')) return response(200, { users: [{ _id: 'employee-1', name: 'Asha', isActive: true }] });
      if (path.startsWith('/stores/cycle?')) return response(200, { cycle: { from: '2026-10-01', to: '2026-10-31' } });
      if (path.startsWith('/attendance?')) return response(200, { records: [] });
      if (path.includes('weekStart=2026-10-26')) return response(500, { message: 'Roster unavailable' });
      if (path.startsWith('/attendance/weekly-roster?')) return response(200, { shifts: [{ id: 'day', name: 'Day', startTime: '09:00', endTime: '18:00' }], roster: null });
      if (init?.method === 'PUT') return response(200, { message: 'saved' });
      return response(200, {});
    });
    const renderer = renderSafeArea(<FranchiseAttendanceScreen storeId="store-1" />);
    await flushEffects();
    act(() => renderer.root.findAll((node) => node.props.accessibilityLabel === t('franchiseAttendanceWeeklyRoster'))[0].props.onPress());
    await flushEffects();
    const weekInput = () => renderer.root.findAllByType(DateInput).find((field) => field.props.accessibilityLabel === t('franchiseAttendanceWeeklyRoster'))!;
    const saveButton = () => renderer.root.findAll((node) => typeof node.props.onPress === 'function' && containsText(node.props.children, t('franchiseAttendanceSaveRoster')))[0];
    act(() => weekInput().props.onChangeText('2026-10-21'));
    await flushEffects();
    expect(saveButton().props.disabled).toBe(false);

    act(() => weekInput().props.onChangeText('2026-10-28'));
    await flushEffects();
    expect(renderer.root.findAll((node) => node.props.children === 'Roster unavailable').length).toBeGreaterThan(0);
    expect(saveButton().props.disabled).toBe(true);
    await act(async () => { await saveButton().props.onPress(); });
    expect(api.mock.calls.some(([path, init]) => path === '/attendance/weekly-roster' && init?.method === 'PUT')).toBe(false);

    act(() => renderer.root.findAll((node) => node.props.onPress && containsText(node.props.children, t('adminRefresh')))[0].props.onPress());
    await flushEffects();
    expect(api.mock.calls.filter(([path]) => path.includes('weekStart=2026-10-26'))).toHaveLength(2);
    act(() => renderer.unmount());
  });
});
