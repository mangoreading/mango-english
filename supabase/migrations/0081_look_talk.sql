-- 0081: 새 활동 템플릿 "그림 보고 대화하기"(looktalk): 상황 그림 한 장(이름표·가격표)을 보고, 학생이 문장 2~3개(가격 묻기 → 가격 답하기)를 차례로 말하기
insert into public.activity_types(key, name_ko, name_en, description, category, sort, importance, active)
values ('looktalk', '그림 보고 대화하기', 'Look & Talk', '상황 그림 한 장(이름표·가격표)을 보고, 마이크로 문장 2~3개(예: 가격을 묻고 → 가격을 답하기)를 차례로 말합니다. 문장은 숨겨져 있고 Hint를 누르면 잠깐 보입니다. 문장마다 말한 단어가 얼마나 맞는지 보여 주고, 기준을 넘으면 다음 문장으로 넘어갑니다.', '말하기', 314, '확장', true)
on conflict (key) do update set name_ko = excluded.name_ko, name_en = excluded.name_en, description = excluded.description, category = excluded.category;
