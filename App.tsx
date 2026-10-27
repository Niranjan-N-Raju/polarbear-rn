import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from './src/screens/LoginScreen';
import { AppLoaderProvider } from './src/components/AppLoader';
import { useState, useSyncExternalStore } from 'react';
import { AnimatedSplash } from './src/components/AnimatedSplash';
import { getLanguage, subscribeToLanguageChanges } from './src/i18n';

function App() {
  useSyncExternalStore(subscribeToLanguageChanges, getLanguage, getLanguage);

  const [splashVisible, setSplashVisible] = useState(true);

  return (
    <>
      <SafeAreaProvider>
        <AppLoaderProvider>
          <LoginScreen />
        </AppLoaderProvider>
      </SafeAreaProvider>
      {splashVisible && <AnimatedSplash onFinish={() => setSplashVisible(false)} />}
    </>
  );
}

export default App;