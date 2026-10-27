import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { FranchiseEmployeesScreen } from '../src/screens/franchise/employees/FranchiseEmployeesScreen';
import { DateInput } from '../src/components/DateInput';
import { t } from '../src/i18n';
import { buttonByLabel, flushEffects, renderSafeArea, response } from './testUtils';

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
});
