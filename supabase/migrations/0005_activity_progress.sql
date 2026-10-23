-- 0005: 활동별 진도 (이어하기/완료 표시/7차시 결과 → 8차시 맞춤)
-- lesson 1~8 = 차시 활동, lesson 90 = Reading Pack (act_idx = 원서 번호)
create table if not exists activity_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  level item_level not null,
  lesson smallint not null,
  act_idx smallint not null,
  stars smallint not null default 0,
  ok int not null default 0,
  total int not null default 0,
  detail jsonb,                      -- 7차시: { tags, plan, review, correct, total }
  updated_at timestamptz not null default now(),
  primary key (user_id, unit_id, level, lesson, act_idx)
);
alter table activity_progress enable row level security;

create policy ap_self on activity_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ap_staff on activity_progress for select using (
  is_hq() or teaches_student(user_id)
  or (app_role() = 'org_admin' and exists (select 1 from profiles p where p.id = user_id and p.org_id = app_org()))
  or exists (select 1 from guardians g where g.parent_id = auth.uid() and g.student_id = user_id));
