import { useEffect, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { apiRequest } from '../../../api/auth';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { ArrowDownLeft, ArrowUpRight, Scale } from '../../../icons';
import { getAdminLayout } from '../../../utils/adminLayout';
import { formatMoney } from '../DashboardCharts';
import { currentMonthValue, monthRange } from '../shared/months';
export interface WithdrawalRecord {
  id: string;
  date: string;
  amount: number;
  type: 'withdrawal' | 'repayment';
  reason: string;
}
export interface WithdrawalResponse {
  withdrawals?: WithdrawalRecord[];
  totalWithdrawals?: number;
  totalRepayments?: number;
  message?: string;
}

export function useFranchiseWithdrawals({ storeId }: { storeId: string; }) {
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
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error'; } | null>(null);
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
      const data = await response.json().catch(() => ({})) as { message?: string; };
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
  return {
    layout,
    month,
    setMonth,
    records,
    loading,
    error,
    setReloadKey,
    formVisible,
    setFormVisible,
    editingRecord,
    deleteRecord,
    setDeleteRecord,
    deleteBusy,
    deleteError,
    setDeleteError,
    toast,
    setToast,
    summaryCards,
    openCreate,
    openEdit,
    handleSaved,
    confirmDelete,
    afterDrawerClose,
  };
}
