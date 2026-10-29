import { Image, StyleSheet, View } from 'react-native';

export function SplashLoaderArtwork() {
  return (
    <View pointerEvents="none" style={styles.artwork}>
      <Image source={{ uri: '/loader.svg' }} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  artwork: { width: 96, maxWidth: '85%', aspectRatio: 60 / 94 },
  image: { width: '100%', height: '100%' },
});