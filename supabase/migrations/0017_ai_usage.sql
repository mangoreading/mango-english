-- 0017: AI 도우미(힌트·대화) 하루 사용량 기록. 서버 함수(service role)만 읽고 쓴다.
create table if not exists public.ai_usage (
  user_id uuid not null,
  day date not null default (now() at time zone 'Asia/Seoul')::date,
  n int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security; -- 정책 없음 = 앱에서는 접근 불가

create or replace function public.ai_use(p_user uuid) returns int language sql security definer set search_path = public as $$
  insert into public.ai_usage(user_id, day, n) values (p_user, (now() at time zone 'Asia/Seoul')::date, 1)
  on conflict (user_id, day) do update set n = public.ai_usage.n + 1
  returning n;
$$;
revoke all on function public.ai_use(uuid) from public, anon, authenticated;
