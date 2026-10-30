-- 학습 메인 화면: 내가 학습 중인 교재 저장 + 교재/출판사 정보가 붙은 발행 단원 목록
alter table public.profiles add column if not exists current_book_id uuid references public.books(id) on delete set null;

-- 발행된 최신 번들 + 교재 정보. 번들은 이미 로그인한 누구나 읽을 수 있어서(bundles_read) 소유자 권한 뷰로 교재 정보를 붙인다.
create or replace view public.learner_units with (security_invoker = false) as
select lb.unit_id, lb.version, lb.bundle, lb.published_at,
       u.no as unit_no, u.title as unit_title,
       b.id as book_id, b.title as book_title, b.grade, p.name as publisher
  from public.latest_bundles lb
  join public.units u on u.id = lb.unit_id
  join public.books b on b.id = u.book_id
  join public.publishers p on p.id = b.publisher_id;
revoke all on public.learner_units from anon;
grant select on public.learner_units to authenticated;
