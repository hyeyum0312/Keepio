-- FEAT-008 카테고리(링크당 0~1개, ADR-015). 별칭·태그 변경은 이후 범위.
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "normalized_name" VARCHAR(40) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- 같은 이름 금지. 동시 생성은 이 제약이 최종 권위(AC-02·08)
CREATE UNIQUE INDEX "categories_user_id_normalized_name_key" ON "categories"("user_id", "normalized_name");

ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- NULL = 미분류. 카테고리를 지우면 링크는 남고 미분류가 된다(AC-04)
ALTER TABLE "bookmarks" ADD COLUMN "category_id" UUID;

ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 카테고리별 활성 목록(AC-11 필터)과 링크 수 집계
CREATE INDEX "bookmarks_active_category_idx" ON "bookmarks"("user_id", "category_id", "created_at" DESC, "id" DESC) WHERE "deleted_at" IS NULL;
