-- 0027: 교재(책) 표지 + 책 1권 = 한 학년 12 Lesson
alter table public.books add column if not exists cover_url text;
alter table public.books add column if not exists lessons smallint not null default 12;
alter table public.publishers add column if not exists sort smallint not null default 0;

insert into storage.buckets (id, name, public) values ('book-covers', 'book-covers', true) on conflict (id) do nothing;
create policy bc_hq_insert on storage.objects for insert to authenticated with check (bucket_id = 'book-covers' and is_hq());
create policy bc_hq_update on storage.objects for update to authenticated using (bucket_id = 'book-covers' and is_hq()) with check (bucket_id = 'book-covers' and is_hq());
create policy bc_hq_delete on storage.objects for delete to authenticated using (bucket_id = 'book-covers' and is_hq());

-- 단원 종류(Lesson / Review)와 책 안의 순서
alter table public.units add column if not exists kind text not null default 'lesson' check (kind in ('lesson','review'));
alter table public.units add column if not exists seq smallint;
update public.units set seq = no where seq is null;

-- 비상교육 초5 목차 (Lesson 1~12 + Review 1·2). 이미 있는 단원은 건드리지 않는다. Review 의 no 는 101, 102.
insert into public.units(book_id, no, title, kind, seq)
select b.id, v.no, v.title, v.kind, v.seq
from public.books b
join public.publishers p on p.id = b.publisher_id and p.name = '비상교육'
cross join (values
  (1,  'Where Are You From?',            'lesson', 1),
  (2,  'Whose Umbrella Is This?',        'lesson', 2),
  (3,  'My Favorite Subject Is Art',     'lesson', 3),
  (4,  'She Has Long Curly Hair',        'lesson', 4),
  (5,  'Can I Take a Picture?',          'lesson', 5),
  (6,  'I Want to Grow Tomatoes',        'lesson', 6),
  (101,'Review 1',                       'review', 7),
  (7,  'I Visited My Grandparents',      'lesson', 8),
  (8,  'What Time Do You Get Up?',       'lesson', 9),
  (9,  'How Much Are These Socks?',      'lesson', 10),
  (10, 'Would You Like Some Spaghetti?', 'lesson', 11),
  (11, 'Where Is the Fun Park?',         'lesson', 12),
  (12, 'What Will You Do This Winter?',  'lesson', 13),
  (102,'Review 2',                       'review', 14)
) as v(no, title, kind, seq)
where b.grade = 5 and b.title = '비상교육 초5 영어'
on conflict (book_id, no) do update set seq = excluded.seq, kind = excluded.kind;
