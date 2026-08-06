import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI
const port = process.env.PW_PORT ?? '3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: isCI ? 2 : 1,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: isCI ? true : false,
    launchOptions: {
      slowMo: isCI ? 0 : 100,
    },
    actionTimeout: 15000,
  },
  expect: { timeout: 10000 },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: isCI ? false : true,
    timeout: 60000,
  },
})
