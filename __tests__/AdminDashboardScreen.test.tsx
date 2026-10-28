import { Platform } from 'react-native';
import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { SummaryCards } from '../src/components/SummaryCards';
import { theme } from '../src/config/theme';
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
      expect(apiRequest).toHaveBeenCalledWith('/dashboard', expect.objectContaining({ signal: expect.any(AbortSignal) }));
      expect(renderer.root.findByType(SummaryCards).props.cards).toEqual([
        expect.objectContaining({ key: 'totalStores', color: theme.colors.teal }),
        expect.objectContaining({ key: 'activeStores', color: theme.colors.orange }),
        expect.objectContaining({ key: 'franchiseStores', color: theme.colors.orange }),
        expect.objectContaining({ key: 'companyStores', color: theme.colors.teal }),
        expect.objectContaining({ key: 'totalUsers', color: theme.colors.teal }),
        expect.objectContaining({ key: 'subAdmins', color: theme.colors.orange }),
        expect.objectContaining({ key: 'storeAdmins', color: theme.colors.orange }),
        expect.objectContaining({ key: 'employees', color: theme.colors.teal }),
      ]);
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
