import { developmentApiUrl } from '../src/config/developmentApiUrl';

describe('development API base URL', () => {
  it.each([
    ['http://10.135.10.15:8081/index.bundle?platform=ios', 'ios'],
    ['http://10.135.20.37:8081/index.bundle?platform=android', 'android'],
    ['http://10.0.2.2:8081/index.bundle', 'android'],
    ['http://localhost:3000/', 'web'],
    ['http://192.168.1.25:3000/', 'web'],
    ['http://[::1]:3000/', 'web'],
    ['file:///app/main.jsbundle', 'ios'],
    [undefined, 'android'],
    [undefined, 'ios'],
  ])('uses the deployed API host for %s on %s', (url, platform) => {
    expect(developmentApiUrl(url, platform)).toBe('https://polarbear-be.vercel.app/api');
  });

  it('ignores the bundle URL host in favor of the deployed API host', () => {
    expect(developmentApiUrl('https://public.example.com/', 'web')).toBe('https://polarbear-be.vercel.app/api');
  });
});
