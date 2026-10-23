import { Text, View } from 'react-native';
import { translateRole } from '../../i18n';
import { adminStyles as styles } from '../../styles/adminStyles';
import type { ProfileIdentityCardProps } from './types';

export function ProfileIdentityCard({ user, showAvatar }: ProfileIdentityCardProps) {
  return (
    <View style={[styles.profileCard, showAvatar && styles.profileIdentity]}>
      {showAvatar ? (
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
      ) : null}
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle}>{user.name}</Text>
        <Text style={styles.rowSubtext}>{user.email}</Text>
        {showAvatar
          ? <View style={styles.profileRoleBadge}><Text style={styles.profileRoleText}>{translateRole(user.role)}</Text></View>
          : <Text style={styles.rowRole}>{translateRole(user.role)}</Text>}
      </View>
    </View>
  );
}
