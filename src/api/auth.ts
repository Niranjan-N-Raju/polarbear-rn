import { Platform } from 'react-native';
import { t } from '../i18n';

const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:4000/api',
  default: 'http://localhost:4000/api',
});

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: AuthenticatedUser;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(t('unableToReachServer'));
  }

  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    token?: string;
    user?: AuthenticatedUser;
  };

  if (!response.ok) {
    const localizedErrors: Record<number, string> = {
      400: t('invalidInput'),
      401: t('invalidCredentials'),
      403: t('noAssociatedStores'),
      413: t('requestTooLarge'),
      429: t('tooManyAttempts'),
      500: t('internalServerError'),
    };
    throw new Error(localizedErrors[response.status] ?? data.message ?? t('loginFailed'));
  }
  if (!data.token || !data.user?.id || !data.user.name) {
    throw new Error(t('invalidLoginResponse'));
  }

  return { token: data.token, user: data.user };
}