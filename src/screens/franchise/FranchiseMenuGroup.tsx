import { useEffect, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import type { Store } from '../../icons';
import { ChevronRight } from '../../icons';
import { theme } from '../../config/theme';
import { franchiseStyles as styles } from './franchiseStyles';

interface FranchiseMenuGroupProps extends PropsWithChildren {
  label: string;
  Icon: typeof Store;
  expanded: boolean;
  onPress: () => void;
}

export function FranchiseMenuGroup({ label, Icon, expanded, onPress, children }: FranchiseMenuGroupProps) {
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [expanded, progress]);

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded }}
        onPress={onPress}
        style={styles.groupButton}
      >
        <Icon size={20} color={theme.colors.muted} />
        <Text style={styles.group}>{label}</Text>
        <Animated.View style={{ transform: [{ rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) }] }}>
          <ChevronRight size={18} color={theme.colors.muted} />
        </Animated.View>
      </Pressable>
      <Animated.View
        style={[styles.submenu, {
          height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, contentHeight] }),
          opacity: progress,
        }]}
        pointerEvents={expanded ? 'auto' : 'none'}
        accessibilityElementsHidden={!expanded}
        importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
      >
        <View
          style={styles.submenuContent}
          onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
}
