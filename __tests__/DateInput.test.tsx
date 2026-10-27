import { Alert, Platform } from 'react-native';
import { act } from 'react-test-renderer';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { DateInput } from '../src/components/DateInput';
import { DateInput as WebDateInput } from '../src/components/DateInput.web';
import { t } from '../src/i18n';
import { formatDateOnly, parseDateOnly } from '../src/utils/dateOnly';
import { buttons, containsText, render } from './testUtils';

const originalPlatform = Platform.OS;
afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
});

describe('date-only conversion', () => {
  it('round-trips local calendar dates without UTC shifts', () => {
    for (const value of ['2024-02-29', '2026-03-08', '2026-11-01', '1990-01-01']) {
      expect(formatDateOnly(parseDateOnly(value)!)).toBe(value);
      expect(parseDateOnly(value)!.getHours()).toBe(12);
    }
    expect(formatDateOnly(new Date(2026, 9, 27, 0, 15))).toBe('2026-10-27');
  });

  it.each(['', 'invalid', '2026-02-29', '2026-13-01', '2026-04-31'])('rejects invalid date %s', (value) => {
    expect(parseDateOnly(value)).toBeUndefined();
  });
});

describe('native date input', () => {
  it('opens the Android system dialog with bounds, commits selection, and supports clearing', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    const change = jest.fn();
    const renderer = render(<DateInput value="2026-10-10" onChangeText={change} accessibilityLabel="Date" minimumDate="2026-10-01" maximumDate="2026-10-31" />);
    act(() => buttons(renderer)[0].props.onPress());
    const options = jest.mocked(DateTimePickerAndroid.open).mock.calls[0][0];
    expect(options).toMatchObject({ mode: 'date', value: parseDateOnly('2026-10-10'), minimumDate: parseDateOnly('2026-10-01'), maximumDate: parseDateOnly('2026-10-31') });
    options.onValueChange!({ nativeEvent: { timestamp: 0, utcOffset: 0 } }, new Date(2026, 9, 15));
    expect(change).toHaveBeenLastCalledWith('2026-10-15');
    options.onNeutralButtonPress!();
    expect(change).toHaveBeenLastCalledWith('');
    act(() => renderer.unmount());
  });

  it('does not change Android values on opening/dismissal, clamps the initial date, and reports native failures', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    const change = jest.fn();
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const renderer = render(<DateInput value="" onChangeText={change} accessibilityLabel="Date" maximumDate="2000-01-01" allowClear={false} />);
    act(() => buttons(renderer)[0].props.onPress());
    const options = jest.mocked(DateTimePickerAndroid.open).mock.calls[0][0];
    expect(options.value).toEqual(parseDateOnly('2000-01-01'));
    expect(options.neutralButton).toBeUndefined();
    expect(change).not.toHaveBeenCalled();
    options.onError!(new Error('No activity'));
    expect(alert).toHaveBeenCalledWith(t('datePickerFailed'), 'No activity');
    act(() => renderer.unmount());
  });

  it('requires confirmation on iOS, preserves values on cancel, and clears optional dates', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    const change = jest.fn();
    const renderer = render(<DateInput value="2026-10-10" onChangeText={change} accessibilityLabel="Date" />);
    act(() => buttons(renderer)[0].props.onPress());
    act(() => renderer.root.findByType(DateTimePicker).props.onValueChange({}, new Date(2026, 9, 20)));
    expect(change).not.toHaveBeenCalled();
    act(() => buttons(renderer).find((button) => containsText(button.props.children, t('adminCancel')))!.props.onPress());
    expect(change).not.toHaveBeenCalled();
    expect(renderer.root.findAllByType(DateTimePicker)).toHaveLength(0);
    act(() => buttons(renderer)[0].props.onPress());
    act(() => renderer.root.findByType(DateTimePicker).props.onValueChange({}, new Date(2026, 9, 21)));
    act(() => buttons(renderer).find((button) => containsText(button.props.children, t('dateConfirm')))!.props.onPress());
    expect(change).toHaveBeenLastCalledWith('2026-10-21');
    act(() => buttons(renderer)[0].props.onPress());
    act(() => buttons(renderer).find((button) => containsText(button.props.children, t('dateClear')))!.props.onPress());
    expect(change).toHaveBeenLastCalledWith('');
    act(() => renderer.unmount());
  });

  it('can confirm the initial date for an empty iOS field and respects disabled fields', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    const change = jest.fn();
    const renderer = render(<DateInput value="" onChangeText={change} accessibilityLabel="Date" allowClear={false} />);
    act(() => buttons(renderer)[0].props.onPress());
    const initial = renderer.root.findByType(DateTimePicker).props.value;
    expect(buttons(renderer).some((button) => containsText(button.props.children, t('dateClear')))).toBe(false);
    act(() => buttons(renderer).find((button) => containsText(button.props.children, t('dateConfirm')))!.props.onPress());
    expect(change).toHaveBeenCalledWith(formatDateOnly(initial));
    act(() => renderer.update(<DateInput value="" onChangeText={change} accessibilityLabel="Date" editable={false} />));
    expect(buttons(renderer)[0].props.disabled).toBe(true);
    act(() => renderer.unmount());
  });
});

describe('browser date input', () => {
  it('uses the browser-native date control with labels, bounds, selection, and clearing', () => {
    const change = jest.fn();
    const renderer = render(<WebDateInput value="2026-10-10" onChangeText={change} accessibilityLabel="Date" minimumDate="2026-10-01" maximumDate="2026-10-31" />);
    const input = renderer.root.findByType('input');
    expect(input.props).toMatchObject({ type: 'date', 'aria-label': 'Date', min: '2026-10-01', max: '2026-10-31' });
    act(() => input.props.onChange({ currentTarget: { value: '2026-10-20' } }));
    expect(change).toHaveBeenLastCalledWith('2026-10-20');
    act(() => input.props.onChange({ currentTarget: { value: '' } }));
    expect(change).toHaveBeenLastCalledWith('');
    act(() => renderer.unmount());
  });

  it('prevents clearing required navigation dates and disables read-only fields', () => {
    const change = jest.fn();
    const renderer = render(<WebDateInput value="2026-10-10" onChangeText={change} accessibilityLabel="Date" allowClear={false} editable={false} />);
    const input = renderer.root.findByType('input');
    expect(input.props).toMatchObject({ required: true, disabled: true });
    act(() => input.props.onChange({ currentTarget: { value: '' } }));
    expect(change).not.toHaveBeenCalled();
    act(() => renderer.unmount());
  });
});
