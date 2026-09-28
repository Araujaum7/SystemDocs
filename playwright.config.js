import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/frontend',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:7101',
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node tests/frontend/start-test-server.js',
    url: 'http://127.0.0.1:7101/api/health',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
