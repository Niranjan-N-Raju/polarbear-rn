import Config from 'react-native-config';
import { Platform, TurboModuleRegistry, type TurboModule } from 'react-native';
import { resolveApiBaseUrl } from './resolveApiBaseUrl';
import { developmentApiUrl } from './developmentApiUrl';

interface SourceCodeModule extends TurboModule {
  getConstants(): { scriptURL?: string };
}

export const apiBaseUrl = resolveApiBaseUrl(Config.API_BASE_URL, {
  isDev: __DEV__,
  devFallback: __DEV__ && !Config.API_BASE_URL?.trim()
    ? developmentApiUrl(TurboModuleRegistry.get<SourceCodeModule>('SourceCode')?.getConstants().scriptURL, Platform.OS)
    : '',
});
