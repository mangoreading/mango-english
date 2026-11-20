// 사용: node content/l9v2/gen.cjs <schema.cjs 경로>  → supabase/migrations/0084_l9_rebuild_flow5.sql 생성 (모든 문항을 zod 로 검증)
const fs = require('fs'); const path = require('path');
const { ActivityItem } = require(path.resolve(process.argv[2]));
const { S } = require('./part3.cjs');
const { SRC } = require('./sources.cjs');
const LESSONS = [
  [1, 'Listen & Learn', '듣고 익혀요', '핵심 단어와 표현의 뜻을 알고 따라 말해요'],
  [2, 'Listen & Speak', '듣고 말해요', '배운 질문을 듣고 대답하며 말해요'],
  [3, 'Ask & Answer', '묻고 답해요', '질문과 대답을 바꾸어 말하고 모범 글을 익혀요'],
  [4, 'Read & Understand', '읽고 알아봐요', '배운 표현이 들어간 글을 읽고 이해해요'],
  [5, 'Master & Expand', '익히고 넓혀요', '모범 글을 참고해 내 글을 쓰고 발표해요'],
  [6, 'Check-up', '점검해요', '배운 표현을 새로운 상황에서 확인해요'],
];
const items = []; let bad = 0;
const seen = new Set();
for (const st of S) {
  const key = st.lesson + '-' + st.pos; if (seen.has(key)) throw new Error('dup step ' + key); seen.add(key);
  st.items.forEach((p, n) => {
    const r = ActivityItem.safeParse(p);
    if (!r.success) { bad++; console.error('INVALID', key, st.kind, n, JSON.stringify(r.error.issues).slice(0, 400)); return; }
    items.push({ lesson: st.lesson, pos: st.pos, n, kind: st.kind, tag: st.tag, payload: r.data });
  });
}
if (bad) process.exit(1);
const lessons = LESSONS.map(([no, en, ko, goal]) => ({ no, en, ko, goal, steps: S.filter((s) => s.lesson === no).sort((a, b) => a.pos - b.pos).map((s) => ({ pos: s.pos, name_en: s.en, name_ko: s.ko, minutes: s.min, kind: s.kind, qty: s.qty, homework: s.hw })) }));
const json = JSON.stringify(items); const lj = JSON.stringify(lessons); const sj = JSON.stringify(SRC);
for (const x of [json, lj, sj]) if (x.includes('$j$')) throw new Error('dollar quote clash');
const sql = `-- 비상교육 초5 영어 Lesson 9 재작성 (Flow(5)_수정본.xlsx 기준): 1) 학습 흐름 2) 문항 3) 교과서 자료(QR 음원·영상 스크립트)
-- 기존 L9 흐름·문항·QR 스크립트는 backup_20261120 에 백업한 뒤 지우고, 6차시(1~5 + Check-up)로 다시 만든다. 교과서 스캔 파일(scan)은 건드리지 않는다.
-- 문항은 모두 초안(draft)으로 들어간다 (승인·발행은 따로). content/l9v2 에서 생성.
create schema if not exists backup_20261120;
create table if not exists backup_20261120.items as select * from public.items;
create table if not exists backup_20261120.flow_lessons as select * from public.flow_lessons;
create table if not exists backup_20261120.flow_steps as select * from public.flow_steps;
create table if not exists backup_20261120.unit_sources as select * from public.unit_sources;
revoke all on schema backup_20261120 from anon, authenticated;

do $do$
declare v_unit uuid; v_cnt int; v_les uuid; v_n int; v_miss int; l jsonb; s jsonb;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise exception 'L9 unit lookup: % match(es). books: %', v_cnt, (select string_agg(b.title || '#' || coalesce(u.no::text, '?'), ' / ') from books b left join units u on u.book_id = b.id); end if;
  if v_unit is null then raise exception 'L9 unit not found'; end if;

  create temp table _col on commit drop as select no, color from flow_lessons where unit_id = v_unit and track = 'core';

  delete from items where unit_id = v_unit;
  delete from flow_lessons where unit_id = v_unit;
  delete from unit_sources where unit_id = v_unit and kind = 'script';

  for l in select * from jsonb_array_elements($j$${lj}$j$::jsonb) loop
    insert into flow_lessons(unit_id, no, en, ko, goal, color, track)
      values (v_unit, (l->>'no')::int, l->>'en', l->>'ko', l->>'goal', coalesce((select color from _col where no = (l->>'no')::int), ''), 'core') returning id into v_les;
    for s in select * from jsonb_array_elements(l->'steps') loop
      insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, kind, qty, homework, study)
        values (v_les, (s->>'pos')::int, s->>'name_en', s->>'name_ko', (s->>'minutes')::int, s->>'kind', (s->>'qty')::int, (s->>'homework')::boolean, not (s->>'homework')::boolean);
    end loop;
  end loop;

  create temp table _l9 on commit drop as
    select * from jsonb_to_recordset($j$${json}$j$::jsonb) as x(lesson int, pos int, n int, kind text, tag text, payload jsonb);

  select count(*) into v_miss from _l9 d where not exists (
    select 1 from flow_steps s join flow_lessons fl on fl.id = s.lesson_id where fl.unit_id = v_unit and fl.no = d.lesson and s.pos = d.pos and s.kind = d.kind);
  if v_miss > 0 then raise exception 'L9 content: % item(s) do not match a flow step (lesson/pos/kind)', v_miss; end if;

  insert into items(unit_id, lesson, act_idx, level, template, tag, payload, status, step_id, created_at)
  select v_unit, d.lesson, d.pos, 'CORE', d.kind, d.tag, d.payload, 'draft', s.id, now() + (d.n * interval '1 millisecond')
    from _l9 d join flow_lessons fl on fl.unit_id = v_unit and fl.no = d.lesson join flow_steps s on s.lesson_id = fl.id and s.pos = d.pos;
  get diagnostics v_n = row_count;
  if v_n <> (select count(*) from _l9) then raise exception 'L9 content: inserted % of %', v_n, (select count(*) from _l9); end if;

  insert into unit_sources(unit_id, kind, lesson_no, sort, title, body, memo, remark)
  select v_unit, 'script', x.lesson_no, x.sort, x.title, x.body, x.memo, x.remark
    from jsonb_to_recordset($j$${sj}$j$::jsonb) as x(lesson_no int, sort int, title text, body text, memo text, remark text);

  raise notice 'L9 rebuilt: % lessons, % steps, % items (draft), % scripts', (select count(*) from flow_lessons where unit_id = v_unit), (select count(*) from flow_steps s join flow_lessons fl on fl.id = s.lesson_id where fl.unit_id = v_unit), v_n, ${SRC.length};
end $do$;
`;
fs.writeFileSync(path.resolve(__dirname, '../../supabase/migrations/0084_l9_rebuild_flow5.sql'), sql);
const per = {}; items.forEach((i) => { per[i.lesson] = (per[i.lesson] || 0) + 1; });
console.log('ok', items.length, 'items', JSON.stringify(per), S.length, 'steps');
