import { TextInput } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { AdminFormField } from '../src/components/AdminFormField';
import { pressables } from './testUtils';

describe('AdminFormField', () => {
  it('renders form field errors, secure visibility toggle, and editable state', () => {
      const onChangeText = jest.fn();
      const onToggleVisibility = jest.fn();
      let renderer!: TestRenderer.ReactTestRenderer;
      act(() => {
        renderer = TestRenderer.create(
          <AdminFormField label="Password" value="" onChangeText={onChangeText} error="Required" secureTextEntry onToggleVisibility={onToggleVisibility} />,
        );
      });
      const input = renderer.root.findByType(TextInput);
      act(() => input.props.onChangeText('secret'));
      act(() => pressables(renderer)[0].props.onPress());
      expect(onChangeText).toHaveBeenCalledWith('secret');
      expect(onToggleVisibility).toHaveBeenCalled();
  
      act(() => renderer.update(<AdminFormField label="Name" value="A" onChangeText={onChangeText} editable={false} multiline />));
      expect(renderer.root.findByType(TextInput).props.editable).toBe(false);
    })
});
