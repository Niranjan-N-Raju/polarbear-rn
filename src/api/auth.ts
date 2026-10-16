import { apiBaseUrl } from '../config/apiBaseUrl';
import { t } from '../i18n';

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export async function apiRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  return fetch(`${apiBaseUrl}${path}`, { ...init, headers });
}

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
    response = await fetch(`${apiBaseUrl}/auth/login`, {
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

  setAccessToken(data.token);
  return { token: data.token, user: data.user };
}