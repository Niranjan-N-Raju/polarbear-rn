/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/components/AnimatedSplash', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return {
    AnimatedSplash: () => ReactModule.createElement(View, { testID: 'animated-splash' }),
  };
});

jest.mock('react-native-config', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('lucide-react-native', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  const MockIcon = () => ReactModule.createElement(View);

  return new Proxy({}, { get: () => MockIcon });
});

test('renders correctly', () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  expect(
    renderer.root.findAllByProps({ testID: 'animated-splash' }).length,
  ).toBeGreaterThan(0);
  ReactTestRenderer.act(() => renderer.unmount());
});
