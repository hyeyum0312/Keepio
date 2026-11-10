-- CreateEnum
CREATE TYPE "email_token_purpose" AS ENUM ('verify_email', 'reset_password');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email" TEXT,
ADD COLUMN     "email_verified_at" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "password_credentials" (
    "user_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_credentials_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "token_hash" BYTEA NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "purpose" "email_token_purpose" NOT NULL,
    "token_hash" BYTEA NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_tokens_token_hash_key" ON "email_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "email_tokens_user_id_idx" ON "email_tokens"("user_id");

-- CreateIndex
CREATE INDEX "email_tokens_expires_at_idx" ON "email_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email") WHERE (email IS NOT NULL);

-- AddForeignKey
ALTER TABLE "password_credentials" ADD CONSTRAINT "password_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_tokens" ADD CONSTRAINT "email_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Prisma가 표현하지 못하는 제약(수동 추가). 앱 검증이 빠져도 정규화되지 않은 이메일로 UNIQUE를 우회하지 못하게 한다(FEAT-003 AC-02·AC-04)
ALTER TABLE "users" ADD CONSTRAINT "users_email_normalized_check"
  CHECK ("email" IS NULL OR ("email" = lower(btrim("email")) AND char_length("email") BETWEEN 3 AND 254));
-- SHA-256 결과만 저장한다
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_token_hash_length_check"
  CHECK (octet_length("token_hash") = 32);
ALTER TABLE "email_tokens" ADD CONSTRAINT "email_tokens_token_hash_length_check"
  CHECK (octet_length("token_hash") = 32);

-- 롤백(Prisma Migrate에는 down이 없다. 운영 데이터가 생긴 뒤에는 백업 후 실행. 비밀번호·세션이 모두 사라진다):
-- DROP TABLE "email_tokens"; DROP TABLE "refresh_tokens"; DROP TABLE "password_credentials";
-- DROP TYPE "email_token_purpose";
-- DROP INDEX "users_email_key";
-- ALTER TABLE "users" DROP CONSTRAINT "users_email_normalized_check", DROP COLUMN "email_verified_at", DROP COLUMN "email";
-- DELETE FROM "_prisma_migrations" WHERE migration_name = '20261110000000_add_auth';
