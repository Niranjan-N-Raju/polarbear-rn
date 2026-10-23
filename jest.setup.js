/* global jest */
jest.mock('react-native-config', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const MockIcon = () => React.createElement('MockIcon');
  return new Proxy({}, { get: () => MockIcon });
});
