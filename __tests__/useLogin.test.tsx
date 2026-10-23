import { Keyboard } from 'react-native';
import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { useLogin } from '../src/hooks/useLogin';
import { render } from './testUtils';

function LoginStateHarness({ setState }: { setState: (state: ReturnType<typeof useLogin>) => void }) {
  setState(useLogin());
  return null;
}

describe('useLogin', () => {
  it('validates, authenticates administrators, and clears the session on sign out', async () => {
      const loginMock = jest.spyOn(authApi, 'login').mockResolvedValue({
        token: 'session-token',
        user: { id: 'admin-1', name: 'Alex', email: 'alex@example.com', role: 'admin' },
      });
      const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
      let state!: ReturnType<typeof useLogin>;
      const renderer = render(<LoginStateHarness setState={(next) => { state = next; }} />);
  
      await act(async () => state.submit());
      expect(loginMock).not.toHaveBeenCalled();
      expect(state.emailError).toBe(t('emailRequired'));
      expect(state.passwordError).toBe(t('passwordRequired'));
  
      act(() => {
        state.updateEmail('  alex@example.com  ');
        state.updatePassword('valid-password');
      });
      await act(async () => state.submit());
      expect(loginMock).toHaveBeenCalledWith('alex@example.com', 'valid-password');
      expect(state.session?.token).toBe('session-token');
      expect(state.isPending).toBe(false);
      expect(dismiss).toHaveBeenCalled();
  
      act(() => state.signOut());
      expect(state.session).toBeNull();
      act(() => renderer.unmount());
    })

  it('rejects non-admin users and distinguishes credential and general errors', async () => {
      const setToken = jest.spyOn(authApi, 'setAccessToken');
      const loginMock = jest.spyOn(authApi, 'login');
      let state!: ReturnType<typeof useLogin>;
      const renderer = render(<LoginStateHarness setState={(next) => { state = next; }} />);
      act(() => {
        state.updateEmail('alex@example.com');
        state.updatePassword('valid-password');
      });
  
      loginMock.mockResolvedValueOnce({
        token: 'wrong-role-token',
        user: { id: 'user-1', name: 'Alex', email: 'alex@example.com', role: 'sub_admin' },
      });
      await act(async () => state.submit());
      expect(state.formError).toBe(t('mobileSuperAdminOnly'));
      expect(setToken).toHaveBeenCalledWith(null);
  
      loginMock.mockRejectedValueOnce(new Error(t('invalidCredentials')));
      await act(async () => state.submit());
      expect(state.passwordError).toBe(t('invalidCredentials'));
      expect(state.formError).toBe('');
  
      loginMock.mockRejectedValueOnce('unexpected');
      await act(async () => state.submit());
      expect(state.formError).toBe(t('loginFailed'));
      act(() => renderer.unmount());
    })
});
