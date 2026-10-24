import { act } from 'react-test-renderer';
import { t, translateRole } from '../src/i18n';
import { UserList } from '../src/screens/admin/users/UserList';
import type { AdminUser } from '../src/screens/admin/users/types';
import { render, buttons } from './testUtils';

const user: AdminUser = {
  _id: 'user-1',
  name: 'Alex Admin',
  email: 'alex@example.com',
  phone: '8123456789',
  role: 'sub_admin',
  franchises: [{ _id: 'store-1', name: 'Central' }],
};

describe('UserList', () => {
  it('renders user cards and desktop tables and delegates actions', () => {
      const onEdit = jest.fn();
      const onDelete = jest.fn();
      const renderer = render(
        <UserList users={[user, { ...user, _id: 'user-2', franchises: [] }]} isTable={false} isDesktopWeb={false} onEdit={onEdit} onDelete={onDelete} />,
      );
      expect(renderer.root.findAllByProps({ children: 'Alex Admin' }).length).toBeGreaterThan(0);
      expect(renderer.root.findAllByProps({ children: translateRole(user.role) }).length).toBeGreaterThan(0);
      expect(renderer.root.findAllByProps({ children: user.email }).length).toBeGreaterThan(0);
      expect(renderer.root.findAllByProps({ children: user.phone }).length).toBeGreaterThan(0);
      expect(renderer.root.findAllByProps({ children: 'Central' }).length).toBeGreaterThan(0);
      expect(renderer.root.findAllByProps({ children: t('adminNoStore') }).length).toBeGreaterThan(0);
      expect(buttons(renderer)[0].props.accessibilityLabel).toBe(`${t('adminEditUser')} ${user.name}`);
      expect(buttons(renderer)[1].props.accessibilityLabel).toBe(`${t('adminDelete')} ${user.name}`);
      act(() => buttons(renderer)[0].props.onPress());
      act(() => buttons(renderer)[1].props.onPress());
      expect(onEdit).toHaveBeenCalledWith(user);
      expect(onDelete).toHaveBeenCalledWith(user);
  
      act(() => renderer.update(
        <UserList users={[user]} isTable onEdit={onEdit} onDelete={onDelete} isDesktopWeb />,
      ));
      expect(renderer.root.findAllByProps({ children: 'Email' }).length).toBeGreaterThan(0);
      expect(renderer.root.findAllByProps({ children: 'Stores' }).length).toBeGreaterThan(0);
      act(() => buttons(renderer)[0].props.onPress());
      expect(onEdit).toHaveBeenCalledTimes(2);
      act(() => renderer.unmount());
    })
});
