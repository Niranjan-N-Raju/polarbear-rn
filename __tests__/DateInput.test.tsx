import { Alert, Modal, Platform } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { DateInput } from '../src/components/DateInput';
import { ResponsiveDrawerModal } from '../src/components/ResponsiveDrawerModal';
import { DateInput as WebDateInput } from '../src/components/DateInput.web';
import { t } from '../src/i18n';
import { formatDateOnly, parseDateOnly } from '../src/utils/dateOnly';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { buttons, containsText, initialMetrics, render, renderSafeArea } from './testUtils';

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

  const press = (renderer: ReturnType<typeof render>, label: string) =>
    act(() => buttons(renderer).find((button) => button.props.accessibilityLabel === label)!.props.onPress());

  it('opens an iOS inline calendar sheet from the field and commits only on Done', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    const change = jest.fn();
    const renderer = renderSafeArea(<DateInput value="2026-10-10" onChangeText={change} accessibilityLabel="Date" minimumDate="2026-10-01" maximumDate="2026-10-31" />);
    expect(renderer.root.findAllByType(DateTimePicker)).toHaveLength(0);
    press(renderer, 'Date');
    const picker = renderer.root.findByType(DateTimePicker);
    expect(picker.props).toMatchObject({ display: 'inline', mode: 'date', value: parseDateOnly('2026-10-10'), minimumDate: parseDateOnly('2026-10-01'), maximumDate: parseDateOnly('2026-10-31') });
    act(() => picker.props.onValueChange({}, new Date(2026, 9, 21)));
    expect(change).not.toHaveBeenCalled();
    press(renderer, t('dateConfirm'));
    expect(change).toHaveBeenLastCalledWith('2026-10-21');
    expect(renderer.root.findAllByType(DateTimePicker)).toHaveLength(0);
    press(renderer, 'Date');
    press(renderer, t('dateClear'));
    expect(change).toHaveBeenLastCalledWith('');
    act(() => renderer.unmount());
  });

  it('cancels iOS selections, clamps the initial date, hides Clear when required, and respects disabled fields', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    const change = jest.fn();
    const renderer = renderSafeArea(<DateInput value="" onChangeText={change} accessibilityLabel="Date" maximumDate="2000-01-01" allowClear={false} />);
    expect(renderer.root.findAll((node) => node.props.children === t('dateSelect')).length).toBeGreaterThan(0);
    press(renderer, 'Date');
    const picker = renderer.root.findByType(DateTimePicker);
    expect(picker.props.value).toEqual(parseDateOnly('2000-01-01'));
    expect(buttons(renderer).some((button) => containsText(button.props.children, t('dateClear')))).toBe(false);
    act(() => picker.props.onValueChange({}, new Date(1999, 0, 1)));
    press(renderer, t('dateCancel'));
    expect(change).not.toHaveBeenCalled();
    expect(renderer.root.findAllByType(DateTimePicker)).toHaveLength(0);
    act(() => renderer.update(<SafeAreaProvider initialMetrics={initialMetrics}><DateInput value="2026-10-10" onChangeText={change} accessibilityLabel="Date" editable={false} /></SafeAreaProvider>));
    expect(buttons(renderer).find((button) => button.props.accessibilityLabel === 'Date')!.props.disabled).toBe(true);
    act(() => renderer.unmount());
  });

  it('renders the iOS sheet through an open drawer instead of stacking a second Modal', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    const renderer = renderSafeArea(
      <ResponsiveDrawerModal visible closeLabel="Close" onClose={() => {}}>
        <DateInput value="2026-10-10" onChangeText={() => {}} accessibilityLabel="Date" />
      </ResponsiveDrawerModal>,
    );
    press(renderer, 'Date');
    expect(renderer.root.findAllByType(DateTimePicker)).toHaveLength(1);
    expect(renderer.root.findAllByType(Modal)).toHaveLength(1);
    press(renderer, t('dateCancel'));
    expect(renderer.root.findAllByType(DateTimePicker)).toHaveLength(0);
    act(() => renderer.unmount());
  });
});

describe('browser date input', () => {
  const renderWeb = (element: React.ReactElement) => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(element, {
        createNodeMock: () => ({ measureInWindow: (callback: (x: number, y: number, w: number, h: number) => void) => callback(10, 20, 200, 40) }),
      });
    });
    return renderer;
  };
  const pressables = (renderer: ReturnType<typeof render>) =>
    renderer.root.findAll((node) => typeof node.props.onPress === 'function' && node.props.accessibilityRole === 'button');
  const findButton = (renderer: ReturnType<typeof render>, label: string) =>
    pressables(renderer).find((node) => node.props.accessibilityLabel === label)
    ?? pressables(renderer).find((node) => containsText(node, label));
  const press = (renderer: ReturnType<typeof render>, label: string) => act(() => findButton(renderer, label)!.props.onPress());

  it('opens a themed calendar popover with bounds, selection, and clearing', () => {
    const change = jest.fn();
    const renderer = renderWeb(<WebDateInput value="2026-10-10" onChangeText={change} accessibilityLabel="Date" minimumDate="2026-10-05" maximumDate="2026-10-25" />);
    expect(renderer.root.findAllByType('input')).toHaveLength(0);
    press(renderer, 'Date');
    expect(renderer.root.findAllByType(Modal)).toHaveLength(1);
    expect(findButton(renderer, '2026-10-10')!.props.accessibilityState).toMatchObject({ selected: true });
    expect(findButton(renderer, '2026-10-01')!.props.disabled).toBe(true);
    expect(findButton(renderer, '2026-10-26')!.props.disabled).toBe(true);
    press(renderer, '2026-10-20');
    expect(change).toHaveBeenLastCalledWith('2026-10-20');
    expect(renderer.root.findAllByType(Modal)).toHaveLength(0);
    press(renderer, 'Date');
    press(renderer, t('dateClear'));
    expect(change).toHaveBeenLastCalledWith('');
    act(() => renderer.unmount());
  });

  it('navigates months and hides clearing for required dates', () => {
    const change = jest.fn();
    const renderer = renderWeb(<WebDateInput value="2026-10-10" onChangeText={change} accessibilityLabel="Date" allowClear={false} />);
    press(renderer, 'Date');
    expect(findButton(renderer, t('dateClear'))).toBeUndefined();
    press(renderer, t('dateNextMonth'));
    press(renderer, '2026-11-03');
    expect(change).toHaveBeenLastCalledWith('2026-11-03');
    act(() => renderer.unmount());
  });

  it('disables read-only fields', () => {
    const renderer = renderWeb(<WebDateInput value="2026-10-10" onChangeText={() => {}} accessibilityLabel="Date" editable={false} />);
    expect(findButton(renderer, 'Date')!.props.disabled).toBe(true);
    act(() => renderer.unmount());
  });
});
