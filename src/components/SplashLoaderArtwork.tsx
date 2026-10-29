import { useState, type ComponentType } from 'react';
import { Image, Platform, StyleSheet, TurboModuleRegistry, View } from 'react-native';
import type { WebViewProps } from 'react-native-webview';
import { SvgXml } from 'react-native-svg';
import { LOADER_SVG } from '../assets/loaderSvg';

const svg = LOADER_SVG;
const webSource = { uri: '/loader.svg' };
const nativeSource = {
  html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:100%;height:100%;background:transparent;overflow:hidden}body{display:flex;align-items:center;justify-content:center}svg{display:block;width:100%;height:auto}</style></head><body>${svg}</body></html>`,
};

function loadWebView(): ComponentType<WebViewProps> | null {
  if (Platform.OS === 'web') return null;
  try {
    if (!TurboModuleRegistry.get('RNCWebViewModule')) return null;
    return require('react-native-webview').WebView;
  } catch {
    return null;
  }
}

export function SplashLoaderArtwork() {
  const [WebView] = useState(loadWebView);

  return (
    <View pointerEvents="none" style={styles.artwork}>
      {Platform.OS === 'web' ? (
        <Image source={webSource} style={styles.image} resizeMode="contain" />
      ) : WebView ? (
        <WebView
          source={nativeSource}
          style={styles.webview}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled={false}
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={(request) => request.url === 'about:blank'}
        />
      ) : (
        <SvgXml xml={svg} width="100%" height="100%" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  artwork: {
    width: 96,
    maxWidth: '85%',
    aspectRatio: 60 / 94,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});