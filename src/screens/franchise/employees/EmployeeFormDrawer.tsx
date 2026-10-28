import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { X } from '../../../icons';
import { apiRequest } from '../../../api/auth';
import { AdminFormField } from '../../../components/AdminFormField';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t, type TranslationKey } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { employeeStyles } from './employeeStyles';

interface Employee {
  _id: string;
  name: string;
  phone?: string;
  position?: string;
  employmentType?: 'full_time' | 'part_time';
  dateOfJoining?: string;
  actualDob?: string;
  dobInRecords?: string;
  salary?: number | null;
  bankAccountNumber?: string;
  bankName?: string;
  bankIfsc?: string;
  bankBranch?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  aadharNumber?: string;
  panNumber?: string;
  aadharDocument?: { fileName: string };
  panDocument?: { fileName: string };
}
interface EmployeeFormDrawerProps {
  visible: boolean;
  storeId: string;
  employee: Employee | null;
  onClose: () => void;
  onAfterClose?: () => void;
  onSaved: (message: string) => void;
}

type Form = Record<'name' | 'phone' | 'position' | 'employmentType' | 'dateOfJoining' | 'actualDob' | 'dobInRecords' | 'salary' | 'bankAccountNumber' | 'bankName' | 'bankIfsc' | 'bankBranch' | 'emergencyContactName' | 'emergencyContactPhone' | 'emergencyContactRelationship' | 'aadharNumber' | 'panNumber', string>;
const emptyForm: Form = { name: '', phone: '', position: '', employmentType: '', dateOfJoining: '', actualDob: '', dobInRecords: '', salary: '', bankAccountNumber: '', bankName: '', bankIfsc: '', bankBranch: '', emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: '', aadharNumber: '', panNumber: '' };
function dateField(value?: string) { return value ? new Date(value).toISOString().slice(0, 10) : ''; }

export function EmployeeFormDrawer({ visible, storeId, employee, onClose, onAfterClose, onSaved }: EmployeeFormDrawerProps) {
  const [form, setForm] = useState<Form>(emptyForm);
  const [documents, setDocuments] = useState<{ aadhar: boolean; pan: boolean }>({ aadhar: false, pan: false });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Editing sends '' for empty fields, so never save over details that failed to load.
  const [loadFailed, setLoadFailed] = useState(false);
  const [section, setSection] = useState<'personal' | 'bank' | 'emergency' | 'documents'>('personal');

  useEffect(() => {
    if (!visible) return;
    setForm({ ...emptyForm, name: employee?.name ?? '', phone: employee?.phone ?? '', position: employee?.position ?? '', employmentType: employee?.employmentType ?? '', dateOfJoining: dateField(employee?.dateOfJoining), actualDob: dateField(employee?.actualDob), dobInRecords: dateField(employee?.dobInRecords), salary: employee?.salary == null ? '' : String(employee.salary), bankAccountNumber: employee?.bankAccountNumber ?? '', bankName: employee?.bankName ?? '', bankIfsc: employee?.bankIfsc ?? '', bankBranch: employee?.bankBranch ?? '', emergencyContactName: employee?.emergencyContactName ?? '', emergencyContactPhone: employee?.emergencyContactPhone ?? '', emergencyContactRelationship: employee?.emergencyContactRelationship ?? '', aadharNumber: employee?.aadharNumber ?? '', panNumber: employee?.panNumber ?? '' });
    setDocuments({ aadhar: Boolean(employee?.aadharDocument), pan: Boolean(employee?.panDocument) });
    setSection('personal');
    setError('');
    setLoadFailed(false);
    if (!employee) return;
    const controller = new AbortController();
    setLoading(true);
    apiRequest(`/users/${encodeURIComponent(employee._id)}?storeId=${encodeURIComponent(storeId)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as { user?: Employee; message?: string };
        if (!response.ok || !data.user) throw new Error(data.message ?? t('adminLoadFailed'));
        const details = data.user;
        setForm({ ...emptyForm, name: details.name ?? '', phone: details.phone ?? '', position: details.position ?? '', employmentType: details.employmentType ?? '', dateOfJoining: dateField(details.dateOfJoining), actualDob: dateField(details.actualDob), dobInRecords: dateField(details.dobInRecords), salary: details.salary == null ? '' : String(details.salary), bankAccountNumber: details.bankAccountNumber ?? '', bankName: details.bankName ?? '', bankIfsc: details.bankIfsc ?? '', bankBranch: details.bankBranch ?? '', emergencyContactName: details.emergencyContactName ?? '', emergencyContactPhone: details.emergencyContactPhone ?? '', emergencyContactRelationship: details.emergencyContactRelationship ?? '', aadharNumber: details.aadharNumber ?? '', panNumber: details.panNumber ?? '' });
        setDocuments({ aadhar: Boolean(details.aadharDocument), pan: Boolean(details.panDocument) });
      })
      .catch((failure) => {
        if (controller.signal.aborted) return;
        setLoadFailed(true);
        setError(failure instanceof Error ? failure.message : t('adminLoadFailed'));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [visible, employee, storeId]);

  const change = (key: keyof Form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = async () => {
    if (loading || loadFailed) return;
    if (!form.name.trim()) { setError(t('franchiseEmployeesNameRequired')); return; }
    if (form.phone && !/^\d{10}$/.test(form.phone.trim())) { setError(t('franchiseEmployeesPhoneInvalid')); return; }
    if (form.emergencyContactPhone && !/^\d{10}$/.test(form.emergencyContactPhone.trim())) { setError(t('franchiseEmployeesPhoneInvalid')); return; }
    const salaryText = form.salary.trim();
    const salary = salaryText ? Number(salaryText) : null;
    // Number('') / Number('abc') and web numeric inputs can yield NaN; never submit a non-finite salary.
    if (salary !== null && (!Number.isFinite(salary) || salary < 0)) { setError(t('franchiseEmployeesSalaryInvalid')); return; }
    setSaving(true);
    setError('');
    try {
      // On edit, a cleared optional field is sent as '' (backend stores '' for text and null for dates) and salary as null.
      const cleared = employee ? '' : undefined;
      const text = (value: string) => value.trim() || cleared;
      const values: Record<string, unknown> = { name: form.name.trim(), phone: text(form.phone), position: text(form.position), employmentType: form.employmentType || undefined, dateOfJoining: form.dateOfJoining || cleared, actualDob: form.actualDob || cleared, dobInRecords: form.dobInRecords || cleared, salary: salary ?? (employee ? null : undefined), bankAccountNumber: text(form.bankAccountNumber), bankName: text(form.bankName), bankIfsc: text(form.bankIfsc), bankBranch: text(form.bankBranch), emergencyContactName: text(form.emergencyContactName), emergencyContactPhone: text(form.emergencyContactPhone), emergencyContactRelationship: text(form.emergencyContactRelationship), aadharNumber: text(form.aadharNumber), panNumber: text(form.panNumber) };
      const url = employee ? `/users/${encodeURIComponent(employee._id)}?storeId=${encodeURIComponent(storeId)}` : `/users?storeId=${encodeURIComponent(storeId)}`;
      const response = await apiRequest(url, { method: employee ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(employee ? values : { ...values, storeId, role: 'employee', franchiseIds: [storeId] }) });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? t('franchiseEmployeesSaveFailed'));
      onSaved(data.message ?? t('franchiseEmployeesSaved'));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t('franchiseEmployeesSaveFailed'));
    } finally { setSaving(false); }
  };

  const field = (key: keyof Form, labelKey: string, keyboardType?: 'default' | 'phone-pad' | 'numeric' | 'numbers-and-punctuation') => (
    <AdminFormField date={key === 'dateOfJoining' || key === 'actualDob' || key === 'dobInRecords'} label={t(labelKey as TranslationKey)} value={form[key]} onChangeText={(value) => change(key, value)} keyboardType={keyboardType} autoCapitalize={key === 'bankIfsc' || key === 'panNumber' ? 'characters' : undefined} autoCorrect={false} />
  );

  return (
    <ResponsiveDrawerModal visible={visible} closeLabel={t('adminCloseMenu')} onClose={onClose} onAfterClose={onAfterClose} overlay={visible && error ? <AppToast message={error} tone="error" onDismiss={() => setError('')} /> : null}>
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeading}>
          <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t(employee ? 'franchiseEmployeesEdit' : 'franchiseEmployeesAdd')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.userIconAction}><X color={theme.colors.muted} size={18} /></Pressable>
        </View>
        <View style={styles.typeOptions}>
          {(['personal', 'bank', 'emergency', 'documents'] as const).map((key) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: section === key }} onPress={() => setSection(key)} style={[styles.secondaryButton, styles.typeOption, section === key && styles.typeOptionSelected]}><Text style={styles.secondaryButtonText}>{t(key === 'personal' ? 'franchiseEmployeesFormPersonal' : key === 'bank' ? 'franchiseEmployeesFormBank' : key === 'emergency' ? 'franchiseEmployeesFormEmergency' : 'franchiseEmployeesDocuments')}</Text></Pressable>)}
        </View>
        {loading ? <AppLoader /> : <ScrollView style={styles.drawerFormScroll} keyboardShouldPersistTaps="handled">
          {section === 'personal' ? <>
            {field('name', 'franchiseEmployeesName')}{field('phone', 'franchiseEmployeesPhone', 'phone-pad')}{field('position', 'franchiseEmployeesPosition')}
            <Text style={styles.fieldLabel}>{t('franchiseEmployeesType')}</Text><View style={styles.typeOptions}>{(['full_time', 'part_time'] as const).map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: form.employmentType === value }} onPress={() => change('employmentType', value)} style={[styles.secondaryButton, styles.typeOption, form.employmentType === value && styles.typeOptionSelected]}><Text style={styles.secondaryButtonText}>{t(value === 'full_time' ? 'franchiseEmployeesFullTime' : 'franchiseEmployeesPartTime')}</Text></Pressable>)}</View>
            {field('dateOfJoining', 'franchiseEmployeesJoined', 'numbers-and-punctuation')}{field('actualDob', 'franchiseEmployeesActualDob', 'numbers-and-punctuation')}{field('dobInRecords', 'franchiseEmployeesRecordDob', 'numbers-and-punctuation')}
          </> : null}
          {section === 'bank' ? <>{field('salary', 'franchiseEmployeesSalary', 'numeric')}{field('bankAccountNumber', 'franchiseEmployeesBankAccount')}{field('bankName', 'franchiseEmployeesBankName')}{field('bankIfsc', 'franchiseEmployeesBankIfsc')}{field('bankBranch', 'franchiseEmployeesBankBranch')}</> : null}
          {section === 'emergency' ? <>{field('emergencyContactName', 'franchiseEmployeesEmergencyName')}{field('emergencyContactPhone', 'franchiseEmployeesEmergencyPhone', 'phone-pad')}{field('emergencyContactRelationship', 'franchiseEmployeesEmergencyRelationship')}</> : null}
          {section === 'documents' ? <>
            {field('aadharNumber', 'franchiseEmployeesAadhar')}{field('panNumber', 'franchiseEmployeesPan')}
            {(['aadhar', 'pan'] as const).map((type) => <View key={type} style={employeeStyles.documentStatus}><Text style={employeeStyles.documentStatusLabel}>{t(type === 'aadhar' ? 'franchiseEmployeesAadhar' : 'franchiseEmployeesPan')}</Text><Text style={employeeStyles.documentStatusValue}>{t(documents[type] ? 'franchiseEmployeesUploaded' : 'franchiseEmployeesNotUploaded')}</Text></View>)}
            <Text style={styles.rowSubtext}>{t('franchiseEmployeesDocumentUploadGap')}</Text>
          </> : null}
        </ScrollView>}
        <View style={styles.modalActions}>
          <View style={styles.drawerActionSlot}><Pressable onPress={onClose} style={[styles.secondaryButton, styles.drawerActionButton]}><Text style={styles.secondaryButtonText}>{t('franchiseEmployeesCancel')}</Text></Pressable></View>
          <View style={styles.drawerActionSlot}><Pressable accessibilityRole="button" accessibilityState={{ disabled: saving || loading || loadFailed }} disabled={saving || loading || loadFailed} onPress={() => save()} style={[styles.primaryButton, styles.drawerActionButton]}>{saving ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t('franchiseEmployeesSave')}</Text>}</Pressable></View>
        </View>
      </View>
    </ResponsiveDrawerModal>
  );
}
