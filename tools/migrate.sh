#!/usr/bin/env bash
# supabase/migrations/*.sql 중 아직 적용 안 된 파일만 이름순으로 실행한다.
# 적용 기록은 public.schema_migrations 에 남긴다. 처음 만들어질 때는 BASELINE_UPTO(예: 0007) 이하 파일을 "이미 적용됨"으로 표시만 한다.
# 필요: DATABASE_URL (Supabase Session pooler 접속 문자열)
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL 이 필요해요}"
cd "$(dirname "$0")/../supabase/migrations"
# 접속 확인: 실패하면 원인을 GitHub 주석(::error::)으로 남긴다 (비밀번호는 출력되지 않음)
host=$(printf '%s' "$DATABASE_URL" | sed -E 's#^[a-z]+://[^@]*@##; s#[/?].*$##')
if ! err=$(psql "$DATABASE_URL" -qAt -c 'select 1' 2>&1 >/dev/null); then
  echo "::error::DB 접속 실패 (host=$host): $(printf '%s' "$err" | tr '\n' ' ' | cut -c1-300)"; exit 1
fi
P=(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -qAt)
fresh=$("${P[@]}" -c "select to_regclass('public.schema_migrations') is null")
"${P[@]}" -c "create table if not exists public.schema_migrations(name text primary key, applied_at timestamptz not null default now()); alter table public.schema_migrations enable row level security;"
if [ "$fresh" = "t" ] && [ -n "${BASELINE_UPTO:-}" ]; then
  for f in $(ls *.sql | sort); do
    if [[ "${f%%_*}" < "$BASELINE_UPTO" || "${f%%_*}" == "$BASELINE_UPTO" ]]; then
      "${P[@]}" -c "insert into public.schema_migrations(name) values ('$f') on conflict do nothing"; echo "baseline: $f"
    fi
  done
fi
n=0
for f in $(ls *.sql | sort); do
  done_=$("${P[@]}" -c "select 1 from public.schema_migrations where name='$f'")
  if [ -z "$done_" ]; then
    echo "apply: $f"
    "${P[@]}" -1 -f "$f"
    "${P[@]}" -c "insert into public.schema_migrations(name) values ('$f')"
    n=$((n+1))
  fi
done
echo "done. applied $n file(s)"
