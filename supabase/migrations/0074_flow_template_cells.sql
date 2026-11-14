-- 0074: 흐름 템플릿을 출판사 × 학년 칸으로 구분 (출판사마다 같은 학년이라도 흐름이 다를 수 있음)
alter table public.flow_templates add column if not exists publisher_id uuid references public.publishers(id) on delete restrict;
alter table public.flow_templates add column if not exists grade smallint check (grade between 1 and 6);

-- 지금까지 만든 템플릿은 모두 비상교육 초5
update public.flow_templates
   set publisher_id = (select id from public.publishers where name = '비상교육'), grade = 5
 where publisher_id is null;

-- 이름은 칸(출판사·학년) 안에서만 겹치지 않으면 된다
alter table public.flow_templates drop constraint if exists flow_templates_name_key;
create unique index if not exists flow_templates_cell_name on public.flow_templates(publisher_id, grade, name);
