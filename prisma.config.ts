import { defineConfig } from "prisma/config";

// 로컬은 루트 .env, CI·운영은 환경 변수로 DATABASE_URL을 받는다.
// PRISMA_TARGET=test 이면 통합 테스트 DB(DATABASE_URL_TEST)를 대상으로 한다.
try {
  process.loadEnvFile();
} catch {
  // .env가 없으면 이미 설정된 환경 변수를 쓴다
}

const urlKey =
  process.env.PRISMA_TARGET === "test" ? "DATABASE_URL_TEST" : "DATABASE_URL";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // generate는 접속 정보가 필요 없어 비어 있어도 진행한다. migrate는 빈 URL이면 Prisma가 실패시킨다.
  datasource: { url: process.env[urlKey] ?? "" },
});
