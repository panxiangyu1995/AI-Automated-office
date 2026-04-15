import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Vite options tailored for Tauri development
  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    proxy: {
      // API proxy configuration for development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  // Env variables starting with TAURI_ are exposed to the client
  envPrefix: ['VITE_', 'TAURI_'],

  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    // Don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunking
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-router')) {
              return 'vendor-react'
            }
            if (id.includes('@radix-ui')) {
              return 'vendor-radix'
            }
            if (
              id.includes('lucide-react') ||
              id.includes('zustand') ||
              id.includes('clsx') ||
              id.includes('tailwind-merge')
            ) {
              return 'vendor-utils'
            }
            return 'vendor-other'
          }
          // Feature chunking - split into separate chunks
          if (id.includes('/src/features/warehouse/')) {
            return 'feature-warehouse'
          }
          if (id.includes('/src/features/auth/')) {
            return 'feature-auth'
          }
          if (id.includes('/src/features/audit/')) {
            return 'feature-audit'
          }
          if (id.includes('/src/features/capability/')) {
            return 'feature-capability'
          }
          if (id.includes('/src/features/cards/')) {
            return 'feature-cards'
          }
          if (id.includes('/src/features/agent/')) {
            return 'feature-agent'
          }
          if (id.includes('/src/features/hr/')) {
            return 'feature-hr'
          }
          if (id.includes('/src/features/sales/')) {
            return 'feature-sales'
          }
          if (id.includes('/src/features/finance/')) {
            return 'feature-finance'
          }
          if (id.includes('/src/features/workspace/')) {
            return 'feature-workspace'
          }
          if (id.includes('/src/features/settings/')) {
            return 'feature-settings'
          }
          if (id.includes('/src/features/permission/')) {
            return 'feature-permission'
          }
          // Component chunks
          if (id.includes('/src/components/editor/')) {
            return 'components-editor'
          }
          if (id.includes('/src/components/common/')) {
            return 'components-common'
          }
          if (id.includes('/src/features/remotion/')) {
            return 'feature-remotion'
          }
        },
      },
    },
  },
})
