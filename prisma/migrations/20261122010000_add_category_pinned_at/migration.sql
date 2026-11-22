-- FEAT-008 AC-15 카테고리 고정(NULL = 고정 안 함). 고정한 순서대로 목록 맨 위에 둔다
ALTER TABLE "categories" ADD COLUMN "pinned_at" TIMESTAMPTZ(3);
