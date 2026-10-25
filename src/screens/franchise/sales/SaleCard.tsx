import { Pressable, Text, View } from 'react-native';
import { Pencil, Receipt } from '../../../icons';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import type { StoreCardStyleKey } from '../../../utils/adminLayout';
import { formatMoney } from '../DashboardCharts';
import type { SaleRecord } from '../types';
import { salesStyles } from './salesStyles';
import { formatPercent, formatSaleDate, onlinePercent } from './utils';

interface SaleCardProps {
  sale: SaleRecord;
  cardStyle: StoreCardStyleKey | null;
  actionsAtBottom: boolean;
  onEdit: (sale: SaleRecord) => void;
}

export function SaleCard({ sale, cardStyle, actionsAtBottom, onEdit }: SaleCardProps) {
  const online = sale.swiggy + sale.zomato;
  const metrics = [
    { label: t('franchiseSaleOnline'), value: formatMoney(online) },
    { label: t('franchiseSaleUpi'), value: formatMoney(sale.upi) },
    { label: t('franchiseSaleCash'), value: formatMoney(sale.cash) },
    { label: t('franchiseSaleSwiggy'), value: formatMoney(sale.swiggy) },
    { label: t('franchiseSaleZomato'), value: formatMoney(sale.zomato) },
    { label: t('franchiseSaleExpenses'), value: formatMoney(sale.totalExpenses) },
  ];
  const editLabel = t('franchiseEditSale', { date: sale.date });

  return (
    <View style={[styles.storeCard, cardStyle && styles[cardStyle]]}>
      <View style={styles.storeCardHeader}>
        <View style={styles.storeIconTile}>
          <Receipt color={theme.colors.orange} size={20} />
        </View>
        <View style={styles.storeCardBody}>
          <View style={styles.storeTitleRow}>
            <Text numberOfLines={1} style={styles.storeTitle}>{formatMoney(sale.totalSale)}</Text>
            <View style={styles.storeCodeBadge}>
              <Text style={styles.storeCodeText}>
                {t('franchiseSaleOnlinePercentShort', { value: formatPercent(onlinePercent(sale.totalSale, sale.swiggy, sale.zomato)) })}
              </Text>
            </View>
          </View>
          <Text style={salesStyles.cardSubtitle}>{formatSaleDate(sale.date)}</Text>
        </View>
        {!actionsAtBottom ? (
          <View style={styles.storeCardHeaderActions}>
            <Pressable
              accessibilityLabel={editLabel}
              accessibilityRole="button"
              onPress={() => onEdit(sale)}
              style={styles.storeCardHeaderAction}
            >
              <Pencil color={theme.colors.teal} size={16} />
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={salesStyles.metricGrid}>
        {metrics.map((metric) => (
          <View key={metric.label} style={salesStyles.metric}>
            <Text style={salesStyles.metricLabel}>{metric.label}</Text>
            <Text numberOfLines={1} style={salesStyles.metricValue}>{metric.value}</Text>
          </View>
        ))}
      </View>

      <View style={salesStyles.bankingRow}>
        <Text style={salesStyles.bankingLabel}>{t('franchiseSaleBankingCash')}</Text>
        <Text style={[salesStyles.bankingValue, sale.bankingCash < 0 && salesStyles.negativeValue]}>
          {formatMoney(sale.bankingCash)}
        </Text>
      </View>

      {actionsAtBottom ? (
        <View style={styles.storeCardActions}>
          <Pressable
            accessibilityLabel={editLabel}
            accessibilityRole="button"
            onPress={() => onEdit(sale)}
            style={styles.storeCardAction}
          >
            <Pencil color={theme.colors.teal} size={14} />
            <Text style={styles.storeEditActionText}>{t('franchiseEdit')}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
