-- 검수 메모: 학생 화면 검수에서 문항마다 남기는 메모
alter table public.items add column if not exists review_note text;
