import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { FranchiseStoreConfigScreen } from '../src/screens/franchise/store-config/FranchiseStoreConfigScreen';
import { buttonByLabel, buttons, containsText, flushEffects, renderSafeArea, response } from './testUtils';

afterEach(() => jest.restoreAllMocks());

describe('FranchiseStoreConfigScreen', () => {
  it('loads the store settings from the franchise store config endpoints', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, {
      store: { name: 'North Store', hasLogo: false },
      cycle: { configured: true, type: 'calendar_month', startDay: 1, endDay: 31 },
      positions: ['Manager'],
      shifts: [{ id: 'day', name: 'Day', startTime: '09:00', endTime: '17:00' }],
    }));
    const renderer = renderSafeArea(<FranchiseStoreConfigScreen storeId="store-1" />);
    await flushEffects();

    expect(api.mock.calls.map(([path]) => String(path))).toEqual(expect.arrayContaining([
      '/stores/branding?storeId=store-1',
      expect.stringMatching(/^\/stores\/cycle\?storeId=store-1&period=\d{4}-\d{2}$/),
      '/stores/positions?storeId=store-1',
      '/stores/shifts?storeId=store-1',
    ]));
    expect(renderer.root.findAll((node) => node.children.includes('North Store')).length).toBeGreaterThan(0);
    act(() => buttonByLabel(renderer, t('franchiseStoreConfigEditItem', { item: t('franchiseStoreConfigPositions') })).props.onPress());
    expect(renderer.root.findAll((node) => node.children.includes('Manager')).length).toBeGreaterThan(0);
    act(() => renderer.unmount());
  });

  it('opens a drawer for editing settings and saves changes', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (input, init) => {
      if (init?.method === 'PUT') return response(200, { message: 'Store name updated.' });
      const path = String(input);
      if (path.includes('/branding')) return response(200, { store: { name: 'North Store', hasLogo: false } });
      if (path.includes('/cycle')) return response(200, { cycle: { configured: false, type: 'calendar_month', startDay: 1, endDay: 31 } });
      if (path.includes('/positions')) return response(200, { positions: ['Manager'] });
      return response(200, { shifts: [] });
    });
    const renderer = renderSafeArea(<FranchiseStoreConfigScreen storeId="store-1" />);
    await flushEffects();
    act(() => buttonByLabel(renderer, t('franchiseStoreConfigEditItem', { item: t('franchiseStoreConfigBranding') })).props.onPress());
    const nameField = renderer.root.find((node) => node.props.accessibilityLabel === t('franchiseStoreConfigName'));
    act(() => nameField.props.onChangeText('North Updated'));
    const save = buttons(renderer).find((node) => containsText(node.props.children, t('franchiseStoreConfigSave')))!;
    act(() => save.props.onPress());
    await flushEffects();

    expect(api).toHaveBeenCalledWith('/stores/branding', expect.objectContaining({ method: 'PUT' }));
    act(() => renderer.unmount());
  });
});
