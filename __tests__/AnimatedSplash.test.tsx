import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import BootSplash from 'react-native-bootsplash';
import { AnimatedSplash, MIN_SPLASH_MS, SPLASH_HTML } from '../src/components/AnimatedSplash';
import { SPLASH_SVG } from '../src/assets/splashSvg';

describe('AnimatedSplash (native)', () => {
  test('embeds the exact public/splash-screen.svg (run scripts/sync-splash-svg.js if this fails)', () => {
    const svg = fs.readFileSync(path.join(__dirname, '../public/splash-screen.svg'), 'utf8');
    expect(SPLASH_SVG).toBe(svg);
  });

  test('renders the SVG with its own CSS animations in a WebView', async () => {
    expect(SPLASH_HTML).toContain('@keyframes');
    expect(SPLASH_HTML).toContain('<svg');
    expect(SPLASH_HTML).not.toContain('<?xml');

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AnimatedSplash onFinish={jest.fn()} />);
    });
    const webview = renderer.root.findByProps({ testID: 'animated-splash-webview' });
    expect(webview.props.source).toEqual({ html: SPLASH_HTML });
    expect(BootSplash.hide).toHaveBeenCalledWith({ fade: false });
    ReactTestRenderer.act(() => renderer.unmount());
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

  test('finishes after the minimum display time', async () => {
    jest.useFakeTimers();
    const onFinish = jest.fn();
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AnimatedSplash onFinish={onFinish} />);
    });
    expect(onFinish).not.toHaveBeenCalled();
    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(MIN_SPLASH_MS + 1000);
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
    ReactTestRenderer.act(() => renderer.unmount());
    jest.useRealTimers();
  });
});
