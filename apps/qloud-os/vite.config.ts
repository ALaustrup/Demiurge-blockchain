import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Workspace aliases - PHASE OMEGA
      '@demiurge/dns-service': path.resolve(__dirname, '../../apps/dns-service/src'),
      '@demiurge/ts-sdk': path.resolve(__dirname, '../../sdk/ts-sdk/src'),
      '@demiurge/schema': path.resolve(__dirname, '../../sdk/schema'),
      // QOR OS internal aliases
      '@abyssos/core': path.resolve(__dirname, './src/core'),
      '@abyssos/crypto': path.resolve(__dirname, './src/crypto'),
      '@abyssos/desktop': path.resolve(__dirname, './src/desktop'),
      '@abyssos/services': path.resolve(__dirname, './src/services'),
      '@abyssos/themes': path.resolve(__dirname, './src/themes'),
      '@abyssos/fractall': path.resolve(__dirname, './src/fractall'),
      '@abyssos/abyssid': path.resolve(__dirname, './src/abyssid'),
      '@abyssos/drc369': path.resolve(__dirname, './src/drc369'),
      '@abyssos/radio': path.resolve(__dirname, './src/radio'),
    }
  },
  server: {
    port: 3001,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Ensure public assets (including video) are copied
    copyPublicDir: true
  },
  // Public directory configuration
  publicDir: 'public'
})

