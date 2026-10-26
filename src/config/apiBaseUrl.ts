import { Platform } from 'react-native';
import Config from 'react-native-config';
import { resolveApiBaseUrl } from './resolveApiBaseUrl';

const localApiUrl = Platform.OS === 'android'
  ? 'http://10.0.2.2:4000/api'
  : 'http://localhost:4000/api';

export const apiBaseUrl = resolveApiBaseUrl(Config.API_BASE_URL, { isDev: __DEV__, devFallback: localApiUrl });
