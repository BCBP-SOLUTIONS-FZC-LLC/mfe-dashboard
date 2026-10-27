import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'
import { defineConfig } from 'vite'
import moduleFederationConfig from './module-federation.config.ts'

export default defineConfig({
  plugins: [tailwindcss(), react(), federation(moduleFederationConfig)],
  server: {
    port: 5002,
    strictPort: true,
    origin: 'http://localhost:5002',
    cors: true,
  },
  preview: {
    port: 5002,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    modulePreload: false,
    minify: false,
    cssCodeSplit: false,
  },
})
