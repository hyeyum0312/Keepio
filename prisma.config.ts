import { defineConfig, env } from "prisma/config";

// 로컬은 루트 .env, CI·운영은 환경 변수로 DATABASE_URL을 받는다
try {
  process.loadEnvFile();
} catch {
  // .env가 없으면 이미 설정된 환경 변수를 쓴다
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
