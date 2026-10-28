import { useRef, useState, type ComponentRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { CalendarDays, ChevronLeft, ChevronRight } from '../icons';
import { theme } from '../config/theme';
import { getLocale, t } from '../i18n';
import { formatDateOnly, parseDateOnly } from '../utils/dateOnly';
import type { DateInputProps } from './DateInput.types';
import { businessDate } from '../utils/businessDate';

const POPOVER_WIDTH = 296;
const POPOVER_HEIGHT = 360;
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface Anchor { x: number; y: number; width: number; height: number }

export function DateInput({
  value, onChangeText, accessibilityLabel, placeholder, editable = true, allowClear = true,
  minimumDate, maximumDate, style,
}: DateInputProps) {
  const fieldRef = useRef<ComponentRef<typeof View>>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [month, setMonth] = useState(() => startOfMonth(parseDateOnly(value) ?? new Date()));
  const window = useWindowDimensions();
  const selected = parseDateOnly(value) ? value : '';
  const today = businessDate();

  const open = () => {
    setMonth(startOfMonth(parseDateOnly(value) ?? parseDateOnly(maximumDate ?? '') ?? new Date()));
    // Open immediately, then refine placement once the field has been measured.
    setAnchor({ x: 0, y: 0, width: 0, height: 0 });
    fieldRef.current?.measureInWindow?.((x, y, width, height) => setAnchor({ x, y, width, height }));
  };
  const close = () => setAnchor(null);
  const choose = (next: string) => { close(); onChangeText(next); };
  const inRange = (day: string) => (!minimumDate || day >= minimumDate) && (!maximumDate || day <= maximumDate);
  const shiftMonth = (delta: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1, 12));

  const position = anchor ? {
    left: Math.max(8, Math.min(anchor.x, window.width - POPOVER_WIDTH - 8)),
    top: anchor.y + anchor.height + 4 + POPOVER_HEIGHT > window.height
      ? Math.max(8, anchor.y - POPOVER_HEIGHT - 4)
      : anchor.y + anchor.height + 4,
  } : null;

  return (
    <>
      <Pressable
        ref={fieldRef}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: value }}
        accessibilityState={{ disabled: !editable, expanded: Boolean(anchor) }}
        disabled={!editable}
        onPress={open}
        style={[styles.input, style, styles.row, !editable && styles.disabled]}
      >
        <Text style={[styles.text, !value && styles.placeholder]}>{value || placeholder || t('dateSelect')}</Text>
        <CalendarDays color={theme.colors.orange} size={18} />
      </Pressable>
      {anchor && position ? (
        <Modal visible transparent animationType="none" onRequestClose={close}>
          <Pressable accessibilityLabel={t('dateCancel')} style={StyleSheet.absoluteFill} onPress={close} />
          <View accessibilityRole="none" accessibilityLabel={accessibilityLabel} style={[styles.popover, position]}>
            <View style={styles.header}>
              <Pressable accessibilityRole="button" accessibilityLabel={t('datePreviousMonth')} onPress={() => shiftMonth(-1)} style={styles.navButton}>
                <ChevronLeft color={theme.colors.orange} size={18} />
              </Pressable>
              <Text style={styles.monthLabel}>{month.toLocaleDateString(getLocale(), { month: 'long', year: 'numeric' })}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t('dateNextMonth')} onPress={() => shiftMonth(1)} style={styles.navButton}>
                <ChevronRight color={theme.colors.orange} size={18} />
              </Pressable>
            </View>
            <View style={styles.grid}>
              {WEEKDAYS.map((day) => <Text key={day} style={[styles.weekday]}>{day}</Text>)}
              {monthCells(month).map((day, index) => {
                if (!day) return <View key={`blank-${index}`} style={styles.cell} />;
                const key = formatDateOnly(day);
                const enabled = inRange(key);
                const isSelected = key === selected;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityLabel={key}
                    accessibilityState={{ selected: isSelected, disabled: !enabled }}
                    disabled={!enabled}
                    onPress={() => choose(key)}
                    style={({ pressed }) => [
                      styles.cell, styles.day,
                      pressed && enabled && !isSelected && styles.dayHover,
                      key === today && !isSelected && styles.today,
                      isSelected && styles.selected,
                    ]}
                  >
                    <Text style={[styles.dayText, !enabled && styles.dayDisabled, key === today && styles.todayText, isSelected && styles.selectedText]}>{day.getDate()}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.footer}>
              {allowClear ? (
                <Pressable accessibilityRole="button" onPress={() => choose('')}><Text style={styles.action}>{t('dateClear')}</Text></Pressable>
              ) : <View />}
              {inRange(today) ? (
                <Pressable accessibilityRole="button" onPress={() => choose(today)}><Text style={styles.action}>{t('dateToday')}</Text></Pressable>
              ) : null}
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function monthCells(month: Date): Array<Date | null> {
  const leading = month.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: days }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1, 12)),
  ];
}

const styles = StyleSheet.create({
  input: { minHeight: 44, borderWidth: 1, borderColor: theme.colors.inputBorder, borderRadius: 6, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.white },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md },
  disabled: { opacity: 0.6 },
  text: { color: theme.colors.ink, fontSize: theme.typography.sm, flexShrink: 1 },
  placeholder: { color: theme.colors.placeholder },
  popover: {
    position: 'absolute', width: POPOVER_WIDTH, padding: theme.spacing.lg, borderRadius: theme.radius.small,
    backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.inputBorder,
    shadowColor: theme.colors.black, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.16, shadowRadius: 24,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  navButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { color: theme.colors.ink, fontSize: theme.typography.md, fontWeight: theme.fontWeight.bold },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
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
