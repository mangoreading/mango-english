-- 0067: 문장 만들기 세부 유형 구분 — (듣고 만들기) / (듣고 이어질 말) / (보고 이어질 말)
update public.activity_types set name_ko='문장 만들기 (듣고 만들기)', name_en='Sentence Build-up (Listen)', description='문장을 소리로 들려주고, 단어 카드를 선택하여 그 문장을 완성합니다.' where key='sscraml';
insert into public.activity_types(key, name_ko, name_en, description, category, sort, importance, active) values
('sscramlr', '문장 만들기 (듣고 이어질 말)', 'Sentence Build-up (Listen & Reply)', '질문 등 앞 문장을 소리로만 들려주고, 단어 카드를 선택하여 이어질 말(대답)을 완성합니다.', '쓰기', 308, '확장', true),
('sscramr', '문장 만들기 (보고 이어질 말)', 'Sentence Build-up (Read & Reply)', '앞 문장을 화면에 보여 주고, 단어 카드를 선택하여 이어질 말(대답)을 완성합니다. 소리는 나오지 않습니다.', '쓰기', 309, '확장', true)
on conflict (key) do update set name_ko = excluded.name_ko, name_en = excluded.name_en, description = excluded.description, category = excluded.category;
