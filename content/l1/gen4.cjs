// 사용: node content/l1/gen4.cjs <schema.cjs> → supabase/migrations/0112_l1_lecture_illus.sql (L1 강의 슬라이드 문항 1개의 내용을 새 슬라이드 삽화 버전으로 교체)
const fs = require('fs'); const path = require('path');
const { ActivityItem } = require(path.resolve(process.argv[2]));
const { S } = require('./part1.cjs');
const st = S.find((x) => x.lesson === 1 && x.pos === 1 && x.kind === 'lecture'); const p = st.items[0];
const r = ActivityItem.safeParse(p); if (!r.success) { console.error(JSON.stringify(r.error.issues).slice(0, 400)); process.exit(1); }
const j = JSON.stringify(r.data); if (j.includes('$j$')) throw new Error('clash');
fs.writeFileSync(path.resolve(__dirname, '../../supabase/migrations/0112_l1_lecture_illus.sql'), `-- 비상 초5 영어 Lesson 1 강의 슬라이드(1차시 pos 1)에 슬라이드 삽화(illus, 투명 PNG 3장)를 달고, 슬라이드 4 예시를 삽화(A-M-Y)와 맞춘다.
-- 문항은 승인 상태 그대로 내용만 바꾸므로 재발행해야 학생 화면에 반영된다. content/l1/gen4.cjs 로 생성.
do $do$
declare v_unit uuid; v_n int;
begin
  select u.id into strict v_unit from units u join books b on b.id = u.book_id where u.no = 1 and u.kind = 'lesson' and b.grade = 5 and b.title = '초5 영어';
  update items i set payload = $j$${j}$j$::jsonb where i.unit_id = v_unit and i.template = 'lecture' and i.lesson = 1;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'L1 lecture items updated: % (expected 1)', v_n; end if;
  raise notice 'L1 lecture: slides updated (% item), status %', v_n, (select string_agg(status::text, ',') from items where unit_id = v_unit and template = 'lecture');
end $do$;
`);
console.log('ok');
