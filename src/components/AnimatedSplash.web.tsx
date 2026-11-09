import { useEffect, useRef } from 'react';

export const MIN_SPLASH_MS = 1500;

type Props = { onFinish: () => void };

// On web the animated SVG in index.html is the splash; keep it visible long enough to be seen.
export function AnimatedSplash({ onFinish }: Props) {
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    const timer = setTimeout(() => {
      const splash = document.getElementById('bootsplash');
      if (splash) {
        splash.style.transition = 'opacity 240ms ease';
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 240);
      }
      onFinishRef.current();
    }, MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
