import { Pressable,ScrollView,Text,View } from 'react-native';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { SummaryCards } from '../../../components/SummaryCards';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { ArrowDownLeft,ArrowUpRight,Pencil,Plus,Trash2 } from '../../../icons';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { formatMoney } from '../DashboardCharts';
import { ConfirmDrawer } from '../shared/ConfirmDrawer';
import { currentMonthValue,formatShortDate } from '../shared/months';
import { MonthStepper } from '../shared/MonthStepper';
import { useFranchiseWithdrawals } from './useFranchiseWithdrawals';
import { WithdrawalFormDrawer } from './WithdrawalFormDrawer';
import { withdrawalStyles } from './withdrawalStyles';
export { type WithdrawalRecord } from './useFranchiseWithdrawals';

export function FranchiseWithdrawalsScreen({ storeId }: { storeId: string }) {
const { layout, month, setMonth, records, loading, error, setReloadKey, formVisible, setFormVisible, editingRecord, deleteRecord, setDeleteRecord, deleteBusy, deleteError, setDeleteError, toast, setToast, summaryCards, openCreate, openEdit, handleSaved, confirmDelete, afterDrawerClose } = useFranchiseWithdrawals({ storeId });
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
