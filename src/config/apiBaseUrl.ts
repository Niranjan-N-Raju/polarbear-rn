import { Platform } from 'react-native';
import Config from 'react-native-config';

const localApiUrl = Platform.OS === 'android'
  ? 'http://10.0.2.2:4000/api'
  : 'http://localhost:4000/api';

export const apiBaseUrl = (Config.API_BASE_URL?.trim() || localApiUrl).replace(/\/+$/, '');