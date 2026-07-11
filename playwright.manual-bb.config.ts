import { defineConfig, devices } from '@playwright/test';

const useExternalServer = process.env.MANUAL_BB_EXTERNAL_SERVER === '1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:1420',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'system-chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
  ...(useExternalServer
    ? {}
    : {
      webServer: {
        command: 'npm run dev',
        url: 'http://127.0.0.1:1420',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
    }),
});
