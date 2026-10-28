import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { X } from '../../../icons';
import { apiRequest } from '../../../api/auth';
import { AdminFormField } from '../../../components/AdminFormField';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { validDateRange } from '../dashboardDates';
import type { WithdrawalRecord } from './FranchiseWithdrawalsScreen';
import { withdrawalStyles } from './withdrawalStyles';
import { businessDate } from '../../../utils/businessDate';

interface WithdrawalFormDrawerProps {
  visible: boolean;
  storeId: string;
  editingRecord: WithdrawalRecord | null;
  onClose: () => void;
  onAfterClose?: () => void;
  onSaved: (message: string) => void;
}

type EntryType = WithdrawalRecord['type'];

export function WithdrawalFormDrawer({ visible, storeId, editingRecord, onClose, onAfterClose, onSaved }: WithdrawalFormDrawerProps) {
  const [date, setDate] = useState(businessDate());
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<EntryType>('withdrawal');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ date?: string; amount?: string }>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setDate(editingRecord?.date ?? businessDate());
    setAmount(editingRecord ? String(editingRecord.amount) : '');
    setType(editingRecord?.type ?? 'withdrawal');
    setReason(editingRecord?.reason ?? '');
    setErrors({});
    setToast(null);
  }, [visible, editingRecord]);

  const save = async () => {
    if (saving) return;
    const nextErrors: { date?: string; amount?: string } = {};
    if (!validDateRange(date, date) || date > businessDate()) nextErrors.date = t('franchiseWithdrawalsDateInvalid');
    const parsedAmount = Number(amount);
    if (!amount.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) nextErrors.amount = t('franchiseWithdrawalsAmountInvalid');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const query = new URLSearchParams({ storeId });
      const response = await apiRequest(
        editingRecord ? `/withdrawals/${encodeURIComponent(editingRecord.id)}?${query.toString()}` : `/withdrawals?${query.toString()}`,
        {
          method: editingRecord ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, amount: parsedAmount, type, reason: reason.trim() }),
        },
      );
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(data.message || t('franchiseWithdrawalsSaveFailed'));
      onSaved(data.message || t('franchiseWithdrawalsSaved'));
    } catch (saveFailure) {
      setToast(saveFailure instanceof Error ? saveFailure.message : t('adminNetworkError'));
    } finally {
      setSaving(false);
    }
  };

  const updateAmount = (value: string) => {
    setAmount(value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'));
    setErrors((current) => ({ ...current, amount: undefined }));
  };

  return (
    <ResponsiveDrawerModal
      visible={visible}
      closeLabel={t('adminCloseMenu')}
      onClose={onClose}
      onAfterClose={onAfterClose}
      overlay={visible && toast ? <AppToast message={toast} tone="error" onDismiss={() => setToast(null)} /> : null}
    >
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeading}>
          <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t(editingRecord ? 'franchiseWithdrawalsEditTitle' : 'franchiseWithdrawalsAdd')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.userIconAction}>
            <X color={theme.colors.muted} size={18} />
          </Pressable>
        </View>
        <ScrollView style={styles.drawerFormScroll} keyboardShouldPersistTaps="handled">
          <AdminFormField
            date
            maximumDate={businessDate()}
            label={t('franchiseWithdrawalsDate')}
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={(value) => { setDate(value); setErrors((current) => ({ ...current, date: undefined })); }}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            error={errors.date}
          />
          <Text style={styles.fieldLabel}>{t('franchiseWithdrawalsType')}</Text>
          <View style={withdrawalStyles.typeOptions}>
            {(['withdrawal', 'repayment'] as const).map((option) => {
              const selected = option === type;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setType(option)}
                  style={[withdrawalStyles.typeOption, selected && withdrawalStyles.typeOptionSelected]}
                >
                  <Text style={[withdrawalStyles.typeOptionText, selected && withdrawalStyles.typeOptionTextSelected]}>
                    {t(option === 'withdrawal' ? 'franchiseWithdrawalsWithdrawal' : 'franchiseWithdrawalsRepaymentType')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <AdminFormField
            label={t('franchiseWithdrawalsAmount')}
            placeholder="0.00"
            value={amount}
            onChangeText={updateAmount}
            keyboardType="decimal-pad"
            error={errors.amount}
          />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('franchiseWithdrawalsReason')}</Text>
            <TextInput
              value={reason}
              placeholder={t('franchiseWithdrawalsReasonPlaceholder')}
              onChangeText={setReason}
              maxLength={300}
              multiline
              style={[styles.fieldInput, styles.multilineField]}
            />
          </View>
          <Text style={withdrawalStyles.characterCount}>{t('franchiseWithdrawalsReasonCount', { count: reason.length })}</Text>
        </ScrollView>
        <View style={styles.modalActions}>
          <View style={styles.drawerActionSlot}>
            <Pressable accessibilityRole="button" onPress={onClose} style={[styles.secondaryButton, styles.drawerActionButton]}>
              <Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text>
            </Pressable>
          </View>
          <View style={styles.drawerActionSlot}>
            <Pressable accessibilityRole="button" disabled={saving} onPress={save} style={[styles.primaryButton, styles.drawerActionButton]}>
              {saving ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t('adminSave')}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </ResponsiveDrawerModal>
  );
}
