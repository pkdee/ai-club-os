#!/usr/bin/env bash
# 접근 규칙을 시험한다. Docker 에 빈 Postgres 를 띄우고, Supabase 의 최소 대역과 마이그레이션을 적용한 뒤
# tests/db 의 시험 파일을 하나씩 새 데이터베이스에서 돌린다. 실제 프로젝트에는 아무것도 보내지 않는다.
set -euo pipefail

cd "$(dirname "$0")/../.."

CONTAINER="ai-club-os-test-db"
IMAGE="postgres:17-alpine"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker 가 필요합니다. Docker 를 설치하고 실행한 뒤 다시 시도해 주세요." >&2
  exit 2
fi

cleanup() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT
cleanup

docker run -d --name "$CONTAINER" -e POSTGRES_PASSWORD=test "$IMAGE" >/dev/null

# 처음 켜질 때 준비용 서버가 한 번 떴다가 다시 시작하므로, 두 번 이어서 응답할 때까지 기다린다.
ready=0
for _ in $(seq 1 60); do
  if docker exec "$CONTAINER" psql -U postgres -qAt -c "select 1" >/dev/null 2>&1; then
    ready=$((ready + 1))
    [ "$ready" -ge 2 ] && break
  else
    ready=0
  fi
  sleep 0.5
done
if [ "$ready" -lt 2 ]; then
  echo "시험용 Postgres 가 켜지지 않았습니다." >&2
  exit 2
fi

# 한 파일을 한 데이터베이스에 적용한다. 오류가 나면 바로 멈춘다.
# 다시 실행해도 되게 쓴 마이그레이션이 내는 알림(없는 것을 지우려 했다는 말)은 감춘다.
apply() {
  docker exec -e PGOPTIONS="-c client_min_messages=warning" -i "$CONTAINER" \
    psql -U postgres -d "$1" -v ON_ERROR_STOP=1 -q <"$2" >/dev/null
}

# 시험마다 복사해 쓸 바탕 데이터베이스를 만든다.
docker exec "$CONTAINER" psql -U postgres -q -c "create database app_template" >/dev/null
apply app_template tests/db/support/00_supabase_stub.sql
for migration in supabase/migrations/*.sql; do
  apply app_template "$migration"
done
apply app_template tests/db/support/90_helpers.sql

fresh_database() {
  docker exec "$CONTAINER" psql -U postgres -q \
    -c "create database $1 template app_template" >/dev/null
}

passed=0
failed=0

for file in tests/db/*.test.sql; do
  name="$(basename "$file" .test.sql)"
  database="t_${name//[^a-z0-9_]/_}"
  fresh_database "$database"

  if ! output="$(docker exec -i "$CONTAINER" psql -U postgres -d "$database" -v ON_ERROR_STOP=1 -v VERBOSITY=terse -qAt <"$file" 2>&1)"; then
    echo "실패 $name: 시험 파일이 끝까지 실행되지 않았습니다."
    echo "$output" | sed 's/^/    /'
    failed=$((failed + 1))
    continue
  fi

  file_passed="$(printf '%s\n' "$output" | grep -c '^ok ' || true)"
  file_failed="$(printf '%s\n' "$output" | grep -c '^not ok ' || true)"
  passed=$((passed + file_passed))
  failed=$((failed + file_failed))

  if [ "$file_failed" -gt 0 ]; then
    echo "실패 $name: $file_failed 건"
    printf '%s\n' "$output" | grep '^not ok ' | sed 's/^/    /'
  elif [ "$file_passed" -eq 0 ]; then
    echo "실패 $name: 실행된 확인이 없습니다."
    failed=$((failed + 1))
  else
    echo "통과 $name: $file_passed 건"
  fi
done

# 두 운영자가 동시에 서로를 구성원으로 내리는 경우. 한 연결로는 재현할 수 없어 두 연결을 쓴다.
race_database="t_last_admin_race"
fresh_database "$race_database"
race_psql() {
  docker exec -i "$CONTAINER" psql -U postgres -d "$race_database" -v VERBOSITY=terse -qAt "$@" 2>&1
}
race_psql -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
select test.login('a');
insert into public.clubs (name) values ('동시 요청 시험');
select test.sudo($$ insert into public.members (club_id, user_id, role, display_name)
  select id, test.uid('b'), 'admin', '박서연' from public.clubs $$);
SQL

first_output="$(mktemp)"
race_psql >"$first_output" <<'SQL' &
begin;
select test.login('a');
update public.members set role = 'member' where user_id = test.uid('b');
select pg_sleep(2);
commit;
SQL
sleep 0.7
second_output="$(race_psql <<'SQL'
begin;
select test.login('b');
update public.members set role = 'member' where user_id = test.uid('a');
commit;
SQL
)"
wait
rm -f "$first_output"
admins_left="$(race_psql -c "select count(*) from public.members where role = 'admin'")"

if [ "$admins_left" = "1" ] && printf '%s' "$second_output" | grep -q "운영자가 한 명 이상"; then
  echo "통과 last_admin_race: 1 건"
  passed=$((passed + 1))
else
  echo "실패 last_admin_race: 남은 운영자 $admins_left 명"
  printf '%s\n' "$second_output" | sed 's/^/    /'
  failed=$((failed + 1))
fi

echo
echo "접근 규칙 시험: 통과 $passed 건, 실패 $failed 건"
[ "$failed" -eq 0 ]
