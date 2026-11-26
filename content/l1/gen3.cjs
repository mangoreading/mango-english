// 사용: node content/l1/gen3.cjs <schema.cjs> → supabase/migrations/0109_l1_revise2.sql
// L1 개정: 철자 문항 보강 + 목표 범위 밖 문장(I like/I am/I can 등) 정리 + 6차시 새 상황 문항. 바뀐 단계의 문항만 교체하고 초안(draft)으로 넣는다.
const fs = require('fs'); const path = require('path');
const { ActivityItem } = require(path.resolve(process.argv[2]));
const { S } = require('./part1.cjs'); require('./part2.cjs'); require('./part3.cjs');
const TARGET = ['5-3','5-4','3-13']; const _OLD = ['3-7', '3-10', '3-11', '3-13', '4-0', '5-1', '5-2', '5-3', '5-4', '5-5', '6-5', '6-12'];
const items = []; let bad = 0;
for (const st of S) { const key = st.lesson + '-' + st.pos; if (!TARGET.includes(key)) continue;
  st.items.forEach((p, n) => { const r = ActivityItem.safeParse(p); if (!r.success) { bad++; console.error('INVALID', key, st.kind, n, JSON.stringify(r.error.issues).slice(0, 300)); return; }
    items.push({ lesson: st.lesson, pos: st.pos, n, kind: st.kind, tag: st.tag, payload: r.data }); }); }
if (bad) process.exit(1);
const j = JSON.stringify(items); if (j.includes('$j$')) throw new Error('clash');
const sql = `-- 비상 초5 영어 Lesson 1 개정: 5-3 모범 글 완성에 상황 안내(inst)와 철자 보기 추가(정답 구분 가능하게), 3-13·5-4 쓰기의 맨 위 칸 이름을 내용과 맞춤. content/l1 에서 생성(gen3.cjs).
-- 바뀐 3개 단계의 기존 문항을 지우고 새 문항을 초안(draft)으로 넣는다. 승인·재발행은 따로.
do $do$
declare v_unit uuid; v_cnt int; v_del int; v_n int; v_miss int;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id where u.no = 1 and u.kind = 'lesson' and b.grade = 5 and b.title = '초5 영어';
  if v_cnt <> 1 then raise exception 'L1 unit lookup: % match(es)', v_cnt; end if;
  create temp table _r on commit drop as select * from jsonb_to_recordset($j$${j}$j$::jsonb) as x(lesson int, pos int, n int, kind text, tag text, payload jsonb);
  select count(*) into v_miss from _r d where not exists (select 1 from flow_steps s join flow_lessons fl on fl.id = s.lesson_id where fl.unit_id = v_unit and fl.no = d.lesson and s.pos = d.pos and s.kind = d.kind);
  if v_miss > 0 then raise exception 'L1 revise: % item(s) do not match a flow step', v_miss; end if;
  delete from items i using flow_steps s join flow_lessons fl on fl.id = s.lesson_id
   where i.step_id = s.id and fl.unit_id = v_unit and (fl.no, s.pos) in (select distinct lesson, pos from _r);
  get diagnostics v_del = row_count;
  insert into items(unit_id, lesson, act_idx, level, template, tag, payload, status, step_id, created_at)
  select v_unit, d.lesson, d.pos, 'CORE', d.kind, d.tag, d.payload, 'draft', s.id, now() + (d.n * interval '1 millisecond')
    from _r d join flow_lessons fl on fl.unit_id = v_unit and fl.no = d.lesson join flow_steps s on s.lesson_id = fl.id and s.pos = d.pos;
  get diagnostics v_n = row_count;
  if v_n <> (select count(*) from _r) then raise exception 'L1 revise: inserted % of %', v_n, (select count(*) from _r); end if;
  raise notice 'L1 revise: deleted %, inserted % (draft)', v_del, v_n;
  raise notice 'L1 items total: % (draft %)', (select count(*) from items where unit_id = v_unit), (select count(*) from items where unit_id = v_unit and status = 'draft');
end $do$;
`;
fs.writeFileSync(path.resolve(__dirname, '../../supabase/migrations/0109_l1_revise2.sql'), sql);
console.log('items', items.length);
