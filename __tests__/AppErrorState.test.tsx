import TestRenderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorState } from '../src/components/AppErrorState';
import { pressables, initialMetrics } from './testUtils';

describe('AppErrorState', () => {
  it('renders the error state and invokes retry', () => {
      const onRetry = jest.fn();
      let renderer!: TestRenderer.ReactTestRenderer;
      act(() => {
        renderer = TestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <AppErrorState message="Failed" onRetry={onRetry} />
          </SafeAreaProvider>,
        );
      });
      act(() => pressables(renderer)[0].props.onPress());
      expect(onRetry).toHaveBeenCalled();
      act(() => renderer.unmount());
    })
});
