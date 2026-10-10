#!/usr/bin/env bash
# 손으로 적용할 마이그레이션을 한 번에 붙여 넣을 수 있게 이어 붙여서 내보낸다.
# 파일 사이에 commit 을 넣어서 파일마다 따로 잠그고 푼다. 여러 테이블을 한꺼번에 잠그면
# 켜져 있는 앱의 조회와 서로를 기다리다 멈출 수 있기 때문이다(docs/adr/0015-delete-rules.md).
# 중간에 멈추면 앞의 파일들은 이미 적용된 것이므로, 다시 실행해도 되게 쓴 파일에만 쓴다.
#
# 쓰는 법: npm run db:bundle -- <처음 적용할 파일 이름의 앞부분>
#   예: npm run --silent db:bundle -- 20261010160037 | pbcopy
set -euo pipefail

cd "$(dirname "$0")/.."

from="${1:-}"
if [ -z "$from" ]; then
  echo "처음 적용할 마이그레이션 파일 이름의 앞부분을 적어 주세요. 예: 20261010160037" >&2
  exit 2
fi

count=0
for file in supabase/migrations/*.sql; do
  name="$(basename "$file")"
  if [[ "$name" < "$from" ]]; then
    continue
  fi
  count=$((count + 1))
  printf -- '-- ===== %s =====\n\n' "$name"
  cat "$file"
  printf '\ncommit;\n\n'
done

if [ "$count" -eq 0 ]; then
  echo "그 이름부터 시작하는 마이그레이션이 없습니다: $from" >&2
  exit 1
fi
echo "마이그레이션 ${count}개를 이어 붙였습니다." >&2
