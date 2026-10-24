import { Pressable, ScrollView, Text, View } from 'react-native';
import { t } from '../../i18n';
import { franchiseStyles as styles } from './franchiseStyles';
import type { FranchiseStore } from './types';

interface StorePickerProps {
  stores: FranchiseStore[];
  activeStoreId?: string;
  onSelect: (store: FranchiseStore) => void;
  onCancel?: () => void;
}

export function StorePicker({ stores, activeStoreId, onSelect, onCancel }: StorePickerProps) {
  return (
    <View style={styles.picker}>
      <Text accessibilityRole="header" style={styles.title}>{t('franchiseSelectStore')}</Text>
      <Text style={styles.body}>{t(activeStoreId ? 'franchiseSwitchDescription' : 'franchiseSelectDescription')}</Text>
      <ScrollView style={styles.pickerList} contentContainerStyle={styles.pickerListContent}>
        {stores.map((store) => (
          <Pressable
            key={store._id}
            accessibilityRole="button"
            accessibilityLabel={t('franchiseSelectStoreName', { name: store.name })}
            accessibilityState={{ selected: activeStoreId === store._id }}
            onPress={() => onSelect(store)}
            style={[styles.storeOption, activeStoreId === store._id && styles.selectedStore]}
          >
            <Text style={styles.sectionTitle}>{store.name}</Text>
            {store.storeCode ? <Text style={styles.subtitle}>{store.storeCode}</Text> : null}
            {store.address ? <Text style={styles.body}>{store.address}</Text> : null}
          </Pressable>
        ))}
      </ScrollView>
      {onCancel ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseCloseSelector')} onPress={onCancel} style={styles.button}>
          <Text style={styles.buttonText}>{t('adminCancel')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
