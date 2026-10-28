import { apiRequest, login, setAccessToken, setPasswordChangeRequiredHandler, setUnauthorizedHandler } from '../src/api/auth';
import { t } from '../src/i18n';
import { response } from './testUtils';

beforeEach(() => {
  setAccessToken(null);
  setUnauthorizedHandler(null);
});

afterAll(() => {
  setAccessToken(null);
  setUnauthorizedHandler(null);
  setPasswordChangeRequiredHandler(null);
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe('auth', () => {
  it('adds bearer auth and handles a single unauthorized response', async () => {
      setAccessToken('token-1');
      const handler = jest.fn();
      setUnauthorizedHandler(handler);
      global.fetch = jest.fn().mockResolvedValue(response(401, {}));
  
      await apiRequest('/users');
      await apiRequest('/users');
  
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect((global.fetch as jest.Mock).mock.calls[0][1].headers.get('Authorization')).toBe('Bearer token-1');
      expect(handler).toHaveBeenCalledTimes(1);
    })

  it('does not invoke the unauthorized callback for logout and supports clearing tokens', async () => {
      setAccessToken('token-2');
      const handler = jest.fn();
      setUnauthorizedHandler(handler);
      global.fetch = jest.fn().mockResolvedValue(response(401, {}));
  
      await apiRequest('/auth/logout');
      expect(handler).not.toHaveBeenCalled();
  
      setAccessToken(null);
      await apiRequest('/public');
      expect((global.fetch as jest.Mock).mock.calls[1][1].headers.has('Authorization')).toBe(false);
    })

  it('logs in, validates credentials response, and maps server errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce(response(200, { token: 'abc', user: { id: '1', name: 'Admin', email: 'a@b.co', role: 'admin' } }))
        .mockResolvedValueOnce(response(200, { token: '', user: { id: '1', name: 'Admin' } }))
        .mockResolvedValueOnce(response(401, { message: 'untrusted message' }));
  
      await expect(login('admin@example.com', 'password')).resolves.toMatchObject({ token: 'abc' });
      await expect(login('admin@example.com', 'password')).rejects.toThrow(t('invalidLoginResponse'));
      await expect(login('admin@example.com', 'password')).rejects.toThrow(t('invalidCredentials'));
    })

  it('reports network failures and server-provided errors for unmapped statuses', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('offline'));
      await expect(login('admin@example.com', 'password')).rejects.toThrow(t('unableToReachServer'));
  
      global.fetch = jest.fn().mockResolvedValue(response(418, { message: 'custom rejection' }));
      await expect(login('admin@example.com', 'password')).rejects.toThrow('custom rejection');
    })

  it('ignores a late 401 for a request sent with a previous token', async () => {
      setAccessToken('old-token');
      const handler = jest.fn();
      setUnauthorizedHandler(handler);
      const pending = deferred<Response>();
      global.fetch = jest.fn().mockReturnValue(pending.promise);

      const request = apiRequest('/users');
      setAccessToken('new-token');
      pending.resolve(response(401, {}));
      await request;
      expect(handler).not.toHaveBeenCalled();

      global.fetch = jest.fn().mockResolvedValue(response(401, {}));
      await apiRequest('/users');
      expect(handler).toHaveBeenCalledTimes(1);
    })

  it('only requires a password change for the token that received the 403', async () => {
      const handler = jest.fn();
      setPasswordChangeRequiredHandler(handler);
      const forbidden = () => ({
        ...response(403, { code: 'PASSWORD_CHANGE_REQUIRED' }),
        clone: () => response(403, { code: 'PASSWORD_CHANGE_REQUIRED' }),
      }) as unknown as Response;

      setAccessToken('old-token');
      const pending = deferred<Response>();
      global.fetch = jest.fn().mockReturnValue(pending.promise);
      const request = apiRequest('/stores');
      setAccessToken('new-token');
      pending.resolve(forbidden());
      await request;
      expect(handler).not.toHaveBeenCalled();

      global.fetch = jest.fn().mockResolvedValue(forbidden());
      await apiRequest('/stores');
      expect(handler).toHaveBeenCalledTimes(1);
      setPasswordChangeRequiredHandler(null);
    })
});
