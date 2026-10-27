/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import BootSplash from 'react-native-bootsplash';

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

test('renders correctly', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  expect(BootSplash.hide).toHaveBeenCalledWith({ fade: true });
  ReactTestRenderer.act(() => renderer.unmount());
});

test('reports splash dismissal failures', async () => {
  const failure = new Error('Native splash unavailable');
  jest.mocked(BootSplash.hide).mockRejectedValueOnce(failure);
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  expect(log).toHaveBeenCalledWith('Unable to dismiss launch splash:', failure);
  ReactTestRenderer.act(() => renderer.unmount());
  log.mockRestore();
});
