import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { X } from '../../../icons';
import { apiRequest } from '../../../api/auth';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { DateInput } from '../../../components/DateInput';
import { theme } from '../../../config/theme';
import { getLocale, t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import type { AttendanceEmployee } from './FranchiseAttendanceScreen';
import { attendanceStyles as local } from './attendanceStyles';
import { businessDate } from '../../../utils/businessDate';

type Shift = { id: string; name: string; startTime: string; endTime: string };
type RosterDay = { date: string; shift: string };
type Schedule = { employeeId: string; days: RosterDay[] };

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function monday(value: string) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return localDate(date);
}
function shiftWeek(value: string, amount: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + amount * 7);
  return localDate(date);
}
function labelDate(value: string) {
  return new Intl.DateTimeFormat(getLocale(), { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${value}T00:00:00`));
}

interface WeeklyRosterDrawerProps {
  visible: boolean;
  storeId: string;
  employees: AttendanceEmployee[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function WeeklyRosterDrawer({ visible, storeId, employees, onClose, onSaved }: WeeklyRosterDrawerProps) {
  const [weekStart, setWeekStart] = useState(() => {
    const nextMonday = new Date(`${monday(businessDate())}T00:00:00`);
    nextMonday.setDate(nextMonday.getDate() + 7);
    return localDate(nextMonday);
  });
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${weekStart}T00:00:00`);
    date.setDate(date.getDate() + index);
    return localDate(date);
  }), [weekStart]);
  const activeEmployees = useMemo(() => employees.filter((employee) => employee.isActive !== false).sort((a, b) => a.name.localeCompare(b.name)), [employees]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Schedules are only saveable for the week they were loaded for; a failed load must not reuse another week's data.
  const [loadedWeek, setLoadedWeek] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setToast(null);
    setLoadError(null);
    setLoadedWeek(null);
    setSchedules([]);
    const query = new URLSearchParams({ storeId, weekStart });
    apiRequest(`/attendance/weekly-roster?${query.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as { roster?: { entries?: Array<{ employeeId: string; days: RosterDay[] }> } | null; shifts?: Shift[]; message?: string };
        if (!active) return;
        if (!response.ok) throw new Error(data.message || t('adminLoadFailed'));
        const available = data.shifts ?? [];
        const saved = new Map((data.roster?.entries ?? []).map((entry) => [entry.employeeId, entry.days]));
        setShifts(available);
        setSchedules(activeEmployees.map((employee) => {
          const byDate = new Map((saved.get(employee._id) ?? []).map((day) => [day.date, day.shift]));
          return { employeeId: employee._id, days: weekDates.map((date) => ({ date, shift: byDate.get(date) ?? available[0]?.id ?? '' })) };
        }));
        setLoadedWeek(weekStart);
      })
      .catch((failure) => {
        if (active && !controller.signal.aborted) setLoadError(failure instanceof Error ? failure.message : t('adminNetworkError'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [activeEmployees, storeId, visible, weekDates, weekStart, reloadKey]);
  const isLoaded = loadedWeek === weekStart && !loading && !loadError;

  function update(employeeId: string, date: string, value: string) {
    setSchedules((current) => current.map((schedule) => schedule.employeeId !== employeeId ? schedule : {
      ...schedule,
      days: schedule.days.map((day) => day.date === date || (date === weekDates[0] && day.date >= weekDates[0] && day.date <= weekDates[6]) ? { ...day, shift: value } : day),
    }));
  }

  async function save() {
    if (saving || !isLoaded) return;
    if (!shifts.length) { setToast(t('franchiseAttendanceNoShifts')); return; }
    if (schedules.some((schedule) => schedule.days.some((day) => day.shift !== 'off' && !shifts.some((shift) => shift.id === day.shift)))) {
      setToast(t('franchiseAttendanceNoShifts'));
      return;
    }
    setSaving(true);
    try {
      const response = await apiRequest('/attendance/weekly-roster', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, weekStart, entries: schedules }),
      });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(data.message || t('adminSaveFailed'));
      onSaved(data.message || t('franchiseAttendanceRosterSaved'));
    } catch (saveError) {
      setToast(saveError instanceof Error ? saveError.message : t('adminNetworkError'));
    } finally { setSaving(false); }
  }

  return (
    <ResponsiveDrawerModal visible={visible} closeLabel={t('franchiseAttendanceClose')} onClose={onClose} overlay={visible && toast ? <AppToast message={toast} tone="error" onDismiss={() => setToast(null)} /> : null}>
      <View style={local.drawerContent}>
        <View style={local.drawerHeader}>
          <Text style={local.drawerTitle}>{t('franchiseAttendanceWeeklyRoster')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseAttendanceClose')} onPress={onClose} style={styles.userIconAction}><X color={theme.colors.muted} size={18} /></Pressable>
        </View>
        <Text style={local.drawerSubtitle}>{t('franchiseAttendanceRosterHelp')}</Text>
        <View style={local.toolbar}>
          <Pressable accessibilityRole="button" onPress={() => setWeekStart((value) => shiftWeek(value, -1))} style={local.dateButton}><Text>‹</Text></Pressable>
          <View style={local.dateField}>
            <Text style={local.dateLabel}>{labelDate(weekDates[0])} – {labelDate(weekDates[6])}</Text>
            <DateInput accessibilityLabel={t('franchiseAttendanceWeeklyRoster')} value={weekStart} onChangeText={(value) => setWeekStart(monday(value))} allowClear={false} />
          </View>
          <Pressable accessibilityRole="button" onPress={() => setWeekStart((value) => shiftWeek(value, 1))} style={local.dateButton}><Text>›</Text></Pressable>
        </View>
        {loading ? <AppLoader /> : loadError ? <AppErrorState message={loadError} onRetry={() => setReloadKey((key) => key + 1)} /> : shifts.length === 0 ? <View style={local.empty}><Text style={local.emptyText}>{t('franchiseAttendanceNoShifts')}</Text></View> : activeEmployees.length === 0 ? <View style={local.empty}><Text style={local.emptyText}>{t('franchiseAttendanceNoEmployees')}</Text></View> : (
          <ScrollView style={local.rosterScroll} contentContainerStyle={local.rosterScrollContent}>
            {activeEmployees.map((employee) => {
              const schedule = schedules.find((item) => item.employeeId === employee._id);
              return <View key={employee._id} style={local.rosterEmployee}>
                <Text style={local.rosterEmployeeName}>{employee.name}</Text>
                {weekDates.map((date, index) => {
                  const day = schedule?.days.find((item) => item.date === date);
                  const selected = day?.shift ?? '';
                  const selectedShift = shifts.find((shift) => shift.id === selected);
                  return <View key={date} style={local.rosterDayRow}>
                    <Text style={local.rosterDayLabel}>{labelDate(date)}</Text>
                    <Text style={local.rosterShiftText}>{selected === 'off' ? t('franchiseAttendanceDayOff') : selectedShift ? `${selectedShift.name} ${t('franchiseAttendanceShift', { start: selectedShift.startTime, end: selectedShift.endTime })}` : '—'}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.rosterShiftChoices}>
                      {shifts.map((shift) => <Pressable key={shift.id} accessibilityRole="button" accessibilityLabel={`${employee.name} ${labelDate(date)} ${shift.name}`} onPress={() => update(employee._id, index === 0 ? weekDates[0] : date, shift.id)} style={[local.rosterShiftButton, selected === shift.id && local.rosterShiftSelected]}><Text style={[local.rosterShiftLabel, selected === shift.id && local.rosterShiftLabelSelected]}>{shift.name}</Text></Pressable>)}
                      <Pressable accessibilityRole="button" accessibilityLabel={`${employee.name} ${labelDate(date)} ${t('franchiseAttendanceDayOff')}`} onPress={() => update(employee._id, index === 0 ? weekDates[0] : date, 'off')} style={[local.rosterShiftButton, selected === 'off' && local.rosterShiftSelected]}><Text style={[local.rosterShiftLabel, selected === 'off' && local.rosterShiftLabelSelected]}>{t('franchiseAttendanceDayOff')}</Text></Pressable>
                    </ScrollView>
                  </View>;
                })}
              </View>;
            })}
          </ScrollView>
        )}
        <View style={local.drawerFooter}>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving || !isLoaded || activeEmployees.length === 0 }} disabled={saving || !isLoaded || activeEmployees.length === 0} onPress={() => save()} style={[local.primaryButton, (saving || !isLoaded || activeEmployees.length === 0) && local.disabled]}>
            {saving ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={local.primaryButtonText}>{t('franchiseAttendanceSaveRoster')}</Text>}
          </Pressable>
        </View>
      </View>
    </ResponsiveDrawerModal>
  );
}
