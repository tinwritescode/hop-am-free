import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // tsconfig keeps JSX as-is for Next; tests compile it themselves.
  oxc: { jsx: { runtime: "automatic" } },
});
