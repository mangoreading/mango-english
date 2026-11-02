-- 0060: Lesson 9 1차시 맨 앞에 '이번 Lesson 미리 보기'(강의 슬라이드 6장)를 넣고 승인·발행
do $do$
declare v_unit uuid; v_les uuid; v_step uuid; v_ver int;
begin
  select u.id into v_unit from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9;
  if v_unit is null then raise exception 'L9 unit not found'; end if;
  select id into v_les from flow_lessons where unit_id = v_unit and no = 1;
  if v_les is null then raise exception 'L9 lesson 1 not found'; end if;
  if exists (select 1 from flow_steps where lesson_id = v_les and kind = 'lecture') then return; end if;
  update items set act_idx = act_idx + 1 where step_id in (select id from flow_steps where lesson_id = v_les);
  update flow_steps set pos = pos + 1 where lesson_id = v_les;
  insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, kind, qty, study, homework)
    values (v_les, 0, 'Lesson Preview', '이번 Lesson 미리 보기', 3, 'lecture', 1, true, false) returning id into v_step;
  insert into items(unit_id, lesson, act_idx, level, template, tag, payload, status, step_id)
    values (v_unit, 1, 0, 'CORE', 'lecture', 'expr', $j${"k": "lecture", "tag": "expr", "title": "Lesson 9", "slides": [{"head": "가게에서는 이렇게 말해요", "pic": "hat", "text": ["가게에 가면 점원이 먼저 말을 걸어요.", "이번 Lesson에서는 물건의 [[가격]]을 묻고 대답하는 말을 배워요."], "cards": ["May I help you? | 도와드릴까요? | 점원", "Yes, please. | 네, 부탁해요. | 손님", "How much is this hat? | 이 모자는 얼마예요? | 손님"]}, {"head": "도움을 주고받는 표현", "text": ["[[May I help you?]]는 '도와드릴까요?'라는 뜻이에요.", "도움이 필요하면 [[Yes, please.]]라고 대답해요. please가 붙으면 부탁하는 말이라 더 공손해요."], "cards": ["May I help you? | 도와드릴까요? | 묻는 말", "Yes, please. | 네, 부탁해요. | 대답", "Thank you. | 고맙습니다. | 마무리 인사"]}, {"head": "가격 묻기 ① 하나일 때", "pic": "hat", "text": ["얼마인지 물을 때는 [[How much]]로 시작해요.", "가까이 있는 물건 하나는 [[this]], 동사는 [[is]]를 써요."], "formula": ["How much + {{is}} + this + 물건?", "It's + 가격 + won."], "cards": ["How much is this hat? | 이 모자는 얼마예요?", "It's ten thousand won. | 10,000원이에요."]}, {"head": "가격 묻기 ② 여러 개일 때", "pic": "socks", "text": ["물건이 여러 개이면 this는 these로, is는 are로, It's는 They're로 바뀌어요."], "table": [" | 하나 | 여러 개", "가리킬 때 | this | these", "동사 | is | are", "대답 | It's | They're"], "tip": "sunglasses, shorts, socks, shoes는 두 개가 한 짝이라서 [[these]]를 써요."}, {"head": "가격 읽는 법", "text": ["숫자를 영어로 읽고, 뒤에 [[won]]을 붙여요. 천 단위로 끊어서 읽으면 쉬워요."], "cards": ["two thousand won | 2,000원", "ten thousand won | 10,000원", "thirteen thousand won | 13,000원", "fifty thousand won | 50,000원"]}, {"head": "정리해요", "text": ["이번 Lesson에서 배울 단어는 hat, sunglasses, jacket, shorts, socks, shoes예요.", "이제 단어와 표현을 직접 듣고 말해 볼까요?"], "cards": ["How much are these socks? | 이 양말은 얼마예요?", "They're two thousand won. | 2,000원이에요."]}]}$j$::jsonb, 'approved', v_step);
  v_ver := publish_unit(v_unit);
  raise notice 'L9 lecture added, published v%', v_ver;
end $do$;
