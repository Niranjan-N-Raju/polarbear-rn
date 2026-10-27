import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Banknote, CalendarClock, FileText, Gift, IndianRupee, Plus, Wallet, X } from '../../../icons';
import { apiRequest } from '../../../api/auth';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { getAdminLayout } from '../../../utils/adminLayout';
import { formatMoney } from '../DashboardCharts';
import { ConfirmDrawer } from '../shared/ConfirmDrawer';
import { MonthStepper } from '../shared/MonthStepper';
import { SummaryCards } from '../../../components/SummaryCards';
import { SalaryEntryDrawer, translateSalaryEntryType, type SalaryEntry, type SalaryEntryKind } from './SalaryEntryDrawer';

interface Projection {
  employeeId: string; name: string; position: string; employmentType: string; salary: number;
  paidDays: number; absentDays: number; weekOffDays: number; missingDays: number; futureDays: number; eligibleDays: number;
  incentives: SalaryEntry[]; incentiveTotal: number; extraDays: SalaryEntry[]; extraDaysTotal: number;
  advances: SalaryEntry[]; advanceTotal: number; earnedSalary: number; projectedSalary: number;
}
interface SalaryData { store: { id: string; name: string }; cycle: { configured: boolean; type: 'calendar_month' | 'custom'; startDay: number; endDay: number; from: string; to: string; totalDays: number }; projections: Projection[] }
interface SlipData { periodLabel?: string; store?: { name?: string; address?: string; phone?: string }; employee?: Record<string, string>; attendance?: { totalWorkingDays?: number; presentDays?: number; weekOffDays?: number; absentDays?: number; extraDaysTotal?: number; extraDays?: Array<{ type: string; days: number }> }; earnings?: { basicSalary?: number; grossEarnings?: number }; deductions?: { advanceTotal?: number; totalDeductions?: number; advances?: Array<{ type: string; amount: number }> }; incentives?: Array<{ type: string; amount: number }>; incentiveTotal?: number; netPay?: number }

const todayPeriod = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; };
const entryKinds: SalaryEntryKind[] = ['advances', 'incentives', 'extra-days'];
const kindLabel: Record<SalaryEntryKind, Parameters<typeof t>[0]> = { advances: 'franchiseSalaryAdvance', incentives: 'franchiseSalaryIncentive', 'extra-days': 'franchiseSalaryExtraDay' };

export function FranchiseSalaryScreen({ storeId }: { storeId: string }) {
  const { width } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const [period, setPeriod] = useState(todayPeriod);
  const [data, setData] = useState<SalaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isCycleOpen, setIsCycleOpen] = useState(false);
  const [cycleType, setCycleType] = useState<'calendar_month' | 'custom'>('calendar_month');
  const [startDay, setStartDay] = useState('2');
  const [cycleError, setCycleError] = useState<string | null>(null);
  const [savingCycle, setSavingCycle] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Projection | null>(null);
  const [slip, setSlip] = useState<SlipData | null>(null);
  const [slipBusy, setSlipBusy] = useState(false);
  const [queuedDrawerAction, setQueuedDrawerAction] = useState<{ type: 'entry'; employeeId: string; kind: SalaryEntryKind; entry: SalaryEntry | null } | { type: 'delete'; employeeId: string; kind: SalaryEntryKind; entry: SalaryEntry } | null>(null);
  const [entryRequest, setEntryRequest] = useState<{ employeeId: string; kind: SalaryEntryKind; entry: SalaryEntry | null } | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<{ employeeId: string; kind: SalaryEntryKind; entry: SalaryEntry } | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingToast, setPendingToast] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const reload = useCallback(() => setReloadKey((current) => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setIsLoading(true); setError(null);
    const query = new URLSearchParams({ storeId, period });
    apiRequest(`/salary?${query.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json().catch(() => ({})) as SalaryData & { message?: string };
        if (!active) return;
        if (!response.ok) { setError(result.message ?? t('adminLoadFailed')); return; }
        setData(result); setCycleType(result.cycle.type); setStartDay(String(result.cycle.startDay));
      })
      .catch(() => { if (active) setError(t('adminNetworkError')); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [storeId, period, reloadKey]);

  const projections = useMemo(() => data?.projections ?? [], [data]);
  const totals = useMemo(() => projections.reduce((sum, item) => ({ base: sum.base + item.salary, earned: sum.earned + item.earnedSalary, projected: sum.projected + item.projectedSalary, incentives: sum.incentives + item.incentiveTotal }), { base: 0, earned: 0, projected: 0, incentives: 0 }), [projections]);
  const cards = [
    { label: t('franchiseSalaryBase'), value: formatMoney(totals.base), color: theme.colors.teal, Icon: IndianRupee },
    { label: t('franchiseSalaryEarned'), value: formatMoney(totals.earned), color: theme.colors.orange, Icon: Wallet },
    { label: t('franchiseSalaryProjected'), value: formatMoney(totals.projected), color: theme.colors.teal, Icon: Banknote },
    { label: t('franchiseSalaryIncentivesTotal'), value: formatMoney(totals.incentives), color: theme.colors.orange, Icon: Gift },
  ];
  const summaryRows = layout.desktopWeb ? [cards] : [cards.slice(0, 2), cards.slice(2)];

  const openSlip = async (employee: Projection) => {
    setSelectedEmployee(employee); setSlip(null); setSlipBusy(true);
    try {
      const query = new URLSearchParams({ storeId, employeeId: employee.employeeId, period });
      const response = await apiRequest(`/salary/slip?${query.toString()}`);
      const result = await response.json().catch(() => ({})) as SlipData & { message?: string };
      if (!response.ok) { setToast(result.message ?? t('franchiseSalarySlipFailed')); return; }
      setSlip(result);
    } catch { setToast(t('adminNetworkError')); }
    finally { setSlipBusy(false); }
  };
  const saveCycle = async () => {
    const day = Number(startDay);
    if (cycleType === 'custom' && (!Number.isInteger(day) || day < 2 || day > 28)) { setCycleError(t('franchiseSalaryCycleDayError')); return; }
    setSavingCycle(true); setCycleError(null);
    try {
      const response = await apiRequest('/salary', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeId, cycleType, ...(cycleType === 'custom' ? { startDay: day } : {}) }) });
      const result = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) { setCycleError(result.message ?? t('adminSaveFailed')); return; }
      setIsCycleOpen(false); setToast(result.message ?? t('franchiseSalaryCycleSaved')); reload();
    } catch { setCycleError(t('adminNetworkError')); }
    finally { setSavingCycle(false); }
  };
  const removeEntry = async () => {
    if (!deleteRequest) return;
    setBusyDelete(true);
    try {
      const response = await apiRequest("/" + deleteRequest.kind + "/" + encodeURIComponent(deleteRequest.entry.id) + "?storeId=" + encodeURIComponent(storeId), { method: "DELETE" });

      const result = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) { setDeleteError(result.message ?? t('adminSaveFailed')); return; }
      setDeleteRequest(null); setPendingToast(result.message ?? t('franchiseSalaryEntryRemoved')); setDeleteError(null); reload();
      setSelectedEmployee((current) => current?.employeeId === deleteRequest.employeeId ? null : current);
    } catch { setToast(t('adminNetworkError')); }
    finally { setBusyDelete(false); }
  };
  const findEntry = (employee: Projection, kind: SalaryEntryKind) => kind === 'advances' ? employee.advances : kind === 'incentives' ? employee.incentives : employee.extraDays;

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
        <View style={salaryStyles.metrics}>{entryKinds.map((kind) => <View key={kind} style={salaryStyles.metric}><Text style={salaryStyles.metricLabel}>{t(kindLabel[kind] )}</Text><Text style={salaryStyles.metricValue}>{kind === 'extra-days' ? `${employee.extraDaysTotal} ${t('franchiseSalaryDaysShort')}` : formatMoney(kind === 'advances' ? employee.advanceTotal : employee.incentiveTotal)}</Text></View>)}</View>
        <View style={salaryStyles.actions}>{entryKinds.map((kind) => <Pressable key={kind} accessibilityRole="button" accessibilityLabel={t('franchiseSalaryAddEntry', { entry: t(kindLabel[kind]) })} onPress={() => setEntryRequest({ employeeId: employee.employeeId, kind, entry: null })} style={salaryStyles.actionButton}><Plus color={theme.colors.orange} size={14} /><Text style={salaryStyles.actionText}>{t(kindLabel[kind] )}</Text></Pressable>)}<Pressable accessibilityRole="button" accessibilityLabel={t('franchiseSalaryDetails')} onPress={() => setSelectedEmployee(employee)} style={salaryStyles.actionButton}><FileText color={theme.colors.teal} size={15} /><Text style={salaryStyles.actionText}>{t('franchiseSalaryDetails')}</Text></Pressable></View>
      </View>)}</View>
    </ScrollView>}
    { !layout.desktopWeb ? <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseSalaryCycleSettings')} onPress={() => setIsCycleOpen(true)} style={styles.fab}><CalendarClock color={theme.colors.white} size={23} /></Pressable> : null }

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
        <View style={salaryStyles.detailEntries}>{entryKinds.map((kind) => <View key={kind}><Text style={salaryStyles.detailTitle}>{t(kindLabel[kind] )}</Text>{findEntry(selectedEmployee, kind).map((entry) => <View key={entry.id} style={salaryStyles.entryRow}><Text style={salaryStyles.entryText}>{translateSalaryEntryType(entry.type)}: {kind === 'extra-days' ? `${entry.days} ${t('franchiseSalaryDaysShort')}` : formatMoney(entry.amount ?? 0)}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('franchiseSalaryEditEntry', { entry: translateSalaryEntryType(entry.type) })} onPress={() => { setQueuedDrawerAction({ type: 'entry', employeeId: selectedEmployee.employeeId, kind, entry }); setSelectedEmployee(null); setSlip(null); }}><Text style={salaryStyles.link}>{t('adminEditUser')}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={t('franchiseSalaryDeleteEntry', { entry: translateSalaryEntryType(entry.type) })} onPress={() => { setQueuedDrawerAction({ type: 'delete', employeeId: selectedEmployee.employeeId, kind, entry }); setSelectedEmployee(null); setSlip(null); }}><Text style={salaryStyles.danger}>{t('adminDelete')}</Text></Pressable></View>)}</View>)}</View>
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

const salaryStyles = StyleSheet.create({
  flexOne: { flex: 1 },
  summary: { marginBottom: 12 }, employeeCard: { backgroundColor: theme.colors.white, borderColor: theme.colors.beige, borderWidth: 1, borderRadius: 14, padding: 15, marginBottom: 12, gap: 8 },
  employeeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, employeeName: { fontSize: 17, color: theme.colors.ink, fontWeight: '700' }, employeeMeta: { marginTop: 3, color: theme.colors.muted, fontSize: 12 }, netPay: { color: theme.colors.teal, fontWeight: '800', fontSize: 17 }, secondary: { color: theme.colors.muted, fontSize: 12 },
  metrics: { flexDirection: 'row', gap: 8, marginVertical: 4 }, metric: { flex: 1, borderRadius: 10, backgroundColor: theme.colors.paleBackground, padding: 9 }, metricLabel: { color: theme.colors.muted, fontSize: 10 }, metricValue: { color: theme.colors.ink, fontSize: 12, fontWeight: '700', marginTop: 4 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, actionButton: { flexDirection: 'row', gap: 4, alignItems: 'center', borderRadius: 8, backgroundColor: theme.colors.sand, paddingVertical: 7, paddingHorizontal: 9 }, actionText: { fontSize: 11, color: theme.colors.ink, fontWeight: '600' },
  modalLabel: { fontSize: 13, color: theme.colors.ink, fontWeight: '700', marginBottom: 8 }, cycleButtons: { flexDirection: 'row', gap: 10, marginBottom: 14 }, cycleButton: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: theme.colors.paleBackground, borderWidth: 1, borderColor: theme.colors.beige, alignItems: 'center' }, selectedCycle: { borderColor: theme.colors.teal, backgroundColor: theme.colors.ice }, cycleText: { color: theme.colors.ink, fontWeight: '600' },
  detailTitle: { color: theme.colors.ink, fontWeight: '700', fontSize: 15, marginTop: 12, marginBottom: 8 }, detailLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.beige }, detailEntries: { gap: 7 }, entryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 }, entryText: { flex: 1, color: theme.colors.ink, fontSize: 12 }, link: { color: theme.colors.teal, fontWeight: '700', fontSize: 12 }, danger: { color: theme.colors.error, fontWeight: '700', fontSize: 12 }, slipButton: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, slip: { marginTop: 12, padding: 12, backgroundColor: theme.colors.paleBackground, borderRadius: 10, gap: 6 }, slipNet: { color: theme.colors.teal, fontWeight: '800', marginTop: 3 },
});
