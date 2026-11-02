import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../config/theme';
import { getLocale, t } from '../../../i18n';
import { Archive, Pencil, RotateCcw } from '../../../icons';
import { formatMoney } from '../DashboardCharts';
import type { Employee } from './useFranchiseEmployees';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onArchive: (employee: Employee) => void;
  onRestore: (employee: Employee) => void;
}

function EmployeeAction({
  label,
  Icon,
  color,
  onPress,
}: {
  label: string;
  Icon: typeof Pencil;
  color: string;
  onPress: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => setShowTooltip(true)}
      onHoverOut={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      style={styles.action}
    >
      <Icon color={color} size={16} />
      {showTooltip ? (
        <View pointerEvents="none" style={styles.tooltip}>
          <Text style={styles.tooltipText}>{label}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function formatDate(value?: string, exitDate = false): string {
  if (!value) return '-';
  const date = new Date(value);
  if (exitDate) date.setUTCDate(date.getUTCDate() - 1);
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleDateString(getLocale(), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: exitDate ? 'Asia/Kolkata' : 'UTC',
      });
}

export function EmployeeTable({
  employees,
  onEdit,
  onArchive,
  onRestore,
}: EmployeeTableProps) {
  const showExitDate = employees.some(employee => employee.isActive === false);
  const columns = [
    { label: t('franchiseEmployeesName'), width: 250 },
    { label: t('franchiseEmployeesPhone'), width: 140 },
    { label: t('franchiseEmployeesPosition'), width: 140 },
    { label: t('franchiseEmployeesSalary'), width: 130 },
    { label: t('franchiseEmployeesJoined'), width: 130 },
    { label: t('franchiseEmployeesStatus'), width: 100 },
    ...(showExitDate
      ? [{ label: t('franchiseEmployeesExitDate'), width: 130 }]
      : []),
    { label: t('franchiseEmployeesActions'), width: 100 },
  ];
  const width = columns.reduce((sum, column) => sum + column.width, 0);

  return (
    <ScrollView
      horizontal
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      <View
        role="table"
        accessibilityLabel={t('franchiseEmployeesTitle')}
        style={[styles.table, { minWidth: width }]}
      >
        <View role="row" style={[styles.row, styles.header]}>
          {columns.map(column => (
            <Text
              key={column.label}
              role="columnheader"
              style={[styles.cell, styles.headerText, { width: column.width }]}
            >
              {column.label}
            </Text>
          ))}
        </View>
        {employees.map(employee => (
          <View key={employee._id} role="row" style={styles.row}>
            <Text
              role="cell"
              style={[styles.cell, styles.name, { width: 250 }]}
            >
              {employee.name}
              {employee.employeeCode ? ` (${employee.employeeCode})` : ''}
            </Text>
            <Text role="cell" style={[styles.cell, { width: 140 }]}>
              {employee.phone || '-'}
            </Text>
            <Text role="cell" style={[styles.cell, { width: 140 }]}>
              {employee.position || '-'}
            </Text>
            <Text role="cell" style={[styles.cell, { width: 130 }]}>
              {employee.salary == null ? '-' : formatMoney(employee.salary)}
            </Text>
            <Text role="cell" style={[styles.cell, { width: 130 }]}>
              {formatDate(employee.dateOfJoining)}
            </Text>
            <View role="cell" style={[styles.statusCell, { width: 100 }]}>
              <Text
                style={[
                  styles.badge,
                  employee.isActive === false ? styles.archived : styles.active,
                ]}
              >
                {t(
                  employee.isActive === false
                    ? 'franchiseEmployeesArchived'
                    : 'franchiseEmployeesActive',
                )}
              </Text>
            </View>
            {showExitDate ? (
              <Text role="cell" style={[styles.cell, { width: 130 }]}>
                {employee.isActive === false
                  ? formatDate(employee.archivedAt, true)
                  : '-'}
              </Text>
            ) : null}
            <View role="cell" style={styles.actions}>
              <EmployeeAction
                label={`${t('franchiseEmployeesEdit')} ${employee.name}`}
                Icon={Pencil}
                color={theme.colors.teal}
                onPress={() => onEdit(employee)}
              />
              {employee.isActive === false ? (
                <EmployeeAction
                  label={`${t('franchiseEmployeesRestore')} ${employee.name}`}
                  Icon={RotateCcw}
                  color={theme.colors.teal}
                  onPress={() => onRestore(employee)}
                />
              ) : (
                <EmployeeAction
                  label={`${t('franchiseEmployeesArchive')} ${employee.name}`}
                  Icon={Archive}
                  color={theme.colors.orange}
                  onPress={() => onArchive(employee)}
                />
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.beige,
    borderRadius: 8,
    backgroundColor: theme.colors.white,
  },
  scrollContent: { flexGrow: 1 },
  table: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.beige,
    minHeight: 60,
  },
  header: { minHeight: 48, backgroundColor: theme.colors.paleBackground },
  cell: {
    flexGrow: 1,
    flexShrink: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.colors.muted,
    fontSize: 13,
  },
  headerText: { fontWeight: '600' },
  name: { color: theme.colors.ink, fontWeight: '600' },
  statusCell: {
    flexGrow: 1,
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'flex-start',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '600',
  },
  active: { backgroundColor: theme.colors.ice, color: theme.colors.teal },
  archived: {
    backgroundColor: theme.colors.paleBackground,
    color: theme.colors.muted,
  },
  actions: {
    width: 100,
    flexGrow: 1,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 6,
  },
  action: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    bottom: 42,
    right: 0,
    minWidth: 140,
    padding: 6,
    borderRadius: 4,
    backgroundColor: theme.colors.ink,
    zIndex: 10,
  },
  tooltipText: { color: theme.colors.white, fontSize: 11 },
});
