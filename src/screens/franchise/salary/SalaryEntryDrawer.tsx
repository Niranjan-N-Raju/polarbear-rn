import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { X } from '../../../icons';
import { apiRequest } from '../../../api/auth';
import { AdminFormField } from '../../../components/AdminFormField';
import { AppLoader } from '../../../components/AppLoader';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';

export type SalaryEntryKind = 'advances' | 'incentives' | 'extra-days';
export interface SalaryEntry { id: string; employeeId: string; type: string; amount?: number; days?: number; paidEarly?: boolean }
interface Props { visible: boolean; storeId: string; period: string; employeeId: string; kind: SalaryEntryKind; entry: SalaryEntry | null; onClose: () => void; onAfterClose?: () => void; onSaved: (message: string) => void }
const options: Record<SalaryEntryKind, string[]> = {
  advances: ['Cash Advance', 'Emergency', 'Loan Repayment', 'Other'],
  incentives: ['Google Review', 'Sales', 'Attendance', 'Audit', 'Other'],
  'extra-days': ['Comp Off', 'Manual Correction', 'Bonus Day', 'Other'],
};
const optionLabelKey: Record<string, Parameters<typeof t>[0]> = {
  'Cash Advance': 'franchiseSalaryTypeCashAdvance', Emergency: 'franchiseSalaryTypeEmergency', 'Loan Repayment': 'franchiseSalaryTypeLoanRepayment',
  'Google Review': 'franchiseSalaryTypeGoogleReview', Sales: 'franchiseSalaryTypeSales', Attendance: 'franchiseSalaryTypeAttendance', Audit: 'franchiseSalaryTypeAudit',
  'Comp Off': 'franchiseSalaryTypeCompOff', 'Manual Correction': 'franchiseSalaryTypeManualCorrection', 'Bonus Day': 'franchiseSalaryTypeBonusDay', Other: 'franchiseSalaryTypeOther',
};
export const translateSalaryEntryType = (type: string) => (optionLabelKey[type] ? t(optionLabelKey[type]) : type);
const translationKey: Record<SalaryEntryKind, Parameters<typeof t>[0]> = { advances: 'franchiseSalaryAdvance', incentives: 'franchiseSalaryIncentive', 'extra-days': 'franchiseSalaryExtraDay' };

export function SalaryEntryDrawer({ visible, storeId, period, employeeId, kind, entry, onClose, onAfterClose, onSaved }: Props) {
  const [type, setType] = useState(options[kind][0]);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [customType, setCustomType] = useState('');
  const [busy, setBusy] = useState(false);
  const [paidEarly, setPaidEarly] = useState(false);
  useEffect(() => {
    if (!visible) return;
    setType(entry && options[kind].includes(entry.type) ? entry.type : entry ? 'Other' : options[kind][0]);
    setAmount(String(kind === 'extra-days' ? entry?.days ?? '' : entry?.amount ?? ''));
    setPaidEarly(entry?.paidEarly === true);
    setError(null); setCustomType(entry && !options[kind].includes(entry.type) ? entry.type : '');
  }, [visible, entry, kind]);
  const save = async () => {
    const parsed = Number(amount);
    const resolvedType = type === 'Other' ? customType.trim() : type.trim();
    if (!resolvedType || !Number.isFinite(parsed) || parsed < 0) { setError(t('franchiseSalaryEntryInvalid')); return; }
    setBusy(true);
    try {
      const payload: Record<string, unknown> = entry
        ? { storeId, type: resolvedType, [kind === 'extra-days' ? 'days' : 'amount']: parsed }
        : { storeId, employeeId, period, type: resolvedType, [kind === 'extra-days' ? 'days' : 'amount']: parsed };
      if (kind === 'incentives') payload.paidEarly = paidEarly;
      const response = await apiRequest(entry ? `/${kind}/${encodeURIComponent(entry.id)}` : `/${kind}`, { method: entry ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) { setError(result.message ?? t('adminSaveFailed')); return; }
      onSaved(result.message ?? t('franchiseSalarySaved'));
      onClose();
    } catch { setError(t('adminNetworkError')); }
    finally { setBusy(false); }
  };
  return <ResponsiveDrawerModal visible={visible} closeLabel={t('adminCloseMenu')} onClose={onClose} onAfterClose={onAfterClose} overlay={null}>
    <View style={styles.drawerContent}>
      <View style={styles.drawerHeading}><Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t(entry ? 'franchiseSalaryEditEntry' : 'franchiseSalaryAddEntry', { entry: t(translationKey[kind]) })}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.userIconAction}><X color={theme.colors.muted} size={18} /></Pressable></View>
      <ScrollView style={styles.drawerFormScroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.fieldLabel}>{t('franchiseSalaryEntryType')}</Text>
        <View style={salaryEntryStyles.options}>{options[kind].map((option) => <Pressable key={option} onPress={() => setType(option)} style={[salaryEntryStyles.option, type === option && salaryEntryStyles.selectedOption]}><Text style={{ color: theme.colors.ink }}>{t(optionLabelKey[option])}</Text></Pressable>)}</View>
        {type === 'Other' ? <AdminFormField label={t('franchiseSalaryCustomType')} value={customType} onChangeText={setCustomType} /> : null}
        <AdminFormField label={t((kind === 'extra-days' ? 'franchiseSalaryDays' : 'franchiseSalaryAmount') as Parameters<typeof t>[0])} placeholder="0" value={amount} onChangeText={(value) => { setAmount(value.replace(/[^\d.]/g, '')); setError(null); }} keyboardType="decimal-pad" error={error ?? undefined} />
        {kind === 'incentives' ? <View style={salaryEntryStyles.paymentRow}><Text style={styles.fieldLabel}>{t('franchiseSalaryPaidEarly')}</Text><Switch accessibilityLabel={t('franchiseSalaryPaidEarly')} value={paidEarly} onValueChange={setPaidEarly} disabled={busy} trackColor={{ true: theme.colors.teal }} /></View> : null}
      </ScrollView>
      <View style={styles.modalActions}><View style={styles.drawerActionSlot}><Pressable accessibilityRole="button" onPress={onClose} style={[styles.secondaryButton, styles.drawerActionButton]}><Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text></Pressable></View><View style={styles.drawerActionSlot}><Pressable accessibilityRole="button" disabled={busy} onPress={save} style={[styles.primaryButton, styles.drawerActionButton]}>{busy ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t(entry ? 'adminSave' : 'franchiseSalaryAddEntryAction')}</Text>}</Pressable></View></View>
    </View>
  </ResponsiveDrawerModal>;
}

const salaryEntryStyles = StyleSheet.create({
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  option: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, backgroundColor: theme.colors.paleBackground, borderWidth: 1, borderColor: theme.colors.beige },
  selectedOption: { backgroundColor: theme.colors.ice, borderColor: theme.colors.teal },
  paymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, gap: 12 },
});
