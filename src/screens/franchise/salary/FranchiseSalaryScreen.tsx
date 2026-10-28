import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { SummaryCards } from '../../../components/SummaryCards';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { CalendarClock, FileText, Plus, X } from '../../../icons';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { formatMoney } from '../DashboardCharts';
import { ConfirmDrawer } from '../shared/ConfirmDrawer';
import { MonthStepper } from '../shared/MonthStepper';
import { SalaryEntryDrawer, translateSalaryEntryType } from './SalaryEntryDrawer';
import { salaryStyles } from './salaryStyles';
import { entryKinds, kindLabel, useFranchiseSalary } from './useFranchiseSalary';
import { currentMonthValue as todayPeriod } from '../shared/months';


export function FranchiseSalaryScreen({ storeId }: { storeId: string; }) {
  const {
    layout,
    period,
    setPeriod,
    data,
    isLoading,
    error,
    isCycleOpen,
    setIsCycleOpen,
    cycleType,
    setCycleType,
    startDay,
    setStartDay,
    cycleError,
    savingCycle,
    selectedEmployee,
    setSelectedEmployee,
    slip,
    setSlip,
    slipBusy,
    queuedDrawerAction,
    setQueuedDrawerAction,
    entryRequest,
    setEntryRequest,
    deleteRequest,
    setDeleteRequest,
    busyDelete,
    toast,
    setToast,
    pendingToast,
    setPendingToast,
    deleteError,
    setDeleteError,
    reload,
    projections,
    summaryRows,
    openSlip,
    saveCycle,
    removeEntry,
    findEntry,
  } = useFranchiseSalary({ storeId });
  return <View style={styles.screen}>
    <View style={[styles.screenHeader, layout.desktopWeb && styles.screenHeaderInline, layout.compactWeb && styles.screenHeaderStack]}>
      <View style={layout.isWeb ? styles.screenHeaderCopy : styles.screenHeaderCopyNative}>
        <View style={styles.screenTitleRow}><Text style={[styles.screenTitle, styles.screenTitleInline]}>{t('franchiseSalaryTitle')}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('franchiseSalaryCycleSettings')} onPress={() => setIsCycleOpen(true)} style={styles.filterIconButton}><CalendarClock color={theme.colors.teal} size={18} /></Pressable></View>
        <Text style={styles.screenDescription}>{data ? `${data.store.name} · ${data.cycle.from} – ${data.cycle.to}` : t('franchiseSalaryDescription')}</Text>
      </View>
    </View>
    {isLoading && !data ? <AppLoader /> : error ? <AppErrorState message={error} onRetry={reload} /> : <ScrollView style={[styles.list, !layout.desktopWeb && styles.storeListFabViewport]} contentContainerStyle={[styles.listContent, !layout.desktopWeb && styles.storeListWithFab]}>
      {isLoading ? <AppLoader variant="inline" /> : null}
      <MonthStepper month={period} onChange={setPeriod} maxMonth={todayPeriod()} />
      <View style={salaryStyles.summary}>{summaryRows.map((row) => <SummaryCards key={row[0].label} cards={row} isWeb={layout.isWeb} perRow={row.length} />)}</View>
      {projections.length === 0 ? <Text style={styles.stateMessage}>{t('franchiseSalaryNoEmployees')}</Text> : null}
      <View style={layout.isWeb ? styles.storeGrid : undefined}>{projections.map((employee) => <View key={employee.employeeId} style={[salaryStyles.employeeCard]}>
        <View style={salaryStyles.employeeHeader}><View style={salaryStyles.flexOne}><Text style={salaryStyles.employeeName}>{employee.name}</Text><Text style={salaryStyles.employeeMeta}>{employee.position || employee.employmentType || t('franchiseSalaryEmployee')}</Text></View><Text style={salaryStyles.netPay}>{formatMoney(employee.earnedSalary)}</Text></View>
        <Text style={salaryStyles.secondary}>{t('franchiseSalaryPaidDays', { paid: employee.paidDays, eligible: employee.eligibleDays })} · {t('franchiseSalaryAbsentDays', { count: employee.absentDays })}</Text>
        <Text style={salaryStyles.secondary}>{t('franchiseSalaryProjected')}: {formatMoney(employee.projectedSalary)}</Text>
        <View style={salaryStyles.metrics}>{entryKinds.map((kind) => <View key={kind} style={salaryStyles.metric}><Text style={salaryStyles.metricLabel}>{t(kindLabel[kind])}</Text><Text style={salaryStyles.metricValue}>{kind === 'extra-days' ? `${employee.extraDaysTotal} ${t('franchiseSalaryDaysShort')}` : formatMoney(kind === 'advances' ? employee.advanceTotal : employee.incentiveTotal)}</Text></View>)}</View>
        <View style={salaryStyles.actions}>{entryKinds.map((kind) => <Pressable key={kind} accessibilityRole="button" accessibilityLabel={t('franchiseSalaryAddEntry', { entry: t(kindLabel[kind]) })} onPress={() => setEntryRequest({ employeeId: employee.employeeId, kind, entry: null })} style={salaryStyles.actionButton}><Plus color={theme.colors.orange} size={14} /><Text style={salaryStyles.actionText}>{t(kindLabel[kind])}</Text></Pressable>)}<Pressable accessibilityRole="button" accessibilityLabel={t('franchiseSalaryDetails')} onPress={() => setSelectedEmployee(employee)} style={salaryStyles.actionButton}><FileText color={theme.colors.teal} size={15} /><Text style={salaryStyles.actionText}>{t('franchiseSalaryDetails')}</Text></Pressable></View>
      </View>)}</View>
    </ScrollView>}
    {!layout.desktopWeb ? <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseSalaryCycleSettings')} onPress={() => setIsCycleOpen(true)} style={styles.fab}><CalendarClock color={theme.colors.white} size={23} /></Pressable> : null}

    <ResponsiveDrawerModal visible={isCycleOpen} closeLabel={t('adminCloseMenu')} onClose={() => setIsCycleOpen(false)} overlay={null}>
      <View style={styles.drawerContent}><View style={styles.drawerHeading}><Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t('franchiseSalaryCycleSettings')}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={() => setIsCycleOpen(false)} style={styles.userIconAction}><X color={theme.colors.muted} size={18} /></Pressable></View>
        <Text style={salaryStyles.modalLabel}>{t('franchiseSalaryCycleLabel')}</Text><View style={salaryStyles.cycleButtons}>{(['calendar_month', 'custom'] as const).map((value) => <Pressable key={value} onPress={() => setCycleType(value)} style={[salaryStyles.cycleButton, cycleType === value && salaryStyles.selectedCycle]}><Text style={salaryStyles.cycleText}>{t(value === 'calendar_month' ? 'franchiseSalaryCalendarCycle' : 'franchiseSalaryCustomCycle')}</Text></Pressable>)}</View>
        {cycleType === 'custom' ? <TextInput accessibilityLabel={t('franchiseSalaryStartDay')} value={startDay} onChangeText={setStartDay} keyboardType="number-pad" style={styles.fieldInput} placeholder={t('franchiseSalaryStartDay')} /> : null}
        {cycleError ? <Text style={styles.fieldError}>{cycleError}</Text> : null}
        <View style={styles.modalActions}><View style={styles.drawerActionSlot}><Pressable accessibilityRole="button" onPress={() => setIsCycleOpen(false)} style={[styles.secondaryButton, styles.drawerActionButton]}><Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text></Pressable></View><View style={styles.drawerActionSlot}><Pressable accessibilityRole="button" disabled={savingCycle} onPress={saveCycle} style={[styles.primaryButton, styles.drawerActionButton]}>{savingCycle ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t('adminSave')}</Text>}</Pressable></View></View>
      </View>
    </ResponsiveDrawerModal>

    <ResponsiveDrawerModal visible={Boolean(selectedEmployee) && !entryRequest && !deleteRequest} closeLabel={t('adminCloseMenu')} onClose={() => { setSelectedEmployee(null); setSlip(null); }} onAfterClose={() => { if (!queuedDrawerAction) return; if (queuedDrawerAction.type === 'entry') setEntryRequest(queuedDrawerAction); else setDeleteRequest(queuedDrawerAction); setQueuedDrawerAction(null); }}>
      {selectedEmployee ? <ScrollView contentContainerStyle={styles.drawerContent}>
        <View style={styles.drawerHeading}><Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{selectedEmployee.name}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={() => { setSelectedEmployee(null); setSlip(null); }} style={styles.userIconAction}><X color={theme.colors.muted} size={18} /></Pressable></View>
        <Text style={salaryStyles.detailTitle}>{t('franchiseSalaryBreakdown')}</Text>
        <View style={salaryStyles.detailLine}><Text>{t('franchiseSalaryBase')}</Text><Text>{formatMoney(selectedEmployee.salary)}</Text></View>
        <View style={salaryStyles.detailLine}><Text>{t('franchiseSalaryPaidDays', { paid: selectedEmployee.paidDays, eligible: selectedEmployee.eligibleDays })}</Text><Text>{formatMoney(selectedEmployee.salary * selectedEmployee.paidDays / (data?.cycle.totalDays ?? 1))}</Text></View>
        <View style={salaryStyles.detailLine}><Text>{t('franchiseSalaryIncentivesTotal')}</Text><Text>{formatMoney(selectedEmployee.incentiveTotal)}</Text></View>
        <View style={salaryStyles.detailLine}><Text>{t('franchiseSalaryAdvance')}</Text><Text>-{formatMoney(selectedEmployee.advanceTotal)}</Text></View>
        <View style={salaryStyles.detailLine}><Text>{t('franchiseSalaryEarned')}</Text><Text>{formatMoney(selectedEmployee.earnedSalary)}</Text></View>
        <View style={salaryStyles.detailEntries}>{entryKinds.map((kind) => <View key={kind}><Text style={salaryStyles.detailTitle}>{t(kindLabel[kind])}</Text>{findEntry(selectedEmployee, kind).map((entry) => <View key={entry.id} style={salaryStyles.entryRow}><Text style={salaryStyles.entryText}>{translateSalaryEntryType(entry.type)}: {kind === 'extra-days' ? `${entry.days} ${t('franchiseSalaryDaysShort')}` : formatMoney(entry.amount ?? 0)}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('franchiseSalaryEditEntry', { entry: translateSalaryEntryType(entry.type) })} onPress={() => { setQueuedDrawerAction({ type: 'entry', employeeId: selectedEmployee.employeeId, kind, entry }); setSelectedEmployee(null); setSlip(null); }}><Text style={salaryStyles.link}>{t('adminEditUser')}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={t('franchiseSalaryDeleteEntry', { entry: translateSalaryEntryType(entry.type) })} onPress={() => { setQueuedDrawerAction({ type: 'delete', employeeId: selectedEmployee.employeeId, kind, entry }); setSelectedEmployee(null); setSlip(null); }}><Text style={salaryStyles.danger}>{t('adminDelete')}</Text></Pressable></View>)}</View>)}</View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseSalaryViewSlip')} onPress={() => openSlip(selectedEmployee)} style={[styles.primaryButton, salaryStyles.slipButton]}><FileText color={theme.colors.white} size={16} /><Text style={styles.primaryButtonText}>{t('franchiseSalaryViewSlip')}</Text></Pressable>
        {slipBusy ? <AppLoader variant="inline" /> : null}
        {slip ? <View style={salaryStyles.slip}>
          <Text style={salaryStyles.detailTitle}>{slip.store?.name} · {slip.periodLabel ?? period}</Text>
          <Text>{slip.store?.address}</Text><Text>{slip.store?.phone}</Text>

          <Text>{t("franchiseSalaryEmployeeName")}: {slip.employee?.name}</Text>
          <Text>{t("franchiseSalaryBankName")}: {slip.employee?.bankName}</Text>
          <Text>{t("franchiseSalaryPan")}: {slip.employee?.panNumber}</Text>
          <Text>{t("franchiseSalaryAccountNumber")}: {slip.employee?.bankAccountNumber}</Text>
          <Text>{t("franchiseSalaryDesignation")}: {slip.employee?.position}</Text>
          <Text>{t("franchiseSalaryPresentDays")}: {slip.attendance?.presentDays}</Text>
          <Text>{t("franchiseSalaryWeekOffDays")}: {slip.attendance?.weekOffDays}</Text>
          <Text>{t("franchiseSalaryAbsentDays", { count: slip.attendance?.absentDays ?? 0 })}</Text>
          <Text>{t("franchiseSalaryBasic")}: {formatMoney(slip.earnings?.basicSalary ?? 0)}</Text>
          <Text style={salaryStyles.slipNet}>{t("franchiseSalaryNetPay")}: {formatMoney(slip.netPay ?? 0)}</Text>

          <Text>{t("franchiseSalaryTotalWorkingDays")}: {slip.attendance?.totalWorkingDays}</Text>
          <Text>{t("franchiseSalaryGrossEarnings")}: {formatMoney(slip.earnings?.grossEarnings ?? 0)}</Text>
          <Text>{t("franchiseSalaryTotalDeductions")}: {formatMoney(slip.deductions?.totalDeductions ?? 0)}</Text>
          {slip.attendance?.extraDays?.map((item, index) => <Text key={index}>{translateSalaryEntryType(item.type)}: {item.days} {t("franchiseSalaryDaysShort")}</Text>)}
          {slip.incentives?.map((item, index) => <Text key={index}>{translateSalaryEntryType(item.type)}: {formatMoney(item.amount)}</Text>)}
          {slip.deductions?.advances?.map((item, index) => <Text key={index}>{translateSalaryEntryType(item.type)}: {formatMoney(item.amount)}</Text>)}
        </View> : null}

      </ScrollView> : null}
    </ResponsiveDrawerModal>

    <SalaryEntryDrawer visible={Boolean(entryRequest)} storeId={storeId} period={period} employeeId={entryRequest?.employeeId ?? ''} kind={entryRequest?.kind ?? 'advances'} entry={entryRequest?.entry ?? null} onClose={() => setEntryRequest(null)} onAfterClose={() => { setEntryRequest(null); reload(); if (pendingToast) { setToast(pendingToast); setPendingToast(''); } }} onSaved={(message) => { setPendingToast(message); setEntryRequest(null); }} />
    <ConfirmDrawer visible={Boolean(deleteRequest)} title={t('franchiseSalaryDeleteTitle')} message={t('franchiseSalaryDeleteConfirm', { entry: deleteRequest ? translateSalaryEntryType(deleteRequest.entry.type) : '' })} confirmLabel={t('adminDelete')} busy={busyDelete} error={deleteError} onDismissError={() => setDeleteError(null)} onAfterClose={() => { if (pendingToast) { setToast(pendingToast); setPendingToast(''); } }} onClose={() => { setDeleteRequest(null); setDeleteError(null); }} onConfirm={removeEntry} />
    {toast && !entryRequest && !deleteRequest ? <AppToast message={toast} tone="success" onDismiss={() => setToast(null)} /> : null}
  </View>;
}
