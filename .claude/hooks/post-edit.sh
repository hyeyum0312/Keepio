#!/usr/bin/env bash
# Claude Code PostToolUse(Edit|Write): 편집한 파일 하나만 Prettier로 정리하고,
# apps/web 의 ts/tsx 는 ESLint 결과를 exit 2 로 Claude 에게 돌려준다.
set -uo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
file="$(jq -r '.tool_response.filePath // .tool_input.file_path // empty')"
[ -n "$file" ] && [ -f "$file" ] || exit 0
case "$file" in "$root"/*) ;; *) exit 0 ;; esac

# 한글 경로를 절대경로로 넘기면 .prettierignore 가 적용되지 않아 저장소 기준 상대경로로 넘긴다
(cd "$root" && node_modules/.bin/prettier --write --ignore-unknown --log-level warn "${file#"$root"/}") >/dev/null 2>&1

case "$file" in
  "$root"/apps/web/*.ts | "$root"/apps/web/*.tsx | "$root"/apps/web/*.mjs)
    # 한글 경로는 절대경로 비교가 어긋날 수 있어 apps/web 기준 상대경로로 넘긴다
    rel="${file#"$root"/apps/web/}"
    if ! out="$(cd "$root/apps/web" && "$root/node_modules/.bin/eslint" --max-warnings 0 "$rel" 2>&1)"; then
      echo "ESLint 위반 — 규칙을 완화하지 말고 코드를 고칠 것:" >&2
      echo "$out" >&2
      exit 2
    fi
    ;;
esac
exit 0
