-- 0038: 6차시 Wrap-up 구성 확정 — 총정리 3분 + 영역별 체크(듣기 4·읽기 5·말하기 4·쓰기 4) + AI 자유대화 5 = 25분
do $$
declare l record; u9 uuid; sid uuid;
begin
  select u.id into u9 from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9;
  for l in select * from flow_lessons where no = 6 and en = 'Wrap-up' loop
    update flow_steps set minutes = 3 where lesson_id = l.id and kind = 'goal';
    update flow_steps set minutes = 4, qty = 3, name_en = 'Check: Listen',     name_ko = '체크 · 듣고 고르기',     pos = 1 where lesson_id = l.id and kind = 'lchpic';
    update flow_steps set minutes = 5, qty = 3, name_en = 'Check: Read',       name_ko = '체크 · 글 읽고 답하기',  pos = 2 where lesson_id = l.id and kind = 'sqchoice';
    update flow_steps set minutes = 4, qty = 2, name_en = 'Check: Role Play',  name_ko = '체크 · 새 상황 역할 대화', pos = 3 where lesson_id = l.id and kind = 'role';
    update flow_steps set minutes = 4, qty = 3, name_en = 'Check: Write',      name_ko = '체크 · 문장 쓰기',        pos = 4 where lesson_id = l.id and kind = 'sbuild';
    update flow_steps set minutes = 5, qty = 1, name_en = 'AI Free Talk',      name_ko = '종합 · AI 자유대화',      pos = 5 where lesson_id = l.id and kind = 'aitalk';
  end loop;

  if u9 is not null then
    -- 문항 순서: 쓰기 체크(400대) → AI 자유대화(500)
    update items i set act_idx = 400 + (i.act_idx - 500) from flow_steps s where s.id = i.step_id and i.unit_id = u9 and i.lesson = 6 and s.kind = 'sbuild';
    update items i set act_idx = 500 from flow_steps s where s.id = i.step_id and i.unit_id = u9 and i.lesson = 6 and s.kind = 'aitalk';

    select s.id into sid from flow_steps s join flow_lessons fl on fl.id = s.lesson_id where fl.unit_id = u9 and fl.no = 6 and s.kind = 'lchpic';
    insert into items(unit_id, lesson, act_idx, level, template, tag, payload, status, step_id) values
      (u9, 6, 102, 'CORE', 'lchpic', 'listen', '{"k":"lchpic","tag":"listen","q":"가격을 물은 물건은 무엇일까요?","say":"May I help you? Yes, please. How much are these hats? They''re ten thousand won.","opts":[{"t":"sunglasses","flag":"sunglasses"},{"t":"socks","flag":"socks"},{"t":"hat","flag":"hat"},{"t":"jacket","flag":"jacket"}],"a":2,"hint":["May I help you? Yes, please. How much are these hats? They''re ten thousand won."]}', 'draft', sid);

    select s.id into sid from flow_steps s join flow_lessons fl on fl.id = s.lesson_id where fl.unit_id = u9 and fl.no = 6 and s.kind = 'sqchoice';
    insert into items(unit_id, lesson, act_idx, level, template, tag, payload, status, step_id) values
      (u9, 6, 202, 'CORE', 'sqchoice', 'read', (select payload || '{"q":"How much are the socks?","opts":[{"t":"2,000 won"},{"t":"20,000 won"},{"t":"12,000 won"},{"t":"10,000 won"}],"a":0,"pic":"socks","hint":["Mina says, \"They''re two thousand won.\""]}'::jsonb from items where unit_id = u9 and lesson = 4 and template = 'sqchoice' order by act_idx limit 1), 'draft', sid);

    select s.id into sid from flow_steps s join flow_lessons fl on fl.id = s.lesson_id where fl.unit_id = u9 and fl.no = 6 and s.kind = 'role';
    insert into items(unit_id, lesson, act_idx, level, template, tag, payload, status, step_id) values
      (u9, 6, 301, 'CORE', 'role', 'speak', '{"k":"role","tag":"speak","pic":"shorts","lines":["A: May I help you?","B: Yes, please. How much are {{these shorts}}?","A: [[They''re fifteen thousand]] won."]}', 'draft', sid);

    select s.id into sid from flow_steps s join flow_lessons fl on fl.id = s.lesson_id where fl.unit_id = u9 and fl.no = 6 and s.kind = 'sbuild';
    insert into items(unit_id, lesson, act_idx, level, template, tag, payload, status, step_id) values
      (u9, 6, 402, 'CORE', 'sbuild', 'write', '{"k":"sbuild","tag":"write","ko":"이 선글라스는 얼마예요?","ans":"How much are these sunglasses?"}', 'draft', sid);
  end if;
end $$;
