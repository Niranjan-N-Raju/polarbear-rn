export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
  preferredLanguage?: 'en' | 'kn';
}

export interface LoginResponse {
  token: string;
  user: AuthenticatedUser;
}
