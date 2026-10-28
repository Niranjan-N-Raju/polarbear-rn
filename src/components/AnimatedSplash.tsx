import { useCallback, useEffect, useRef } from 'react';
import type { ComponentType } from 'react';
import { Animated, Image, StyleSheet, TurboModuleRegistry } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import type { WebViewMessageEvent, WebViewProps } from 'react-native-webview';
import manifest from '../../assets/bootsplash/manifest.json';
import { SPLASH_SVG } from '../assets/splashSvg';

export const MIN_SPLASH_MS = 4000;
export const SPLASH_LOGO_WIDTH = 320;
// If the WebView never reports its first paint, stop waiting this long after it finished loading.
export const PAINT_FALLBACK_MS = 1000;
export const PAINTED_MESSAGE = 'splash-painted';

// react-native-svg can't run the SVG's CSS @keyframes, so the exact SVG is rendered in a WebView.
// The inline script reports after two animation frames, i.e. once the SVG has actually been drawn;
// "load end" alone fires before the first paint and would expose the WebView's empty background.
export const SPLASH_HTML = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
html,body{margin:0;height:100%;background:${
  manifest.background
};overflow:hidden}
body{display:flex;align-items:center;justify-content:center}
svg{width:min(${SPLASH_LOGO_WIDTH}px,80vw);height:auto;display:block}
</style></head><body>${SPLASH_SVG.replace(
  /^<\?xml[^>]*\?>\s*/,
  '',
)}<script>requestAnimationFrame(function(){requestAnimationFrame(function(){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('${PAINTED_MESSAGE}')})})</script></body></html>`;

type Props = { onFinish: () => void };

// Loaded lazily: importing react-native-webview throws if the native binary wasn't rebuilt with it.
function loadWebView(): ComponentType<WebViewProps> | null {
  try {
    if (!TurboModuleRegistry.get('RNCWebViewModule')) {
      return null;
    }
    return require('react-native-webview').WebView;
  } catch {
    return null;
  }
}

export function AnimatedSplash({ onFinish }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const launchHidden = useRef(false);
  const WebView = useRef(loadWebView()).current;

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
    if (!WebView) {
      console.warn(
        'react-native-webview is not in this native build; rebuild the app to see the animated splash.',
      );
      hideLaunchScreen();
    }
  }, [WebView, hideLaunchScreen]);

  const paintFallback = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (paintFallback.current) {
        clearTimeout(paintFallback.current);
      }
    },
    [],
  );
  const onWebViewLoadEnd = useCallback(() => {
    if (!paintFallback.current) {
      paintFallback.current = setTimeout(hideLaunchScreen, PAINT_FALLBACK_MS);
    }
  }, [hideLaunchScreen]);
  const onWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (event.nativeEvent.data === PAINTED_MESSAGE) {
        hideLaunchScreen();
      }
    },
    [hideLaunchScreen],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      hideLaunchScreen();
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onFinishRef.current());
    }, MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, [hideLaunchScreen, opacity]);

  return (
    <Animated.View
      testID="animated-splash"
      pointerEvents="none"
      style={[
        styles.container,
        { backgroundColor: manifest.background, opacity },
      ]}
    >
      {WebView ? (
        <WebView
          testID="animated-splash-webview"
          originWhitelist={['*']}
          source={{ html: SPLASH_HTML }}
          style={[styles.webview, { backgroundColor: manifest.background }]}
          scrollEnabled={false}
          bounces={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          // Script only posts the first-paint signal; the HTML is static and bundled with the app.
          javaScriptEnabled
          onMessage={onWebViewMessage}
          onLoadEnd={onWebViewLoadEnd}
          onError={hideLaunchScreen}
        />
      ) : (
        <Image
          testID="animated-splash-fallback"
          source={require('../../assets/bootsplash/logo.png')}
          style={[
            styles.fallback,
            { width: manifest.logo.width, height: manifest.logo.height },
          ]}
          resizeMode="contain"
        />
      )}
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
  fallback: {
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
});
