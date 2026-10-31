import { useEffect, useId, useRef, useState, type ComponentRef } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { CalendarDays, ChevronLeft, ChevronRight } from '../icons';
import { theme } from '../config/theme';
import { getLocale, t } from '../i18n';
import { formatDateOnly, parseDateOnly } from '../utils/dateOnly';
import { businessDate } from '../utils/businessDate';
import { useOverlayHost } from './OverlayHost';
import type { DateInputProps } from './DateInput.types';
import { AppLoader } from './AppLoader';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
interface Anchor { x: number; y: number; width: number; height: number }

export function CalendarDateInput({ value, onChangeText, accessibilityLabel, placeholder, editable = true, allowClear = true, minimumDate, maximumDate, disabledDates, calendarLoading = false, calendarError, onMonthChange, style }: DateInputProps) {
  const fieldRef = useRef<ComponentRef<typeof View>>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [month, setMonth] = useState(() => startOfMonth(parseDateOnly(value) ?? new Date()));
  const window = useWindowDimensions();
  const overlayHost = useOverlayHost();
  const hostOverlay = Platform.OS === 'web' ? null : overlayHost;
  const hostKey = useId();
  const selected = parseDateOnly(value) ? value : '';
  const blockedDates = new Set(disabledDates ?? []);
  const today = businessDate();
  const popoverWidth = Math.min(296, Math.max(0, window.width - 16));
  const enabled = (date: string) => (!minimumDate || date >= minimumDate) && (!maximumDate || date <= maximumDate) && !blockedDates.has(date);
  const notifyMonth = (next: Date) => onMonthChange?.(formatDateOnly(next), formatDateOnly(new Date(next.getFullYear(), next.getMonth() + 1, 0, 12)));
  const open = () => {
    const next = startOfMonth(parseDateOnly(value) ?? parseDateOnly(maximumDate ?? '') ?? new Date());
    setMonth(next);
    notifyMonth(next);
    setAnchor({ x: 0, y: 0, width: 0, height: 0 });
    fieldRef.current?.measureInWindow?.((x, y, width, height) => setAnchor({ x, y, width, height }));
  };
  const close = () => setAnchor(null);
  const choose = (date: string) => {
    if (calendarLoading || calendarError) return;
    if (date && !enabled(date)) return;
    close();
    onChangeText(date);
  };
  const shiftMonth = (delta: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1, 12);
    setMonth(next);
    notifyMonth(next);
  };
  const position = anchor ? {
    left: Math.max(8, Math.min(anchor.x, window.width - popoverWidth - 8)),
    top: anchor.y + anchor.height + 364 > window.height ? Math.max(8, anchor.y - 364) : anchor.y + anchor.height + 4,
  } : null;
  const gridHeight = (Math.ceil(monthCells(month).length / 7) + 1) * 36;
  const calendar = anchor && position ? <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
    <Pressable accessibilityRole="button" accessibilityLabel={t('dateCancel')} style={StyleSheet.absoluteFill} onPress={close} />
    <View accessibilityLabel={accessibilityLabel} style={[styles.popover, position, { width: popoverWidth }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('datePreviousMonth')} disabled={calendarLoading} onPress={() => shiftMonth(-1)} style={styles.navButton}><ChevronLeft color={theme.colors.orange} size={18} /></Pressable>
        <Text style={styles.monthLabel}>{month.toLocaleDateString(getLocale(), { month: 'long', year: 'numeric' })}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('dateNextMonth')} disabled={calendarLoading} onPress={() => shiftMonth(1)} style={styles.navButton}><ChevronRight color={theme.colors.orange} size={18} /></Pressable>
      </View>
      {calendarLoading ? <View style={[styles.calendarState, { height: gridHeight }]} accessibilityState={{ busy: true }}><AppLoader variant="inline" /></View> : calendarError ? <View style={[styles.calendarState, { height: gridHeight }]}><Text accessibilityRole="alert" style={styles.error}>{calendarError}</Text></View> : <View style={styles.grid}>
        {WEEKDAYS.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}
        {monthCells(month).map((day, index) => {
          if (!day) return <View key={`blank-${index}`} style={styles.cell} />;
          const date = formatDateOnly(day);
          const available = enabled(date);
          const isSelected = date === selected;
          return <Pressable key={date} accessibilityRole="button" accessibilityLabel={date} accessibilityState={{ selected: isSelected, disabled: !available }} disabled={!available} onPress={() => choose(date)} style={({ pressed }) => [styles.cell, styles.day, pressed && available && !isSelected && styles.dayHover, date === today && available && !isSelected && styles.today, isSelected && available && styles.selected]}>
            <Text style={[styles.dayText, !available && styles.dayDisabled, date === today && available && styles.todayText, isSelected && available && styles.selectedText]}>{day.getDate()}</Text>
          </Pressable>;
        })}
      </View>}
      <View style={styles.footer}>
        {allowClear ? <Pressable accessibilityRole="button" disabled={calendarLoading || Boolean(calendarError)} onPress={() => choose('')}><Text style={styles.action}>{t('dateClear')}</Text></Pressable> : <View />}
        {!calendarLoading && !calendarError && enabled(today) ? <Pressable accessibilityRole="button" onPress={() => choose(today)}><Text style={styles.action}>{t('dateToday')}</Text></Pressable> : null}
      </View>
    </View>
  </View> : null;

  useEffect(() => {
    hostOverlay?.(hostKey, calendar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostOverlay, hostKey, anchor, month, value, minimumDate, maximumDate, disabledDates, calendarLoading, calendarError, allowClear, onChangeText, onMonthChange, window.width, window.height]);
  useEffect(() => () => hostOverlay?.(hostKey, null), [hostOverlay, hostKey]);

  return <>
    <Pressable ref={fieldRef} accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityValue={{ text: value }} accessibilityState={{ disabled: !editable, expanded: Boolean(anchor) }} disabled={!editable} onPress={open} style={[styles.input, style, styles.row, !editable && styles.disabled]}>
      <Text style={[styles.text, !value && styles.placeholder]}>{value || placeholder || t('dateSelect')}</Text>
      <CalendarDays color={theme.colors.orange} size={18} />
    </Pressable>
    {!hostOverlay && calendar ? <Modal visible transparent animationType="none" onRequestClose={close}>{calendar}</Modal> : null}
  </>;
}

function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1, 12); }
function monthCells(month: Date): Array<Date | null> {
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return [...Array.from({ length: month.getDay() }, () => null), ...Array.from({ length: days }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1, 12))];
}

const styles = StyleSheet.create({
  input: { minHeight: 44, borderWidth: 1, borderColor: theme.colors.inputBorder, borderRadius: 6, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.white },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md },
  disabled: { opacity: 0.6 },
  text: { color: theme.colors.ink, fontSize: theme.typography.sm, flexShrink: 1 },
  placeholder: { color: theme.colors.placeholder },
  popover: { position: 'absolute', padding: theme.spacing.lg, borderRadius: theme.radius.small, backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.inputBorder, shadowColor: theme.colors.black, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  navButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { color: theme.colors.ink, fontSize: theme.typography.md, fontWeight: theme.fontWeight.bold },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarState: { alignItems: 'center', justifyContent: 'center' },
  error: { color: theme.colors.error, fontSize: theme.typography.sm, textAlign: 'center' },
  cell: { width: '14.2857%', height: 36, alignItems: 'center', justifyContent: 'center' },
  weekday: { width: '14.2857%', textAlign: 'center', color: theme.colors.muted, fontSize: theme.typography.xs, fontWeight: theme.fontWeight.medium, lineHeight: 36 },
  day: { borderRadius: 18 },
  dayHover: { backgroundColor: theme.colors.welcomeTint },
  today: { borderWidth: 1, borderColor: theme.colors.orange },
  selected: { backgroundColor: theme.colors.orange },
  dayText: { color: theme.colors.ink, fontSize: theme.typography.sm },
  dayDisabled: { color: theme.colors.inputBorder },
  todayText: { color: theme.colors.orange, fontWeight: theme.fontWeight.bold },
  selectedText: { color: theme.colors.white, fontWeight: theme.fontWeight.bold },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.md, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.beige },
  action: { color: theme.colors.orange, fontSize: theme.typography.sm, fontWeight: theme.fontWeight.bold },
});