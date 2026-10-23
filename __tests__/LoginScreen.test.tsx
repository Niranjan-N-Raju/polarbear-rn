import { Animated, KeyboardAvoidingView, Platform, StatusBar, TextInput } from 'react-native';
import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { LoginScreen } from '../src/screens/LoginScreen';
import { renderSafeArea, buttons, flushEffects, response } from './testUtils';

const originalPlatform = Platform.OS;
afterEach(() => {
  jest.restoreAllMocks();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
});

describe('LoginScreen', () => {
  it('renders accessible login inputs, toggles password visibility, and submits credentials', async () => {
      global.fetch = jest.fn().mockResolvedValue(response(401, { message: 'Unauthorized' }));
      const renderer = renderSafeArea(<LoginScreen />);
      const email = renderer.root.findByProps({ accessibilityLabel: t('emailLabel') });
      const password = renderer.root.findByProps({ accessibilityLabel: t('passwordLabel') });
      expect(password.props.secureTextEntry).toBe(true);
  
      const toggle = renderer.root.findByProps({ accessibilityLabel: t('showPassword') });
      act(() => toggle.props.onPress());
      expect(renderer.root.findByProps({ accessibilityLabel: t('passwordLabel') }).props.secureTextEntry).toBe(false);
  
      act(() => {
        email.props.onChangeText('admin@example.com');
        renderer.root.findByProps({ accessibilityLabel: t('passwordLabel') }).props.onChangeText('bad-password');
      });
      const submit = buttons(renderer).find((button) => button.props.accessibilityRole === 'button' && button.props.children?.props?.children?.props?.children === t('signIn'));
      await act(async () => { submit?.props.onPress(); });
      expect(global.fetch).toHaveBeenCalled();
      expect(renderer.root.findAllByProps({ children: t('invalidCredentials') }).length).toBeGreaterThan(0);
      act(() => renderer.unmount());
    })

  it('renders the desktop hero layout on wide web screens', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
      width: 1440,
      height: 900,
      scale: 1,
      fontScale: 1,
    });
    const renderer = renderSafeArea(<LoginScreen />);
    expect(renderer.root.findAllByProps({ children: t('heroHeadline') }).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({ children: t('heroDescription') }).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({ children: t('protectedAccess') }).length).toBeGreaterThan(0);
    act(() => renderer.unmount());
  });

  it('shows required-field errors without attempting authentication', async () => {
    global.fetch = jest.fn();
    const renderer = renderSafeArea(<LoginScreen />);
    const email = renderer.root.findByProps({ accessibilityLabel: t('emailLabel') });
    const password = renderer.root.findByProps({ accessibilityLabel: t('passwordLabel') });
    act(() => {
      email.props.onChangeText('');
      password.props.onChangeText('');
    });
    const submit = buttons(renderer).find((button) => button.props.accessibilityRole === 'button'
      && button.props.children?.props?.children?.props?.children === t('signIn'));
    await act(async () => { submit?.props.onPress(); });
    expect(renderer.root.findAllByProps({ children: t('emailRequired') }).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({ children: t('passwordRequired') }).length).toBeGreaterThan(0);
    expect(global.fetch).not.toHaveBeenCalled();
    act(() => renderer.unmount());
  });

  it('uses iOS keyboard avoidance and compact tablet web layout', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    const nativeRenderer = renderSafeArea(<LoginScreen />);
    expect(nativeRenderer.root.findByType(KeyboardAvoidingView).props.behavior).toBe('padding');
    expect(nativeRenderer.root.findByType(StatusBar).props.barStyle).toBe('dark-content');
    act(() => nativeRenderer.unmount());

    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
      width: 800,
      height: 900,
      scale: 1,
      fontScale: 1,
    });
    const tabletRenderer = renderSafeArea(<LoginScreen />);
    expect(tabletRenderer.root.findAllByProps({ children: t('heroHeadline') })).toHaveLength(0);
    expect(tabletRenderer.root.findAllByProps({ children: t('brandShortName') }).length).toBeGreaterThan(0);
    act(() => tabletRenderer.unmount());
  });

  it('renders the authenticated home and returns to login when the session expires', async () => {
    const login = jest.spyOn(authApi, 'login').mockResolvedValue({
      token: 'session-token',
      user: { id: 'admin-1', name: 'Alex Admin', email: 'alex@example.com', role: 'admin' },
    });
    jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, {}));
    const registerUnauthorizedHandler = jest.spyOn(authApi, 'setUnauthorizedHandler');
    const renderer = renderSafeArea(<LoginScreen />);
    const email = renderer.root.findByProps({ accessibilityLabel: t('emailLabel') });
    const password = renderer.root.findByProps({ accessibilityLabel: t('passwordLabel') });
    act(() => {
      email.props.onChangeText('admin@example.com');
      password.props.onChangeText('valid-password');
    });
    const submit = buttons(renderer).find((button) => button.props.accessibilityRole === 'button'
      && button.props.children?.props?.children?.props?.children === t('signIn'));
    await act(async () => { submit?.props.onPress(); });
    expect(login).toHaveBeenCalledWith('admin@example.com', 'valid-password');
    await flushEffects();
    expect(renderer.root.findAllByProps({ children: t('adminDashboard') }).length).toBeGreaterThan(0);

    jest.useFakeTimers();
    jest.spyOn(Animated, 'timing').mockImplementation(() => ({
      start: (callback?: (result: { finished: boolean }) => void) => callback?.({ finished: true }),
      stop: jest.fn(),
      reset: jest.fn(),
    }) as ReturnType<typeof Animated.timing>);
    const unauthorizedHandler = registerUnauthorizedHandler.mock.calls
      .map(([handler]) => handler)
      .find((handler) => handler !== null);
    expect(unauthorizedHandler).toBeDefined();
    act(() => unauthorizedHandler?.());
    expect(renderer.root.findAllByProps({ children: t('sessionExpired') }).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByType(TextInput).some((input) => input.props.accessibilityLabel === t('emailLabel'))).toBe(true);
    act(() => renderer.root.findByProps({ accessibilityLabel: t('adminDismissToast') }).props.onPress());
    act(() => renderer.unmount());
    jest.useRealTimers();
  });
});
