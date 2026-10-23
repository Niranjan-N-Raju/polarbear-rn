import { Animated } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppToast } from '../src/components/AppToast';
import { pressables, initialMetrics } from './testUtils';

describe('AppToast', () => {
  it('dismisses the toast', () => {
      jest.useFakeTimers();
      const onDismiss = jest.fn();
      jest.spyOn(Animated, 'timing').mockImplementation(() => ({
        start: (callback?: (result: { finished: boolean }) => void) => callback?.({ finished: true }),
        stop: jest.fn(),
        reset: jest.fn(),
      }) as ReturnType<typeof Animated.timing>);
      let renderer!: TestRenderer.ReactTestRenderer;
      act(() => {
        renderer = TestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <AppToast message="Saved" onDismiss={onDismiss} durationMs={1000} />
          </SafeAreaProvider>,
        );
      });
      const toastPressables = pressables(renderer);
      act(() => toastPressables[0].props.onPress());
      expect(onDismiss).toHaveBeenCalled();
      act(() => renderer.unmount());
      jest.useRealTimers();
      jest.restoreAllMocks();
    })
});
