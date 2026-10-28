#!/usr/bin/env bash
# api 코드에서 OpenAPI·클라이언트를 다시 생성해, 커밋된 생성물과 다르면 실패한다.
# 실패하면 생성물은 이미 갱신된 상태이므로 diff를 검토하고 함께 커밋한다.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

snapshot() { find packages/api-client/openapi.json packages/api-client/src/generated -type f -print0 | sort -z | xargs -0 shasum | shasum; }

before="$(snapshot)"
npm run --silent openapi:generate >/dev/null
after="$(snapshot)"

if [ "$before" != "$after" ]; then
  echo "OpenAPI/api-client가 코드와 달랐다. 재생성했으니 검토 후 커밋: git diff -- packages/api-client" >&2
  git diff --stat -- packages/api-client >&2 || true
  exit 1
fi
