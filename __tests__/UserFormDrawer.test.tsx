import { act } from 'react-test-renderer';
import { t } from '../src/i18n';
import { UserFormDrawer } from '../src/screens/admin/users/UserFormDrawer';
import { renderSafeArea, buttons, containsText } from './testUtils';

describe('UserFormDrawer', () => {
  it('supports user form role/store selection and saving', () => {
      const onRoleChange = jest.fn();
      const onToggleStore = jest.fn();
      const onSave = jest.fn();
      const renderer = renderSafeArea(
        <UserFormDrawer
          visible
          editing={null}
          form={{ name: '', email: '', password: '', role: 'franchise_admin', franchiseIds: [] }}
          stores={[{ _id: 'store-1', name: 'Central' }]}
          fieldErrors={{ franchiseIds: 'Choose a store' }}
          isSaving={false}
          toastMessage=""
          onClose={jest.fn()}
          onAfterClose={jest.fn()}
          onDismissToast={jest.fn()}
          onNameChange={jest.fn()}
          onEmailChange={jest.fn()}
          onPasswordChange={jest.fn()}
          onRoleChange={onRoleChange}
          onToggleStore={onToggleStore}
          onSave={onSave}
        />,
      );
      const checkbox = renderer.root.findByProps({ accessibilityRole: 'checkbox' });
      expect(checkbox.props.accessibilityState.checked).toBe(false);
      act(() => checkbox.props.onPress());
      expect(onToggleStore).toHaveBeenCalledWith('store-1');
      const subAdmin = buttons(renderer).find((button) => containsText(button.props.children, t('adminSubAdmin')));
      act(() => subAdmin?.props.onPress());
      expect(onRoleChange).toHaveBeenCalledWith('sub_admin');
      const save = buttons(renderer).find((button) => button.props.children?.props?.children === t('adminSave'));
      act(() => save?.props.onPress());
      expect(onSave).toHaveBeenCalled();
      act(() => renderer.unmount());
    })
});
