-- 0066: 활동 템플릿 분리 — 옵션 대신 별도 템플릿으로 제공
insert into public.activity_types(key, name_ko, name_en, description, category, sort, importance, active) values
('scenerep', '장면 영상 보기 + 따라 말하기', 'Scene Story + Repeat', '장면 영상 보기(영상 → 문제 → 해석/해설)에 마지막 "문장 따라 말해보기" 단계가 더해진 활동입니다. 장면 대사를 한 문장씩 듣고 따라 말합니다.', '듣기', 305, '확장', true),
('sscraml', '문장 만들기 (듣고 만들기)', 'Sentence Build-up (Listen)', '문장을 소리로 들려주고, 단어 카드를 선택하여 문장을 완성합니다. 들려줄 말을 따로 정하거나 "이어질 말" 만들기로 바꿀 수 있습니다.', '쓰기', 306, '확장', true)
on conflict (key) do update set name_ko = excluded.name_ko, name_en = excluded.name_en, description = excluded.description, category = excluded.category;
