import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { resolveApiBaseUrl } from './src/config/resolveApiBaseUrl';

export function buildContentSecurityPolicy(apiBaseUrl: string): string {
  const apiOrigin = apiBaseUrl.startsWith('/') ? '' : ` ${new URL(apiBaseUrl).origin}`;
  return [
    "default-src 'self'",
    "script-src 'self'",
    // react-native-web injects its generated styles at runtime.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self'${apiOrigin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

function contentSecurityPolicy(apiBaseUrl: string): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: buildContentSecurityPolicy(apiBaseUrl) },
        injectTo: 'head-prepend',
      },
    ],
  };
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isBuild = command === 'build';
  const apiBaseUrl = isBuild
    ? resolveApiBaseUrl(env.VITE_API_BASE_URL, { isDev: false, devFallback: '' })
    : '';
  // Dev server only: let the existing TEST_LOGIN_* keys prefill the form. Production bundles never see them.
  const devCredentialDefines = isBuild
    ? {}
    : {
        'import.meta.env.VITE_TEST_LOGIN_EMAIL': JSON.stringify(env.VITE_TEST_LOGIN_EMAIL || env.TEST_LOGIN_EMAIL || ''),
        'import.meta.env.VITE_TEST_LOGIN_PASSWORD': JSON.stringify(env.VITE_TEST_LOGIN_PASSWORD || env.TEST_LOGIN_PASSWORD || ''),
      };

  return {
    plugins: [react(), ...(isBuild ? [contentSecurityPolicy(apiBaseUrl)] : [])],
    define: { global: 'globalThis', __DEV__: JSON.stringify(!isBuild), ...devCredentialDefines },
    envPrefix: ['VITE_'],
    build: { sourcemap: false },
    resolve: {
      alias: [
        {
          find: 'react-native-safe-area-context',
          replacement: `${process.cwd()}/src/web/safeAreaContext.tsx`,
        },
        {
          find: 'lucide-react-native',
          replacement: 'lucide-react',
        },
        {
          find: /^react-native$/,
          replacement: `${process.cwd()}/node_modules/react-native-web`,
        },
      ],
      extensions: [
        '.web.tsx',
        '.web.ts',
        '.web.jsx',
        '.web.js',
        '.tsx',
        '.ts',
        '.jsx',
        '.js',
        '.json',
      ],
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
    },
  };
});
