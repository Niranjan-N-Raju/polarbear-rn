/// <reference types="vite/client" />
import { resolveApiBaseUrl } from './resolveApiBaseUrl';

export const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL, {
  isDev: import.meta.env.DEV,
  devFallback: 'http://localhost:4000/api',
});
