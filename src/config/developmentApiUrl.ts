import { resolveApiBaseUrl } from './resolveApiBaseUrl';

export function developmentApiUrl(sourceUrl: string | undefined, platform: string): string {
  const source = sourceUrl ? new URL(sourceUrl) : undefined;
  const hostname = source && ['http:', 'https:'].includes(source.protocol)
    ? source.hostname
    : platform === 'android' ? '10.0.2.2' : 'localhost';
  return resolveApiBaseUrl(`http://${hostname}:4000/api`, { isDev: true, devFallback: '' });
}
