import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Unit tests only. The Playwright e2e specs under e2e/ use @playwright/test
    // and fail to load under vitest, so exclude them — `npm test` stays clean.
    include: ['src/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/lib/**'],
      exclude: ['src/generated/**', '**/*.test.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
