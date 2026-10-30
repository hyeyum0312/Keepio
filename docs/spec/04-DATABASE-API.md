# keepio — 데이터베이스 및 API 설계 v0.3

## 논리 모델

- User 1:N Bookmark/Category/Tag/Bucket/Publication
- Bookmark N:M Category (`bookmark_categories`)
- Bookmark N:M Tag (`bookmark_tags`)
- Bookmark N:M Bucket (`bucket_items`)
- Publication 1:N PublicationVersion; Publication N:1 Template
- PublicationVersion의 `content_json`은 공개 시점 스냅샷

## 주요 테이블

| 테이블               | 주요 필드                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| users                | id, email, plan_id                                                                                          |
| bookmarks            | id, user_id, original_url, normalized_url, title, description, thumbnail, classification_status, deleted_at |
| categories           | id, user_id, name, normalized_name                                                                          |
| category_aliases     | id, category_id, alias                                                                                      |
| bookmark_categories  | bookmark_id, category_id                                                                                    |
| tags                 | id, user_id, name                                                                                           |
| bookmark_tags        | bookmark_id, tag_id                                                                                         |
| buckets              | id, user_id, title, description                                                                             |
| bucket_items         | bucket_id, bookmark_id, sort_order                                                                          |
| templates            | id, name, schema_version, config                                                                            |
| publications         | id, user_id, slug, template_id, status, published_version_id                                                |
| publication_versions | id, publication_id, version, content_json, created_at                                                       |
| plan_limits          | plan_id, resource_type, limit_value                                                                         |
| usage_counters       | user_id, resource_type, period, used                                                                        |
| outbox_events        | id, type, payload, created_at, delivered_at                                                                 |

모든 사용자 소유 데이터에 소유권 검증을 적용. 생성/수정 시각과 필요한 외래 키는 실제 마이그레이션에 포함.

## 핵심 제약

- `bookmark_categories(bookmark_id, category_id)` UNIQUE
- `bookmark_tags(bookmark_id, tag_id)` UNIQUE
- `bucket_items(bucket_id, bookmark_id)` UNIQUE
- `categories(user_id, normalized_name)` UNIQUE
- `publications(slug)` UNIQUE
- `bookmarks(user_id, normalized_url) WHERE deleted_at IS NULL` 부분 UNIQUE 인덱스
- Prisma가 직접 표현하기 어려운 DB 인덱스는 SQL 마이그레이션으로 관리
- 연결 대상이 같은 사용자 소유인지 서비스 계층에서 검증; 필요하면 DB 레벨 제약 보강

## URL 정책

- 사용자별 동일 정규화 URL은 기존 Bookmark 재사용.
- 정규화 시 호스트/스킴/기본 포트/추적 파라미터를 보수적으로 처리. 제거하는 추적 파라미터: `utm_source`·`utm_medium`·`utm_campaign`·`utm_term`·`utm_content`·`fbclid`·`gclid`·`igshid`(FEAT-001). 목록 변경은 기존 저장분의 정규화 결과를 바꾸므로 별도 결정으로 한다.
- `http`/`https`만 허용. 입력·정규화 결과 모두 2048자 이하(유니크 인덱스 항목 크기 한계).
- `POST /api/bookmarks`는 신규 `201`, 기존 `200`(같은 body).
- 경로·쿼리·fragment는 콘텐츠 구분에 쓰일 수 있으므로 일괄 제거 금지.
- Soft Delete된 동일 URL 재저장 시 저장하지 않고 `409` + 기존 ID로 복구를 안내한다(D-01 결정, FEAT-001 AC-07).

## API 목록

| Method       | Path                            | 기능                   |
| ------------ | ------------------------------- | ---------------------- |
| POST         | /api/bookmarks                  | 링크 저장 및 중복 반환 |
| GET          | /api/bookmarks                  | 검색·필터·페이지네이션 |
| PATCH        | /api/bookmarks/:id              | 링크 수정              |
| DELETE       | /api/bookmarks/:id              | Soft Delete            |
| POST         | /api/bookmarks/:id/restore      | 복구                   |
| POST         | /api/bookmarks/bulk             | 일괄 분류/연결         |
| POST         | /api/bookmarks/:id/classify     | AI 분류 요청           |
| GET/POST     | /api/categories                 | 카테고리 조회/생성     |
| PATCH/DELETE | /api/categories/:id             | 수정/삭제              |
| GET/POST     | /api/buckets                    | 버킷 조회/생성         |
| PUT          | /api/buckets/:id/items          | 버킷 구성/순서         |
| GET          | /api/templates                  | 템플릿 조회            |
| GET/POST     | /api/publications               | 발행물 조회/초안 생성  |
| PATCH        | /api/publications/:id           | 초안 수정              |
| POST         | /api/publications/:id/publish   | 발행/수정 발행         |
| POST         | /api/publications/:id/unpublish | 발행 취소              |
| GET          | /p/:slug                        | 공개 페이지            |
| GET          | /api/usage                      | 사용량 조회            |

## 저장 응답 예시

```json
{
  "bookmark": {
    "id": "bm_123",
    "url": "https://example.com/hotel",
    "categoryIds": ["cat_travel", "cat_stay"],
    "classificationStatus": "completed"
  },
  "created": false,
  "alreadyExists": true
}
```

## AI 분류 계약 예시

```json
{
  "existing_category_ids": ["cat_travel", "cat_stay"],
  "suggested_categories": [],
  "suggested_tags": ["제주", "오션뷰"],
  "bucket_suggestions": ["제주 숙소 후보"],
  "confidence": 0.92,
  "requires_review": false
}
```

AI confidence는 모델의 자기 평가값으로 취급하며 자동 적용 기준은 실제 검증 결과로 조정.

## 발행 스냅샷 예시

```json
{
  "title": "제주 여행 숙소 추천",
  "template": "magazine",
  "schemaVersion": 1,
  "blocks": [
    { "id": "b1", "type": "heading", "text": "내가 고른 제주 숙소" },
    { "id": "b2", "type": "image", "assetId": "asset_cover" },
    {
      "id": "b3",
      "type": "link_card",
      "sourceBookmarkId": "bm_123",
      "url": "https://example.com/hotel",
      "title": "추천 숙소",
      "description": "오션뷰 숙소"
    }
  ]
}
```

`sourceBookmarkId`는 추적용이며 공개 렌더링은 스냅샷 값 사용. 발행 상태는 draft/published/unpublished. 공개 버전 포인터 변경은 트랜잭션으로 수행.
