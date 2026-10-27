import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

/** Renders content above an already-presented native Modal so callers never stack a second Modal (iOS freezes). */
export type OverlayHost = (key: string, node: ReactNode | null) => void;

export const OverlayHostContext = createContext<OverlayHost | null>(null);

export const useOverlayHost = () => useContext(OverlayHostContext);
