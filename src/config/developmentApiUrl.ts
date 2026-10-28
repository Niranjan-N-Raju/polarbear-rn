import { resolveApiBaseUrl } from './resolveApiBaseUrl';

export function developmentApiUrl(_sourceUrl: string | undefined, _platform: string): string {
  return resolveApiBaseUrl('https://polarbear-be.vercel.app/api', { isDev: true, devFallback: '' });
}
