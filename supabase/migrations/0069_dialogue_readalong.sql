-- 0069: 대화(문장) 따라 읽기 — (그림) / (글)
insert into public.activity_types(key, name_ko, name_en, description, category, sort, importance, active) values
('dreadp', '대화 따라 읽기 (그림)', 'Read & Speak (Picture)', '그림과 대화를 보며 한 줄씩 순서대로 듣고 마이크로 따라 읽습니다. 읽는 줄은 단어별 일치가 색으로 표시됩니다.', '말하기', 37, '확장', true),
('dreadt', '대화 따라 읽기 (글)', 'Read & Speak (Text)', '대화(또는 문장)를 한 줄씩 순서대로 듣고 마이크로 따라 읽습니다. 그림 없이 글만 보여 줍니다.', '말하기', 38, '확장', true)
on conflict (key) do update set name_ko = excluded.name_ko, name_en = excluded.name_en, description = excluded.description, category = excluded.category;
