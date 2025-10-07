import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // Base is env-driven for multi-host deploys
  // - GitHub Pages: leave undefined to default to /AngelicWaves/
  // - Heroku: set VITE_PUBLIC_BASE=/ in Config Vars
  base: process.env.VITE_PUBLIC_BASE ?? (mode === 'development' ? '/' : '/AngelicWaves/'),
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 3000,
    open: true,
  },
}));
