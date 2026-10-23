import { Pencil, Trash2 } from '../../../icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { theme } from '../../../config/theme';
import { t, translateRole } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import type { UserListProps } from './types';

export function UserList({ users, isTable, isDesktopWeb, onEdit, onDelete }: UserListProps) {
  if (isTable) {
    return (
      <View style={styles.usersTable}>
        <View style={[styles.usersTableRow, styles.usersTableHeader]}>
          <Text style={[styles.usersTableCell, styles.usersTableHeaderText, styles.usersTableName]}>Name</Text>
          <Text style={[styles.usersTableCell, styles.usersTableHeaderText, styles.usersTableEmail]}>Email</Text>
          <Text style={[styles.usersTableCell, styles.usersTableHeaderText, styles.usersTableStores]}>Stores</Text>
          <View style={styles.usersTableActions} />
        </View>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {users.map((user) => (
            <View key={user._id} style={styles.usersTableRow}>
              <View style={[styles.usersTableCell, styles.usersTableName]}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userNameRoleGroup}>
                  <Text numberOfLines={1} style={styles.userTableNameText}>{user.name}</Text>
                  <View style={styles.userRoleTag}>
                    <Text style={styles.userRoleTagText}>{translateRole(user.role)}</Text>
                  </View>
                </View>
              </View>
              <Text numberOfLines={1} style={[styles.usersTableCell, styles.usersTableEmail]}>{user.email}</Text>
              <View style={[styles.usersTableCell, styles.usersTableStores]}>
                {user.franchises.length === 0
                  ? <Text style={styles.rowSubtext}>{t('adminNoStore')}</Text>
                  : user.franchises.map((store) => <Text key={store._id} style={styles.userTableStore}>{store.name}</Text>)}
              </View>
              <View style={styles.usersTableActions}>
                <Pressable accessibilityRole="button" accessibilityLabel={`${t('adminEditUser')} ${user.name}`} onPress={() => onEdit(user)} style={styles.userIconAction}>
                  <Pencil color={theme.colors.teal} size={16} />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`${t('adminDelete')} ${user.name}`} onPress={() => onDelete(user)} style={styles.userIconAction}>
                  <Trash2 color={theme.colors.error} size={16} />
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.list, !isDesktopWeb && styles.userListWithFab]}
      contentContainerStyle={[styles.listContent, !isDesktopWeb && styles.userListContentWithFab]}
    >
      {users.map((user) => (
        <View key={user._id} style={styles.row}>
          <View style={styles.rowHeader}>
            <View style={[styles.userNameRoleGroup, styles.userCardTitle]}>
              <Text numberOfLines={1} style={[styles.rowTitle, styles.userTableNameText]}>{user.name}</Text>
              <View style={styles.userRoleTag}>
                <Text style={styles.userRoleTagText}>{translateRole(user.role)}</Text>
              </View>
            </View>
            <View style={styles.userCardActions}>
              <Pressable accessibilityRole="button" accessibilityLabel={`${t('adminEditUser')} ${user.name}`} onPress={() => onEdit(user)} style={styles.userIconAction}>
                <Pencil color={theme.colors.teal} size={16} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`${t('adminDelete')} ${user.name}`} onPress={() => onDelete(user)} style={styles.userIconAction}>
                <Trash2 color={theme.colors.error} size={16} />
              </Pressable>
            </View>
          </View>
          <Text style={styles.rowSubtext}>{user.email}</Text>
          <View style={styles.storePills}>
            {user.franchises.length === 0
              ? <Text style={styles.rowSubtext}>{t('adminNoStore')}</Text>
              : user.franchises.map((store) => (
                <View key={store._id} style={styles.storePill}>
                  <Text style={styles.storePillText}>{store.name}</Text>
                </View>
              ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
