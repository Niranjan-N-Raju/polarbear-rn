import React from 'react';
import { Modal, Platform } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ResponsiveDrawerModal } from '../src/components/ResponsiveDrawerModal';
import { initialMetrics } from './testUtils';

const originalPlatform = Platform.OS;

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
});

describe('ResponsiveDrawerModal', () => {
  it('closes the native drawer from the scrim and calls after-close when hidden', async () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    const onAfterClose = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;
    const renderDrawer = (visible: boolean) => (
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <ResponsiveDrawerModal visible={visible} closeLabel="Close" onClose={onClose} onAfterClose={onAfterClose}>
          <></>
        </ResponsiveDrawerModal>
      </SafeAreaProvider>
    );

    act(() => {
      renderer = TestRenderer.create(renderDrawer(true));
    });
    const scrim = renderer.root.find((node) => node.props.testID === 'responsive-drawer-scrim');
    act(() => scrim.props.onPress());
    expect(onClose).toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(50));
    act(() => renderer.update(renderDrawer(false)));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });
    expect(onAfterClose).toHaveBeenCalled();
    act(() => renderer.unmount());
  });

  it('animates the web drawer in and out, then calls after-close', async () => {
    jest.useFakeTimers();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
      width: 1200,
      height: 800,
      scale: 1,
      fontScale: 1,
    });
    const onAfterClose = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;
    const renderDrawer = (visible: boolean) => (
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <ResponsiveDrawerModal
          visible={visible}
          closeLabel="Close"
          onClose={jest.fn()}
          onAfterClose={onAfterClose}
          overlay={<></>}
        >
          <></>
        </ResponsiveDrawerModal>
      </SafeAreaProvider>
    );

    act(() => {
      renderer = TestRenderer.create(renderDrawer(true));
    });
    const modal = renderer.root.findByType(Modal);
    expect(modal.props.visible).toBe(true);
    expect(modal.props.animationType).toBe('none');
    const panel = renderer.root.findByProps({ testID: 'responsive-drawer-panel' });
    expect(panel.props.style[panel.props.style.length - 1].opacity).toBe(0);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(30);
    });
    expect(panel.props.style[panel.props.style.length - 1].opacity).toBe(1);

    act(() => renderer.update(renderDrawer(false)));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(260);
    });
    expect(onAfterClose).toHaveBeenCalledTimes(1);
    expect(renderer.root.findByType(Modal).props.visible).toBe(false);
    act(() => renderer.unmount());
  });

  it('cancels a pending web close when reopened and uses dialog timing on native', async () => {
    jest.useFakeTimers();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
      width: 1200,
      height: 800,
      scale: 1,
      fontScale: 1,
    });
    const onAfterClose = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;
    const renderDrawer = (visible: boolean) => (
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <ResponsiveDrawerModal
          visible={visible}
          closeLabel="Close"
          onClose={jest.fn()}
          onAfterClose={onAfterClose}
        >
          <></>
        </ResponsiveDrawerModal>
      </SafeAreaProvider>
    );

    act(() => {
      renderer = TestRenderer.create(renderDrawer(true));
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(30);
    });
    act(() => renderer.update(renderDrawer(false)));
    act(() => jest.advanceTimersByTime(100));
    act(() => renderer.update(renderDrawer(true)));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(300);
    });
    expect(onAfterClose).not.toHaveBeenCalled();
    expect(renderer.root.findByType(Modal).props.visible).toBe(true);
    act(() => renderer.unmount());

    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
      width: 400,
      height: 800,
      scale: 1,
      fontScale: 1,
    });
    act(() => {
      renderer = TestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <ResponsiveDrawerModal
            visible
            closeLabel="Close"
            onClose={jest.fn()}
            presentation="dialog"
          >
            <></>
          </ResponsiveDrawerModal>
        </SafeAreaProvider>,
      );
    });
    expect(renderer.root.findByType(Modal).props.animationType).toBe('fade');
    act(() => renderer.unmount());
  });
});
