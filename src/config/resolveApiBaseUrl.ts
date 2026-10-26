const devHttpHost = /^(localhost|127\.0\.0\.1|\[::1\]|10\.0\.2\.2|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/i;

type ResolveOptions = { isDev: boolean; devFallback: string };

/**
 * Validates the configured API base URL. Production builds must use https (or a same-origin
 * relative path on web) so bearer tokens and credentials never travel in cleartext; plain http is
 * only accepted in development and only for loopback/private-network hosts.
 */
export function resolveApiBaseUrl(raw: string | undefined, { isDev, devFallback }: ResolveOptions): string {
  const value = raw?.trim() || (isDev ? devFallback : '');
  if (!value) throw new Error('API base URL is not configured for this build.');
  if (value.startsWith('/') && !value.startsWith('//')) return value.replace(/\/+$/, '');

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('API base URL is not a valid URL.');
  }
  if (url.username || url.password) throw new Error('API base URL must not contain credentials.');
  const isHttps = url.protocol === 'https:';
  const isAllowedDevHttp = isDev && url.protocol === 'http:' && devHttpHost.test(url.hostname);
  if (!isHttps && !isAllowedDevHttp) {
    throw new Error('API base URL must use https outside local development.');
  }
  return value.replace(/\/+$/, '');
}
