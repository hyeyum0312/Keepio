#!/usr/bin/env bash
# CI 검사 범위 결정. 인자: 비교 기준 커밋(없으면 전체 검사).
# 출력(GITHUB_OUTPUT 형식): turbo=<turbo 추가 인자>, api=<true|false>
# - 기준과 비교해 바뀐 패키지(+그 패키지에 의존하는 패키지)만 검사한다(turbo --affected).
# - 패키지 밖이지만 결과에 영향을 주는 파일(prisma, CI 설정, scripts)이 바뀌면 전체 검사.
#   turbo는 prisma/schema.prisma 변경을 어느 패키지에도 연결하지 못한다(2026-10-29 확인).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

base="${1:-}"
full=""
if [ -z "$base" ] || [ -z "${base//0/}" ] || ! git cat-file -e "$base^{commit}" 2>/dev/null; then
  full="기준 커밋 없음"
elif git diff --name-only "$base" HEAD | grep -qE '^(prisma/|\.github/workflows/|scripts/)'; then
  full="prisma·CI 설정·scripts 변경"
fi

if [ -n "$full" ]; then
  echo "검사 범위: 전체 ($full)" >&2
  turbo=""
  export -n TURBO_SCM_BASE 2>/dev/null || true
else
  export TURBO_SCM_BASE="$base"
  turbo="--affected"
fi

packages="$(npx turbo ls $turbo --output=json 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).packages.items.map(p=>p.name).join(" ")))')"
echo "검사 대상: ${packages:-(없음)}" >&2

api=false
case " $packages " in *" @keepio/api "*) api=true ;; esac
echo "turbo=$turbo"
echo "api=$api"
