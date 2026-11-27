import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    base: '',
    build: {
        chunkSizeWarningLimit: 600,
        emptyOutDir: false,
        outDir: '../core/dashboard',
        reportCompressedSize: true,
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- rolldownOptions.codeSplitting takes a different shape; migrating it would change the dashboard's chunk layout
        rollupOptions: {
            output: {
                // eslint-disable-next-line @typescript-eslint/no-deprecated -- see the note on rollupOptions above
                manualChunks: id => {
                    if (id.includes('node_modules/antd')) {
                        return 'ui-antd'
                    }

                    if (id.includes('node_modules/react-router')) {
                        return 'router'
                    }

                    if (
                        id.includes('node_modules/react') ||
                        id.includes('node_modules/react-dom')
                    ) {
                        return 'react-core'
                    }

                    if (id.includes('node_modules/@uiw/react-json-view')) {
                        return 'ui-utils'
                    }

                    if (
                        id.includes('node_modules/dayjs') ||
                        id.includes('node_modules/pretty-ms')
                    ) {
                        return 'utils'
                    }
                },
            },
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router', 'antd'],
    },
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },
    root: 'src/dashboard',
    server: {
        port: 3001,
        proxy: {
            '/telescope/api': {
                changeOrigin: true,
                target: 'http://localhost:3000',
            },
        },
    },
})
