import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { apiRequest } from '../../../api/auth';
import { AdminFormField } from '../../../components/AdminFormField';
import { AppLoader } from '../../../components/AppLoader';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { X } from '../../../icons';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { businessDate } from '../../../utils/businessDate';
import { formatMoney } from '../DashboardCharts';
import type { Employee } from './useFranchiseEmployees';

interface Props {
  visible: boolean;
  employee: Employee | null;
  mode?: 'hike' | 'promotion';
  positions?: string[];
  storeId: string;
  onClose: () => void;
  onAfterClose: () => void;
  onSaved: (message: string) => void;
}

export function SalaryHikeDrawer({ visible, employee, storeId, mode = 'hike', positions = [], onClose, onAfterClose, onSaved }: Props) {
  const [salary, setSalary] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(businessDate);
  const [position, setPosition] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!visible) return;
    setSalary('');
    setEffectiveFrom(businessDate());
    setPosition(positions.find((item) => item !== employee?.position) ?? '');
    setError('');
  }, [visible, employee]);
  const save = async () => {
    if (!employee || busy) return;
    const amount = Number(salary);
    if (!salary.trim() || !Number.isFinite(amount) || amount <= (employee.latestSalary ?? employee.salary ?? 0) || !effectiveFrom || (mode === 'promotion' && (!position || position === employee.position))) {
      setError(t('franchiseEmployeesHikeInvalid')); return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await apiRequest(`/users/${encodeURIComponent(employee._id)}/salary-hikes?storeId=${encodeURIComponent(storeId)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ salary: amount, effectiveFrom, ...(mode === 'promotion' ? { position } : {}) }),
      });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? t('adminSaveFailed'));
      onSaved(data.message ?? t(mode === 'promotion' ? 'franchiseEmployeesPromotionSaved' : 'franchiseEmployeesHikeSaved'));
      onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : t('adminNetworkError')); }
    finally { setBusy(false); }
  };
  return <ResponsiveDrawerModal visible={visible} closeLabel={t('adminCloseMenu')} onClose={() => { if (!busy) onClose(); }} onAfterClose={onAfterClose}>
    <View style={styles.drawerContent}>
      <View style={styles.drawerHeading}><Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t(mode === 'promotion' ? 'franchiseEmployeesPromotion' : 'franchiseEmployeesSalaryHike')}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} disabled={busy} onPress={onClose} style={styles.userIconAction}><X size={18} color={theme.colors.muted} /></Pressable></View>
      <Text style={styles.sectionLabel}>{employee?.name}{employee?.employeeCode ? ` (${employee.employeeCode})` : ''}</Text>
      <Text style={styles.rowSubtext}>{t('franchiseEmployeesCurrentSalary')}: {formatMoney(employee?.salary ?? 0)}</Text>
      <Text style={styles.rowSubtext}>{t('franchiseEmployeesLatestSalary')}: {formatMoney(employee?.latestSalary ?? employee?.salary ?? 0)}</Text>
      {mode === 'promotion' ? <><Text style={styles.fieldLabel}>{t('franchiseEmployeesNewPosition')}</Text><View style={styles.typeOptions}>{positions.filter((item) => item !== employee?.position).map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: position === item }} disabled={busy} onPress={() => setPosition(item)} style={[styles.secondaryButton, styles.typeOption, position === item && styles.typeOptionSelected]}><Text style={styles.secondaryButtonText}>{item}</Text></Pressable>)}</View></> : null}
      <AdminFormField label={t('franchiseEmployeesNewSalary')} value={salary} placeholder="0.00" onChangeText={(value) => { setSalary(value.replace(/[^\d.]/g, '')); setError(''); }} keyboardType="decimal-pad" editable={!busy} />
      <AdminFormField date label={t('franchiseEmployeesHikeEffective')} value={effectiveFrom} minimumDate={employee?.dateOfJoining?.slice(0, 10)} onChangeText={setEffectiveFrom} editable={!busy} />
      {error ? <Text accessibilityRole="alert" style={styles.fieldError}>{error}</Text> : null}
      <View style={styles.modalActions}>
        <View style={styles.drawerActionSlot}><Pressable accessibilityRole="button" disabled={busy} onPress={onClose} style={[styles.secondaryButton, styles.drawerActionButton]}><Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text></Pressable></View>
        <View style={styles.drawerActionSlot}><Pressable accessibilityRole="button" disabled={busy} onPress={save} style={[styles.primaryButton, styles.drawerActionButton]}>{busy ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t('adminSave')}</Text>}</Pressable></View>
      </View>
    </View>
  </ResponsiveDrawerModal>;
}