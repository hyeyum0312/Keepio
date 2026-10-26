import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";

// Nest DI는 데코레이터 메타데이터가 필요해 esbuild 대신 SWC로 변환한다
export default defineConfig({
  plugins: [swc.vite({ module: { type: "es6" } })],
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", "dist", "src/**/*.int.test.ts"],
  },
});
