import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@/frontend": path.resolve(__dirname, "./frontend"),
      "@/backend": path.resolve(__dirname, "./backend"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
