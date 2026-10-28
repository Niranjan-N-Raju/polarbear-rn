import { Pressable, ScrollView, Text, View } from 'react-native';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { DateInput } from '../../../components/DateInput';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { SummaryCards } from '../../../components/SummaryCards';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { CalendarDays, Filter } from '../../../icons';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { ConfirmDrawer } from '../shared/ConfirmDrawer';
import { MonthStepper } from '../shared/MonthStepper';
import { attendanceStyles as local } from './attendanceStyles';
import { dateLabel, statuses, statusLabelKey } from './attendanceUtils';
import { useFranchiseAttendance, type FranchiseAttendanceScreenProps } from './useFranchiseAttendance';
import { WeeklyRosterDrawer } from './WeeklyRosterDrawer';
export { type AttendanceEmployee } from './attendanceUtils';

export function FranchiseAttendanceScreen({ storeId }: FranchiseAttendanceScreenProps) {
  const {
    layout,
    period,
    setPeriod,
    cycle,
    employees,
    records,
    selectedDate,
    setSelectedDate,
    employeeFilter,
    setEmployeeFilter,
    loading,
    error,
    setReloadKey,
    updatingId,
    drawer,
    setDrawer,
    toast,
    setToast,
    toastTone,
    setToastTone,
    periodDates,
    visibleEmployees,
    summaryCards,
    changeDate,
    updateStatus,
    removeRecord,
    removeRequest,
    removing,
    removeError,
    setRemoveError,
    cancelRemove,
    confirmRemove,
  } = useFranchiseAttendance({ storeId });
  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, layout.desktopWeb && styles.screenHeaderInline, layout.compactWeb && styles.screenHeaderStack]}>
        <View style={layout.isWeb ? styles.screenHeaderCopy : styles.screenHeaderCopyNative}>
          <View style={styles.screenTitleRow}>
            <Text style={[styles.screenTitle, styles.screenTitleInline]}>{t('franchiseAttendance')}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseAttendanceFilterEmployees')} onPress={() => setDrawer('filters')} style={styles.filterIconButton}>
              <Filter color={theme.colors.teal} size={18} />
              {employeeFilter !== 'all' ? <View style={local.activeDot} /> : null}
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseAttendanceWeeklyRoster')} onPress={() => setDrawer('roster')} style={styles.filterIconButton}>
              <CalendarDays color={theme.colors.teal} size={18} />
            </Pressable>
          </View>
          <Text style={styles.screenDescription}>{t('franchiseAttendanceDescription')}</Text>
        </View>
        <View style={styles.screenHeaderActions}>
          {layout.desktopWeb ? <Pressable accessibilityRole="button" onPress={() => setDrawer('roster')} style={[styles.secondaryButton, styles.screenHeaderAction]}><Text style={styles.secondaryButtonText}>{t('franchiseAttendanceWeeklyRoster')}</Text></Pressable> : null}
        </View>
      </View>

      {!storeId ? <View style={local.empty}><Text style={local.emptyText}>{t('franchiseAttendanceSelectStore')}</Text></View> : <>
        <View style={local.toolbar}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseAttendancePreviousDay')} onPress={() => changeDate(-1)} style={local.dateButton}><Text style={styles.secondaryButtonText}>‹</Text></Pressable>
          <View style={local.dateField}>
            <DateInput
              accessibilityLabel={t('franchiseAttendanceDate')}
              value={selectedDate}
              onChangeText={setSelectedDate}
              allowClear={false}
              minimumDate={cycle?.from}
              maximumDate={cycle?.to}
            />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseAttendanceNextDay')} onPress={() => changeDate(1)} style={local.dateButton}><Text style={styles.secondaryButtonText}>›</Text></Pressable>
        </View>
        <MonthStepper month={period} onChange={(next) => setPeriod(next)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.dayStrip}>
          {periodDates.map((date) => {
            const selected = date === selectedDate;
            const count = records.filter((record) => record.date === date && (employeeFilter === 'all' || record.employeeId === employeeFilter)).length;
            return <Pressable key={date} accessibilityRole="button" accessibilityLabel={date} onPress={() => setSelectedDate(date)} style={[local.dayItem, selected && local.dayItemSelected]}>
              <Text style={local.dayItemText}>{dateLabel(date, { weekday: 'short' })}</Text>
              <Text style={local.dayItemNumber}>{date.slice(8)}{count > 0 ? ` · ${count}` : ''}</Text>
            </Pressable>;
          })}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.filterRow}>
          <Pressable accessibilityRole="button" onPress={() => setEmployeeFilter('all')} style={[local.filterChip, employeeFilter === 'all' && local.filterChipActive]}>
            <Text style={[local.filterText, employeeFilter === 'all' && local.filterTextActive]}>{t('franchiseAttendanceAllEmployees')}</Text>
          </Pressable>
          {employees.filter((employee) => employee.isActive !== false).map((employee) => <Pressable key={employee._id} accessibilityRole="button" accessibilityLabel={`${t('franchiseAttendanceFilterEmployees')}: ${employee.name}`} onPress={() => setEmployeeFilter(employeeFilter === employee._id ? 'all' : employee._id)} style={[local.filterChip, employeeFilter === employee._id && local.filterChipActive]}>
            <Text style={[local.filterText, employeeFilter === employee._id && local.filterTextActive]}>{employee.name}</Text>
          </Pressable>)}
        </ScrollView>
        <Text style={local.sectionLabel}>{t('franchiseAttendanceSummaryDay')} · {dateLabel(selectedDate)}</Text>
        <SummaryCards cards={summaryCards} isWeb={layout.desktopWeb} perRow={layout.desktopWeb ? 3 : 2} />
        {loading ? <AppLoader /> : error ? <AppErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} /> : (
          <>
            <View style={local.employeeTop}>
              <Text style={local.sectionLabel}>{t('franchiseAttendanceDate')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseAttendanceWeeklyRoster')} onPress={() => setDrawer('roster')} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{t('franchiseAttendanceWeeklyRoster')}</Text></Pressable>
            </View>
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {visibleEmployees.length === 0 ? <View style={local.empty}><Text style={local.emptyText}>{t('franchiseAttendanceNoEmployees')}</Text></View> : visibleEmployees.map((employee) => {
                const record = records.find((item) => item.date === selectedDate && item.employeeId === employee._id);
                return <View key={employee._id} style={local.employeeCard}>
                  <View style={local.employeeTop}>
                    <Text style={local.employeeName}>{employee.name}</Text>
                    {record ? <Pressable accessibilityRole="button" accessibilityLabel={`${t('franchiseAttendanceRemove')} ${employee.name}`} onPress={() => removeRecord(employee)}><Text style={local.employeeMeta}>×</Text></Pressable> : <Text style={local.employeeMeta}>{t('franchiseAttendanceUnmarked')}</Text>}
                  </View>
                  <View style={local.statusRow}>
                    {statuses.map((status) => {
                      const chosen = record?.status === status;
                      return <Pressable key={status} accessibilityRole="button" accessibilityLabel={`${employee.name}: ${t(statusLabelKey[status])}`} accessibilityState={{ selected: chosen, disabled: updatingId === employee._id }} disabled={updatingId === employee._id} onPress={() => updateStatus(employee, status)} style={[local.statusButton, chosen && local.statusButtonSelected, updatingId === employee._id && local.disabled]}>
                        <Text style={[local.statusText, chosen && local.statusTextSelected]}>{t(statusLabelKey[status])}</Text>
                      </Pressable>;
                    })}
                  </View>
                  {record?.comment ? <Text style={local.comments}>{record.comment}</Text> : null}
                </View>;
              })}
            </ScrollView>
          </>
        )}
      </>}
      {toast && !removeRequest ? <AppToast message={toast} tone={toastTone} onDismiss={() => setToast(null)} /> : null}
      <ResponsiveDrawerModal visible={drawer === 'filters'} closeLabel={t('franchiseAttendanceClose')} onClose={() => setDrawer(null)}>
        <View style={local.drawerContent}>
          <Text style={local.drawerTitle}>{t('franchiseAttendanceFilterEmployees')}</Text>
          <Pressable accessibilityRole="button" onPress={() => { setEmployeeFilter('all'); setDrawer(null); }} style={[local.filterChip, employeeFilter === 'all' && local.filterChipActive]}>
            <Text style={[local.filterText, employeeFilter === 'all' && local.filterTextActive]}>{t('franchiseAttendanceAllEmployees')}</Text>
          </Pressable>
          <ScrollView style={local.rosterScroll} contentContainerStyle={local.rosterScrollContent}>
            {employees.filter((employee) => employee.isActive !== false).map((employee) => <Pressable key={employee._id} accessibilityRole="button" onPress={() => { setEmployeeFilter(employee._id); setDrawer(null); }} style={[local.filterChip, employeeFilter === employee._id && local.filterChipActive]}>
              <Text style={[local.filterText, employeeFilter === employee._id && local.filterTextActive]}>{employee.name}</Text>
            </Pressable>)}
          </ScrollView>
        </View>
      </ResponsiveDrawerModal>
      <WeeklyRosterDrawer visible={drawer === 'roster'} storeId={storeId} employees={employees} onClose={() => setDrawer(null)} onSaved={(message) => { setDrawer(null); setToastTone('success'); setToast(message); setReloadKey((key) => key + 1); }} />
      <ConfirmDrawer
        visible={Boolean(removeRequest)}
        title={t('franchiseAttendanceRemove')}
        message={removeRequest ? t('franchiseAttendanceRemoveConfirm', { name: removeRequest.employee.name, date: dateLabel(removeRequest.date) }) : ''}
        confirmLabel={t('franchiseAttendanceRemove')}
        busy={removing}
        error={removeError}
        onDismissError={() => setRemoveError(null)}
        onClose={cancelRemove}
        onConfirm={confirmRemove}
      />
    </View>
  );
}
