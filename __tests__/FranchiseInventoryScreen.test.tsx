import { act } from 'react-test-renderer';
import * as authApi from '../src/api/auth';
import { t } from '../src/i18n';
import { FranchiseInventoryScreen } from '../src/screens/franchise/inventory/FranchiseInventoryScreen';
import { DateInput } from '../src/components/DateInput';
import type { InventoryStockItem } from '../src/screens/franchise/types';
import { buttonByLabel, buttons, containsText, flushEffects, renderSafeArea, response } from './testUtils';

afterEach(() => jest.restoreAllMocks());

const isoDaysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const stock = (overrides: Partial<InventoryStockItem>): InventoryStockItem => ({
  _id: 'inv-1', productId: 'p-1', product: 'Vanilla tub', quantity: 3, expiryDate: isoDaysFromNow(-1), ...overrides,
});

const texts = (renderer: ReturnType<typeof renderSafeArea>, value: string) => renderer.root.findAllByProps({ children: value });

describe('FranchiseInventoryScreen', () => {
  it('loads store inventory and filters with summary cards', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockResolvedValue(response(200, {
      items: [stock({}), stock({ _id: 'inv-2', productId: 'p-2', product: 'Choco cone', quantity: 5, expiryDate: isoDaysFromNow(60) })],
    }));
    const renderer = renderSafeArea(<FranchiseInventoryScreen storeId="store-1" />);
    await flushEffects();

    expect(api.mock.calls[0][0]).toBe('/inventory?storeId=store-1');
    expect(texts(renderer, 'Vanilla tub').length).toBeGreaterThan(0);
    expect(texts(renderer, 'Choco cone').length).toBeGreaterThan(0);

    act(() => buttonByLabel(renderer, `${t('franchiseInventorySummaryExpired')}: 3`).props.onPress());
    expect(texts(renderer, 'Vanilla tub').length).toBeGreaterThan(0);
    expect(texts(renderer, 'Choco cone')).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it('shows the empty state and opens the add stock drawer', async () => {
    jest.spyOn(authApi, 'apiRequest').mockImplementation(async (path: string) => (
      path.startsWith('/products') ? response(200, { products: [] }) : response(200, { items: [] })
    ));
    const renderer = renderSafeArea(<FranchiseInventoryScreen storeId="store-1" />);
    await flushEffects();
    expect(texts(renderer, t('franchiseInventoryEmpty')).length).toBeGreaterThan(0);

    act(() => buttonByLabel(renderer, t('franchiseInventoryAddStock')).props.onPress());
    await flushEffects();
    expect(buttons(renderer).some((node) => containsText(node.props.children, t('franchiseInventoryAddStock')))).toBe(true);
    expect(renderer.root.findByType(DateInput).props.accessibilityLabel).toBe(t('franchiseInventoryExpiry'));
    act(() => renderer.unmount());
  });

  it('dumps expired stock through the action drawer', async () => {
    const api = jest.spyOn(authApi, 'apiRequest').mockImplementation(async (_path: string, init?: RequestInit) => (
      init?.method === 'PATCH' ? response(200, { message: 'ok' }) : response(200, { items: [stock({})] })
    ));
    const renderer = renderSafeArea(<FranchiseInventoryScreen storeId="store-1" />);
    await flushEffects();

    act(() => buttonByLabel(renderer, t('franchiseInventoryDumpLabel', { name: 'Vanilla tub' })).props.onPress());
    const confirm = buttons(renderer).find((node) => containsText(node.props.children, t('franchiseInventoryConfirmDump')));
    await act(async () => confirm!.props.onPress());
    await flushEffects();

    const patch = api.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'PATCH');
    expect(JSON.parse(String((patch![1] as RequestInit).body))).toMatchObject({ storeId: 'store-1', action: 'dump', inventoryItemId: 'inv-1', quantity: 3 });
    act(() => renderer.unmount());
  });
});
