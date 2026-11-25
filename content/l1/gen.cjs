// 사용: node content/l1/gen.cjs <schema.cjs 경로> → supabase/migrations/0107_l1_content.sql 생성 (모든 문항을 zod 로 검증)
// Lesson 1 흐름(차시·활동)은 admin 에 이미 있다. 이 마이그레이션은 문항·단어·표현·교과서 자료·장면 프롬프트만 넣는다 (문항은 모두 draft).
const fs = require('fs'); const path = require('path');
const { ActivityItem } = require(path.resolve(process.argv[2]));
const { S, VOCAB } = require('./part1.cjs'); require('./part2.cjs'); require('./part3.cjs');
const { SRC } = require('./sources.cjs');
const { SCENES, CHARS, WORD_PROMPTS } = require('./scenes.cjs');
const items = []; let bad = 0; const seen = new Set();
for (const st of S) {
  const key = st.lesson + '-' + st.pos; if (seen.has(key)) throw new Error('dup step ' + key); seen.add(key);
  st.items.forEach((p, n) => {
    const r = ActivityItem.safeParse(p);
    if (!r.success) { bad++; console.error('INVALID', key, st.kind, n, JSON.stringify(r.error.issues).slice(0, 400)); return; }
    items.push({ lesson: st.lesson, pos: st.pos, n, kind: st.kind, tag: st.tag, payload: r.data });
  });
}
if (bad) process.exit(1);
const EXPR = []; const addE = (en, ko) => { if (!EXPR.some((x) => x.en === en)) EXPR.push({ en, ko }); };
[['Where are you from?', '너는 어느 나라에서 왔니?'], ["I'm from Korea.", '나는 한국에서 왔어.'], ['How do you spell your name?', '너의 이름은 철자가 어떻게 되니?'], ['H-A-N-A.', 'H-A-N-A야.'], ['Nice to meet you.', '만나서 반가워.'], ['My name is Hana.', '내 이름은 하나야.']].forEach(([a, b]) => addE(a, b));
const j = { items: JSON.stringify(items), vocab: JSON.stringify(VOCAB.map(([key, en, ko]) => ({ key, en, ko }))), expr: JSON.stringify(EXPR), src: JSON.stringify(SRC), scenes: JSON.stringify(SCENES), chars: JSON.stringify(CHARS), words: JSON.stringify(WORD_PROMPTS) };
for (const x of Object.values(j)) if (x.includes('$j$')) throw new Error('dollar quote clash');
const sql = `-- 비상교육 초5 영어 Lesson 1 (Where Are You From?) 콘텐츠: 문항(초안) · 단어 · 핵심 표현 · 교과서 QR 스크립트 · 영상 장면 이미지 프롬프트 · 단어 그림 프롬프트
-- Lesson 1 흐름(6차시)은 admin 에 이미 있으므로 건드리지 않는다. 문항은 모두 초안(draft)으로 들어간다 (승인·발행은 따로). content/l1 에서 생성.
do $do$
declare v_unit uuid; v_cnt int; v_n int; v_miss int; v_style uuid; v_src uuid;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 1 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise exception 'L1 unit lookup: % match(es)', v_cnt; end if;
  if exists (select 1 from items where unit_id = v_unit) then raise exception 'L1 already has items - refusing to overwrite'; end if;

  -- 단어(나라 이름)와 핵심 표현
  insert into vocab(key, en, ko) select x.key, x.en, x.ko from jsonb_to_recordset($j$${j.vocab}$j$::jsonb) as x(key text, en text, ko text)
    on conflict (key) do update set en = excluded.en, ko = excluded.ko;
  insert into unit_vocab(unit_id, vocab_id) select v_unit, v.id from vocab v where v.key in (select key from jsonb_to_recordset($j$${j.vocab}$j$::jsonb) as x(key text)) on conflict do nothing;
  insert into expressions(en, ko) select x.en, x.ko from jsonb_to_recordset($j$${j.expr}$j$::jsonb) as x(en text, ko text) on conflict (en) do nothing;
  insert into unit_expressions(unit_id, expression_id) select v_unit, e.id from expressions e where e.en in (select en from jsonb_to_recordset($j$${j.expr}$j$::jsonb) as x(en text)) on conflict do nothing;

  -- 문항
  create temp table _l1 on commit drop as select * from jsonb_to_recordset($j$${j.items}$j$::jsonb) as x(lesson int, pos int, n int, kind text, tag text, payload jsonb);
  select count(*) into v_miss from _l1 d where not exists (select 1 from flow_steps s join flow_lessons fl on fl.id = s.lesson_id where fl.unit_id = v_unit and fl.no = d.lesson and s.pos = d.pos and s.kind = d.kind);
  if v_miss > 0 then raise exception 'L1 content: % item(s) do not match a flow step (lesson/pos/kind): %', v_miss, (select string_agg(distinct d.lesson || '-' || d.pos || ' ' || d.kind, ', ') from _l1 d where not exists (select 1 from flow_steps s join flow_lessons fl on fl.id = s.lesson_id where fl.unit_id = v_unit and fl.no = d.lesson and s.pos = d.pos and s.kind = d.kind)); end if;
  insert into items(unit_id, lesson, act_idx, level, template, tag, payload, status, step_id, created_at)
  select v_unit, d.lesson, d.pos, 'CORE', d.kind, d.tag, d.payload, 'draft', s.id, now() + (d.n * interval '1 millisecond')
    from _l1 d join flow_lessons fl on fl.unit_id = v_unit and fl.no = d.lesson join flow_steps s on s.lesson_id = fl.id and s.pos = d.pos;
  get diagnostics v_n = row_count;
  if v_n <> (select count(*) from _l1) then raise exception 'L1 content: inserted % of %', v_n, (select count(*) from _l1); end if;
  raise notice 'L1 items: % (draft)', v_n;
  raise notice 'L1 flow steps without items: %', (select coalesce(string_agg(fl.no || '-' || s.pos || ' ' || s.kind, ', '), '(none)') from flow_steps s join flow_lessons fl on fl.id = s.lesson_id where fl.unit_id = v_unit and not exists (select 1 from items i where i.step_id = s.id));

  -- 교과서 QR 음원·영상 스크립트
  delete from unit_sources where unit_id = v_unit and kind = 'script';
  insert into unit_sources(unit_id, kind, lesson_no, sort, title, body, memo, remark)
  select v_unit, 'script', x.lesson_no, x.sort, x.title, x.body, x.memo, x.remark from jsonb_to_recordset($j$${j.src}$j$::jsonb) as x(lesson_no int, sort int, title text, body text, memo text, remark text);

  -- 장면 이미지 프롬프트: 스타일 세트(L9 화풍 복사) + 이 Lesson 인물 + 장면별 프롬프트
  insert into art_styles(name, style, avoid, chars)
  select '비상 초5 영어 L1', a.style, 'text, letters, words, numbers, watermark, logo, manga style, anime style, chibi, realistic photo, 3D render, scary, dark, extra fingers, distorted faces, brand names', $j$${j.chars}$j$::jsonb
    from art_styles a where a.name = '비상 초5 영어 L9'
  on conflict (name) do update set chars = excluded.chars, avoid = excluded.avoid
  returning id into v_style;
  if v_style is null then raise notice 'L9 art style not found - L1 scene prompts skipped'; else
    insert into lesson_chars(unit_id, chars, updated_at) values (v_unit, $j$${j.chars}$j$::jsonb, now()) on conflict (unit_id) do update set chars = excluded.chars, updated_at = now();
    insert into scene_prompts(unit_id, step_id, seq, lines, desc_ko, prompt, file_name, style_id)
    select v_unit, s.id, x.seq, x.lines, x.desc_ko, x.prompt, x.file_name, v_style
      from jsonb_to_recordset($j$${j.scenes}$j$::jsonb) as x(lesson int, pos int, seq int, lines text, desc_ko text, prompt text, file_name text)
      join flow_lessons fl on fl.unit_id = v_unit and fl.no = x.lesson
      join flow_steps s on s.lesson_id = fl.id and s.pos = x.pos and s.kind in ('scene', 'scenerep')
    on conflict (step_id, seq) do nothing;
    get diagnostics v_n = row_count; raise notice 'L1 scene prompts: % (expected 19)', v_n;
  end if;

  -- 단어 그림 프롬프트 (이미지 제작 > 단원 단어·삽화)
  insert into image_prompts(unit_id, kind, key, en, ko, prompt, seq)
  select v_unit, x.kind, x.key, x.en, x.ko, x.prompt, row_number() over ()::int from jsonb_to_recordset($j$${j.words}$j$::jsonb) as x(kind text, key text, en text, ko text, prompt text)
  on conflict (unit_id, kind, key) do nothing;
  raise notice 'L1 vocab %, expressions %, scripts %, image prompts %', (select count(*) from unit_vocab where unit_id = v_unit), (select count(*) from unit_expressions where unit_id = v_unit), (select count(*) from unit_sources where unit_id = v_unit and kind = 'script'), (select count(*) from image_prompts where unit_id = v_unit);
end $do$;
`;
fs.writeFileSync(path.resolve(__dirname, '../../supabase/migrations/0107_l1_content.sql'), sql);
const by = {}; items.forEach((i) => { by[i.lesson] = (by[i.lesson] || 0) + 1; });
console.log('ok', items.length, 'items', JSON.stringify(by), S.length, 'steps');
