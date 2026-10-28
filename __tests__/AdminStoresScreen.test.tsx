import { Platform, TextInput } from 'react-native';
import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { AdminStoresScreen } from '../src/screens/admin/stores/AdminStoresScreen';
import { renderSafeArea, buttons, containsText, buttonByLabel, flushEffects, response } from './testUtils';

const originalPlatform = Platform.OS;
afterEach(() => {
  jest.restoreAllMocks();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
});

describe('AdminStoresScreen', () => {
  it('loads stores, validates and creates a store, and archives a store', async () => {
      const existing = {
        _id: 'store-1',
        name: 'Central',
        storeCode: 'C001',
        storeType: 'company',
        createdBy: 'admin-1',
        isActive: true,
      };
      const apiRequest = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path, options) => {
        if (path.startsWith('/stores?')) return response(200, { franchises: [existing], pagination: { page: 1, totalPages: 1, total: 1 } });
        if (path === '/stores' && options?.method === 'POST') return response(201, {});
        if (path.startsWith('/stores/archive?')) return response(200, { message: 'Archived' });
        return response(200, {});
      });
      const onToast = jest.fn();
      const renderer = renderSafeArea(<AdminStoresScreen userId="admin-1" onToast={onToast} />);
      await flushEffects();
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('limit=9'), expect.objectContaining({ signal: expect.any(AbortSignal) }));
      expect(renderer.root.findAllByProps({ children: 'Central' }).length).toBeGreaterThan(0);
  
      act(() => buttonByLabel(renderer, t('adminAddStore')).props.onPress());
      const save = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminCreateStore'));
      await act(async () => { save?.props.onPress(); });
      expect(renderer.root.findAllByProps({ children: t('adminStoreNameRequired') }).length).toBeGreaterThan(0);
  
      const inputByPlaceholder = (placeholder: string) => renderer.root.find((node) => node.type === TextInput && node.props.placeholder === placeholder);
      act(() => {
        inputByPlaceholder(t('adminStoreNamePlaceholder')).props.onChangeText('New Store');
        inputByPlaceholder(t('adminStoreCodePlaceholder')).props.onChangeText(' n001 ');
      });
      const validSave = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminCreateStore'));
      await act(async () => { validSave?.props.onPress(); });
      expect(apiRequest).toHaveBeenCalledWith('/stores', expect.objectContaining({ method: 'POST' }));
      const requestOptions = apiRequest.mock.calls.find(([path]) => path === '/stores')?.[1];
      expect(JSON.parse(String(requestOptions?.body))).toMatchObject({ storeCode: 'N001', name: 'New Store' });
  
      const archiveAction = buttonByLabel(renderer, `${t('adminArchive')} Central`);
      act(() => archiveAction.props.onPress());
      const confirmArchive = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminArchive'));
      await act(async () => { confirmArchive?.props.onPress(); });
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('/stores/archive?id=store-1'), expect.objectContaining({ method: 'PATCH' }));
      act(() => renderer.unmount());
    })

  it('applies and clears store filters and validates edit/archive workflows', async () => {
      const existing = {
        _id: 'store-1',
        name: 'Central',
        storeCode: 'C001',
        storeType: 'franchise',
        address: 'Main road',
        phone: '1234567890',
        ownerName: 'Taylor',
        ownerPhone: '9876543210',
        ownerEmail: 'taylor@example.com',
        createdBy: 'admin-1',
        isActive: true,
      };
      const apiRequest = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path, options) => {
        if (path.startsWith('/stores?')) return response(200, { franchises: [existing], pagination: { page: 1, totalPages: 1, total: 1 } });
        if (path === '/stores?id=store-1' && options?.method === 'PATCH') return response(200, {});
        if (path.startsWith('/stores/archive?')) return response(200, { message: 'Archived' });
        return response(200, {});
      });
      const renderer = renderSafeArea(<AdminStoresScreen userId="admin-1" onToast={jest.fn()} />);
      await flushEffects();
  
      act(() => buttonByLabel(renderer, t('adminOpenFilters')).props.onPress());
      const search = renderer.root.find((node) => node.type === TextInput && node.props.placeholder === t('adminSearchStoresPlaceholder'));
      act(() => search.props.onChangeText('Central'));
      const status = buttons(renderer).find((button) => containsText(button.props.children, t('adminStatus')));
      act(() => status?.props.onPress());
      const archivedOption = buttons(renderer).find((button) => containsText(button.props.children, t('adminArchived')));
      act(() => archivedOption?.props.onPress());
      const storeType = buttons(renderer).find((button) => containsText(button.props.children, t('adminStoreType')));
      act(() => storeType?.props.onPress());
      const franchiseOption = buttons(renderer).find((button) => containsText(button.props.children, t('adminFranchiseStore')));
      act(() => franchiseOption?.props.onPress());
      let apply = buttons(renderer).find((button) => containsText(button.props.children, t('adminApplyFilters')));
      await act(async () => { apply?.props.onPress(); });
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('status=archived&type=franchise'), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  
      act(() => buttonByLabel(renderer, t('adminOpenFilters')).props.onPress());
      const clear = buttons(renderer).find((button) => containsText(button.props.children, t('adminClearFilters')));
      await act(async () => { clear?.props.onPress(); });
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('status=active&type=all'), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  
      act(() => buttonByLabel(renderer, `${t('adminEditStore')} Central`).props.onPress());
      const input = (placeholder: string) => renderer.root.find((node) => node.type === TextInput && node.props.placeholder === placeholder);
      act(() => {
        input(t('adminPhonePlaceholder')).props.onChangeText('123');
        input(t('adminOwnerPhonePlaceholder')).props.onChangeText('456');
        input(t('adminOwnerEmailPlaceholder')).props.onChangeText('not-an-email');
      });
      const save = () => buttons(renderer).find((button) => containsText(button.props.children, t('adminSaveChanges')));
      await act(async () => { save()?.props.onPress(); });
      expect(renderer.root.findAllByProps({ children: t('adminPhoneInvalid') }).length).toBeGreaterThan(0);
      expect(renderer.root.findAllByProps({ children: t('adminOwnerPhoneInvalid') }).length).toBeGreaterThan(0);
      expect(renderer.root.findAllByProps({ children: t('adminOwnerEmailInvalid') }).length).toBeGreaterThan(0);
  
      act(() => {
        input(t('adminPhonePlaceholder')).props.onChangeText('1234567890');
        input(t('adminOwnerPhonePlaceholder')).props.onChangeText('9876543210');
        input(t('adminOwnerEmailPlaceholder')).props.onChangeText('owner@example.com');
      });
      const archivedStatus = buttons(renderer).find((button) => containsText(button.props.children, t('adminArchived')));
      act(() => archivedStatus?.props.onPress());
      await act(async () => { save()?.props.onPress(); });
      const confirm = buttons(renderer).find((button) => containsText(button.props.children, t('adminArchive')));
      await act(async () => { confirm?.props.onPress(); });
      expect(apiRequest).toHaveBeenCalledWith('/stores?id=store-1', expect.objectContaining({ method: 'PATCH' }));
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('/stores/archive?id=store-1'), expect.objectContaining({ method: 'PATCH' }));
      act(() => renderer.unmount());
    })

  it('recovers when the initial store request fails', async () => {
      let requests = 0;
      const apiRequest = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path) => {
        if (path.startsWith('/stores?')) {
          requests += 1;
          return requests === 1
            ? response(503, { message: 'Store service unavailable' })
            : response(200, { franchises: [], pagination: { page: 1, totalPages: 1, total: 0 } });
        }
        return response(200, {});
      });
      const renderer = renderSafeArea(<AdminStoresScreen userId="admin-1" onToast={jest.fn()} />);
      await flushEffects();
      expect(renderer.root.findAllByProps({ children: 'Store service unavailable' }).length).toBeGreaterThan(0);
      const retry = buttons(renderer).find((button) => containsText(button.props.children, t('adminRefresh')));
      await act(async () => { retry?.props.onPress(); });
      await flushEffects();
      expect(apiRequest).toHaveBeenCalledTimes(2);
      expect(renderer.root.findAllByProps({ children: t('adminNoStores') }).length).toBeGreaterThan(0);
      act(() => renderer.unmount());
    })
});
