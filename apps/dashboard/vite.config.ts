import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/telescope/',
  resolve: {
    alias: {
      '@hono-telescope/types': resolve(__dirname, '../../packages/types/index.ts'),
    }
  },
  server: {
    port: 3001,
    proxy: {
      '/telescope/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: ['/@vite/client']
    }
  }
})