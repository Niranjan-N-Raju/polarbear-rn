import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { API_REQUEST_TIMEOUT_MS, apiRequest, setAccessToken, setUnauthorizedHandler } from '../src/api/auth';
import { resolveApiBaseUrl } from '../src/config/resolveApiBaseUrl';

const root = path.resolve(__dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const prod = { isDev: false, devFallback: 'http://localhost:5000/api' };
const dev = { isDev: true, devFallback: 'http://localhost:5000/api' };

describe('API base URL transport policy', () => {
  it('accepts https and same-origin paths in production and strips trailing slashes', () => {
    expect(resolveApiBaseUrl(' https://api.example.com/api/ ', prod)).toBe('https://api.example.com/api');
    expect(resolveApiBaseUrl('/api/', prod)).toBe('/api');
  });

  it.each([
    ['http://api.example.com/api'],
    ['http://localhost:5000/api'],
    ['ftp://api.example.com'],
    ['//evil.example.com/api'],
    // eslint-disable-next-line no-script-url -- intentionally malicious input under test
    ['javascript:alert(1)'],
    ['not a url'],
    ['https://user:pass@api.example.com/api'],
  ])('rejects %s in production', (value) => {
    expect(() => resolveApiBaseUrl(value, prod)).toThrow();
  });

  it('requires an explicit URL in production but falls back in development', () => {
    expect(() => resolveApiBaseUrl(undefined, prod)).toThrow('not configured');
    expect(() => resolveApiBaseUrl('   ', prod)).toThrow('not configured');
    expect(resolveApiBaseUrl(undefined, dev)).toBe('http://localhost:5000/api');
  });

  it('allows development http only for loopback, emulator, and private LAN hosts', () => {
    for (const host of ['localhost', '127.0.0.1', '[::1]', '10.0.2.2', '192.168.1.20', '172.16.0.4', '10.1.2.3']) {
      expect(resolveApiBaseUrl(`http://${host}:5000/api`, dev)).toBe(`http://${host}:5000/api`);
    }
    for (const host of ['api.example.com', '8.8.8.8', '172.32.0.1', 'localhost.evil.com']) {
      expect(() => resolveApiBaseUrl(`http://${host}/api`, dev)).toThrow('https');
    }
  });
});

describe('apiRequest session and timeout handling', () => {
  beforeEach(() => {
    setAccessToken(null);
    setUnauthorizedHandler(null);
  });
  afterEach(() => {
    jest.useRealTimers();
    setAccessToken(null);
    setUnauthorizedHandler(null);
  });

  const hangingFetch = () =>
    jest.fn((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    }));

  it('aborts requests that exceed the timeout', async () => {
    jest.useFakeTimers();
    global.fetch = hangingFetch() as unknown as typeof fetch;
    const pending = apiRequest('/slow');
    jest.advanceTimersByTime(API_REQUEST_TIMEOUT_MS);
    await expect(pending).rejects.toThrow('aborted');
  });

  it('propagates caller cancellation, including already-aborted signals', async () => {
    global.fetch = hangingFetch() as unknown as typeof fetch;
    const caller = new AbortController();
    const pending = apiRequest('/slow', { signal: caller.signal });
    caller.abort();
    await expect(pending).rejects.toThrow('aborted');

    const aborted = new AbortController();
    aborted.abort();
    global.fetch = jest.fn((_url: string, init: RequestInit) =>
      init.signal?.aborted ? Promise.reject(new Error('aborted')) : Promise.resolve(new Response())) as unknown as typeof fetch;
    await expect(apiRequest('/x', { signal: aborted.signal })).rejects.toThrow('aborted');
  });

  it('drops the in-memory token after a 401 so later requests are unauthenticated', async () => {
    setAccessToken('secret-token');
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    global.fetch = jest.fn().mockResolvedValue({ status: 401 }) as unknown as typeof fetch;
    await apiRequest('/users');
    await apiRequest('/users');
    const calls = (global.fetch as unknown as jest.Mock).mock.calls;
    expect(calls[0][1].headers.has('Authorization')).toBe(true);
    expect(calls[1][1].headers.has('Authorization')).toBe(false);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not persist tokens to device or browser storage', () => {
    const sources = ['src/api/auth.ts', 'src/hooks/useLogin.ts', 'App.tsx']
      .filter((file) => fs.existsSync(path.join(root, file)))
      .map(read)
      .join('\n');
    expect(sources).not.toMatch(/AsyncStorage|localStorage|sessionStorage|document\.cookie|MMKV|SecureStore/);
  });
});

describe('web build hardening', () => {
  const vite = read('vite.config.ts');

  it('injects a restrictive CSP, disables source maps, and limits env exposure', () => {
    expect(vite).toContain("object-src 'none'");
    expect(vite).toContain("script-src 'self'");
    expect(vite).toContain("base-uri 'self'");
    expect(vite).toContain("form-action 'self'");
    expect(vite).toMatch(/sourcemap:\s*false/);
    expect(vite).toMatch(/envPrefix:\s*\[\s*'VITE_'\s*\]/);
    expect(vite).not.toMatch(/envPrefix:[^\n]*TEST_/);
    expect(vite).toContain('isDev: false');
  });

  it('only reads web test credentials from VITE_ keys in development', () => {
    const creds = read('src/config/testLoginCredentials.web.ts');
    expect(creds).toContain('import.meta.env.DEV');
    expect(creds).toContain('VITE_TEST_LOGIN_EMAIL');
    expect(creds).not.toMatch(/import\.meta\.env\.TEST_/);
  });
});

describe('Android platform hardening', () => {
  const manifest = read('android/app/src/main/AndroidManifest.xml');

  it('disables backups and cleartext traffic in the release manifest', () => {
    expect(manifest).toContain('android:allowBackup="false"');
    expect(manifest).not.toContain('android:usesCleartextTraffic="true"');
    expect(manifest).not.toContain('android:debuggable="true"');
  });

  it('exports only the launcher activity', () => {
    const exported = manifest.match(/android:exported="true"/g) ?? [];
    expect(exported).toHaveLength(1);
    expect(manifest).not.toMatch(/<data\s+android:scheme=/);
  });

  it('applies FLAG_SECURE to release builds', () => {
    const activity = read('android/app/src/main/java/com/reactnative/MainActivity.kt');
    expect(activity).toMatch(/if \(!BuildConfig\.DEBUG\)\s*\{\s*window\.setFlags\(WindowManager\.LayoutParams\.FLAG_SECURE/);
  });

  it('guards release builds against test credentials and non-https APIs', () => {
    const gradle = read('android/app/build.gradle');
    expect(gradle).toContain('release: ".env.production"');
    expect(gradle).toContain('preReleaseBuild');
    expect(gradle).toMatch(/TEST_/);
    expect(gradle).toMatch(/https:\/\//);
  });
});

describe('iOS platform hardening', () => {
  const plist = read('ios/reactnative/Info.plist');

  it('keeps ATS enforced and declares no custom URL schemes or empty permission prompts', () => {
    expect(plist).toMatch(/<key>NSAllowsArbitraryLoads<\/key>\s*<false\/>/);
    expect(plist).not.toContain('CFBundleURLTypes');
    expect(plist).not.toMatch(/UsageDescription<\/key>\s*<string><\/string>/);
  });

  it('covers content before the app-switcher snapshot', () => {
    const scene = read('ios/reactnative/SceneDelegate.swift');
    expect(scene).toContain('func sceneWillResignActive');
    expect(scene).toContain('func sceneDidBecomeActive');
    expect(scene).toContain('privacyOverlay?.removeFromSuperview()');
  });

  it('runs the release env check only for Release builds', () => {
    const pbx = read('ios/reactnative.xcodeproj/project.pbxproj');
    expect(pbx).toContain('$CONFIGURATION\\" = \\"Release\\"');
    expect(pbx).toContain('scripts/check-release-env.sh');
  });

  describe('check-release-env.sh', () => {
    const script = path.join(root, 'scripts/check-release-env.sh');
    let dir: string;
    beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envcheck-')); });
    afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

    const run = (contents: string | null) => {
      if (contents !== null) fs.writeFileSync(path.join(dir, '.env.production'), contents);
      try {
        execFileSync('sh', [script, dir], { env: { ...process.env, ENVFILE: '.env.production' }, stdio: 'pipe' });
        return { code: 0, stderr: '' };
      } catch (error) {
        const failure = error as { status: number; stderr: Buffer };
        return { code: failure.status, stderr: failure.stderr.toString() };
      }
    };

    it('passes a clean production env', () => {
      expect(run('API_BASE_URL=https://api.example.com/api\nTEST_LOGIN_EMAIL=\nTEST_LOGIN_PASSWORD=""\n').code).toBe(0);
    });

    it('fails on populated test keys or non-https URLs without echoing values', () => {
      const result = run('API_BASE_URL=http://api.example.com/api\nTEST_LOGIN_PASSWORD=hunter2\n');
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('TEST_LOGIN_PASSWORD');
      expect(result.stderr).toContain('API_BASE_URL');
      expect(result.stderr).not.toContain('hunter2');
      expect(result.stderr).not.toContain('api.example.com');
    });

    it('fails when the release env file is missing', () => {
      expect(run(null).code).toBe(1);
    });

    it('fails a Release build that falls back to the developer .env when ENVFILE is unset', () => {
      fs.writeFileSync(path.join(dir, '.env'), 'API_BASE_URL=https://api.example.com/api\nTEST_LOGIN_EMAIL=dev@example.com\n');
      const env = { ...process.env };
      delete env.ENVFILE;
      let code = 0;
      let stderr = '';
      try {
        execFileSync('sh', [script, dir], { env, stdio: 'pipe' });
      } catch (error) {
        const failure = error as { status: number; stderr: Buffer };
        code = failure.status;
        stderr = failure.stderr.toString();
      }
      expect(code).toBe(1);
      expect(stderr).toContain('TEST_LOGIN_EMAIL');
      expect(stderr).not.toContain('dev@example.com');
    });
  });
});

describe('repository secret hygiene', () => {
  it('ignores local env files but keeps examples free of values', () => {
    const ignore = read('.gitignore');
    expect(ignore).toMatch(/^\.env$/m);
    for (const example of ['.env.example', '.env.production.example']) {
      const lines = read(example).split('\n').filter((line) => /^[A-Z_]+=/.test(line));
      for (const line of lines.filter((l) => /TEST_|PASSWORD|SECRET|TOKEN/.test(l.split('=')[0]))) {
        expect(line.split('=')[1]).toBe('');
      }
    }
  });
});
