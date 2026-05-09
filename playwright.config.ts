import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const webServerCommand =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ??
  "npm run preview -- --host 127.0.0.1";

export default defineConfig({
  testDir: "./tests/smoke",
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: true,
  },
  use: {
    baseURL,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
