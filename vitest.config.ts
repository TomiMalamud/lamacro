import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    watch: false,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
});
