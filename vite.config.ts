import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-icon.svg"],
      manifest: {
        name: "HairSalon",
        short_name: "HairSalon",
        description: "Онлайн-запись к парикмахеру",
        theme_color: "#6D28D9",
        background_color: "#F5F3FF",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "/pwa-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml"
          }
        ]
      }
    })
  ],
  resolve: { alias: { "@": resolve("./src") } },
  server: { port: 3000, open: true, host: true },
  build: {
    outDir: "dist"
  },
  preview: { port: 3000 },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"]
  }
});