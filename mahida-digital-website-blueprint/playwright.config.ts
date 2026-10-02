import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:3010',
    trace: 'retain-on-failure',
    launchOptions: {
      ...(process.env.PW_CHROMIUM_EXECUTABLE
        ? { executablePath: process.env.PW_CHROMIUM_EXECUTABLE }
        : {}),
      ...(process.env.PW_SINGLE_PROCESS === '1'
        ? { args: ['--single-process', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader'] }
        : {}),
    },
  },
  webServer: {
    command: 'npm run start -- --hostname 127.0.0.1 --port 3010',
    url: 'http://127.0.0.1:3010/masuk',
    timeout: 60_000,
    reuseExistingServer: false,
  },
});
