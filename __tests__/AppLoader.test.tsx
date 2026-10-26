import TestRenderer, { act } from 'react-test-renderer';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { AppLoader, AppLoaderProvider } from '../src/components/AppLoader';
import { t } from '../src/i18n';

describe('AppLoader', () => {
  it('renders the default and inline loader variants', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<AppLoader variant="inline" />);
    });
    act(() => renderer.update(<AppLoader />));
    expect(renderer.root.findAll((node) => node.props.accessibilityLabel === t('adminLoading')).length).toBeGreaterThan(0);
    act(() => renderer.unmount());
  });

  it('renders screen loading above the header at the app root without opening a modal', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    const render = (loading: boolean) => (
      <AppLoaderProvider>
        <View testID="header" />
        <View testID="screen-content">
          {loading ? <AppLoader /> : null}
        </View>
      </AppLoaderProvider>
    );
    act(() => { renderer = TestRenderer.create(render(true)); });
    const overlay = renderer.root.findByProps({ testID: 'app-loader-overlay' });
    const header = renderer.root.findByProps({ testID: 'header' });
    expect(header.parent?.children).toContain(overlay.parent);
    expect(StyleSheet.flatten(overlay.props.style)).toMatchObject({
      position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 1000,
    });
    expect(overlay.props.onStartShouldSetResponder()).toBe(true);
    expect(overlay.props.accessibilityState.busy).toBe(true);
    expect(renderer.root.findAllByType(Modal)).toHaveLength(0);
    act(() => renderer.update(render(false)));
    expect(renderer.root.findAllByProps({ testID: 'app-loader-overlay' })).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it('keeps the overlay until every screen loader finishes and leaves button spinners inline', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    const render = (first: boolean, second: boolean) => (
      <AppLoaderProvider>
        {first ? <AppLoader key="first" color="red" /> : null}
        {second ? <AppLoader key="second" color="blue" /> : null}
        <AppLoader variant="inline" />
      </AppLoaderProvider>
    );
    act(() => { renderer = TestRenderer.create(render(true, true)); });
    expect(renderer.root.findAllByType(View).filter((node) => node.props.testID === 'app-loader-overlay')).toHaveLength(1);
    expect(renderer.root.findAllByType(ActivityIndicator).map((node) => node.props.size)).toEqual(['small', 'large']);
    act(() => renderer.update(render(true, false)));
    expect(renderer.root.findByProps({ testID: 'app-loader-overlay' }).findByType(ActivityIndicator).props.color).toBe('red');
    act(() => renderer.update(render(false, false)));
    expect(renderer.root.findAllByProps({ testID: 'app-loader-overlay' })).toHaveLength(0);
    expect(renderer.root.findByType(ActivityIndicator).props.size).toBe('small');
    act(() => renderer.unmount());
  });
});
