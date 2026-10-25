-- 0025: 단어 그림 생성(OpenAI) 하루 사용량 기록. 서버 함수(service role)만 읽고 쓴다.
create table if not exists public.image_usage (
  user_id uuid not null,
  day date not null default (now() at time zone 'Asia/Seoul')::date,
  n int not null default 0,
  primary key (user_id, day)
);
alter table public.image_usage enable row level security;

create or replace function public.image_use(p_user uuid) returns int language sql security definer set search_path = public as $$
  insert into public.image_usage(user_id, day, n) values (p_user, (now() at time zone 'Asia/Seoul')::date, 1)
  on conflict (user_id, day) do update set n = public.image_usage.n + 1
  returning n;
$$;
revoke all on function public.image_use(uuid) from public, anon, authenticated;
