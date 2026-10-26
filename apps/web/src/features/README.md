# features

도메인별 기능 모듈(`bookmarks`, `categories`, `buckets`, `publications` …). 구조와 경계 규칙은 [FRONTEND.md](../../../../docs/standards/FRONTEND.md#structure-adr-002).

- 내부는 필요한 것만: `ui/`, `model/`, `api/`, `lib/`
- 다른 feature는 `index.ts`로만 import한다.
