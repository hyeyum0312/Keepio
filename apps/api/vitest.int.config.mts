import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";

// 실제 PostgreSQL(DATABASE_URL_TEST)에 붙는 통합 테스트. 실행: npm run test:integration
export default defineConfig({
  plugins: [swc.vite({ module: { type: "es6" } })],
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.int.test.ts"],
    setupFiles: ["./vitest.int.setup.ts"],
    // 테스트 파일들이 같은 DB를 공유하므로 순서대로 실행한다
    fileParallelism: false,
  },
});
