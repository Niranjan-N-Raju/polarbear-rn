import type { AuthenticatedUser } from '../../api/types';

export type AdminTab = 'dashboard' | 'stores' | 'users' | 'profile';

export interface AdminHomeScreenProps {
  user: AuthenticatedUser;
  onLogout: () => void;
}

export interface AdminProfileScreenProps {
  user: AuthenticatedUser;
  onUserUpdated: (user: AuthenticatedUser) => void;
}

export interface ProfileIdentityCardProps {
  user: Pick<AuthenticatedUser, 'name' | 'email' | 'role'>;
  showAvatar: boolean;
}
