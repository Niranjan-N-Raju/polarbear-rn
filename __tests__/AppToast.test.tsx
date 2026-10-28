import { Animated, StyleSheet, View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppToast } from '../src/components/AppToast';
import { pressables, initialMetrics } from './testUtils';
import { OverlayHostProvider } from '../src/components/OverlayHost';

describe('AppToast', () => {
  it('shows only the top toast in the screen overlay with safe-area spacing', () => {
    jest.useFakeTimers();
    let renderer!: TestRenderer.ReactTestRenderer;
    const renderToast = (visible: boolean) => (
      <SafeAreaProvider
        initialMetrics={{
          ...initialMetrics,
          insets: { top: 54, bottom: 34, left: 0, right: 0 },
        }}
      >
        <OverlayHostProvider>
          <View testID="nested-screen">
            {visible ? (
              <AppToast message="Saved" onDismiss={jest.fn()} />
            ) : null}
          </View>
        </OverlayHostProvider>
      </SafeAreaProvider>
    );
    act(() => {
      renderer = TestRenderer.create(renderToast(true));
    });
    const top = renderer.root.findByProps({ testID: 'app-toast-top' });
    expect(StyleSheet.flatten(top.props.style).top).toBe(70);
    expect(
      renderer.root.findAllByProps({ testID: 'app-toast-bottom' }),
    ).toHaveLength(0);
    expect(
      renderer.root
        .findByProps({ testID: 'nested-screen' })
        .findAllByProps({ testID: 'app-toast-top' }),
    ).toHaveLength(0);
    expect(
      renderer.root.findAll(
        node =>
          typeof node.type === 'string' &&
          node.props.accessibilityRole === 'alert',
      ),
    ).toHaveLength(1);
    act(() => {
      renderer.update(renderToast(false));
    });
    expect(
      renderer.root.findAllByProps({ testID: 'app-toast-top' }),
    ).toHaveLength(0);
    expect(
      renderer.root.findAllByProps({ testID: 'app-toast-bottom' }),
    ).toHaveLength(0);
    act(() => renderer.unmount());
    jest.useRealTimers();
  });

  it('dismisses the toast', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    jest.spyOn(Animated, 'timing').mockImplementation(
      () =>
        ({
          start: (callback?: (result: { finished: boolean }) => void) =>
            callback?.({ finished: true }),
          stop: jest.fn(),
          reset: jest.fn(),
        } as ReturnType<typeof Animated.timing>),
    );
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
  });
});
