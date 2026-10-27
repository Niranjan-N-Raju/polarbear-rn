export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
}

export interface LoginResponse {
  token: string;
  user: AuthenticatedUser;
}
