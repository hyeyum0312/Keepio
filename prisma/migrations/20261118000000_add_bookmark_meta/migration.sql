-- CreateEnum
CREATE TYPE "thumbnail_status" AS ENUM ('pending', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "thumbnail_source" AS ENUM ('auto', 'upload');

-- AlterTable
ALTER TABLE "bookmarks" ADD COLUMN     "page_title" VARCHAR(300),
ADD COLUMN     "thumbnail_key" TEXT,
ADD COLUMN     "thumbnail_source" "thumbnail_source",
ADD COLUMN     "thumbnail_status" "thumbnail_status" NOT NULL DEFAULT 'failed',
ADD COLUMN     "title" VARCHAR(100);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "normalized_name" VARCHAR(60) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmark_tags" (
    "bookmark_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "bookmark_tags_pkey" PRIMARY KEY ("bookmark_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_user_id_normalized_name_key" ON "tags"("user_id", "normalized_name");

-- CreateIndex
CREATE INDEX "bookmark_tags_tag_id_idx" ON "bookmark_tags"("tag_id");

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmark_tags" ADD CONSTRAINT "bookmark_tags_bookmark_id_fkey" FOREIGN KEY ("bookmark_id") REFERENCES "bookmarks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmark_tags" ADD CONSTRAINT "bookmark_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Prisma가 표현하지 못하는 제약(수동 추가). 빈 이름·빈 제목을 막는다(FEAT-010 AC-01·02)
ALTER TABLE "tags" ADD CONSTRAINT "tags_name_length_check"
  CHECK (char_length("name") >= 1 AND char_length("normalized_name") >= 1);
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_title_length_check"
  CHECK ("title" IS NULL OR char_length("title") >= 1);

-- 롤백(Prisma Migrate에는 down이 없다. 태그·제목·썸네일 정보가 사라진다. 썸네일 파일은 STORAGE_DIR에서 따로 지운다):
-- DROP TABLE "bookmark_tags"; DROP TABLE "tags";
-- ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmarks_title_length_check", DROP COLUMN "title", DROP COLUMN "page_title",
--   DROP COLUMN "thumbnail_key", DROP COLUMN "thumbnail_status", DROP COLUMN "thumbnail_source";
-- DROP TYPE "thumbnail_status"; DROP TYPE "thumbnail_source";
-- DELETE FROM "_prisma_migrations" WHERE migration_name = '20261118000000_add_bookmark_meta';
