import TestRenderer, { act } from 'react-test-renderer';
import { AdminFilterDropdown } from '../src/components/AdminFilterDropdown';
import { pressables } from './testUtils';

describe('AdminFilterDropdown', () => {
  it('renders filter dropdown choices and supports selecting and toggling', () => {
      const onSelect = jest.fn();
      const onToggle = jest.fn();
      let renderer!: TestRenderer.ReactTestRenderer;
      act(() => {
        renderer = TestRenderer.create(
          <AdminFilterDropdown
            label="Status"
            value="active"
            expanded
            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
            onToggle={onToggle}
            onSelect={onSelect}
            optionsPlacement="above"
          />,
        );
      });
      expect(pressables(renderer)).toHaveLength(3);
      act(() => pressables(renderer)[0].props.onPress());
      act(() => pressables(renderer)[2].props.onPress());
      expect(onToggle).toHaveBeenCalled();
      expect(onSelect).toHaveBeenCalledWith('inactive');
    })
});
