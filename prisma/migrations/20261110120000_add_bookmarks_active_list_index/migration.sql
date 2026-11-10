-- CreateIndex
CREATE INDEX "bookmarks_active_list_idx" ON "bookmarks"("user_id", "created_at" DESC, "id" DESC) WHERE (deleted_at IS NULL);


-- 롤백(Prisma Migrate에는 down이 없다. 데이터 영향 없음):
-- DROP INDEX "bookmarks_active_list_idx";
-- DELETE FROM "_prisma_migrations" WHERE migration_name = '20261110120000_add_bookmarks_active_list_index';
