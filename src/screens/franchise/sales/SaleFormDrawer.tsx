import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Check, Pencil, Plus, Trash2, X } from '../../../icons';
import { apiRequest } from '../../../api/auth';
import { AdminFormField } from '../../../components/AdminFormField';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { formatMoney } from '../DashboardCharts';
import type { SaleRecord } from '../types';
import { salesStyles } from './salesStyles';
import { businessDate } from '../../../utils/businessDate';
import {
  calculateCash,
  emptySaleForm,
  isValidAmount,
  parseAmount,
  type SaleAmountField,
  type SaleForm,
  type SaleFormErrors,
  saleToForm,
  salePayload,
  sanitizeAmount,
  sumExpenses,
  validateSaleForm,
} from './utils';

interface SaleFormDrawerProps {
  visible: boolean;
  storeId: string;
  editingSale: SaleRecord | null;
  existingDates: string[];
  onClose: () => void;
  onAfterClose?: () => void;
  onSaved: (message: string) => void;
}

interface ExpenseDraft {
  index: number | null;
  name: string;
  amount: string;
}

const amountLabels: Record<SaleAmountField, Parameters<typeof t>[0]> = {
  totalSale: 'franchiseSaleTotal',
  swiggy: 'franchiseSaleSwiggy',
  zomato: 'franchiseSaleZomato',
  upi: 'franchiseSaleUpi',
  upiCharge: 'franchiseSaleUpiCharge',
};

export function SaleFormDrawer({
  visible,
  storeId,
  editingSale,
  existingDates,
  onClose,
  onAfterClose,
  onSaved,
}: SaleFormDrawerProps) {
  const [form, setForm] = useState<SaleForm>(() => emptySaleForm());
  const [errors, setErrors] = useState<SaleFormErrors>({});
  const [expenseDraft, setExpenseDraft] = useState<ExpenseDraft | null>(null);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [calendarRange, setCalendarRange] = useState<{ from: string; to: string } | null>(null);
  const [dateAvailability, setDateAvailability] = useState<Record<string, string[]>>({});
  const [datesLoading, setDatesLoading] = useState(false);
  const [dateLoadError, setDateLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'error' | 'success' } | null>(null);

  useEffect(() => {
    // Hidden drawers can stay mounted during dismissal; reset only when opened or given another sale.
    if (!visible) return;
    setForm(editingSale ? saleToForm(editingSale) : emptySaleForm());
    setErrors({});
    setExpenseDraft(null);
    setExpenseError(null);
    setToast(null);
    setCalendarRange(null);
    setDateAvailability({});
    setDatesLoading(false);
    setDateLoadError(null);
  }, [visible, editingSale]);

  const loadCalendarMonth = useCallback((from: string, to: string) => {
    setDatesLoading(true);
    setDateLoadError(null);
    setCalendarRange({ from, to });
  }, []);

  useEffect(() => {
    if (!visible || !calendarRange) return;
    const today = businessDate();
    if (calendarRange.from > today) { setDatesLoading(false); return; }
    const controller = new AbortController();
    const query = new URLSearchParams({ storeId, from: calendarRange.from, to: calendarRange.to > today ? today : calendarRange.to });
    apiRequest(`/sales?${query.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as { sales?: SaleRecord[]; message?: string };
        if (controller.signal.aborted) return;
        if (!response.ok) throw new Error(data.message ?? t('adminLoadFailed'));
        if (!Array.isArray(data.sales)) throw new Error(t('adminLoadFailed'));
        setDateAvailability((current) => ({ ...current, [calendarRange.from]: data.sales!.map((sale) => sale.date) }));
      })
      .catch(() => { if (!controller.signal.aborted) setDateLoadError(t('adminLoadFailed')); })
      .finally(() => { if (!controller.signal.aborted) setDatesLoading(false); });
    return () => controller.abort();
  }, [visible, calendarRange, storeId]);

  const cash = calculateCash(form);
  const totalExpenses = sumExpenses(form.expenses);
  const bankingCash = cash - totalExpenses;
  const dates = useMemo(() => [...new Set([...existingDates, ...Object.values(dateAvailability).flat()])], [existingDates, dateAvailability]);
  const disabledDates = useMemo(() => dates.filter((date) => date !== editingSale?.date), [dates, editingSale?.date]);

  const updateField = (field: 'date' | SaleAmountField, value: string) => {
    setForm((current) => ({ ...current, [field]: field === 'date' ? value : sanitizeAmount(value) }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const saveExpense = () => {
    if (!expenseDraft) return;
    const name = expenseDraft.name.trim();
    if (!name || !isValidAmount(expenseDraft.amount)) {
      setExpenseError(t('franchiseExpenseInvalid'));
      return;
    }
    const expense = { name, amount: parseAmount(expenseDraft.amount) };
    setForm((current) => ({
      ...current,
      expenses: expenseDraft.index === null
        ? [...current.expenses, expense]
        : current.expenses.map((item, index) => (index === expenseDraft.index ? expense : item)),
    }));
    setExpenseDraft(null);
    setExpenseError(null);
  };

  const removeExpense = (removeIndex: number) => {
    setForm((current) => ({ ...current, expenses: current.expenses.filter((_, index) => index !== removeIndex) }));
    if (expenseDraft?.index === removeIndex) setExpenseDraft(null);
  };

  const save = async () => {
    if (saving || datesLoading || dateLoadError) return;
    const nextErrors = validateSaleForm(form, dates, editingSale?.date ?? null);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSaving(true);
    try {
      const response = await apiRequest(editingSale ? `/sales/${encodeURIComponent(editingSale._id)}` : '/sales', {
        method: editingSale ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salePayload(storeId, form)),
      });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) {
        if (response.status === 409) setErrors({ date: t('franchiseSaleDuplicateDate') });
        setToast({ message: data.message || t('adminSaveFailed'), tone: 'error' });
        return;
      }
      const message = data.message || t('franchiseSaleSaved');
      onSaved(message);
    } catch {
      setToast({ message: t('adminNetworkError'), tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const amountField = (field: SaleAmountField, containerStyle?: object) => (
    <AdminFormField
      key={field}
      label={t(amountLabels[field])}
      placeholder="0"
      value={form[field]}
      onChangeText={(value) => updateField(field, value)}
      keyboardType="decimal-pad"
      error={errors[field]}
      containerStyle={containerStyle}
    />
  );

  return (
    <ResponsiveDrawerModal
      visible={visible}
      closeLabel={t('adminCloseMenu')}
      onClose={onClose}
      onAfterClose={onAfterClose}
      overlay={visible && toast ? <AppToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} /> : null}
    >
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeading}>
          <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>
            {t(editingSale ? 'franchiseEditSaleTitle' : 'franchiseAddSale')}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.userIconAction}>
            <X color={theme.colors.muted} size={18} />
          </Pressable>
        </View>
        <ScrollView
          style={styles.drawerFormScroll}
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <AdminFormField
            date
            label={t('franchiseSaleDate')}
            placeholder={t('franchiseDatePlaceholder')}
            value={form.date}
            onChangeText={(value) => updateField('date', value)}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            maximumDate={businessDate()}
            disabledDates={disabledDates}
            calendarLoading={datesLoading}
            calendarError={dateLoadError}
            onMonthChange={loadCalendarMonth}
            error={errors.date ?? dateLoadError ?? undefined}
          />
          {amountField('totalSale')}
          <View style={salesStyles.formRow}>
            {amountField('swiggy', salesStyles.formRowItem)}
            {amountField('zomato', salesStyles.formRowItem)}
          </View>
          <View style={salesStyles.formRow}>
            {amountField('upi', salesStyles.formRowItem)}
            {amountField('upiCharge', salesStyles.formRowItem)}
          </View>
          <View style={salesStyles.readOnlyField}>
            <Text style={salesStyles.readOnlyLabel}>{t('franchiseSaleCashAuto')}</Text>
            <Text style={[salesStyles.readOnlyValue, cash < 0 && salesStyles.negativeValue]}>{formatMoney(cash)}</Text>
          </View>

          <View style={salesStyles.expenseHeader}>
            <Text style={styles.sectionLabel}>{t('franchiseSaleExpenses')}</Text>
            {!expenseDraft ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('franchiseAddExpense')}
                onPress={() => { setExpenseDraft({ index: null, name: '', amount: '' }); setExpenseError(null); }}
                style={salesStyles.addExpenseButton}
              >
                <Plus color={theme.colors.teal} size={14} />
                <Text style={salesStyles.addExpenseText}>{t('franchiseAddExpense')}</Text>
              </Pressable>
            ) : null}
          </View>
          {form.expenses.length === 0 && !expenseDraft ? (
            <Text style={salesStyles.emptyExpenses}>{t('franchiseSaleNoExpenses')}</Text>
          ) : null}
          {form.expenses.map((expense, index) => (
            expenseDraft?.index === index ? null : (
              <View key={`${expense.name}-${index}`} style={salesStyles.expenseRow}>
                <Text numberOfLines={1} style={salesStyles.expenseName}>{expense.name}</Text>
                <Text style={salesStyles.expenseAmount}>{formatMoney(expense.amount)}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('franchiseEditExpense', { name: expense.name })}
                  onPress={() => { setExpenseDraft({ index, name: expense.name, amount: String(expense.amount) }); setExpenseError(null); }}
                  style={salesStyles.expenseIconButton}
                >
                  <Pencil color={theme.colors.teal} size={14} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('franchiseDeleteExpense', { name: expense.name })}
                  onPress={() => removeExpense(index)}
                  style={salesStyles.expenseIconButton}
                >
                  <Trash2 color={theme.colors.error} size={14} />
                </Pressable>
              </View>
            )
          ))}
          {expenseDraft ? (
            <View style={salesStyles.expenseEditor}>
              <View style={salesStyles.formRow}>
                <TextInput
                  accessibilityLabel={t('franchiseExpenseName')}
                  placeholder={t('franchiseExpenseName')}
                  placeholderTextColor={theme.colors.muted}
                  value={expenseDraft.name}
                  onChangeText={(name) => setExpenseDraft((current) => current && { ...current, name })}
                  style={[styles.fieldInput, salesStyles.formRowItem]}
                />
                <TextInput
                  accessibilityLabel={t('franchiseExpenseAmount')}
                  placeholder={t('franchiseExpenseAmount')}
                  placeholderTextColor={theme.colors.muted}
                  keyboardType="decimal-pad"
                  value={expenseDraft.amount}
                  onChangeText={(amount) => setExpenseDraft((current) => current && { ...current, amount: sanitizeAmount(amount) })}
                  style={[styles.fieldInput, salesStyles.formRowItem]}
                />
              </View>
              {expenseError ? <Text style={salesStyles.dateError}>{expenseError}</Text> : null}
              <View style={salesStyles.expenseEditorActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('adminCancel')}
                  onPress={() => { setExpenseDraft(null); setExpenseError(null); }}
                  style={[styles.secondaryButton, salesStyles.smallButton]}
                >
                  <X color={theme.colors.muted} size={14} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('franchiseSaveExpense')}
                  onPress={saveExpense}
                  style={[styles.primaryButton, salesStyles.smallButton]}
                >
                  <Check color={theme.colors.white} size={14} />
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={salesStyles.totalsBlock}>
            <View style={salesStyles.totalsRow}>
              <Text style={salesStyles.totalsLabel}>{t('franchiseTotalExpenses')}</Text>
              <Text style={salesStyles.totalsValue}>{formatMoney(totalExpenses)}</Text>
            </View>
            <View style={salesStyles.totalsRow}>
              <Text style={salesStyles.totalsLabel}>{t('franchiseSaleBankingCash')}</Text>
              <Text style={[salesStyles.totalsValue, bankingCash < 0 && salesStyles.negativeValue]}>{formatMoney(bankingCash)}</Text>
            </View>
          </View>
        </ScrollView>
        <View style={[salesStyles.formActions, Platform.OS === 'web' && salesStyles.formActionsWeb]}>
          <View style={[styles.modalActions, Platform.OS === 'web' && salesStyles.formActionsRowWeb]}>
            <View style={styles.drawerActionSlot}>
              <Pressable accessibilityRole="button" onPress={onClose} style={[styles.secondaryButton, styles.drawerActionButton]}>
                <Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text>
              </Pressable>
            </View>
            <View style={styles.drawerActionSlot}>
              <Pressable
                accessibilityRole="button"
                disabled={saving || datesLoading || Boolean(dateLoadError)}
                onPress={() => void save()}
                style={[styles.primaryButton, styles.drawerActionButton]}
              >
                {saving
                  ? <AppLoader variant="inline" color={theme.colors.white} />
                  : <Text style={styles.primaryButtonText}>{t(editingSale ? 'adminSaveChanges' : 'franchiseSaveSale')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </ResponsiveDrawerModal>
  );
}
