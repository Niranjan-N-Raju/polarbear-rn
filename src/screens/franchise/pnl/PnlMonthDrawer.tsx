import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { X } from '../../../icons';
import { apiRequest } from '../../../api/auth';
import { AdminFormField } from '../../../components/AdminFormField';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { formatMoney } from '../DashboardCharts';
import type { PnlMonth } from './types';
import { pnlAllInputKeys, pnlCostOfGoodsKeys, pnlExpenseKeys, pnlFieldGroups, pnlRentKeys } from './pnlFieldGroups';
import { pnlStyles } from './pnlStyles';

interface PnlMonthDrawerProps {
  visible: boolean;
  storeId: string;
  month: PnlMonth;
  onClose: () => void;
  onAfterClose: () => void;
  onSaved: (message: string) => void;
}

const specialFields = [
  { key: 'netSales', label: 'franchisePnlNetSales' },
  { key: 'nob', label: 'franchisePnlNumberOfBills' },
  { key: 'food', label: 'franchisePnlFood' },
  { key: 'packaging', label: 'franchisePnlPackaging' },
  { key: 'houseKeeping', label: 'franchisePnlHouseKeeping' },
  { key: 'localPurchase', label: 'franchisePnlLocalPurchase' },
  { key: 'wastage', label: 'franchisePnlWastage' },
  { key: 'swiggyFee', label: 'franchisePnlSwiggyCommission' },
  { key: 'amazonFee', label: 'franchisePnlAmazonCommission' },
  { key: 'dotPeFee', label: 'franchisePnlDotPeCommission' },
  { key: 'zomatoFee', label: 'franchisePnlZomatoCommission' },
  { key: 'rent', label: 'franchisePnlRent' },
  { key: 'rentStaffRoom', label: 'franchisePnlStaffRoomRent' },
  { key: 'electricityCharges', label: 'franchisePnlElectricityCharges' },
] as const;

const costOfGoods = new Set(pnlCostOfGoodsKeys);
const rentKeys = new Set(pnlRentKeys);

function amount(values: Record<string, string>, key: string) {
  const parsed = Number.parseFloat(values[key] ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return formatMoney(value);
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function PnlMonthDrawer({ visible, storeId, month, onClose, onAfterClose, onSaved }: PnlMonthDrawerProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'error' | 'success'>('error');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Saving only touches keys that were loaded (or prefilled) or edited, so a partial load never zeroes server data.
  const touchedKeys = useRef(new Set<string>());

  useEffect(() => {
    if (!visible) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    setValues({});
    touchedKeys.current = new Set();
    setToast(null);
    const query = new URLSearchParams({ storeId, period: month.period });
    apiRequest(`/pnl/inputs?${query.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as { input?: { values?: Record<string, number> } | null; message?: string };
        if (!response.ok) throw new Error(data.message || t('franchisePnlLoadInputsFailed'));
        const nextValues: Record<string, string> = {};
        for (const [key, value] of Object.entries(data.input?.values ?? {})) nextValues[key] = value ? String(value) : '';
        if (nextValues.netSales === undefined) nextValues.netSales = String(Math.round((month.revenue || 0) * 0.95 * 100) / 100);
        if (nextValues.swiggyFee === undefined) nextValues.swiggyFee = String(Math.round((month.swiggyRevenue || 0) * 0.185 * 100) / 100);
        if (nextValues.zomatoFee === undefined) nextValues.zomatoFee = String(Math.round((month.zomatoRevenue || 0) * 0.18 * 100) / 100);
        if (controller.signal.aborted) return;
        touchedKeys.current = new Set(Object.keys(nextValues));
        setValues(nextValues);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : t('franchisePnlLoadInputsFailed'));
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [visible, storeId, month, reloadKey]);

  const get = (key: string) => values[key] ?? '';
  const update = (key: string, value: string) => {
    touchedKeys.current.add(key);
    setValues((current) => ({
      ...current,
      [key]: value.replace(/[^\d.]/g, ''),
    }));
  };
  const grossProfit = amount(values, 'netSales') - pnlCostOfGoodsKeys.reduce((sum, key) => sum + amount(values, key), 0);
  const actualFoodCost = amount(values, 'food') + amount(values, 'localPurchase') + amount(values, 'packaging');
  const foodCostPercent = amount(values, 'netSales') > 0 ? actualFoodCost / amount(values, 'netSales') * 100 : 0;
  const deliveryFees = amount(values, 'swiggyFee') + amount(values, 'amazonFee') + amount(values, 'dotPeFee') + amount(values, 'zomatoFee');
  const rentExpenses = pnlRentKeys.reduce((sum, key) => sum + amount(values, key), 0);
  const otherExpenses = pnlExpenseKeys.reduce((sum, key) => sum + (
    key === 'staffSalary' || costOfGoods.has(key) || rentKeys.has(key) ? 0 : amount(values, key)
  ), 0);
  const payroll = amount(values, 'staffSalary') || month.payroll;
  const totalExpenses = rentExpenses + otherExpenses + payroll;
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = amount(values, 'netSales') > 0 ? netProfit / amount(values, 'netSales') * 100 : 0;

  const groupedSections = pnlFieldGroups;

  async function save() {
    if (saving || loading || loadError) return;
    setSaving(true);
    setToast(null);
    const payload: Record<string, number> = {};
    for (const key of pnlAllInputKeys) {
      if (touchedKeys.current.has(key)) payload[key] = amount(values, key);
    }
    try {
      const response = await apiRequest('/pnl/inputs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, period: month.period, values: payload }),
      });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(data.message || t('franchisePnlSaveInputsFailed'));
      onSaved(data.message || t('franchisePnlInputsSaved'));
      onClose();
    } catch (error) {
      setToast(error instanceof Error ? error.message : t('franchisePnlSaveInputsFailed'));
      setToastTone('error');
    } finally {
      setSaving(false);
    }
  }

  const row = (labelKey: Parameters<typeof t>[0], value: string, strong = false) => (
    <View key={labelKey} style={pnlStyles.row}>
      <Text style={[pnlStyles.rowLabel, strong && pnlStyles.rowLabelStrong]}>{t(labelKey)}</Text>
      <Text style={pnlStyles.rowValue}>{value}</Text>
    </View>
  );
  const summary = (titleKey: Parameters<typeof t>[0], children: React.ReactNode) => (
    <View key={titleKey} style={pnlStyles.section}>
      <Text style={pnlStyles.sectionTitle}>{t(titleKey)}</Text>
      <View style={pnlStyles.sectionCard}>{children}</View>
    </View>
  );
  const input = (key: string, label: Parameters<typeof t>[0]) => (
    <AdminFormField
      key={key}
      label={t(label)}
      placeholder="0"
      value={get(key)}
      onChangeText={(value) => update(key, value)}
      keyboardType="decimal-pad"
    />
  );

  return (
    <ResponsiveDrawerModal
      visible={visible}
      closeLabel={t('adminCloseMenu')}
      onClose={onClose}
      onAfterClose={onAfterClose}
      overlay={visible && toast ? <AppToast message={toast} tone={toastTone} onDismiss={() => setToast(null)} /> : null}
    >
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeading}>
          <View style={pnlStyles.flex}>
            <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t('franchisePnlPeriod', { period: month.period })}</Text>
            <Text style={pnlStyles.headerRange}>{month.from} – {month.to}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.userIconAction}>
            <X color={theme.colors.muted} size={18} />
          </Pressable>
        </View>
        {loading ? <AppLoader /> : loadError ? (
          <AppErrorState message={loadError} onRetry={() => setReloadKey((key) => key + 1)} />
        ) : (
          <ScrollView style={styles.drawerFormScroll} contentContainerStyle={pnlStyles.scrollContent} keyboardShouldPersistTaps="handled">
            {summary('franchisePnlSales', <>
              {row('franchisePnlGrossSales', money(month.revenue))}
              {input('netSales', 'franchisePnlNetSales')}
              {input('nob', 'franchisePnlNumberOfBills')}
              {row('franchisePnlAveragePerCover', money(amount(values, 'nob') > 0 ? amount(values, 'netSales') / amount(values, 'nob') : 0))}
            </>)}
            {summary('franchisePnlConsumption', <>
              {input('food', 'franchisePnlFood')}
              {input('packaging', 'franchisePnlPackaging')}
              {input('houseKeeping', 'franchisePnlHouseKeeping')}
              {input('localPurchase', 'franchisePnlLocalPurchase')}
              {input('wastage', 'franchisePnlWastage')}
              {row('franchisePnlTotalConsumption', money(pnlCostOfGoodsKeys.reduce((sum, key) => sum + amount(values, key), 0)), true)}
            </>)}
            {summary('franchisePnlFoodCost', <>
              {row('franchisePnlActualFoodCost', money(actualFoodCost))}
              {row('franchisePnlFoodCostPercent', percent(foodCostPercent), true)}
              {row('franchisePnlGrossProfit', money(grossProfit), true)}
            </>)}
            {summary('franchisePnlOtherExpenses', <>
              {specialFields.slice(7, 11).map(({ key, label }) => input(key, label))}
              {row('franchisePnlDeliveryCharges', money(deliveryFees), true)}
            </>)}
            {summary('franchisePnlRentUtilities', <>
              {specialFields.slice(11).map(({ key, label }) => input(key, label))}
              {row('franchisePnlTotalRentUtilities', money(amount(values, 'rent') + amount(values, 'rentStaffRoom') + amount(values, 'electricityCharges')), true)}
            </>)}
            {groupedSections.map((group) => summary(group.title, <>
              {group.fields.map((field) => input(field.key, field.label))}
              {group.fields.length > 1 ? row('franchisePnlTotal', money(group.fields.reduce((sum, field) => sum + amount(values, field.key), 0)), true) : null}
            </>))}
            {summary('franchisePnlSummary', <>
              {row('franchisePnlGrossProfit', money(grossProfit), true)}
              {row('franchisePnlTotalExpenses', money(totalExpenses), true)}
              {row('franchisePnlNetProfit', money(netProfit), true)}
              {row('franchisePnlPercentOfProfit', percent(profitMargin), true)}
            </>)}
          </ScrollView>
        )}
        <View style={styles.modalActions}>
          <View style={styles.drawerActionSlot}>
            <Pressable accessibilityRole="button" onPress={onClose} style={[styles.secondaryButton, styles.drawerActionButton]}>
              <Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text>
            </Pressable>
          </View>
          <View style={styles.drawerActionSlot}>
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving || loading || Boolean(loadError) }} disabled={saving || loading || Boolean(loadError)} onPress={() => save()} style={[styles.primaryButton, styles.drawerActionButton]}>
              <Text style={styles.primaryButtonText}>{saving ? t('franchisePnlSaving') : t('adminSave')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ResponsiveDrawerModal>
  );
}
