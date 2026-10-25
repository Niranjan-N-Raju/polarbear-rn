import { Pressable, Text, View } from 'react-native';
import { Boxes, Check, Trash2 } from '../../../icons';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import type { StoreCardStyleKey } from '../../../utils/adminLayout';
import type { InventoryStockItem } from '../types';
import { inventoryStyles } from './inventoryStyles';
import { daysUntil, formatInventoryDate } from './utils';

export type InventoryAction = 'useOne' | 'useMany' | 'dump';

interface InventoryCardProps {
  item: InventoryStockItem;
  priority: number;
  cardStyle: StoreCardStyleKey | null;
  onAction: (item: InventoryStockItem, action: InventoryAction) => void;
}

export function InventoryCard({ item, priority, cardStyle, onAction }: InventoryCardProps) {
  const days = daysUntil(item.expiryDate);
  const expired = days < 0;
  const urgent = days >= 0 && days <= 1;
  const details = [
    { label: t('franchiseInventoryExpiry'), value: formatInventoryDate(item.expiryDate) },
    {
      label: t('franchiseInventoryStatus'),
      value: expired ? t('franchiseInventoryExpired') : t('franchiseInventoryDaysLeft', { count: days }),
      style: expired ? inventoryStyles.expiredValue : urgent ? inventoryStyles.urgentValue : undefined,
    },
    { label: t('franchiseInventoryQuantity'), value: String(item.quantity) },
  ];

  return (
    <View style={[styles.storeCard, cardStyle && styles[cardStyle]]}>
      <View style={styles.storeCardHeader}>
        <View style={styles.storeIconTile}>
          <Boxes color={expired ? theme.colors.error : theme.colors.teal} size={20} />
        </View>
        <View style={styles.storeCardBody}>
          <View style={styles.storeTitleRow}>
            <Text numberOfLines={1} style={styles.storeTitle}>{item.product}</Text>
            <View style={styles.storeCodeBadge}>
              <Text style={styles.storeCodeText}>#{priority}</Text>
            </View>
            {urgent ? (
              <View style={inventoryStyles.useNowBadge}>
                <Text style={inventoryStyles.useNowText}>{t('franchiseInventoryUseNow')}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={inventoryStyles.detailRow}>
        {details.map((detail) => (
          <View key={detail.label} style={inventoryStyles.detail}>
            <Text style={inventoryStyles.detailLabel}>{detail.label}</Text>
            <Text numberOfLines={1} style={[inventoryStyles.detailValue, detail.style]}>{detail.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.storeCardActions}>
        {expired ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('franchiseInventoryDumpLabel', { name: item.product })}
            onPress={() => onAction(item, 'dump')}
            style={styles.storeCardAction}
          >
            <Trash2 color={theme.colors.error} size={14} />
            <Text style={inventoryStyles.dumpActionText}>{t('franchiseInventoryMarkDumped')}</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('franchiseInventoryUseOneLabel', { name: item.product })}
              onPress={() => onAction(item, 'useOne')}
              style={styles.storeCardAction}
            >
              <Check color={theme.colors.teal} size={14} />
              <Text style={styles.storeEditActionText}>{t('franchiseInventoryUseOne')}</Text>
            </Pressable>
            {item.quantity >= 2 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('franchiseInventoryUseManyLabel', { name: item.product })}
                onPress={() => onAction(item, 'useMany')}
                style={styles.storeCardAction}
              >
                <Boxes color={theme.colors.orange} size={14} />
                <Text style={styles.storeArchiveActionText}>{t('franchiseInventoryUseMany')}</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}
