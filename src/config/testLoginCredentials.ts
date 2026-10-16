import Config from 'react-native-config';

export const defaultLoginCredentials = __DEV__
  ? {
      email: Config.TEST_LOGIN_EMAIL ?? '',
      password: Config.TEST_LOGIN_PASSWORD ?? '',
    }
  : { email: '', password: '' };