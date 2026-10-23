import { act } from 'react-test-renderer';
import { t } from '../src/i18n';
import { StoreCard } from '../src/screens/admin/stores/StoreCard';
import type { StoreRecord } from '../src/screens/admin/stores/types';
import { render, buttons } from './testUtils';

const store: StoreRecord = {
  _id: 'store-1',
  name: 'Central',
  storeCode: 'C001',
  storeType: 'franchise',
  address: 'Main road',
  createdBy: 'user-1',
};

describe('StoreCard', () => {
  it('renders store card states and dispatches edit/archive actions only for its owner', () => {
      const onEdit = jest.fn();
      const onArchive = jest.fn();
      const renderer = render(
        <StoreCard store={store} userId="user-1" storeCardStyle={null} actionsAtBottom={false} isUpdatingArchive={false} onEdit={onEdit} onArchive={onArchive} />,
      );
      expect(renderer.root.findAllByProps({ children: 'Central' }).length).toBeGreaterThan(0);
      expect(renderer.root.findAllByProps({ children: 'Main road' }).length).toBeGreaterThan(0);
      act(() => buttons(renderer)[0].props.onPress());
      act(() => buttons(renderer)[1].props.onPress());
      expect(onEdit).toHaveBeenCalledWith(store);
      expect(onArchive).toHaveBeenCalledWith(store);
  
      act(() => renderer.update(
        <StoreCard
          store={{ ...store, archivedAt: '2025-01-01' }}
          userId="someone-else"
          storeCardStyle="storeCardDouble"
          actionsAtBottom
          isUpdatingArchive={false}
          onEdit={onEdit}
          onArchive={onArchive}
        />
      ));
      expect(renderer.root.findAllByProps({ children: t('adminArchived') }).length).toBeGreaterThan(0);
      expect(buttons(renderer)).toHaveLength(0);
      act(() => renderer.unmount());
    })
});
