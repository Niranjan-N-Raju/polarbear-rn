import { Animated, Text } from 'react-native';
import { act } from 'react-test-renderer';
import { Store } from '../src/icons';
import { FranchiseMenuGroup } from '../src/screens/franchise/FranchiseMenuGroup';
import { render } from './testUtils';

afterEach(() => jest.restoreAllMocks());

describe('FranchiseMenuGroup', () => {
  it('animates both expansion and collapse and stops interrupted animations', () => {
    const stop = jest.fn();
    const timing = jest.spyOn(Animated, 'timing').mockImplementation(() => ({
      start: jest.fn(), stop, reset: jest.fn(),
    }));
    const onPress = jest.fn();
    const group = (expanded: boolean) => (
      <FranchiseMenuGroup label="Store" Icon={Store} expanded={expanded} onPress={onPress}>
        <Text>Sales</Text>
      </FranchiseMenuGroup>
    );
    const renderer = render(group(false));
    const button = () => renderer.root.findByProps({ accessibilityLabel: 'Store' });
    expect(button().props.accessibilityState.expanded).toBe(false);
    expect(renderer.root.findAllByProps({ accessibilityElementsHidden: true }).length).toBeGreaterThan(0);
    act(() => button().props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
    act(() => renderer.update(group(true)));
    expect(timing).toHaveBeenLastCalledWith(expect.anything(), {
      toValue: 1, duration: 220, useNativeDriver: false,
    });
    expect(button().props.accessibilityState.expanded).toBe(true);
    expect(renderer.root.findAllByProps({ accessibilityElementsHidden: false }).length).toBeGreaterThan(0);
    act(() => renderer.update(group(false)));
    expect(timing).toHaveBeenLastCalledWith(expect.anything(), {
      toValue: 0, duration: 220, useNativeDriver: false,
    });
    act(() => renderer.unmount());
    expect(stop).toHaveBeenCalledTimes(3);
  });
});
