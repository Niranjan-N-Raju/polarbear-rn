/* global jest */
jest.mock('react-native-bootsplash', () => ({
  __esModule: true,
  default: {
    hide: jest.fn().mockResolvedValue(undefined),
    isVisible: jest.fn().mockReturnValue(false),
  },
}));

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  const WebView = (props) => {
    React.useEffect(() => {
      props.onLoadEnd?.();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return React.createElement(View, props);
  };
  return { __esModule: true, WebView, default: WebView };
});

jest.mock('react-native-config', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props) => React.createElement('MockDateTimePicker', props),
    DateTimePickerAndroid: { open: jest.fn(), dismiss: jest.fn() },
  };
});

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const MockIcon = () => React.createElement('MockIcon');
  return new Proxy({}, { get: () => MockIcon });
});
