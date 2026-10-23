import { apiRequest, login, setAccessToken, setUnauthorizedHandler } from '../src/api/auth';
import { t } from '../src/i18n';
import { response } from './testUtils';

beforeEach(() => {
  setAccessToken(null);
  setUnauthorizedHandler(null);
});

afterAll(() => {
  setAccessToken(null);
  setUnauthorizedHandler(null);
});

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
});
