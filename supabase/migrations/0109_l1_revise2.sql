-- 비상 초5 영어 Lesson 1 개정: 5-3 모범 글 완성에 상황 안내(inst)와 철자 보기 추가(정답 구분 가능하게), 3-13·5-4 쓰기의 맨 위 칸 이름을 내용과 맞춤. content/l1 에서 생성(gen3.cjs).
-- 바뀐 3개 단계의 기존 문항을 지우고 새 문항을 초안(draft)으로 넣는다. 승인·재발행은 따로.
do $do$
declare v_unit uuid; v_cnt int; v_del int; v_n int; v_miss int;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id where u.no = 1 and u.kind = 'lesson' and b.grade = 5 and b.title = '초5 영어';
  if v_cnt <> 1 then raise exception 'L1 unit lookup: % match(es)', v_cnt; end if;
  create temp table _r on commit drop as select * from jsonb_to_recordset($j$[{"lesson":3,"pos":13,"n":0,"kind":"mfree","tag":"write","payload":{"tag":"write","k":"mfree","topic":"korea","topicLabel":"내 이름","lines":["Hello. My name is {}.","{}.","I'm from {}."],"lineHints":["위에 쓴 내 이름을 문장에 다시 써요. (예: Hana)","내 이름의 철자를 알파벳 하나씩 - 로 이어 써요. (예: H-A-N-A)","나라 이름은 대문자로 시작해요. (예: Korea)"],"hint":["Hello. My name is Hana."]}},{"lesson":3,"pos":13,"n":1,"kind":"mfree","tag":"write","payload":{"tag":"write","k":"mfree","topic":"brazil","topicLabel":"내 이름","lines":["Hi, I'm {}.","{}.","I'm from {}."],"lineHints":["위에 쓴 내 이름을 문장에 다시 써요. (예: Leo)","내 이름의 철자를 알파벳 하나씩 - 로 이어 써요. (예: L-E-O)","나라 이름은 대문자로 시작해요. (예: Brazil)"],"hint":["Hi, I'm Leo."]}},{"lesson":5,"pos":3,"n":0,"kind":"mwbank","tag":"write","payload":{"tag":"write","inst":"Max는 브라질에서 온 영웅이에요. 보기에서 알맞은 단어를 골라 글을 완성하세요.","k":"mwbank","lines":["My name is {}.","{}.","I'm from {}."],"ans":["Max","M-A-X","Brazil"],"extra":["Leo","L-E-O","France"],"blankHints":["영웅의 이름이에요.","이름의 철자를 알파벳 하나씩 말해요.","나라 이름이에요."]}},{"lesson":5,"pos":3,"n":1,"kind":"mwbank","tag":"write","payload":{"tag":"write","inst":"Zia는 이집트에서 온 영웅이에요. 보기에서 알맞은 단어를 골라 글을 완성하세요.","k":"mwbank","lines":["My name is {}.","{}.","I'm from {}."],"ans":["Zia","Z-I-A","Egypt"],"extra":["Kai","K-A-I","Korea"],"blankHints":["영웅의 이름이에요.","이름의 철자를 알파벳 하나씩 말해요.","나라 이름이에요."]}},{"lesson":5,"pos":4,"n":0,"kind":"mfree","tag":"write","payload":{"tag":"write","k":"mfree","topic":"brazil","topicLabel":"나의 영웅 이름","lines":["My name is {}.","{}.","I'm from {}."],"lineHints":["위에 쓴 영웅 이름을 문장에 다시 써요. (예: Max)","영웅 이름의 철자를 알파벳 하나씩 - 로 이어 써요. (예: M-A-X)","나라 이름은 대문자로 시작해요. (예: Brazil)"],"hint":["My name is Max."]}},{"lesson":5,"pos":4,"n":1,"kind":"mfree","tag":"write","payload":{"tag":"write","k":"mfree","topic":"egypt","topicLabel":"나의 영웅 이름","lines":["My name is {}.","{}.","I'm from {}."],"lineHints":["위에 쓴 영웅 이름을 문장에 다시 써요. (예: Max)","영웅 이름의 철자를 알파벳 하나씩 - 로 이어 써요. (예: M-A-X)","나라 이름은 대문자로 시작해요. (예: Brazil)"],"hint":["My name is Zia."]}}]$j$::jsonb) as x(lesson int, pos int, n int, kind text, tag text, payload jsonb);
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
