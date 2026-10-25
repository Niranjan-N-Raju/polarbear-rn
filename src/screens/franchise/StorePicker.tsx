import { Pressable, ScrollView, Text, View } from 'react-native';
import { theme } from '../../config/theme';
import { Check, ChevronRight, LogOut, MapPin, Store, X } from '../../icons';
import { t } from '../../i18n';
import { storePickerStyles as styles } from './storePickerStyles';
import type { FranchiseStore } from './types';

interface StorePickerProps {
  stores: FranchiseStore[];
  activeStoreId?: string;
  onSelect: (store: FranchiseStore) => void;
  onCancel?: () => void;
  onSignOut?: () => void;
  fill?: boolean;
}

export function StorePicker({ stores, activeStoreId, onSelect, onCancel, onSignOut, fill = false }: StorePickerProps) {
  return (
    <View style={[styles.sheet, fill && styles.sheetFill]}>
      {!fill ? <View style={styles.handle} /> : null}
      <View style={[styles.header, fill && styles.headerFill]}>
        <View style={styles.headerIcon}>
          <Store size={22} color={theme.colors.orange} />
        </View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={styles.title}>{t('franchiseSelectStore')}</Text>
          <Text style={styles.description}>{t(activeStoreId ? 'franchiseSwitchDescription' : 'franchiseSelectDescription')}</Text>
        </View>
        {onCancel ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('franchiseCloseSelector')}
            hitSlop={8}
            onPress={onCancel}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <X size={20} color={theme.colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView style={[styles.list, fill && styles.listFill]} contentContainerStyle={styles.listContent}>
        {stores.map((store) => {
          const selected = activeStoreId === store._id;
          return (
            <Pressable
              key={store._id}
              accessibilityRole="button"
              accessibilityLabel={t('franchiseSelectStoreName', { name: store.name })}
              accessibilityState={{ selected }}
              onPress={() => onSelect(store)}
              style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
            >
              <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                <Store size={18} color={selected ? theme.colors.white : theme.colors.teal} />
              </View>
              <View style={styles.optionCopy}>
                <View style={styles.optionTitleRow}>
                  <Text numberOfLines={1} style={styles.optionName}>{store.name}</Text>
                  {store.storeCode ? <Text style={styles.codePill}>{store.storeCode}</Text> : null}
                </View>
                {store.address ? (
                  <View style={styles.addressRow}>
                    <MapPin size={12} color={theme.colors.quiet} />
                    <Text numberOfLines={1} style={styles.address}>{store.address}</Text>
                  </View>
                ) : null}
              </View>
              {selected ? (
                <View style={styles.checkBadge}>
                  <Check size={14} color={theme.colors.white} />
                </View>
              ) : (
                <ChevronRight size={18} color={theme.colors.quiet} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {onSignOut ? (
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('signOut')}
            onPress={onSignOut}
            style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
          >
            <LogOut size={16} color={theme.colors.error} />
            <Text style={styles.signOutText}>{t('signOut')}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
