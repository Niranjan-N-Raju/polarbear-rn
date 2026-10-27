import { act } from 'react-test-renderer';
import { DateInput } from '../src/components/DateInput';
import { MonthStepper } from '../src/screens/franchise/shared/MonthStepper';
import { render } from './testUtils';

it('selects a month through the date picker while preserving the maximum month', () => {
  const change = jest.fn();
  const renderer = render(<MonthStepper month="2026-10" onChange={change} maxMonth="2026-10" />);
  const picker = renderer.root.findByType(DateInput);
  expect(picker.props).toMatchObject({ value: '2026-10-01', maximumDate: '2026-10-31', allowClear: false });
  act(() => picker.props.onChangeText('2026-09-15'));
  expect(change).toHaveBeenCalledWith('2026-09');
  act(() => renderer.unmount());
});
