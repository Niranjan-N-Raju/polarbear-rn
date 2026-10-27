import { useEffect, useRef } from 'react';
import BootSplash from 'react-native-bootsplash';

export const MIN_SPLASH_MS = 1800;

type Props = { onFinish: () => void };

// On web the animated SVG in index.html is the splash; keep it visible long enough to be seen.
export function AnimatedSplash({ onFinish }: Props) {
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    const timer = setTimeout(() => {
      BootSplash.hide({ fade: true })
        .catch((error: unknown) => console.error('Unable to dismiss launch splash:', error))
        .finally(() => onFinishRef.current());
    }, MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
