#!/usr/bin/env bash
# 커밋 메시지·PR 본문에 AI 작성자 표시(Co-Authored-By: Claude 등)가 있으면 실패한다.
# GitHub는 이 표시로 기여자 그래프에 AI를 올리고, squash merge는 PR 커밋의 표시를 dev로 옮긴다.
# 사용:
#   check-ai-attribution.sh --file <메시지 파일>   (commit-msg hook)
#   check-ai-attribution.sh --revs <git log 범위…>  (CI: PR에서 새로 들어오는 커밋)
#   check-ai-attribution.sh --stdin                (CI: PR 제목·본문)
set -euo pipefail

# trailer는 줄 맨 앞에 온다. 규칙을 설명하는 문장(본문 중간의 "Co-Authored-By: Claude")은 통과시킨다
pattern='^[[:space:]]*co-authored-by:.*(claude|anthropic)|generated with \[claude'

fail() {
  echo "AI 작성자 표시 금지: $1" >&2
  echo "→ 해당 줄을 지운다. 설정: .claude/settings.json attribution (빈 값 유지)" >&2
  exit 1
}

case "${1:-}" in
  --file)
    # 주석 줄(#)은 git이 메시지에서 지우므로 검사하지 않는다
    if grep -v '^#' "$2" | grep -Eiq "$pattern"; then fail "커밋 메시지"; fi
    ;;
  --revs)
    shift
    bad="$(git log --format='%h' "$@" | while read -r h; do
      if git log -1 --format=%B "$h" | grep -Eiq "$pattern"; then echo "$h"; fi
    done)"
    if [ -n "$bad" ]; then fail "커밋 $(echo "$bad" | tr '\n' ' ')"; fi
    ;;
  --stdin)
    if grep -Eiq "$pattern"; then fail "PR 제목·본문"; fi
    ;;
  *)
    echo "usage: $0 --file <path> | --revs <rev…> | --stdin" >&2
    exit 2
    ;;
esac
