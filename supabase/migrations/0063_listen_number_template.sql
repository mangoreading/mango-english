-- 0063: 새 활동 템플릿 "듣고 번호 고르기"(lnum): 질문과 선택지를 모두 소리로만 들려주고 번호로 고르는 듣기 문항(기존 듣고 고르기보다 어려움)
insert into public.activity_types(key, name_ko, name_en, description, category, sort, importance, active)
values ('lnum', '듣고 번호 고르기', 'Listen & Choose (Number)', '질문과 선택지를 모두 음성으로만 들려주고, 화면의 번호(1~4)로 답을 고릅니다. 들을 수 있는 횟수를 정할 수 있고, 정답을 맞히면 들은 내용을 스크립트로 보여 줍니다. 기존 듣고 고르기보다 난이도가 높습니다.', '듣기', 307, '확장', true)
on conflict (key) do update set name_ko = excluded.name_ko, name_en = excluded.name_en, description = excluded.description, category = excluded.category;
