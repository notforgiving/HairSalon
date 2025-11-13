import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from 'path';


export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve("./src") } },
  server: { port: 3000, open: true, host: true },
  build: {
  outDir: "dist"
},
  preview: { port: 3000 },
  // Включаем SPA fallback
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});