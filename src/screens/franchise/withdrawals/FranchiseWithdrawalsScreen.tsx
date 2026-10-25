import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, Scale, Trash2 } from '../../../icons';
import { apiRequest } from '../../../api/auth';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { getAdminLayout } from '../../../utils/adminLayout';
import { formatMoney } from '../DashboardCharts';
import { ConfirmDrawer } from '../shared/ConfirmDrawer';
import { MonthStepper } from '../shared/MonthStepper';
import { SummaryCards } from '../shared/SummaryCards';
import { currentMonthValue, formatShortDate, monthRange } from '../shared/months';
import { WithdrawalFormDrawer } from './WithdrawalFormDrawer';
import { withdrawalStyles } from './withdrawalStyles';

export interface WithdrawalRecord {
  id: string;
  date: string;
  amount: number;
  type: 'withdrawal' | 'repayment';
  reason: string;
}

interface WithdrawalResponse {
  withdrawals?: WithdrawalRecord[];
  totalWithdrawals?: number;
  totalRepayments?: number;
  message?: string;
}

export function FranchiseWithdrawalsScreen({ storeId }: { storeId: string }) {
  const { width } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const [month, setMonth] = useState(() => currentMonthValue());
  const range = useMemo(() => monthRange(month), [month]);
  const [records, setRecords] = useState<WithdrawalRecord[]>([]);
  const [allTimeWithdrawals, setAllTimeWithdrawals] = useState(0);
  const [allTimeRepayments, setAllTimeRepayments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [formVisible, setFormVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WithdrawalRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<WithdrawalRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingToast, setPendingToast] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);
    const query = new URLSearchParams({ storeId, from: range.from, to: range.to });
    apiRequest(`/withdrawals?${query.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as WithdrawalResponse;
        if (!active) return;
        if (!response.ok) {
          setError(data.message || t('adminLoadFailed'));
          return;
        }
        setRecords(data.withdrawals ?? []);
        setAllTimeWithdrawals(data.totalWithdrawals ?? 0);
        setAllTimeRepayments(data.totalRepayments ?? 0);
      })
      .catch(() => {
        if (active) setError(t('adminNetworkError'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [storeId, range, reloadKey]);

  const monthWithdrawals = records.filter((record) => record.type === 'withdrawal').reduce((sum, record) => sum + record.amount, 0);
  const monthRepayments = records.filter((record) => record.type === 'repayment').reduce((sum, record) => sum + record.amount, 0);
  const netOutstanding = monthWithdrawals - monthRepayments;
  const summaryCards = [
    { label: t('franchiseWithdrawalsMonthTotal'), value: formatMoney(monthWithdrawals), color: theme.colors.orange, Icon: ArrowUpRight },
    { label: t('franchiseWithdrawalsRepayments'), value: formatMoney(monthRepayments), color: theme.colors.teal, Icon: ArrowDownLeft },
    { label: t('franchiseWithdrawalsNet'), value: formatMoney(netOutstanding), color: netOutstanding > 0 ? theme.colors.orange : theme.colors.teal, Icon: Scale },
    { label: t('franchiseWithdrawalsAllTime'), value: formatMoney(allTimeWithdrawals), color: theme.colors.orange, Icon: ArrowUpRight },
    { label: t('franchiseWithdrawalsAllTimeRepayments'), value: formatMoney(allTimeRepayments), color: theme.colors.teal, Icon: ArrowDownLeft },
  ];

  const openCreate = () => {
    setEditingRecord(null);
    setFormVisible(true);
  };

  const openEdit = (record: WithdrawalRecord) => {
    setEditingRecord(record);
    setFormVisible(true);
  };

  const handleSaved = (message: string) => {
    setReloadKey((key) => key + 1);
    setPendingToast(message);
    setFormVisible(false);
  };

  const confirmDelete = async () => {
    if (!deleteRecord) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const query = new URLSearchParams({ storeId });
      const response = await apiRequest(`/withdrawals/${encodeURIComponent(deleteRecord.id)}?${query.toString()}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(data.message || t('franchiseWithdrawalsDeleteFailed'));
      setPendingToast(data.message || t('franchiseWithdrawalsRemoved'));
      setDeleteRecord(null);
      setReloadKey((key) => key + 1);
    } catch (deleteFailure) {
      setDeleteError(deleteFailure instanceof Error ? deleteFailure.message : t('adminNetworkError'));
    } finally {
      setDeleteBusy(false);
    }
  };

  const afterDrawerClose = () => {
    setEditingRecord(null);
    if (pendingToast) {
      setToast({ message: pendingToast, tone: 'success' });
      setPendingToast('');
    }
  };

  if (loading && records.length === 0 && !error) {
    return <View style={styles.screen}><AppLoader /></View>;
  }
  if (error && records.length === 0) {
    return <View style={styles.screen}><AppErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} /></View>;
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, layout.desktopWeb && styles.screenHeaderInline, layout.compactWeb && styles.screenHeaderStack]}>
        <View style={layout.isWeb ? styles.screenHeaderCopy : styles.screenHeaderCopyNative}>
          <Text style={[styles.screenTitle, styles.screenTitleInline]}>{t('franchiseWithdrawalsTitle')}</Text>
          <Text style={styles.screenDescription}>{t('franchiseWithdrawalsDescription')}</Text>
        </View>
        {layout.desktopWeb ? (
          <Pressable accessibilityRole="button" onPress={openCreate} style={[styles.primaryButton, styles.screenHeaderAction]}>
            <Text style={styles.primaryButtonText}>{t('franchiseWithdrawalsAdd')}</Text>
          </Pressable>
        ) : null}
      </View>

      <MonthStepper month={month} onChange={setMonth} maxMonth={currentMonthValue()} />

      <ScrollView
        style={[styles.list, !layout.desktopWeb && styles.storeListFabViewport]}
        contentContainerStyle={[styles.listContent, !layout.desktopWeb && styles.storeListWithFab]}
      >
        {loading ? <AppLoader variant="inline" /> : null}
        {error ? <Text accessibilityRole="alert" style={withdrawalStyles.errorMessage}>{error}</Text> : null}
        <SummaryCards cards={summaryCards} isWeb={layout.isWeb} perRow={layout.desktopWeb ? 5 : 2} />
        {records.length === 0 ? <Text style={styles.stateMessage}>{t('franchiseWithdrawalsEmpty')}</Text> : null}
        <View style={layout.isWeb ? styles.storeGrid : undefined}>
          {records.map((record) => (
            <View key={record.id} style={[styles.storeCard, withdrawalStyles.entryCard, layout.storeCardStyle ? styles[layout.storeCardStyle] : undefined]}>
              <View style={withdrawalStyles.entryHeader}>
                <View style={[withdrawalStyles.typeIcon, { backgroundColor: record.type === 'withdrawal' ? theme.colors.welcomeTint : theme.colors.ice }]}>
                  {record.type === 'withdrawal'
                    ? <ArrowUpRight color={theme.colors.orange} size={18} />
                    : <ArrowDownLeft color={theme.colors.teal} size={18} />}
                </View>
                <View style={withdrawalStyles.entryDetails}>
                  <View style={withdrawalStyles.entryTitleRow}>
                    <Text style={withdrawalStyles.entryAmount}>{formatMoney(record.amount)}</Text>
                    <View style={[withdrawalStyles.typeBadge, record.type === 'withdrawal' ? withdrawalStyles.withdrawalBadge : withdrawalStyles.repaymentBadge]}>
                      <Text style={[withdrawalStyles.typeBadgeText, { color: record.type === 'withdrawal' ? theme.colors.orange : theme.colors.teal }]}>
                        {t(record.type === 'withdrawal' ? 'franchiseWithdrawalsWithdrawal' : 'franchiseWithdrawalsRepaymentType')}
                      </Text>
                    </View>
                  </View>
                  <Text style={withdrawalStyles.entryDate}>{formatShortDate(record.date)}</Text>
                </View>
              </View>
              {record.reason ? <Text style={withdrawalStyles.reason}>{record.reason}</Text> : null}
              <View style={withdrawalStyles.actions}>
                <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseWithdrawalsEdit', { date: formatShortDate(record.date) })} onPress={() => openEdit(record)} style={withdrawalStyles.actionButton}>
                  <Pencil color={theme.colors.teal} size={15} />
                  <Text style={withdrawalStyles.editText}>{t('franchiseEdit')}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseWithdrawalsDelete', { date: formatShortDate(record.date) })} onPress={() => { setDeleteError(null); setDeleteRecord(record); }} style={withdrawalStyles.actionButton}>
                  <Trash2 color={theme.colors.error} size={15} />
                  <Text style={withdrawalStyles.deleteText}>{t('adminDelete')}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {!layout.desktopWeb ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseWithdrawalsAdd')} onPress={openCreate} style={styles.fab}>
          <Plus color={theme.colors.white} size={24} />
        </Pressable>
      ) : null}

      <WithdrawalFormDrawer
        visible={formVisible}
        storeId={storeId}
        editingRecord={editingRecord}
        onClose={() => setFormVisible(false)}
        onAfterClose={afterDrawerClose}
        onSaved={handleSaved}
      />
      <ConfirmDrawer
        visible={Boolean(deleteRecord)}
        title={t('franchiseWithdrawalsDeleteTitle')}
        message={t('franchiseWithdrawalsDeleteConfirm')}
        confirmLabel={t('adminDelete')}
        busy={deleteBusy}
        error={deleteError}
        onDismissError={() => setDeleteError(null)}
        onClose={() => setDeleteRecord(null)}
        onAfterClose={afterDrawerClose}
        onConfirm={confirmDelete}
      />
      {!formVisible && !deleteRecord && toast ? <AppToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} /> : null}
    </View>
  );
}
