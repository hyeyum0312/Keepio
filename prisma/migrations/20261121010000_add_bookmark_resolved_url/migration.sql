-- 리다이렉트를 따라간 마지막 주소(FEAT-010 AC-19). 기존 행은 비워 둔다
ALTER TABLE "bookmarks" ADD COLUMN "resolved_url" VARCHAR(2048);
