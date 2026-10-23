import { Archive, MapPin, Pencil, Phone, RotateCcw, Store as StoreIcon } from '../../../icons';
import { Pressable, Text, View } from 'react-native';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import type { StoreCardProps } from './types';

export function StoreCard({
  store,
  userId,
  storeCardStyle,
  actionsAtBottom,
  isUpdatingArchive,
  onEdit,
  onArchive,
}: StoreCardProps) {
  const canManage = store.createdBy === userId;
  const isActive = Boolean(store.isActive && !store.archivedAt);

  return (
    <View style={[styles.storeCard, storeCardStyle && styles[storeCardStyle]]}>
      <View style={styles.storeCardHeader}>
        <View style={styles.storeIconTile}><StoreIcon color={theme.colors.orange} size={20} /></View>
        <View style={styles.storeCardBody}>
          <View style={styles.storeTitleRow}>
            <Text numberOfLines={1} style={styles.storeTitle}>{store.name}</Text>
            {store.storeCode ? <View style={styles.storeCodeBadge}><Text style={styles.storeCodeText}>{store.storeCode}</Text></View> : null}
          </View>
          <View style={styles.storeBadgeRow}>
            <View style={[styles.storeTypeBadge, store.storeType === 'company' ? styles.storeCompanyBadge : styles.storeFranchiseBadge]}>
              <Text style={[styles.storeTypeBadgeText, store.storeType === 'company' ? styles.storeCompanyBadgeText : styles.storeFranchiseBadgeText]}>
                {store.storeType === 'company' ? t('adminCompanyStore') : t('adminFranchiseStore')}
              </Text>
            </View>
            <View style={[styles.storeStatusBadge, isActive ? styles.storeActiveBadge : styles.storeInactiveBadge]}>
              <Text style={isActive ? styles.storeActiveBadgeText : styles.storeInactiveBadgeText}>
                {store.archivedAt ? t('adminArchived') : isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
        {canManage && !actionsAtBottom ? (
          <View style={styles.storeCardHeaderActions}>
            <Pressable accessibilityRole="button" accessibilityLabel={`${t('adminEditStore')} ${store.name}`} onPress={() => onEdit(store)} style={styles.storeCardHeaderAction}>
              <Pencil color={theme.colors.teal} size={16} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${store.archivedAt ? t('adminRestore') : t('adminArchive')} ${store.name}`}
              disabled={isUpdatingArchive}
              onPress={() => onArchive(store)}
              style={styles.storeCardHeaderAction}
            >
              {store.archivedAt
                ? <RotateCcw color={theme.colors.orange} size={16} />
                : <Archive color={theme.colors.orange} size={16} />}
            </Pressable>
          </View>
        ) : null}
      </View>
      {store.description ? <Text style={styles.storeDescription}>{store.description}</Text> : null}
      {store.address || store.phone ? (
        <View style={styles.storeContactBlock}>
          {store.address ? <View style={styles.storeContactRow}><MapPin color="#9CA3AF" size={14} /><Text style={styles.storeContactText}>{store.address}</Text></View> : null}
          {store.phone ? <View style={styles.storeContactRow}><Phone color="#9CA3AF" size={14} /><Text style={styles.storeContactText}>{store.phone}</Text></View> : null}
        </View>
      ) : null}
      {canManage && actionsAtBottom ? (
        <View style={styles.storeCardActions}>
          <Pressable accessibilityRole="button" onPress={() => onEdit(store)} style={styles.storeCardAction}>
            <Pencil color={theme.colors.teal} size={14} />
            <Text style={styles.storeEditActionText}>{t('adminEditStore')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => onArchive(store)} style={styles.storeCardAction}>
            {store.archivedAt ? <RotateCcw color={theme.colors.orange} size={14} /> : <Archive color={theme.colors.orange} size={14} />}
            <Text style={styles.storeArchiveActionText}>{store.archivedAt ? t('adminRestore') : t('adminArchive')}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
