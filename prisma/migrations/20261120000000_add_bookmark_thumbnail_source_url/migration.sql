-- og:image 원본 주소(FEAT-010 AC-11). 기존 행은 비워 둔다
ALTER TABLE "bookmarks" ADD COLUMN "thumbnail_source_url" VARCHAR(2048);
