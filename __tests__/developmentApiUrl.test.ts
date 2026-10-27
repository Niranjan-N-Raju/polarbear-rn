import { developmentApiUrl } from '../src/config/developmentApiUrl';

describe('development API host detection', () => {
  it.each([
    ['http://10.135.10.15:8081/index.bundle?platform=ios', 'ios', 'http://10.135.10.15:4000/api'],
    ['http://10.135.20.37:8081/index.bundle?platform=android', 'android', 'http://10.135.20.37:4000/api'],
    ['http://10.0.2.2:8081/index.bundle', 'android', 'http://10.0.2.2:4000/api'],
    ['http://localhost:3000/', 'web', 'http://localhost:4000/api'],
    ['http://192.168.1.25:3000/', 'web', 'http://192.168.1.25:4000/api'],
    ['http://[::1]:3000/', 'web', 'http://[::1]:4000/api'],
    ['file:///app/main.jsbundle', 'ios', 'http://localhost:4000/api'],
    [undefined, 'android', 'http://10.0.2.2:4000/api'],
    [undefined, 'ios', 'http://localhost:4000/api'],
  ])('resolves %s on %s', (url, platform, expected) => {
    expect(developmentApiUrl(url, platform)).toBe(expected);
  });

  it('does not bypass the transport policy for public hosts', () => {
    expect(() => developmentApiUrl('https://public.example.com/', 'web')).toThrow('https');
  });
});
