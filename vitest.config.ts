import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    environmentOptions: {
      happyDOM: {
        url: 'http://localhost:5002/',
      },
    },
    setupFiles: ['./test/setup.ts'],
    include: ['test/{unit,integration,e2e}/**/*.test.{ts,tsx}'],
    env: {
      VITE_APP1_URL: 'http://localhost:5001',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/*.css'],
      reportOnFailure: true,
    },
  },
})
