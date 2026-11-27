-- CreateIndex
CREATE INDEX "bookmarks_category_id_idx" ON "bookmarks"("category_id");


-- 카테고리 삭제(FEAT-008 AC-04) 때 FK ON DELETE SET NULL이 이 인덱스로 링크를 찾는다. 데이터 변경 없음.
-- 롤백(Prisma Migrate에는 down이 없다. 데이터 영향 없음):
-- DROP INDEX "bookmarks_category_id_idx";
-- DELETE FROM "_prisma_migrations" WHERE migration_name = '20261127010000_add_bookmarks_category_id_index';
