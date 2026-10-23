import { Platform } from 'react-native';
import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { AdminDashboardScreen } from '../src/screens/admin/AdminDashboardScreen';
import { render, response } from './testUtils';

const originalPlatform = Platform.OS;
afterEach(() => {
  jest.restoreAllMocks();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
});

describe('AdminDashboardScreen', () => {
  it('loads dashboard statistics and shows its error state on request failure', async () => {
      const apiRequest = jest.spyOn(authApi, 'apiRequest');
      apiRequest.mockResolvedValueOnce(response(200, {
        totalStores: 4, activeStores: 3, inactiveStores: 1, franchiseStores: 2,
        companyStores: 2, totalUsers: 6, storeAdmins: 2, subAdmins: 1, employees: 3,
      }));
      let renderer = render(<AdminDashboardScreen />);
      await act(async () => { await new Promise((resolve) => setImmediate(resolve)); });
      expect(apiRequest).toHaveBeenCalledWith('/dashboard');
      expect(renderer.root.findAllByProps({ children: t('adminDashboard') }).length).toBeGreaterThan(0);
      expect(renderer.toJSON()).toBeTruthy();
      act(() => renderer.unmount());
  
      apiRequest.mockRejectedValueOnce(new Error('offline'));
      renderer = render(<AdminDashboardScreen />);
      await act(async () => { await new Promise((resolve) => setImmediate(resolve)); });
      expect(renderer.root.findAllByProps({ accessibilityRole: 'alert' }).length).toBeGreaterThan(0);
      act(() => renderer.unmount());
    })
});
