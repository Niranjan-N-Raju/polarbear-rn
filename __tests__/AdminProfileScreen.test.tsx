import { Platform, ScrollView, StyleSheet, TextInput } from 'react-native';
import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { getLanguage, setLanguage, t } from '../src/i18n';
import { AdminProfileScreen } from '../src/screens/admin/AdminProfileScreen';
import { useAdminProfile } from '../src/screens/admin/useAdminProfile';
import { render } from './testUtils';
import { adminStyles } from '../src/styles/adminStyles';
import { renderSafeArea, buttons, containsText, flushEffects, response } from './testUtils';

const originalPlatform = Platform.OS;
afterEach(() => {
  setLanguage('en');
  jest.restoreAllMocks();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
});

describe('AdminProfileScreen', () => {
  it.each(['admin', 'franchise_admin'])('uses the standard screen gutters without nested horizontal padding for %s', async (role) => {
    const user = { id: 'user-1', name: 'Alex', email: 'alex@example.com', role };
    jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, user));
    const renderer = renderSafeArea(<AdminProfileScreen user={user} onUserUpdated={jest.fn()} />);
    await flushEffects();

    const scroll = renderer.root.findByType(ScrollView);
    const screenStyle = StyleSheet.flatten(scroll.parent!.props.style);
    const contentStyle = StyleSheet.flatten(scroll.props.contentContainerStyle);
    expect(screenStyle.paddingHorizontal).toBe(adminStyles.screen.paddingHorizontal);
    expect(contentStyle.paddingHorizontal).toBe(0);
    expect(screenStyle.paddingHorizontal + contentStyle.paddingHorizontal).toBe(16);
    act(() => renderer.unmount());
  });

  it('loads profile, validates and updates a name, and validates password changes', async () => {
      const initialUser = {
        id: 'admin-1',
        name: 'Alex',
        email: 'alex@example.com',
        role: 'admin',
      };
      const apiRequest = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (_path, options) => {
        if (!options) return response(200, initialUser);
        const body = JSON.parse(String(options.body)) as Record<string, string>;
        if (body.name) return response(200, { token: 'renewed-token' });
        if (body.currentPassword && body.newPassword !== 'AnotherPassword12!') return response(400, { message: 'Incorrect current password' });
        if (body.newPassword === 'AnotherPassword12!') return response(200, { token: 'password-renewed-token' });
        return response(200, {});
      });
      const onUserUpdated = jest.fn();
      const renderer = renderSafeArea(<AdminProfileScreen user={initialUser} onUserUpdated={onUserUpdated} />);
      await flushEffects();
      expect(apiRequest).toHaveBeenCalledWith('/me', expect.objectContaining({ signal: expect.any(AbortSignal) }));
      expect(renderer.root.findAllByProps({ children: 'Alex' }).length).toBeGreaterThan(0);
  
      const nameInput = renderer.root.find((node) => node.type === TextInput && node.props.value === 'Alex');
      act(() => nameInput.props.onChangeText('   '));
      let saveName = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminSaveName'));
      await act(async () => { saveName?.props.onPress(); });
      expect(renderer.root.findAllByProps({ children: t('adminNameRequired') }).length).toBeGreaterThan(0);
  
      const currentName = renderer.root.find((node) => node.type === TextInput && node.props.value === '   ');
      act(() => currentName.props.onChangeText('Alex Updated'));
      saveName = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminSaveName'));
      await act(async () => { saveName?.props.onPress(); });
      expect(onUserUpdated).toHaveBeenCalledWith(expect.objectContaining({ name: 'Alex Updated' }));
      expect(renderer.root.findAllByProps({ children: t('adminNameUpdated') }).length).toBeGreaterThan(0);
  
      let updatePassword = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminUpdatePassword'));
      await act(async () => { updatePassword?.props.onPress(); });
      expect(renderer.root.findAllByProps({ children: t('adminPasswordRequired') }).length).toBeGreaterThan(0);
  
      const passwordInputs = renderer.root.findAllByType(TextInput);
      act(() => {
        passwordInputs[1].props.onChangeText('CurrentPass1!');
        passwordInputs[2].props.onChangeText('NewPassword123!');
        passwordInputs[3].props.onChangeText('DifferentPassword123!');
      });
      updatePassword = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminUpdatePassword'));
      await act(async () => { updatePassword?.props.onPress(); });
      expect(renderer.root.findAllByProps({ children: t('adminPasswordMismatch') }).length).toBeGreaterThan(0);
  
      act(() => passwordInputs[3].props.onChangeText('NewPassword123!'));
      updatePassword = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminUpdatePassword'));
      await act(async () => { updatePassword?.props.onPress(); });
      expect(renderer.root.findAllByProps({ children: 'Incorrect current password' }).length).toBeGreaterThan(0);
  
      act(() => {
        passwordInputs[1].props.onChangeText('CurrentPass1!');
        passwordInputs[2].props.onChangeText('AnotherPassword12!');
        passwordInputs[3].props.onChangeText('AnotherPassword12!');
      });
      updatePassword = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminUpdatePassword'));
      await act(async () => { updatePassword?.props.onPress(); });
      expect(apiRequest).toHaveBeenCalledWith('/me', expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ currentPassword: 'CurrentPass1!', newPassword: 'AnotherPassword12!' }),
      }));
      act(() => renderer.unmount());
    })

  it('renders the desktop profile layout and reports profile load and save errors', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
      width: 1440,
      height: 900,
      scale: 1,
      fontScale: 1,
    });
    const user = { id: 'admin-1', name: 'Alex', email: 'alex@example.com', role: 'admin' };
    const apiRequest = jest.spyOn(authApi, 'apiRequest')
      .mockResolvedValueOnce(response(500, { message: 'Profile unavailable' }))
      .mockResolvedValueOnce(response(500, { message: 'Name update rejected' }));
    const renderer = renderSafeArea(<AdminProfileScreen user={user} onUserUpdated={jest.fn()} />);
    await flushEffects();
    expect(renderer.root.findAllByProps({ children: 'Profile unavailable' }).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({ children: t('adminCurrentPassword') }).length).toBeGreaterThan(0);

    const nameInput = renderer.root.find((node) => node.type === TextInput && node.props.value === 'Alex');
    act(() => nameInput.props.onChangeText('Alex Updated'));
    const saveName = buttons(renderer).find((button) => containsText(button.props.children, t('adminSaveName')));
    await act(async () => { saveName?.props.onPress(); });
    expect(apiRequest).toHaveBeenCalledWith('/me', expect.objectContaining({ method: 'PATCH' }));
    expect(renderer.root.findAllByProps({ children: 'Name update rejected' }).length).toBeGreaterThan(0);
    act(() => renderer.unmount());
  });

  it('saves and applies the preferred language selected in the profile', async () => {
    const user = { id: 'admin-1', name: 'Alex', email: 'alex@example.com', role: 'admin' };
    const apiRequest = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (_path, options) => {
      if (!options) return response(200, user);
      return response(200, {});
    });
    const onUserUpdated = jest.fn();
    const onToast = jest.fn();
    const renderer = renderSafeArea(<AdminProfileScreen user={user} onUserUpdated={onUserUpdated} onToast={onToast} />);
    await flushEffects();

    const kannadaButton = buttons(renderer).find((button) => containsText(button.props.children, 'ಕನ್ನಡ'));
    await act(async () => { kannadaButton?.props.onPress(); });
    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(getLanguage()).toBe('en');
    expect(renderer.root.findAllByProps({ children: t('adminChangeLanguageConfirm', { language: 'ಕನ್ನಡ' }) }).length).toBeGreaterThan(0);

    const cancelButton = buttons(renderer).find((button) => containsText(button.props.children, t('adminCancel')));
    await act(async () => { cancelButton?.props.onPress(); });
    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(getLanguage()).toBe('en');

    const kannadaAgain = buttons(renderer).find((button) => containsText(button.props.children, 'ಕನ್ನಡ'));
    await act(async () => { kannadaAgain?.props.onPress(); });
    const confirmButton = buttons(renderer).find((button) => containsText(button.props.children, t('adminChangeLanguageAction')));
    await act(async () => { confirmButton?.props.onPress(); });

    expect(apiRequest).toHaveBeenLastCalledWith('/me', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ preferredLanguage: 'kn' }),
    }));
    expect(getLanguage()).toBe('kn');
    expect(onUserUpdated).toHaveBeenCalledWith(expect.objectContaining({ preferredLanguage: 'kn' }));
    expect(onToast).toHaveBeenCalledWith(t('adminLanguageUpdated'), 'success');
    act(() => renderer.unmount());
  });

  it('routes password validation errors to the right field in Kannada', async () => {
    const user = { id: 'user-1', name: 'Alex', email: 'alex@example.com', role: 'admin', preferredLanguage: 'kn' as const };
    const api = jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, user));
    setLanguage('kn');
    const onUserUpdated = jest.fn();
    let state!: ReturnType<typeof useAdminProfile>;
    function Harness() { state = useAdminProfile({ user, onUserUpdated }); return null; }
    const renderer = render(<Harness />);
    await flushEffects();
    expect(getLanguage()).toBe('kn');

    const attempt = async (current: string, next: string, confirm: string) => {
      act(() => { state.setCurrentPassword(current); state.setNewPassword(next); state.setConfirmPassword(confirm); });
      await act(async () => { await state.changePassword(); });
      return { current: state.currentPasswordError, next: state.newPasswordError, confirm: state.confirmPasswordError };
    };
    expect(await attempt('Current#Pass1', 'lowercase#pass1', 'lowercase#pass1')).toEqual({ current: '', next: t('adminPasswordUppercase'), confirm: '' });
    expect(await attempt('Current#Pass1', 'UPPERCASE#PASS1', 'UPPERCASE#PASS1')).toEqual({ current: '', next: t('adminPasswordLowercase'), confirm: '' });
    expect(await attempt('Current#Pass1', 'Mixedcase1234', 'Mixedcase1234')).toEqual({ current: '', next: t('adminPasswordSpecial'), confirm: '' });
    expect(await attempt('Current#Pass1', 'Mixed#casepass', 'Mixed#casepass')).toEqual({ current: '', next: t('adminPasswordNumber'), confirm: '' });
    expect(await attempt('Current#Pass1', 'Current#Pass1', 'Current#Pass1')).toEqual({ current: '', next: t('adminPasswordSame'), confirm: '' });
    expect(await attempt('Current#Pass1', 'Short#1A', 'Short#1A')).toEqual({ current: '', next: t('adminPasswordLength'), confirm: '' });
    expect(await attempt('Current#Pass1', 'Another#Pass12', 'Different#Pass12')).toEqual({ current: '', next: '', confirm: t('adminPasswordMismatch') });
    expect(await attempt('', 'Another#Pass12', 'Another#Pass12')).toEqual({ current: t('adminPasswordRequired'), next: '', confirm: '' });
    expect(t('adminPasswordUppercase')).not.toMatch(/uppercase/i);
    expect(api).toHaveBeenCalledTimes(1);
    act(() => renderer.unmount());
  });
});
