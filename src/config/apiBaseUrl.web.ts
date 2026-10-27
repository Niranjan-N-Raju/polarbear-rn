/// <reference types="vite/client" />
import { resolveApiBaseUrl } from './resolveApiBaseUrl';
import { developmentApiUrl } from './developmentApiUrl';

export const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL, {
  isDev: import.meta.env.DEV,
  devFallback: import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL?.trim()
    ? developmentApiUrl(globalThis.location.href, 'web')
    : '',
});
