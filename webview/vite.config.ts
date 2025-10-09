import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'src'),
  build: {
    outDir: resolve(__dirname, '../media'),
    emptyOutDir: false,
    rollupOptions: {
      input: {
        'command-bar': resolve(__dirname, 'src/command-bar/index.html'),
      },
      output: {
        entryFileNames: '[name].bundle.js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'css/[name].[ext]';
          }
          return 'assets/[name].[ext]';
        },
      },
    },
  },
  server: {
    port: 3000,
  },
});