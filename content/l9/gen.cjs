// 사용: node content/l9/gen.cjs <schema.cjs 경로>  → supabase/migrations/0049_l9_core_content.sql 생성 (모든 문항을 zod 로 검증)
const fs = require('fs'); const path = require('path');
const { ActivityItem } = require(path.resolve(process.argv[2]));
const { L } = require('./items.cjs');
const rows = []; let bad = 0;
for (const [key, st] of Object.entries(L)) {
  const [lesson, pos] = key.split('-').map(Number);
  st.items.forEach((p, n) => {
    const r = ActivityItem.safeParse(p);
    if (!r.success) { bad++; console.error('INVALID', key, n, JSON.stringify(r.error.issues).slice(0, 300)); return; }
    rows.push({ lesson, pos, n, kind: st.kind, tag: st.tag, payload: r.data });
  });
}
if (bad) process.exit(1);
const json = JSON.stringify(rows);
if (json.includes('$j$')) throw new Error('dollar quote clash');
const sql = `-- 비상교육 초5 영어 Lesson 9 · 1~6차시 CORE 문항 초안 (draft). 직접 쓴 연습 문항, content/l9/items.cjs 에서 생성.
-- 1) 기존 내용 백업 2) 1~6차시 칸 구성을 '비상 초5 6차시' 템플릿으로 다시 맞춤(7·8차시는 그대로) 3) 문항 삽입
create schema if not exists backup_20261029;
create table if not exists backup_20261029.items as select * from public.items;
create table if not exists backup_20261029.flow_lessons as select * from public.flow_lessons;
create table if not exists backup_20261029.flow_steps as select * from public.flow_steps;
revoke all on schema backup_20261029 from anon, authenticated;

do $do$
declare v_unit uuid; v_tpl uuid; rl record; rs record; v_lesson uuid; v_n int; v_miss int;
begin
  select u.id into v_unit from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9;
  select id into v_tpl from flow_templates where name = '비상 초5 6차시';
  if v_unit is null or v_tpl is null then raise exception 'L9 unit or template not found'; end if;

  delete from items where unit_id = v_unit and lesson between 1 and 6;
  delete from flow_lessons where unit_id = v_unit and no between 1 and 6;

  for rl in select * from flow_lessons where template_id = v_tpl and no between 1 and 6 order by no loop
    insert into flow_lessons(unit_id, no, en, ko, goal, color, track, src_id) values (v_unit, rl.no, rl.en, rl.ko, rl.goal, rl.color, rl.track, rl.id) returning id into v_lesson;
    for rs in select * from flow_steps where lesson_id = rl.id order by pos loop
      insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special, kind, qty, homework, study, src_id) values (v_lesson, rs.pos, rs.name_en, rs.name_ko, rs.minutes, rs.special, rs.kind, rs.qty, rs.homework, rs.study, rs.id);
    end loop;
  end loop;
  update flow_steps u set ref_step_id = (select x.id from flow_steps x join flow_lessons xl on xl.id = x.lesson_id where xl.unit_id = v_unit and x.src_id = t.ref_step_id)
    from flow_steps t, flow_lessons ul
   where u.src_id = t.id and t.ref_step_id is not null and u.lesson_id = ul.id and ul.unit_id = v_unit and ul.no between 1 and 6;

  create temp table _l9 on commit drop as
    select * from jsonb_to_recordset($j$${json}$j$::jsonb) as x(lesson int, pos int, n int, kind text, tag text, payload jsonb);

  select count(*) into v_miss from _l9 d where not exists (
    select 1 from flow_steps s join flow_lessons fl on fl.id = s.lesson_id where fl.unit_id = v_unit and fl.no = d.lesson and s.pos = d.pos and s.kind = d.kind);
  if v_miss > 0 then raise exception 'L9 content: % item(s) do not match a template step (lesson/pos/kind)', v_miss; end if;

  insert into items(unit_id, lesson, act_idx, level, template, tag, payload, status, step_id, created_at)
  select v_unit, d.lesson, d.pos, 'CORE', d.kind, d.tag, d.payload, 'draft', s.id, now() + (d.n * interval '1 millisecond')
    from _l9 d join flow_lessons fl on fl.unit_id = v_unit and fl.no = d.lesson join flow_steps s on s.lesson_id = fl.id and s.pos = d.pos;
  get diagnostics v_n = row_count;
  if v_n <> (select count(*) from _l9) then raise exception 'L9 content: inserted % of %', v_n, (select count(*) from _l9); end if;
end $do$;
`;
fs.writeFileSync(path.resolve(__dirname, '../../supabase/migrations/0049_l9_core_content.sql'), sql);
console.log('ok', rows.length, 'items');
