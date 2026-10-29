import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type ColorValue } from 'react-native';
import { theme } from '../config/theme';
import { t } from '../i18n';
import type { AppLoaderProps } from './types';
import { SplashLoaderArtwork } from './SplashLoaderArtwork';

export type { AppLoaderVariant } from './types';

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  screen: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  label: {
    color: theme.colors.white,
    fontSize: theme.typography.sm,
  },
});

type RegisterLoader = (color: ColorValue, artwork?: AppLoaderProps['artwork']) => () => void;
const LoaderContext = createContext<RegisterLoader | null>(null);

function LoaderOverlay({ color, artwork }: Pick<AppLoaderProps, 'artwork'> & { color: ColorValue }) {
  const label = t('adminLoading');
  return (
    <View
      testID="app-loader-overlay"
      style={styles.screen}
      accessibilityViewIsModal
      accessibilityState={{ busy: true }}
      accessible={artwork === 'splash'}
      accessibilityLabel={artwork === 'splash' ? label : undefined}
      onStartShouldSetResponder={() => true}
    >
      {artwork === 'splash' ? <SplashLoaderArtwork /> : (
        <>
          <ActivityIndicator accessibilityLabel={label} color={color} size="large" />
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </View>
  );
}

// Each native drawer needs its own host because it is presented above the app root.
export function AppLoaderProvider({ children }: PropsWithChildren) {
  const [loaders, setLoaders] = useState<{ id: symbol; color: ColorValue; artwork?: AppLoaderProps['artwork'] }[]>([]);
  const register = useCallback<RegisterLoader>((color, artwork) => {
    const id = Symbol();
    setLoaders((current) => [...current, { id, color, artwork }]);
    return () => setLoaders((current) => current.filter((loader) => loader.id !== id));
  }, []);
  const activeLoader = loaders[loaders.length - 1];

  return (
    <LoaderContext.Provider value={register}>
      <View style={styles.host}>
        {children}
        {activeLoader ? <LoaderOverlay color={activeLoader.color} artwork={activeLoader.artwork} /> : null}
      </View>
    </LoaderContext.Provider>
  );
}

export function AppLoader({ variant = 'screen', color = theme.colors.orange, artwork = 'splash' }: AppLoaderProps) {
  const register = useContext(LoaderContext);
  useEffect(() => {
    if (variant === 'screen' && register) return register(color, artwork);
    return undefined;
  }, [color, register, variant, artwork]);

  if (variant === 'inline') {
    return <ActivityIndicator accessibilityLabel={t('adminLoading')} color={color} size="small" />;
  }

  return register ? null : <LoaderOverlay color={color} artwork={artwork} />;
}