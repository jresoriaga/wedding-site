import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./app/lib/__tests__/setup.ts'],
    css: true,
    server: {
      deps: {
        // @react-pdf/renderer uses browser canvas APIs — exclude from Vite transform
        // so vi.mock() can intercept it cleanly without crashing the test bundler
        external: ['@react-pdf/renderer'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
