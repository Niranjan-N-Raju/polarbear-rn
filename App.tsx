import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from './src/screens/LoginScreen';
import { AppLoaderProvider } from './src/components/AppLoader';
import { useEffect } from 'react';
import BootSplash from 'react-native-bootsplash';

function App() {
  useEffect(() => {
    BootSplash.hide({ fade: true }).catch((error: unknown) => {
      console.error('Unable to dismiss launch splash:', error);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <AppLoaderProvider>
        <LoginScreen />
      </AppLoaderProvider>
    </SafeAreaProvider>
  );
}

export default App;