import { configDefaults, defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    // e2e/ holds the Playwright browser tests (npm run test:e2e).
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
  resolve: {
    alias: {
      "@/frontend": fromRoot("./frontend"),
      "@/backend": fromRoot("./backend"),
      "@": fromRoot("./src"),
    },
  },
});
