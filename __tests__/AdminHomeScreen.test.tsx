import { Platform } from 'react-native';
import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { AdminHomeScreen } from '../src/screens/admin/AdminHomeScreen';
import { renderSafeArea, buttons, containsText, buttonByLabel, flushEffects, response } from './testUtils';

const originalPlatform = Platform.OS;
afterEach(() => {
  jest.restoreAllMocks();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
});

describe('AdminHomeScreen', () => {
  it('navigates the native admin menu and signs out even if remote logout fails', async () => {
      const apiRequest = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path) => {
        if (path === '/auth/logout') throw new Error('offline');
        if (path.startsWith('/users?')) return response(200, { users: [], pagination: { page: 1, totalPages: 1, total: 0 } });
        if (path.startsWith('/stores')) return response(200, { franchises: [] });
        return response(200, {});
      });
      const onLogout = jest.fn();
      const user = { id: 'admin-1', name: 'Alex', email: 'alex@example.com', role: 'admin' };
      const renderer = renderSafeArea(<AdminHomeScreen user={user} onLogout={onLogout} />);
      act(() => buttonByLabel(renderer, t('adminOpenMenu')).props.onPress());
      const usersTab = buttons(renderer).find((button) => containsText(button.props.children, t('adminUsers')));
      act(() => usersTab?.props.onPress());
      await flushEffects();
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('/users?'));
  
      act(() => buttonByLabel(renderer, t('adminOpenMenu')).props.onPress());
      await act(async () => { buttonByLabel(renderer, t('signOut')).props.onPress(); });
      expect(apiRequest).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });
      expect(onLogout).toHaveBeenCalled();
      act(() => renderer.unmount());
    })

  it('renders desktop sidebar navigation and profile actions', async () => {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
      jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
        width: 1300,
        height: 900,
        scale: 1,
        fontScale: 1,
      });
      const apiRequest = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path) => {
        if (path === '/dashboard') return response(200, { totalStores: 0, activeStores: 0, inactiveStores: 0, franchiseStores: 0, companyStores: 0, totalUsers: 0, storeAdmins: 0, subAdmins: 0, employees: 0 });
        if (path === '/me') return response(200, { id: 'admin-1', name: 'Alex', email: 'alex@example.com', role: 'admin' });
        if (path.startsWith('/stores')) return response(200, { franchises: [] });
        if (path.startsWith('/users?')) return response(200, { users: [], pagination: { page: 1, totalPages: 1, total: 0 } });
        return response(200, {});
      });
      const user = { id: 'admin-1', name: 'Alex', email: 'alex@example.com', role: 'admin' };
      const renderer = renderSafeArea(<AdminHomeScreen user={user} onLogout={jest.fn()} />);
      await flushEffects();
      act(() => buttonByLabel(renderer, 'Collapse sidebar').props.onPress());
      expect(renderer.root.findAllByProps({ accessibilityLabel: 'Expand sidebar' }).length).toBeGreaterThan(0);
      const storesTab = buttonByLabel(renderer, t('adminStores'));
      act(() => storesTab.props.onPress());
      await flushEffects();
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('/stores?'));
      const profileTab = buttonByLabel(renderer, t('adminProfile'));
      act(() => profileTab.props.onPress());
      await flushEffects();
      expect(apiRequest).toHaveBeenCalledWith('/me');
      expect(renderer.root.findAllByProps({ children: t('adminProfileTitle') }).length).toBeGreaterThan(0);
      act(() => renderer.unmount());
    })
});
