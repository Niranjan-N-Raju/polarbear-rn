import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { apiRequest } from '../../../api/auth';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { Gift, Plus } from '../../../icons';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { formatMoney } from '../DashboardCharts';
import { SalaryHikeDrawer } from '../employees/SalaryHikeDrawer';
import type { Employee } from '../employees/useFranchiseEmployees';
import { franchiseStyles } from '../franchiseStyles';

export function SalaryHikesScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [changeMode, setChangeMode] = useState<'hike' | 'promotion'>('hike');
  const [positions, setPositions] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [toast, setToast] = useState('');

  const load = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError('');
      try {
        const query = new URLSearchParams({
          status: 'active',
          limit: '500',
        });
        const [response, positionsResponse] = await Promise.all([
          apiRequest(`/users?${query}`, { signal }),
          apiRequest('/stores/positions', { signal }),
        ]);
        const data = (await response.json().catch(() => ({}))) as {
          users?: Employee[];
          message?: string;
        };
        const positionsData = (await positionsResponse
          .json()
          .catch(() => ({}))) as { positions?: string[] };
        if (signal.aborted) return;
        if (!response.ok) throw new Error(data.message ?? t('adminLoadFailed'));
        setEmployees(data.users ?? []);
        if (!positionsResponse.ok) throw new Error(t('adminLoadFailed'));
        setPositions(positionsData.positions ?? []);
      } catch (reason) {
        if (!signal.aborted)
          setError(
            reason instanceof Error ? reason.message : t('adminNetworkError'),
          );
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  const visibleEmployees = employees
    .filter(employee => employee.isActive !== false)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <View style={styles.screen}>
      <View style={styles.screenHeader}>
        <View style={styles.screenHeaderCopy}>
          <View style={styles.screenTitleRow}>
            <Gift color={theme.colors.teal} size={20} />
            <Text style={[styles.screenTitle, styles.screenTitleInline]}>
              {t('franchiseSalaryHikesPromotions')}
            </Text>
          </View>
          <Text style={styles.screenDescription}>
            {t('franchiseSalaryDescription')}
          </Text>
        </View>
      </View>
      {loading && employees.length === 0 ? (
        <AppLoader />
      ) : error && employees.length === 0 ? (
        <AppErrorState
          message={error}
          onRetry={() => setReloadKey(key => key + 1)}
        />
      ) : (
        <ScrollView
          style={[styles.list, styles.storeListFabViewport]}
          contentContainerStyle={[styles.listContent, styles.storeListWithFab]}
        >
          {loading ? <AppLoader variant="inline" /> : null}
          {error ? (
            <Text accessibilityRole="alert" style={franchiseStyles.error}>
              {error}
            </Text>
          ) : null}
          {visibleEmployees.length === 0 ? (
            <Text style={styles.stateMessage}>
              {t('franchiseSalaryNoEmployeesForHikes')}
            </Text>
          ) : null}
          <View style={styles.storeGrid}>
            {visibleEmployees.map(employee => (
              <View key={employee._id} style={styles.storeCard}>
                <View style={styles.storeCardHeader}>
                  <View style={styles.storeIconTile}>
                    <Gift color={theme.colors.teal} size={18} />
                  </View>
                  <View style={styles.storeCardBody}>
                    <Text style={styles.userCardName}>
                      {employee.name}
                      {employee.employeeCode
                        ? ` (${employee.employeeCode})`
                        : ''}
                    </Text>
                    <Text style={styles.rowSubtext}>
                      {employee.position || t('franchiseEmployeesPosition')}
                    </Text>
                  </View>
                </View>
                <View style={styles.storeCardBody}>
                  <Text style={styles.rowSubtext}>
                    {t('franchiseEmployeesCurrentSalary')}:{' '}
                    {formatMoney(employee.salary ?? 0)}
                  </Text>
                  <Text style={styles.rowSubtext}>
                    {t('franchiseEmployeesLatestSalary')}:{' '}
                    {formatMoney(employee.latestSalary ?? employee.salary ?? 0)}
                  </Text>
                </View>
                <View style={styles.storeCardActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setChangeMode('hike');
                      setSelectedEmployee(employee);
                    }}
                    style={styles.storeCardAction}
                  >
                    <Plus color={theme.colors.teal} size={15} />
                    <Text style={styles.storeEditActionText}>
                      {t('franchiseEmployeesSalaryHike')}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setChangeMode('promotion');
                      setSelectedEmployee(employee);
                    }}
                    style={styles.storeCardAction}
                  >
                    <Plus color={theme.colors.orange} size={15} />
                    <Text
                      style={[
                        styles.storeEditActionText,
                        { color: theme.colors.orange },
                      ]}
                    >
                      {t('franchiseEmployeesPromotion')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      <SalaryHikeDrawer
        visible={Boolean(selectedEmployee)}
        employee={selectedEmployee}
        mode={changeMode}
        positions={positions}
        onClose={() => setSelectedEmployee(null)}
        onAfterClose={() => {
          if (selectedEmployee) setReloadKey(key => key + 1);
        }}
        onSaved={setToast}
      />
      {toast ? (
        <AppToast
          message={toast}
          tone="success"
          onDismiss={() => setToast('')}
        />
      ) : null}
    </View>
  );
}
