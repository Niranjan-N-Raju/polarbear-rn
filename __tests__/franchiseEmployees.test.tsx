import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { FranchiseEmployeesScreen } from '../src/screens/franchise/employees/FranchiseEmployeesScreen';
import { DateInput } from '../src/components/DateInput';
import { t } from '../src/i18n';
import { EmployeeFormDrawer } from '../src/screens/franchise/employees/EmployeeFormDrawer';
import { AdminFormField } from '../src/components/AdminFormField';
import { buttonByLabel, buttons, containsText, flushEffects, renderSafeArea, response } from './testUtils';

describe('FranchiseEmployeesScreen', () => {
  afterEach(() => jest.restoreAllMocks());

  it('loads scoped employees and exposes create, filters, and pagination controls', async () => {
    jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, {
      users: Array.from({ length: 10 }, (_unused, index) => ({ _id: `employee-${index}`, name: `Employee ${index}`, phone: '5551234567', isActive: true, franchises: [] })),
      pagination: { total: 10 },
    }));
    const renderer = renderSafeArea(<FranchiseEmployeesScreen storeId="store-1" />);
    await flushEffects();
    expect(renderer.root.findByProps({ children: 'Employees' })).toBeTruthy();
    expect(buttonByLabel(renderer, 'Filter employees')).toBeTruthy();
    expect(buttonByLabel(renderer, 'Add employee')).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Load more' })).toBeTruthy();
    expect(authApi.apiRequest).toHaveBeenCalledWith(expect.stringContaining('/users?storeId=store-1'));
  });

  it('opens employee form drawer from the add action', async () => {
    jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, { users: [], pagination: { total: 0 } }));
    const renderer = renderSafeArea(<FranchiseEmployeesScreen storeId="store-1" />);
    await flushEffects();
    await act(async () => { buttonByLabel(renderer, 'Add employee').props.onPress(); });
    expect(renderer.root.findByProps({ children: 'Add employee' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Full name' })).toBeTruthy();
    expect(renderer.root.findAllByType(DateInput).map((field) => field.props.accessibilityLabel)).toEqual([
      t('franchiseEmployeesJoined'),
      t('franchiseEmployeesActualDob'),
      t('franchiseEmployeesRecordDob'),
    ]);
  });

  const details = { _id: 'employee-1', name: 'Asha', phone: '9876543210', position: 'Cook', employmentType: 'full_time', dateOfJoining: '2025-01-02T00:00:00.000Z', salary: 15000, bankName: 'Bank' };
  const fieldByLabel = (renderer: ReturnType<typeof renderSafeArea>, label: string) => renderer.root.findAllByType(AdminFormField).find((node) => node.props.label === label)!;
  const pressSection = (renderer: ReturnType<typeof renderSafeArea>, label: string) => act(() => buttons(renderer).find((node) => containsText(node.props.children, label))!.props.onPress());
  const pressSave = async (renderer: ReturnType<typeof renderSafeArea>) => {
    await act(async () => { await buttons(renderer).find((node) => containsText(node.props.children, t('franchiseEmployeesSave')))!.props.onPress(); });
  };

  it('sends cleared optional fields on edit and rejects a non-numeric salary', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (_path, init) => (
      init?.method === 'PATCH' ? response(200, { message: 'User updated.' }) : response(200, { user: details })
    ));
    const onSaved = jest.fn();
    const renderer = renderSafeArea(<EmployeeFormDrawer visible storeId="store-1" employee={details as never} onClose={jest.fn()} onSaved={onSaved} />);
    await flushEffects();
    act(() => fieldByLabel(renderer, t('franchiseEmployeesPhone')).props.onChangeText(''));
    act(() => fieldByLabel(renderer, t('franchiseEmployeesJoined')).props.onChangeText(''));
    pressSection(renderer, t('franchiseEmployeesFormBank'));
    act(() => fieldByLabel(renderer, t('franchiseEmployeesBankName')).props.onChangeText('  '));
    act(() => fieldByLabel(renderer, t('franchiseEmployeesSalary')).props.onChangeText('abc'));
    await pressSave(renderer);
    expect(api.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false);
    expect(renderer.root.findAllByProps({ message: t('franchiseEmployeesSalaryInvalid') }).length).toBeGreaterThan(0);

    act(() => fieldByLabel(renderer, t('franchiseEmployeesSalary')).props.onChangeText(''));
    await pressSave(renderer);
    const patch = api.mock.calls.find(([, init]) => init?.method === 'PATCH')!;
    expect(patch[0]).toBe('/users/employee-1?storeId=store-1');
    expect(JSON.parse(patch[1]!.body as string)).toMatchObject({ name: 'Asha', phone: '', dateOfJoining: '', bankName: '', salary: null, position: 'Cook', employmentType: 'full_time' });
    expect(onSaved).toHaveBeenCalledWith('User updated.');
    act(() => renderer.unmount());
  });

  it('omits empty optional fields on create and blocks saving after a failed edit load', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, { message: 'Created.' }));
    let renderer = renderSafeArea(<EmployeeFormDrawer visible storeId="store-1" employee={null} onClose={jest.fn()} onSaved={jest.fn()} />);
    act(() => fieldByLabel(renderer, t('franchiseEmployeesName')).props.onChangeText('New Hire'));
    await pressSave(renderer);
    const body = JSON.parse(api.mock.calls[0][1]!.body as string);
    expect(body).toMatchObject({ name: 'New Hire', storeId: 'store-1', role: 'employee' });
    expect(body).not.toHaveProperty('phone');
    expect(body).not.toHaveProperty('salary');
    act(() => renderer.unmount());

    api.mockReset();
    api.mockResolvedValue(response(500, { message: 'Details unavailable' }));
    renderer = renderSafeArea(<EmployeeFormDrawer visible storeId="store-1" employee={details as never} onClose={jest.fn()} onSaved={jest.fn()} />);
    await flushEffects();
    await pressSave(renderer);
    expect(api).toHaveBeenCalledTimes(1);
    act(() => renderer.unmount());
  });
});
