import TestRenderer, { act } from 'react-test-renderer';
import { AppLoader } from '../src/components/AppLoader';
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
});
