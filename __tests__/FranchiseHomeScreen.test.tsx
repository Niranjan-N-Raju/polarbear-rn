import { act } from 'react-test-renderer';
import { Platform } from 'react-native';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { FranchiseDashboardScreen } from '../src/screens/franchise/FranchiseDashboardScreen';
import { FranchiseHomeScreen } from '../src/screens/franchise/FranchiseHomeScreen';
import { buttons, flushEffects, renderSafeArea, response } from './testUtils';

jest.mock('../src/screens/franchise/FranchiseDashboardScreen', () => ({
  FranchiseDashboardScreen: jest.fn(() => null),
}));

const user = { id: 'user-1', name: 'Franchise Admin', email: 'user@example.test', role: 'franchise_admin' };
const stores = [{ _id: 'store-1', name: 'Central' }, { _id: 'store-2', name: 'North' }];
const originalPlatform = Platform.OS;

afterEach(() => {
  jest.restoreAllMocks();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
});

describe('FranchiseHomeScreen', () => {
  it('requires selecting a store for multiple assignments and supports switching and cancellation', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, { franchises: stores }));
    const logout = jest.fn();
    const renderer = renderSafeArea(<FranchiseHomeScreen user={user} onLogout={logout} />);
    await flushEffects();
    expect(renderer.root.findAllByType(FranchiseDashboardScreen)).toHaveLength(0);
    expect(renderer.root.findAllByProps({ accessibilityLabel: t('franchiseCloseSelector') })).toHaveLength(0);
    act(() => renderer.root.findByProps({ accessibilityLabel: t('franchiseSelectStoreName', { name: 'Central' }) }).props.onPress());
    expect(renderer.root.findByType(FranchiseDashboardScreen).props.storeId).toBe('store-1');

    act(() => renderer.root.findByProps({ accessibilityLabel: t('adminOpenMenu') }).props.onPress());
    act(() => renderer.root.findByProps({ accessibilityLabel: t('franchiseSwitchStore') }).props.onPress());
    await flushEffects();
    act(() => renderer.root.findByProps({ accessibilityLabel: t('franchiseCloseSelector') }).props.onPress());
    expect(renderer.root.findByType(FranchiseDashboardScreen).props.storeId).toBe('store-1');

    act(() => renderer.root.findByProps({ accessibilityLabel: t('adminOpenMenu') }).props.onPress());
    act(() => renderer.root.findByProps({ accessibilityLabel: t('franchiseSwitchStore') }).props.onPress());
    await flushEffects();
    act(() => renderer.root.findByProps({ accessibilityLabel: t('franchiseSelectStoreName', { name: 'North' }) }).props.onPress());
    expect(renderer.root.findByType(FranchiseDashboardScreen).props.storeId).toBe('store-2');
    expect(api).toHaveBeenCalledTimes(3);

    act(() => renderer.root.findByProps({ accessibilityLabel: t('adminOpenMenu') }).props.onPress());
    act(() => renderer.root.findByProps({ accessibilityLabel: t('signOut') }).props.onPress());
    expect(logout).toHaveBeenCalledTimes(1);
    act(() => renderer.unmount());
  });

  it('automatically selects the only store and exposes the complete source navigation', async () => {
    jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, { franchises: [stores[0]] }));
    const renderer = renderSafeArea(<FranchiseHomeScreen user={user} onLogout={jest.fn()} />);
    await flushEffects();
    expect(renderer.root.findByType(FranchiseDashboardScreen).props.storeId).toBe('store-1');
    act(() => renderer.root.findByProps({ accessibilityLabel: t('adminOpenMenu') }).props.onPress());
    expect(renderer.root.findAllByProps({ accessibilityLabel: t('franchiseSwitchStore') })).toHaveLength(0);
    const groupButton = (label: string) => buttons(renderer).find((button) => button.props.children?.props?.children === label)!;
    act(() => groupButton(t('franchiseStoreGroup')).props.onPress());
    for (const label of ['franchiseSales', 'franchiseInventory', 'franchisePnl', 'franchiseWithdrawals'] as const) {
      expect(renderer.root.findAllByProps({ accessibilityLabel: t(label) }).length).toBeGreaterThan(0);
    }
    act(() => groupButton(t('franchiseStaffGroup')).props.onPress());
    for (const label of ['adminEmployees', 'franchiseAttendance', 'franchiseSalary', 'adminProfile', 'franchiseStoreConfig'] as const) {
      expect(renderer.root.findAllByProps({ accessibilityLabel: t(label) }).length).toBeGreaterThan(0);
    }
    act(() => renderer.root.findByProps({ accessibilityLabel: t('franchiseSalary') }).props.onPress());
    expect(renderer.root.findAllByProps({ children: t('franchiseNotMigrated') }).length).toBeGreaterThan(0);
    act(() => renderer.unmount());
  });

  it('shows store-load errors with retry and a no-store state without requesting dashboard data', async () => {
    jest.spyOn(authApi, 'apiRequest')
      .mockRejectedValueOnce(new Error(t('franchiseStoresLoadFailed')))
      .mockResolvedValueOnce(response(200, { franchises: [] }));
    const renderer = renderSafeArea(<FranchiseHomeScreen user={user} onLogout={jest.fn()} />);
    await flushEffects();
    expect(renderer.root.findAllByProps({ children: t('franchiseStoresLoadFailed') }).length).toBeGreaterThan(0);
    const refresh = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminRefresh'))!;
    act(() => refresh.props.onPress());
    await flushEffects();
    expect(renderer.root.findAllByProps({ children: t('franchiseNoStores') }).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByType(FranchiseDashboardScreen)).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it('supports the desktop sidebar and rechecks assignments before switching stores', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({ width: 1440, height: 900, scale: 1, fontScale: 1 });
    jest.spyOn(authApi, 'apiRequest')
      .mockResolvedValueOnce(response(200, { franchises: stores }))
      .mockResolvedValueOnce(response(200, { franchises: [stores[1]] }));
    const renderer = renderSafeArea(<FranchiseHomeScreen user={user} onLogout={jest.fn()} />);
    await flushEffects();
    act(() => renderer.root.findByProps({ accessibilityLabel: t('franchiseSelectStoreName', { name: 'Central' }) }).props.onPress());
    expect(renderer.root.findAllByProps({ accessibilityLabel: t('adminOpenMenu') })).toHaveLength(0);
    act(() => renderer.root.findByProps({ accessibilityLabel: t('franchiseCollapseSidebar') }).props.onPress());
    expect(renderer.root.findAllByProps({ accessibilityLabel: t('franchiseExpandSidebar') }).length).toBeGreaterThan(0);
    act(() => renderer.root.findByProps({ accessibilityLabel: t('franchiseSwitchStore') }).props.onPress());
    await flushEffects();
    expect(renderer.root.findByType(FranchiseDashboardScreen).props.storeId).toBe('store-2');
    expect(renderer.root.findAllByProps({ accessibilityLabel: t('franchiseSelectStoreName', { name: 'Central' }) })).toHaveLength(0);
    act(() => renderer.unmount());
  });
});
