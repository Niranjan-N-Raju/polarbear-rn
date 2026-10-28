import { createContext, useCallback, useContext, useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

/** Renders content above an already-presented native Modal so callers never stack a second Modal (iOS freezes). */
export type OverlayHost = (key: string, node: ReactNode | null) => void;

export const OverlayHostContext = createContext<OverlayHost | null>(null);

export const useOverlayHost = () => useContext(OverlayHostContext);

export function OverlayHostProvider({ children }: PropsWithChildren) {
  const [overlays, setOverlays] = useState<Record<string, ReactNode>>({});
  const hostOverlay = useCallback<OverlayHost>((key, node) => {
    setOverlays(current => {
      const next = { ...current };
      if (node == null) delete next[key];
      else next[key] = node;
      return next;
    });
  }, []);

  return (
    <OverlayHostContext.Provider value={hostOverlay}>
      <View style={{ flex: 1 }}>
        {children}
        {Object.entries(overlays).map(([key, node]) => (
          <View
            key={key}
            style={StyleSheet.absoluteFill}
            pointerEvents="box-none"
          >
            {node}
          </View>
        ))}
      </View>
    </OverlayHostContext.Provider>
  );
}
