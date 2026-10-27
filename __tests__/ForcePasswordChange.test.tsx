import { TextInput } from 'react-native';
import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { LoginScreen } from '../src/screens/LoginScreen';
import { ForcePasswordChangeScreen, validateNewPassword } from '../src/screens/ForcePasswordChangeScreen';
import { AdminHomeScreen } from '../src/screens/admin/AdminHomeScreen';
import { buttons, containsText, flushEffects, renderSafeArea, response } from './testUtils';

afterEach(() => {
  jest.restoreAllMocks();
  authApi.setAccessToken(null);
  authApi.setPasswordChangeRequiredHandler(null);
  authApi.setUnauthorizedHandler(null);
});

function pressText(renderer: ReturnType<typeof renderSafeArea>, label: string) {
  const target = buttons(renderer).find((button) => containsText(button.props.children, label));
  if (!target) throw new Error(`button ${label} not found`);
  return target;
}

describe('apiRequest PASSWORD_CHANGE_REQUIRED handling', () => {
  it('invokes the handler only for the server code on an authenticated 403', async () => {
    authApi.setAccessToken('token');
    const handler = jest.fn();
    authApi.setPasswordChangeRequiredHandler(handler);
    const forced = { ...response(403, {}), clone: () => ({ json: async () => ({ code: 'PASSWORD_CHANGE_REQUIRED' }) }) };
    const plain = { ...response(403, {}), clone: () => ({ json: async () => ({ message: 'Forbidden' }) }) };
    global.fetch = jest.fn().mockResolvedValueOnce(plain).mockResolvedValueOnce(forced);

    await authApi.apiRequest('/franchise/stores');
    expect(handler).not.toHaveBeenCalled();
    await authApi.apiRequest('/franchise/stores');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ignores the code when no token is present', async () => {
    const handler = jest.fn();
    authApi.setPasswordChangeRequiredHandler(handler);
    global.fetch = jest.fn().mockResolvedValue({ ...response(403, {}), clone: () => ({ json: async () => ({ code: 'PASSWORD_CHANGE_REQUIRED' }) }) });
    await authApi.apiRequest('/public');
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('validateNewPassword', () => {
  it('enforces the server password policy and rejects reuse', () => {
    expect(validateNewPassword('', 'x', 'x')).toBe('adminPasswordRequired');
    expect(validateNewPassword('Temp', 'A', 'B')).toBe('adminPasswordMismatch');
    expect(validateNewPassword('Temp', 'short', 'short')).toBe('adminPasswordLength');
    expect(validateNewPassword('Temp', 'nouppercase12!', 'nouppercase12!')).toBe('adminPasswordUppercase');
    expect(validateNewPassword('SamePassword12!', 'SamePassword12!', 'SamePassword12!')).toBe('adminPasswordSame');
    expect(validateNewPassword('TempPassword12!', 'BrandNewPass12!', 'BrandNewPass12!')).toBeNull();
  });
});

describe('ForcePasswordChangeScreen', () => {
  it('submits the change, stores the renewed token and completes', async () => {
    const apiRequest = jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, { token: 'renewed', mustChangePassword: false }));
    const setToken = jest.spyOn(authApi, 'setAccessToken');
    const onCompleted = jest.fn();
    const renderer = renderSafeArea(<ForcePasswordChangeScreen onCompleted={onCompleted} onSignOut={jest.fn()} />);
    const inputs = renderer.root.findAllByType(TextInput);
    act(() => {
      inputs[0].props.onChangeText('TempPassword12!');
      inputs[1].props.onChangeText('BrandNewPass12!');
      inputs[2].props.onChangeText('BrandNewPass12!');
    });
    await act(async () => { pressText(renderer, t('forcePasswordSubmit')).props.onPress(); });
    await flushEffects();
    expect(apiRequest).toHaveBeenCalledWith('/me', expect.objectContaining({ method: 'PATCH' }));
    expect(JSON.parse(String(apiRequest.mock.calls[0][1]?.body))).toEqual({ currentPassword: 'TempPassword12!', newPassword: 'BrandNewPass12!' });
    expect(setToken).toHaveBeenCalledWith('renewed');
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });

  it('shows the server error and does not complete on failure', async () => {
    jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(400, { message: 'Current password is incorrect.' }));
    const onCompleted = jest.fn();
    const renderer = renderSafeArea(<ForcePasswordChangeScreen onCompleted={onCompleted} onSignOut={jest.fn()} />);
    const inputs = renderer.root.findAllByType(TextInput);
    act(() => {
      inputs[0].props.onChangeText('WrongPassword12!');
      inputs[1].props.onChangeText('BrandNewPass12!');
      inputs[2].props.onChangeText('BrandNewPass12!');
    });
    await act(async () => { pressText(renderer, t('forcePasswordSubmit')).props.onPress(); });
    await flushEffects();
    expect(onCompleted).not.toHaveBeenCalled();
    expect(renderer.root.findAllByProps({ children: 'Current password is incorrect.' }).length).toBeGreaterThan(0);
  });
});

describe('LoginScreen forced password change', () => {
  it('gates the dashboard until the password is changed', async () => {
    jest.spyOn(authApi, 'login').mockResolvedValue({
      token: 'temp-token',
      user: { id: 'u1', name: 'New Admin', email: 'new@example.com', role: 'admin', mustChangePassword: true },
    });
    jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, { token: 'renewed' }));
    const renderer = renderSafeArea(<LoginScreen />);
    act(() => {
      renderer.root.findByProps({ accessibilityLabel: t('emailLabel') }).props.onChangeText('new@example.com');
      renderer.root.findByProps({ accessibilityLabel: t('passwordLabel') }).props.onChangeText('TempPassword12!');
    });
    const submit = buttons(renderer).find((button) => button.props.accessibilityRole === 'button'
      && button.props.children?.props?.children?.props?.children === t('signIn'));
    await act(async () => { submit?.props.onPress(); });
    await flushEffects();

    expect(renderer.root.findAllByType(ForcePasswordChangeScreen)).toHaveLength(1);
    expect(renderer.root.findAllByType(AdminHomeScreen)).toHaveLength(0);

    const inputs = renderer.root.findAllByType(TextInput);
    act(() => {
      inputs[0].props.onChangeText('TempPassword12!');
      inputs[1].props.onChangeText('BrandNewPass12!');
      inputs[2].props.onChangeText('BrandNewPass12!');
    });
    await act(async () => { pressText(renderer, t('forcePasswordSubmit')).props.onPress(); });
    await flushEffects();
    expect(renderer.root.findAllByType(ForcePasswordChangeScreen)).toHaveLength(0);
    expect(renderer.root.findAllByType(AdminHomeScreen)).toHaveLength(1);
    act(() => renderer.unmount());
  });
});
