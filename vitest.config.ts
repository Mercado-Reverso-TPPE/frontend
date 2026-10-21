import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Configuração de testes, separada de `vite.config.ts` — aquele arquivo é
 * gerenciado pelo Figma Make e carrega plugins de build que os testes não usam.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/testes/setup.ts"],
    include: ["src/testes/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/testes/**", "src/dados/**", "src/main.tsx", "src/**/*.d.ts"],
    },
  },
});
