import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'TEST_'],
  resolve: {
    alias: [
      {
        find: 'react-native-safe-area-context',
        replacement: `${process.cwd()}/src/web/safeAreaContext.tsx`,
      },
      {
        find: 'lucide-react-native',
        replacement: 'lucide-react',
      },
      {
        find: /^react-native$/,
        replacement: `${process.cwd()}/node_modules/react-native-web`,
      },
    ],
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  }
});