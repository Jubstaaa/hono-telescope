import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '',
  root: 'src/dashboard',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@types': path.resolve(__dirname, './src/types'),
      '@core': path.resolve(__dirname, './src/core'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/telescope/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../core/dashboard',
    emptyOutDir: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      mangle: true,
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Ant Design - UI components
          if (id.includes('node_modules/antd')) {
            return 'ui-antd';
          }

          // React Router - routing
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }

          // State Management - Redux
          if (id.includes('node_modules/@reduxjs/toolkit') || id.includes('node_modules/redux')) {
            return 'state';
          }

          // Core React
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-core';
          }

          // UI Utilities
          if (id.includes('node_modules/@uiw/react-json-view')) {
            return 'ui-utils';
          }

          // HTTP & API
          if (id.includes('node_modules/axios')) {
            return 'http';
          }

          // Utilities
          if (
            id.includes('node_modules/dayjs') ||
            id.includes('node_modules/pretty-ms') ||
            id.includes('node_modules/lodash')
          ) {
            return 'utils';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
    reportCompressedSize: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router', 'antd', '@reduxjs/toolkit', 'redux'],
  },
});
