import Config from 'react-native-config';
import { resolveApiBaseUrl } from './resolveApiBaseUrl';

// Dev machine LAN IP so simulators, emulators and physical devices can all reach the backend.
const localApiUrl = 'http://192.168.1.2:4000/api';

export const apiBaseUrl = resolveApiBaseUrl(Config.API_BASE_URL, { isDev: __DEV__, devFallback: localApiUrl });
