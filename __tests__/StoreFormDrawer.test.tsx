import { TextInput } from 'react-native';
import { act } from 'react-test-renderer';
import { t } from '../src/i18n';
import { StoreFormDrawer } from '../src/screens/admin/stores/StoreFormDrawer';
import type { StoreRecord } from '../src/screens/admin/stores/types';
import { renderSafeArea, buttons, containsText } from './testUtils';

const store: StoreRecord = {
  _id: 'store-1',
  name: 'Central',
  storeCode: 'C001',
  storeType: 'franchise',
  createdBy: 'user-1',
};

describe('StoreFormDrawer', () => {
  it('renders franchise store form transformations and archived controls', () => {
      const onFieldChange = jest.fn();
      const onArchivedChange = jest.fn();
      const onSave = jest.fn();
      const renderer = renderSafeArea(
        <StoreFormDrawer
          visible
          editingStore={store}
          form={{ name: store.name, storeCode: store.storeCode, address: '', phone: '', description: '', storeType: 'franchise', ownerName: '', ownerPhone: '', ownerEmail: '' }}
          formIsArchived
          fieldErrors={{ ownerEmail: 'Invalid email' }}
          isSaving={false}
          toastMessage=""
          toastTone="error"
          onClose={jest.fn()}
          onAfterClose={jest.fn()}
          onDismissToast={jest.fn()}
          onFieldChange={onFieldChange}
          onArchivedChange={onArchivedChange}
          onSave={onSave}
        />,
      );
      const inputs = renderer.root.findAllByType(TextInput);
      const codeInput = inputs.find((input) => input.props.value === store.storeCode);
      act(() => codeInput?.props.onChangeText('new'));
      expect(onFieldChange).toHaveBeenCalledWith('storeCode', 'NEW');
      const ownerPhone = inputs.find((input) => input.props.placeholder === t('adminOwnerPhonePlaceholder'));
      act(() => ownerPhone?.props.onChangeText('abc123456789012'));
      expect(onFieldChange).toHaveBeenCalledWith('ownerPhone', '1234567890');
      const active = buttons(renderer).find((button) => containsText(button.props.children, t('adminActive')));
      act(() => active?.props.onPress());
      expect(onArchivedChange).toHaveBeenCalledWith(false);
      const save = buttons(renderer).find((button) => containsText(button.props.children, t('adminSaveChanges')));
      act(() => save?.props.onPress());
      expect(onSave).toHaveBeenCalled();
      act(() => renderer.unmount());
    })
});
