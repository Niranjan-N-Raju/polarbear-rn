import { apiBaseUrl } from '../config/apiBaseUrl';
import { Platform } from 'react-native';
import { t } from '../i18n';
import type { AuthenticatedUser, LoginResponse } from './types';

export type { AuthenticatedUser, LoginResponse } from './types';

export const API_REQUEST_TIMEOUT_MS = 30_000;

let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
let passwordChangeRequiredHandler: (() => void) | null = null;

export function setPasswordChangeRequiredHandler(handler: (() => void) | null): void {
  passwordChangeRequiredHandler = handler;
}
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
  if (Platform.OS === 'web') headers.set('X-Web-Session', '1');
  // Responses are only allowed to end the session that actually sent them.
  const requestToken = accessToken;
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const controller = new AbortController();
  // Combine caller cancellation with the shared timeout without replacing the caller's signal.
  const abortFromCaller = () => controller.abort();
  if (init.signal?.aborted) controller.abort();
  init.signal?.addEventListener('abort', abortFromCaller);
  const timeout = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      ...(Platform.OS === 'web' ? { credentials: 'include' as const } : {}),
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener('abort', abortFromCaller);
  }
  // Parallel failed requests should trigger one sign-out notification, not one toast per request.
  if (response.status === 401 && accessToken && requestToken === accessToken && path !== '/auth/logout' && !hasHandledUnauthorized) {
    hasHandledUnauthorized = true;
    accessToken = null;
    unauthorizedHandler?.();
  }
  if (response.status === 403 && accessToken && requestToken === accessToken && passwordChangeRequiredHandler && typeof response.clone === 'function') {
    // Inspect a copy so feature callers can still read the original response body.
    const body = (await response.clone().json().catch(() => null)) as { code?: string } | null;
    if (body?.code === 'PASSWORD_CHANGE_REQUIRED' && requestToken === accessToken) passwordChangeRequiredHandler?.();
  }
  return response;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(Platform.OS === 'web' ? { 'X-Web-Session': '1' } : {}),
      },
      ...(Platform.OS === 'web' ? { credentials: 'include' as const } : {}),
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

export async function restoreSession(signal: AbortSignal): Promise<LoginResponse | null> {
  const response = await apiRequest('/auth/session', { method: 'POST', signal });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(t('unableToReachServer'));
  const data = await response.json() as LoginResponse;
  if (!data.token || !data.user?.id || !data.user.name) throw new Error(t('invalidLoginResponse'));
  return data;
}