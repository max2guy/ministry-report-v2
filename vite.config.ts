import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8")) as { version: string };
const base = process.env.GITHUB_ACTIONS ? "/ministry-report-v2/" : "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-cache" },
          },
        ],
      },
      includeAssets: ["icon.svg", "apple-touch-icon-180x180.png", "pwa-64x64.png"],
      manifest: {
        name: "사역보고서 v2",
        short_name: "사역보고서",
        description: "주일 사역 출결 및 현황 보고서",
        start_url: base,
        scope: base,
        display: "standalone",
        background_color: "#24564a",
        theme_color: "#000000",
        lang: "ko",
        icons: [
          { src: "pwa-64x64.png",              sizes: "64x64",    type: "image/png" },
          { src: "pwa-192x192.png",             sizes: "192x192",  type: "image/png" },
          { src: "pwa-512x512.png",             sizes: "512x512",  type: "image/png", purpose: "any" },
          { src: "maskable-icon-512x512.png",   sizes: "512x512",  type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    exclude: ["node_modules/**", "dist/**", "tests/smoke/**", ".worktrees/**"],
    environment: "jsdom",
  },
});
