import { defineConfig } from "vite";

export default defineConfig({
  server: {
    open: false,
    port: 5174,
  },
  build: {
    target: "es2020",
    outDir: "dist",
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
