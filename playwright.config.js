import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 30000, fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: { command: 'node tests/test-server.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI, timeout: 15000 },
  reporter: [['list']]
});
