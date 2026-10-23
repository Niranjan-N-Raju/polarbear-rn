import { act } from 'react-test-renderer';
import { t } from '../src/i18n';
import { StoreFiltersDrawer } from '../src/screens/admin/stores/StoreFiltersDrawer';
import { renderSafeArea, buttons, containsText } from './testUtils';

describe('StoreFiltersDrawer', () => {
  it('renders store filters with clear state and applies/clears selections', () => {
      const onClose = jest.fn();
      const onClearFilters = jest.fn();
      const onApplyFilters = jest.fn();
      const onToggleFilter = jest.fn();
      const renderer = renderSafeArea(
        <StoreFiltersDrawer
          visible
          height={800}
          isWeb={false}
          searchText=""
          statusFilter="active"
          typeFilter="all"
          openFilter="type"
          hasDraftFilters
          onClose={onClose}
          onAfterClose={jest.fn()}
          onSearchChange={jest.fn()}
          onStatusChange={jest.fn()}
          onTypeChange={jest.fn()}
          onToggleFilter={onToggleFilter}
          onDismissDropdown={jest.fn()}
          onClearFilters={onClearFilters}
          onApplyFilters={onApplyFilters}
        />,
      );
      expect(renderer.root.findAllByProps({ children: t('adminFilterStores') }).length).toBeGreaterThan(0);
      const clear = buttons(renderer).find((button) => containsText(button.props.children, t('adminClearFilters')));
      const apply = buttons(renderer).find((button) => containsText(button.props.children, t('adminApplyFilters')));
      act(() => clear?.props.onPress());
      act(() => apply?.props.onPress());
      expect(onClearFilters).toHaveBeenCalled();
      expect(onApplyFilters).toHaveBeenCalled();
      act(() => buttons(renderer)
        .find((button) => button.props.accessibilityLabel === t('adminCloseMenu') && !button.props.testID)
        ?.props.onPress());
      expect(onClose).toHaveBeenCalled();
      act(() => renderer.unmount());
    })
});
