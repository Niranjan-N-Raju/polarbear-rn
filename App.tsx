import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from './src/screens/LoginScreen';
import { AppLoaderProvider } from './src/components/AppLoader';

function App() {
  return (
    <SafeAreaProvider>
      <AppLoaderProvider>
        <LoginScreen />
      </AppLoaderProvider>
    </SafeAreaProvider>
  );
}

export default App;