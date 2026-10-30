-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "original_url" TEXT NOT NULL,
    "normalized_url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookmarks_user_id_normalized_url_idx" ON "bookmarks"("user_id", "normalized_url");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_active_user_url_key" ON "bookmarks"("user_id", "normalized_url") WHERE (deleted_at IS NULL);

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Prisma가 표현하지 못하는 제약(수동 추가). 앱 검증이 빠져도 B-tree 인덱스 항목 한계 전에 막는다(FEAT-001 AC-06)
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_url_length_check"
  CHECK (char_length("original_url") <= 2048 AND char_length("normalized_url") <= 2048);

-- 롤백(Prisma Migrate에는 down이 없다. 운영 데이터가 생긴 뒤에는 백업 후 실행):
-- DROP TABLE "bookmarks"; DROP TABLE "users";
-- DELETE FROM "_prisma_migrations" WHERE migration_name = '<이 폴더 이름>';
