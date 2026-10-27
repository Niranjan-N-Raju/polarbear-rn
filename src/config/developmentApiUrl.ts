import { resolveApiBaseUrl } from './resolveApiBaseUrl';

export function developmentApiUrl(_sourceUrl: string | undefined, _platform: string): string {
  return resolveApiBaseUrl('http://192.168.1.2:4000/api', { isDev: true, devFallback: '' });
}
