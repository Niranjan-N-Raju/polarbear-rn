import { Platform, TextInput } from 'react-native';
import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { AdminUsersScreen } from '../src/screens/admin/users/AdminUsersScreen';
import { useAdminUsers } from '../src/screens/admin/users/useAdminUsers';
import { render } from './testUtils';
import { renderSafeArea, buttons, containsText, buttonByLabel, flushEffects, response } from './testUtils';

const originalPlatform = Platform.OS;
afterEach(() => {
  jest.restoreAllMocks();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
});

describe('AdminUsersScreen', () => {
  it('loads users, validates and creates a user, applies filters, and deletes a user', async () => {
      const existing = {
        _id: 'user-1',
        name: 'Alex Admin',
        email: 'alex@example.com',
        role: 'sub_admin',
        franchises: [],
      };
      const apiRequest = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path, options) => {
        if (path.startsWith('/users?')) return response(200, { users: [existing], pagination: { page: 1, totalPages: 1, total: 1 } });
        if (path === '/stores?limit=100') return response(200, { franchises: [{ _id: 'store-1', name: 'Central' }] });
        if (path === '/users' && options?.method === 'POST') return response(201, {});
        if (path === '/users/user-1' && options?.method === 'DELETE') return response(200, {});
        return response(200, {});
      });
      const onToast = jest.fn();
      const renderer = renderSafeArea(<AdminUsersScreen onToast={onToast} />);
      await flushEffects();
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('/users?'), expect.objectContaining({ signal: expect.any(AbortSignal) }));
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('limit=9'), expect.objectContaining({ signal: expect.any(AbortSignal) }));
      expect(renderer.root.findAllByProps({ children: 'Alex Admin' }).length).toBeGreaterThan(0);
  
      act(() => buttonByLabel(renderer, t('adminAddUser')).props.onPress());
      const save = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminSave'));
      await act(async () => { save?.props.onPress(); });
      expect(renderer.root.findAllByProps({ children: t('adminUserNameRequired') }).length).toBeGreaterThan(0);
  
      const inputByPlaceholder = (placeholder: string) => renderer.root.find((node) => node.type === TextInput && node.props.placeholder === placeholder);
      act(() => {
        inputByPlaceholder(t('adminFullNamePlaceholder')).props.onChangeText('New Admin');
        inputByPlaceholder(t('adminUserEmailPlaceholder')).props.onChangeText('new@example.com');
        inputByPlaceholder(t('adminUserPasswordPlaceholder')).props.onChangeText('StrongPassword9!');
      });
      const validSave = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminSave'));
      await act(async () => { validSave?.props.onPress(); });
      expect(apiRequest).toHaveBeenCalledWith('/users', expect.objectContaining({ method: 'POST' }));
  
      act(() => buttonByLabel(renderer, t('adminOpenFilters')).props.onPress());
      const search = renderer.root.find((node) => node.type === TextInput && node.props.placeholder === t('adminSearchUsers'));
      act(() => search.props.onChangeText('Alex'));
      const apply = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminApplyFilters'));
      await act(async () => { apply?.props.onPress(); });
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('search=Alex'), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  
      const deleteAction = buttonByLabel(renderer, `${t('adminDelete')} Alex Admin`);
      act(() => deleteAction.props.onPress());
      const confirmDelete = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminDelete'));
      await act(async () => { confirmDelete?.props.onPress(); });
      expect(apiRequest).toHaveBeenCalledWith('/users/user-1', expect.objectContaining({ method: 'DELETE' }));
      expect(onToast).not.toHaveBeenCalled();
      act(() => renderer.unmount());
    })

  it('enforces user email, password, and franchise assignment rules', async () => {
      const apiRequest = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path, options) => {
        if (path.startsWith('/users?')) return response(200, { users: [], pagination: { page: 1, totalPages: 1, total: 0 } });
        if (path === '/stores?limit=100') return response(200, { franchises: [{ _id: 'store-1', name: 'Central' }] });
        if (path === '/users' && options?.method === 'POST') return response(201, {});
        return response(200, {});
      });
      const renderer = renderSafeArea(<AdminUsersScreen onToast={jest.fn()} />);
      await flushEffects();
      act(() => buttonByLabel(renderer, t('adminAddUser')).props.onPress());
      const input = (placeholder: string) => renderer.root.find((node) => node.type === TextInput && node.props.placeholder === placeholder);
      const submit = async () => {
        const save = buttons(renderer).find((button) => containsText(button.props.children, t('adminSave')));
        await act(async () => { save?.props.onPress(); });
      };
  
      act(() => {
        input(t('adminFullNamePlaceholder')).props.onChangeText('Franchise Admin');
        input(t('adminUserEmailPlaceholder')).props.onChangeText('invalid-email');
        input(t('adminUserPasswordPlaceholder')).props.onChangeText('short');
      });
      await submit();
      expect(renderer.root.findAllByProps({ children: t('adminUserEmailInvalid') }).length).toBeGreaterThan(0);
      expect(renderer.root.findAllByProps({ children: t('adminPasswordLength') }).length).toBeGreaterThan(0);
  
      act(() => input(t('adminUserEmailPlaceholder')).props.onChangeText('franchise@example.com'));
      const passwordChecks: Array<[string, Parameters<typeof t>[0]]> = [
        ['longpassword123!', 'adminPasswordUppercase'],
        ['LONGPASSWORD123!', 'adminPasswordLowercase'],
        ['LongPassword!!!!', 'adminPasswordNumber'],
        ['LongPassword123', 'adminPasswordSpecial'],
      ];
      for (const [value, errorKey] of passwordChecks) {
        act(() => input(t('adminUserPasswordPlaceholder')).props.onChangeText(value));
        await submit();
        expect(renderer.root.findAllByProps({ children: t(errorKey) }).length).toBeGreaterThan(0);
      }
  
      act(() => input(t('adminUserPasswordPlaceholder')).props.onChangeText('StrongPassword9!'));
      const franchiseRole = buttons(renderer).find((button) => containsText(button.props.children, t('adminFranchiseAdmin')));
      act(() => franchiseRole?.props.onPress());
      await submit();
      expect(renderer.root.findAllByProps({ children: t('adminUserStoreRequired') }).length).toBeGreaterThan(0);
      const checkbox = renderer.root.findByProps({ accessibilityRole: 'checkbox' });
      act(() => checkbox.props.onPress());
      await submit();
      expect(apiRequest).toHaveBeenCalledWith('/users', expect.objectContaining({ method: 'POST' }));
      act(() => renderer.unmount());
    })

  it('recovers from initial user load errors and loads additional pages', async () => {
      const user = { _id: 'user-1', name: 'Alex Admin', email: 'alex@example.com', role: 'sub_admin', franchises: [] };
      let userListRequestCount = 0;
      const apiRequest = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path, options) => {
        if (path.startsWith('/users?')) {
          userListRequestCount += 1;
          if (userListRequestCount === 1) return response(500, { message: 'User service unavailable' });
          const page = new URLSearchParams(path.split('?')[1]).get('page');
          const users = page === '2' ? [{ ...user, _id: 'user-2', name: 'Second User' }] : [user];
          return response(200, { users, pagination: { page: Number(page), totalPages: 2, total: 2 } });
        }
        if (path === '/stores?limit=100') return response(200, { franchises: [] });
        if (path === '/users/user-1' && options?.method === 'PATCH') return response(400, { message: 'User update rejected' });
        return response(200, {});
      });
      const renderer = renderSafeArea(<AdminUsersScreen onToast={jest.fn()} />);
      await flushEffects();
      expect(renderer.root.findAllByProps({ children: 'User service unavailable' }).length).toBeGreaterThan(0);
      const retry = buttons(renderer).find((button) => containsText(button.props.children, t('adminRefresh')));
      await act(async () => { retry?.props.onPress(); });
      await flushEffects();
      expect(renderer.root.findAllByProps({ children: 'Alex Admin' }).length).toBeGreaterThan(0);
  
      const loadMore = buttons(renderer).find((button) => containsText(button.props.children, t('adminLoadMore')));
      await act(async () => { loadMore?.props.onPress(); });
      await flushEffects();
      expect(renderer.root.findAllByProps({ children: 'Second User' }).length).toBeGreaterThan(0);
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('page=2'), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  
      act(() => buttonByLabel(renderer, `${t('adminEditUser')} Alex Admin`).props.onPress());
      const nameInput = renderer.root.find((node) => node.type === TextInput && node.props.value === 'Alex Admin');
      act(() => nameInput.props.onChangeText('Alex Changed'));
      const save = buttons(renderer).find((button) => containsText(button.props.children, t('adminSave')));
      await act(async () => { save?.props.onPress(); });
      expect(apiRequest).toHaveBeenCalledWith('/users/user-1', expect.objectContaining({ method: 'PATCH' }));
      expect(renderer.root.findAllByProps({ children: 'User update rejected' }).length).toBeGreaterThan(0);
      act(() => renderer.unmount());
    })

  it('applies and clears store, status, and role filters', async () => {
    const apiRequest = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path) => {
      if (path.startsWith('/users?')) {
        return response(200, {
          users: [{
            _id: 'user-1',
            name: 'Alex Admin',
            email: 'alex@example.com',
            role: 'sub_admin',
            franchises: [{ _id: 'store-1', name: 'Central' }],
          }],
          pagination: { page: 1, totalPages: 1, total: 1 },
        });
      }
      if (path === '/stores?limit=100') return response(200, { franchises: [{ _id: 'store-1', name: 'Central' }] });
      return response(200, {});
    });
    const renderer = renderSafeArea(<AdminUsersScreen onToast={jest.fn()} />);
    await flushEffects();

    act(() => buttonByLabel(renderer, t('adminOpenFilters')).props.onPress());
    const storeSearch = renderer.root.find((node) => node.type === TextInput && node.props.placeholder === t('adminSearchStores'));
    act(() => storeSearch.props.onChangeText('Cent'));
    const storeOption = buttons(renderer).find((button) => containsText(button.props.children, 'Central'));
    act(() => storeOption?.props.onPress());

    const dropdown = (label: string) => buttons(renderer).find((button) => containsText(button.props.children, label));
    act(() => dropdown(t('adminStatus'))?.props.onPress());
    act(() => buttons(renderer).find((button) => containsText(button.props.children, t('adminActive')))?.props.onPress());
    const apply = buttons(renderer).find((button) => containsText(button.props.children, t('adminApplyFilters')));
    await act(async () => { apply?.props.onPress(); });
    expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('franchiseId=store-1'), expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('status=active'), expect.objectContaining({ signal: expect.any(AbortSignal) }));

    act(() => buttonByLabel(renderer, t('adminOpenFilters')).props.onPress());
    const clear = buttons(renderer).find((button) => containsText(button.props.children, t('adminClearFilters')));
    await act(async () => { clear?.props.onPress(); });
    const userListRequests = apiRequest.mock.calls.filter(([path]) => path.startsWith('/users?'));
    const latestUserListRequest = userListRequests[userListRequests.length - 1]?.[0];
    expect(latestUserListRequest).toContain('status=all');
    expect(latestUserListRequest).not.toContain('franchiseId=');
    expect(latestUserListRequest).not.toContain('role=');
    act(() => renderer.unmount());
  });

  it('ignores superseded user list responses and aborts in-flight requests on unmount', async () => {
    const user = (id: string, name: string) => ({ _id: id, name, email: `${id}@example.com`, role: 'sub_admin', franchises: [] });
    const pending: Array<{ path: string; signal?: AbortSignal; resolve: (value: Response) => void }> = [];
    jest.spyOn(authApi, 'apiRequest').mockImplementation((path, init) => {
      if (path.startsWith('/stores')) return Promise.resolve(response(200, { franchises: [] }));
      return new Promise<Response>((resolve) => { pending.push({ path, signal: init?.signal ?? undefined, resolve }); });
    });
    let state!: ReturnType<typeof useAdminUsers>;
    const onToast = jest.fn();
    function Harness() { state = useAdminUsers({ onToast }); return null; }
    const renderer = render(<Harness />);
    await flushEffects();
    act(() => state.setSearchText('New'));
    let applied!: Promise<void>;
    act(() => { applied = state.applyFilters(); });
    expect(pending).toHaveLength(2);
    expect(pending[0].signal?.aborted).toBe(true);

    await act(async () => {
      pending[1].resolve(response(200, { users: [user('u-2', 'New User')], pagination: { page: 1, totalPages: 1, total: 1 } }));
      await applied;
    });
    await act(async () => {
      pending[0].resolve(response(200, { users: [user('u-1', 'Old User')], pagination: { page: 1, totalPages: 1, total: 1 } }));
      await new Promise((resolve) => setImmediate(resolve));
    });
    expect(state.visibleUsers.map((item) => item.name)).toEqual(['New User']);
    expect(state.appliedFilters.search).toBe('New');

    act(() => { void state.loadMore(); });
    const inFlight = pending[2];
    act(() => renderer.unmount());
    expect(inFlight.signal?.aborted).toBe(true);
  });
});
