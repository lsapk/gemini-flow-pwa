import { defineConfig, devices } from "@playwright/test";
const channel = process.env.PLAYWRIGHT_CHANNEL || (process.platform === "win32" ? "chrome" : undefined);
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:8080",
    trace: "retain-on-failure",
    channel,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
        channel,
      },
    },
  ],
  webServer: {
    command: "npm run build -- --outDir .browser-dist && npm run preview -- --outDir .browser-dist --port 8080",
    url: "http://127.0.0.1:8080",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: "http://127.0.0.1:54321",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_browser_test",
    },
  },
});
