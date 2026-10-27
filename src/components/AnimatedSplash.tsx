import { useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { WebView } from 'react-native-webview';
import manifest from '../../assets/bootsplash/manifest.json';
import { SPLASH_SVG } from '../assets/splashSvg';

export const MIN_SPLASH_MS = 1800;
export const SPLASH_LOGO_WIDTH = 320;

// react-native-svg can't run the SVG's CSS @keyframes, so the exact SVG is rendered in a WebView.
export const SPLASH_HTML = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
html,body{margin:0;height:100%;background:${manifest.background};overflow:hidden}
body{display:flex;align-items:center;justify-content:center}
svg{width:min(${SPLASH_LOGO_WIDTH}px,80vw);height:auto;display:block}
</style></head><body>${SPLASH_SVG.replace(/^<\?xml[^>]*\?>\s*/, '')}</body></html>`;

type Props = { onFinish: () => void };

export function AnimatedSplash({ onFinish }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const launchHidden = useRef(false);

  // Keep the static OS launch screen until the WebView has painted, to avoid a blank flash.
  const hideLaunchScreen = useCallback(() => {
    if (launchHidden.current) {
      return;
    }
    launchHidden.current = true;
    BootSplash.hide({ fade: false }).catch((error: unknown) =>
      console.error('Unable to dismiss launch splash:', error),
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      hideLaunchScreen();
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
        onFinishRef.current(),
      );
    }, MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, [hideLaunchScreen, opacity]);

  return (
    <Animated.View
      testID="animated-splash"
      pointerEvents="none"
      style={[styles.container, { backgroundColor: manifest.background, opacity }]}
    >
      <WebView
        testID="animated-splash-webview"
        originWhitelist={['*']}
        source={{ html: SPLASH_HTML }}
        style={[styles.webview, { backgroundColor: manifest.background }]}
        scrollEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        javaScriptEnabled={false}
        onLoadEnd={hideLaunchScreen}
        onError={hideLaunchScreen}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
  },
  webview: {
    flex: 1,
  },
});
