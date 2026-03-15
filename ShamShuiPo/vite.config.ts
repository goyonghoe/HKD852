import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    port: 5174,
    open: false,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    globals: false,
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
  },
});
