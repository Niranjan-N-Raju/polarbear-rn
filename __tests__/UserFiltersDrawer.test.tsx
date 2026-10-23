import { TextInput } from 'react-native';
import { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { t } from '../src/i18n';
import { UserFiltersDrawer } from '../src/screens/admin/users/UserFiltersDrawer';
import { renderSafeArea, buttons, containsText, initialMetrics } from './testUtils';

describe('UserFiltersDrawer', () => {
  it('renders user filter options and exposes all drawer callbacks', () => {
      const callbacks = Array.from({ length: 15 }, () => jest.fn());
      const renderer = renderSafeArea(
        <UserFiltersDrawer
          visible
          height={800}
          isWeb={false}
          searchText=""
          storeSearchText="Central"
          filterStatus="all"
          filterRole="all"
          stores={[{ _id: 'store-1', name: 'Central' }]}
          openFilter="store"
          hasDraftFilters={false}
          onClose={callbacks[0]}
          onAfterClose={callbacks[1]}
          onSearchChange={callbacks[2]}
          onStoreSearchChange={callbacks[3]}
          onStoreSelect={callbacks[4]}
          onFilterStatusChange={callbacks[5]}
          onFilterRoleChange={callbacks[6]}
          onToggleFilter={callbacks[7]}
          onOpenStoreFilter={callbacks[8]}
          onDismissDropdown={callbacks[9]}
          onClearFilters={callbacks[10]}
          onApplyFilters={callbacks[11]}
          userRoleOptions={[{ value: 'sub_admin', label: t('adminSubAdmin') }]}
        />,
      );
      expect(renderer.root.findAllByProps({ children: t('adminFilterUsers') }).length).toBeGreaterThan(0);
      const inputs = renderer.root.findAllByType(TextInput);
      expect(inputs).toHaveLength(2);
      act(() => inputs[0].props.onChangeText('Alex'));
      act(() => inputs[1].props.onChangeText('Cent'));
      act(() => inputs[1].props.onFocus());
      expect(callbacks[2]).toHaveBeenCalledWith('Alex');
      expect(callbacks[3]).toHaveBeenCalledWith('Cent');
      expect(callbacks[8]).toHaveBeenCalled();
      const storeChoice = buttons(renderer).find((button) => button.props.children?.props?.children === 'Central');
      expect(storeChoice).toBeDefined();
      act(() => storeChoice?.props.onPress());
      expect(callbacks[4]).toHaveBeenCalledWith({ _id: 'store-1', name: 'Central' });
      act(() => renderer.root.findByProps({ testID: 'user-filter-dropdown-dismiss' }).props.onPress());
      expect(callbacks[9]).toHaveBeenCalled();
      act(() => renderer.unmount());
    })

  it('enables clearing draft filters and handles status and role dropdown selections', () => {
    const onClearFilters = jest.fn();
    const onApplyFilters = jest.fn();
    const onFilterStatusChange = jest.fn();
    const onFilterRoleChange = jest.fn();
    const onToggleFilter = jest.fn();
    const props = {
      visible: true,
      height: 800,
      isWeb: true,
      searchText: 'Alex',
      storeSearchText: 'missing',
      filterStatus: 'all' as const,
      filterRole: 'all',
      stores: [{ _id: 'store-1', name: 'Central' }],
      openFilter: 'status' as const,
      hasDraftFilters: true,
      onClose: jest.fn(),
      onAfterClose: jest.fn(),
      onSearchChange: jest.fn(),
      onStoreSearchChange: jest.fn(),
      onStoreSelect: jest.fn(),
      onFilterStatusChange,
      onFilterRoleChange,
      onToggleFilter,
      onOpenStoreFilter: jest.fn(),
      onDismissDropdown: jest.fn(),
      onClearFilters,
      onApplyFilters,
      userRoleOptions: [{ value: 'sub_admin', label: t('adminSubAdmin') }],
    };
    const renderDrawer = (openFilter: 'status' | 'type' | 'store' | null) => (
      <UserFiltersDrawer {...props} openFilter={openFilter} />
    );
    const renderer = renderSafeArea(renderDrawer('status'));
    const clear = buttons(renderer).find((button) => containsText(button.props.children, t('adminClearFilters')));
    expect(clear?.props.disabled).toBe(false);
    act(() => clear?.props.onPress());
    expect(onClearFilters).toHaveBeenCalled();

    const activeStatus = buttons(renderer).find((button) => containsText(button.props.children, t('adminActive')));
    act(() => activeStatus?.props.onPress());
    expect(onFilterStatusChange).toHaveBeenCalledWith('active');

    act(() => renderer.update(
      <SafeAreaProvider initialMetrics={initialMetrics}>{renderDrawer('type')}</SafeAreaProvider>,
    ));
    const subAdmin = buttons(renderer).find((button) => containsText(button.props.children, t('adminSubAdmin')));
    act(() => subAdmin?.props.onPress());
    expect(onFilterRoleChange).toHaveBeenCalledWith('sub_admin');

    const searchStore = renderer.root.find((node) => node.type === TextInput && node.props.placeholder === t('adminSearchStores'));
    expect(searchStore.props.value).toBe('missing');
    expect(buttons(renderer).some((button) => containsText(button.props.children, 'Central'))).toBe(false);
    act(() => renderer.unmount());
  });
});
