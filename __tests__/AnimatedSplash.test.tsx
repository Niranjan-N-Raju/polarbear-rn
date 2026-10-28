import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import BootSplash from 'react-native-bootsplash';
import { AnimatedSplash, LAUNCH_SCREEN_MAX_MS, MIN_SPLASH_MS, PAINT_FALLBACK_MS, PAINTED_MESSAGE, SPLASH_HTML } from '../src/components/AnimatedSplash';
import { SPLASH_SVG } from '../src/assets/splashSvg';

describe('AnimatedSplash (native)', () => {
  beforeEach(() => jest.mocked(BootSplash.hide).mockClear());

  test('embeds the exact public/splash-screen.svg (run scripts/sync-splash-svg.js if this fails)', () => {
    const svg = fs.readFileSync(path.join(__dirname, '../public/splash-screen.svg'), 'utf8');
    expect(SPLASH_SVG).toBe(svg);
  });

  test('keeps the launch screen until the WebView reports its first paint (no blank flash)', async () => {
    expect(SPLASH_HTML).toContain('@keyframes');
    expect(SPLASH_HTML).toContain('<svg');
    expect(SPLASH_HTML).not.toContain('<?xml');
    expect(SPLASH_HTML).toContain(PAINTED_MESSAGE);

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AnimatedSplash onFinish={jest.fn()} />);
    });
    const webview = renderer.root.findByProps({ testID: 'animated-splash-webview' });
    expect(webview.props.source).toEqual({ html: SPLASH_HTML });
    // The mock fires onLoadEnd on mount; that alone must not reveal the empty WebView.
    expect(BootSplash.hide).not.toHaveBeenCalled();

    await ReactTestRenderer.act(() => {
      webview.props.onMessage({ nativeEvent: { data: 'something-else' } });
    });
    expect(BootSplash.hide).not.toHaveBeenCalled();

    await ReactTestRenderer.act(() => {
      webview.props.onMessage({ nativeEvent: { data: PAINTED_MESSAGE } });
    });
    expect(BootSplash.hide).toHaveBeenCalledTimes(1);
    expect(BootSplash.hide).toHaveBeenCalledWith({ fade: false });
    ReactTestRenderer.act(() => renderer.unmount());
  });

  test('hides the launch screen after a fallback delay if the paint signal never arrives', async () => {
    jest.useFakeTimers();
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AnimatedSplash onFinish={jest.fn()} />);
    });
    expect(BootSplash.hide).not.toHaveBeenCalled();
    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(PAINT_FALLBACK_MS);
    });
    expect(BootSplash.hide).toHaveBeenCalledTimes(1);
    ReactTestRenderer.act(() => renderer.unmount());
    jest.useRealTimers();
  });

  test('falls back to the static logo when the WebView native module is missing', async () => {
    const { TurboModuleRegistry } = require('react-native');
    jest.mocked(TurboModuleRegistry.get).mockReturnValueOnce(null);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AnimatedSplash onFinish={jest.fn()} />);
    });
    expect(renderer.root.findAllByProps({ testID: 'animated-splash-fallback' }).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({ testID: 'animated-splash-webview' })).toHaveLength(0);
    expect(BootSplash.hide).toHaveBeenCalledWith({ fade: false });
    ReactTestRenderer.act(() => renderer.unmount());
    warn.mockRestore();
  });

  test('plays the animation for the full minimum time after it becomes visible, then finishes', async () => {
    jest.useFakeTimers();
    const onFinish = jest.fn();
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AnimatedSplash onFinish={onFinish} />);
    });
    const webview = renderer.root.findByProps({ testID: 'animated-splash-webview' });
    // Simulate a slow first paint: the minimum time must not have been consumed while waiting.
    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(PAINT_FALLBACK_MS - 100);
      webview.props.onMessage({ nativeEvent: { data: PAINTED_MESSAGE } });
    });
    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(MIN_SPLASH_MS - 100);
    });
    expect(onFinish).not.toHaveBeenCalled();
    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
    ReactTestRenderer.act(() => renderer.unmount());
    jest.useRealTimers();
  });

  test('never waits on the static launch screen longer than the safety cap', async () => {
    jest.useFakeTimers();
    const onFinish = jest.fn();
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AnimatedSplash onFinish={onFinish} />);
    });
    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(LAUNCH_SCREEN_MAX_MS + MIN_SPLASH_MS + 1000);
    });
    expect(BootSplash.hide).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledTimes(1);
    ReactTestRenderer.act(() => renderer.unmount());
    jest.useRealTimers();
  });
});
