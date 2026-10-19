import type { ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ResponsiveDrawerModalProps {
  visible: boolean;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  panelStyle?: StyleProp<ViewStyle>;
}

export function ResponsiveDrawerModal({ visible, closeLabel, onClose, children, panelStyle }: ResponsiveDrawerModalProps) {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isWeb ? 'fade' : 'slide'}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.root, isWeb && styles.webRoot]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          onPress={onClose}
          style={styles.scrim}
        />
        <View
          style={[
            styles.panel,
            isWeb ? styles.webPanel : styles.nativePanel,
            !isWeb && { paddingBottom: insets.bottom },
            panelStyle,
          ]}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  webRoot: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  panel: {
    minHeight: 0,
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
  },
  webPanel: {
    width: '30%',
    height: '100%',
    borderLeftWidth: 1,
    borderLeftColor: '#E8E4D7',
    shadowColor: '#24323A',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  nativePanel: {
    width: '100%',
    height: '70%',
    borderTopWidth: 1,
    borderTopColor: '#E8E4D7',
    shadowColor: '#24323A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
});