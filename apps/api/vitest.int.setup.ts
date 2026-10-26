// 통합 테스트는 DATABASE_URL_TEST만 사용한다. 개발 DB를 지우는 사고를 막기 위해
// DB 이름이 _test로 끝나지 않으면 실행하지 않는다.
try {
  process.loadEnvFile(new URL("../../.env", import.meta.url));
} catch {
  // CI는 환경 변수로 받는다
}

const testUrl = process.env.DATABASE_URL_TEST;
if (!testUrl) {
  throw new Error("DATABASE_URL_TEST is not set (see docs/SETUP.md)");
}
if (!new URL(testUrl).pathname.endsWith("_test")) {
  throw new Error(
    "DATABASE_URL_TEST must point to a database whose name ends with _test",
  );
}

// PrismaService는 DATABASE_URL을 읽으므로 테스트 DB로 바꿔 둔다
process.env.DATABASE_URL = testUrl;
