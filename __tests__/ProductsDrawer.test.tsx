import { act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { ProductsDrawer } from '../src/screens/franchise/inventory/ProductsDrawer';
import { flushEffects, renderSafeArea, response } from './testUtils';

afterEach(() => jest.restoreAllMocks());

it('shows the shared catalog without mutation controls or requests', async () => {
  const api = jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, {
    products: [{ _id: 'product-1', name: 'Milk', normalizedName: 'milk' }],
  }));
  const renderer = renderSafeArea(
    <ProductsDrawer visible storeId="store-1" onClose={jest.fn()} />,
  );
  await flushEffects();
  expect(renderer.root.findAllByProps({ children: 'Milk' }).length).toBeGreaterThan(0);
  expect(renderer.root.findAllByProps({ children: t('franchiseInventoryProductsReadOnly') }).length).toBeGreaterThan(0);
  expect(renderer.root.findAllByType(TextInput)).toHaveLength(0);
  expect(renderer.root.findAllByProps({ accessibilityLabel: t('franchiseInventoryAddProducts') })).toHaveLength(0);
  expect(renderer.root.findAllByProps({ accessibilityLabel: t('franchiseInventoryDeleteProduct', { name: 'Milk' }) })).toHaveLength(0);
  expect(api).toHaveBeenCalledTimes(1);
  expect(api).toHaveBeenCalledWith('/products?storeId=store-1', expect.objectContaining({ signal: expect.anything() }));
  act(() => renderer.unmount());
});
