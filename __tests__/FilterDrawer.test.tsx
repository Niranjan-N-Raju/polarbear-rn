import { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { FilterDrawer } from '../src/components/FilterDrawer';
import { ResponsiveDrawerModal } from '../src/components/ResponsiveDrawerModal';
import { t } from '../src/i18n';
import { buttons, renderSafeArea } from './testUtils';

describe('FilterDrawer', () => {
  it('reuses the responsive shell and forwards fields, actions and close lifecycle', () => {
    const onClose = jest.fn();
    const onAfterClose = jest.fn();
    const onClear = jest.fn();
    const onApply = jest.fn();
    const renderer = renderSafeArea(
      <FilterDrawer visible title="Filters" height={800} isWeb={false} maxHeight={430} onClose={onClose} onAfterClose={onAfterClose} onClear={onClear} onApply={onApply}>
        <Text>Custom fields</Text>
      </FilterDrawer>,
    );
    const modal = renderer.root.findByType(ResponsiveDrawerModal);
    expect(modal.props.panelStyle).toEqual({ height: 430 });
    expect(modal.props.onClose).toBe(onClose);
    expect(modal.props.onAfterClose).toBe(onAfterClose);
    expect(renderer.root.findAllByProps({ children: 'Custom fields' }).length).toBeGreaterThan(0);
    act(() => buttons(renderer).find((button) => button.props.children?.props?.children === t('adminClearFilters'))!.props.onPress());
    act(() => buttons(renderer).find((button) => button.props.children?.props?.children === t('adminApplyFilters'))!.props.onPress());
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledTimes(1);
    act(() => renderer.unmount());
  });

  it('preserves disabled clear state and lets the shared modal size web panels', () => {
    const renderer = renderSafeArea(
      <FilterDrawer visible title="Filters" height={800} isWeb canClear={false} onClose={jest.fn()} onClear={jest.fn()} onApply={jest.fn()}>
        <Text>Fields</Text>
      </FilterDrawer>,
    );
    expect(renderer.root.findByType(ResponsiveDrawerModal).props.panelStyle).toBeUndefined();
    const clear = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminClearFilters'))!;
    expect(clear.props.disabled).toBe(true);
    expect(clear.props.accessibilityState).toEqual({ disabled: true });
    act(() => renderer.unmount());
  });

  it('supports feature-specific labels without imposing a fixed panel height', () => {
    const onClear = jest.fn();
    const onApply = jest.fn();
    const renderer = renderSafeArea(
      <FilterDrawer visible title="Employees" clearLabel="Clear employee filters" applyLabel="Apply employee filters" onClose={jest.fn()} onClear={onClear} onApply={onApply}>
        <Text>Employee fields</Text>
      </FilterDrawer>,
    );
    expect(renderer.root.findByType(ResponsiveDrawerModal).props.panelStyle).toBeUndefined();
    act(() => buttons(renderer).find((button) => button.props.children?.props?.children === 'Clear employee filters')!.props.onPress());
    act(() => buttons(renderer).find((button) => button.props.children?.props?.children === 'Apply employee filters')!.props.onPress());
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledTimes(1);
    act(() => renderer.unmount());
  });
});
