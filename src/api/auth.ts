import { apiBaseUrl } from '../config/apiBaseUrl';
import { t } from '../i18n';

let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
let hasHandledUnauthorized = false;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (token) hasHandledUnauthorized = false;
}

export async function apiRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });
  if (response.status === 401 && accessToken && path !== '/auth/logout' && !hasHandledUnauthorized) {
    hasHandledUnauthorized = true;
    accessToken = null;
    unauthorizedHandler?.();
  }
  return response;
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });
  } catch {
    throw new Error(t('unableToReachServer'));
  } finally {
    clearTimeout(timeout);
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