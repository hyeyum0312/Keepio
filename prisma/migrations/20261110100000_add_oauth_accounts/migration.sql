-- CreateEnum
CREATE TYPE "oauth_provider" AS ENUM ('google', 'kakao');

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "provider" "oauth_provider" NOT NULL,
    "subject" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "oauth_accounts_user_id_idx" ON "oauth_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_subject_key" ON "oauth_accounts"("provider", "subject");

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Prisma가 표현하지 못하는 제약(수동 추가). 제공자 ID의 비정상 값(빈 값·과도한 길이)을 막는다
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_subject_length_check"
  CHECK (char_length("subject") BETWEEN 1 AND 255);

-- 롤백(Prisma Migrate에는 down이 없다. 운영 데이터가 생긴 뒤에는 백업 후 실행. 소셜 전용 계정은 로그인 수단을 잃는다):
-- DROP TABLE "oauth_accounts"; DROP TYPE "oauth_provider";
-- DELETE FROM "_prisma_migrations" WHERE migration_name = '20261110100000_add_oauth_accounts';
