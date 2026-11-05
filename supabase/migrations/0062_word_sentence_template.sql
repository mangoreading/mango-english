-- 0062: 새 활동 템플릿 "단어·문장 듣고 따라 말하기"(wsent): 카드마다 단어를 2번, 이어서 그 단어가 들어간 문장을 읽어 줌 (문장 안의 단어는 빨강)
insert into public.activity_types(key, name_ko, name_en, description, category, sort, importance, active)
values ('wsent', '단어·문장 듣고 따라 말하기', 'Word & Sentence Repeat', '그림 카드마다 단어를 두 번 들려주고, 그 단어가 들어간 문장을 이어서 들려줍니다. 문장 안의 단어는 빨강으로 표시되고, 카드를 누르면 다시 들려줍니다.', '어휘', 109, '확장', true)
on conflict (key) do update set name_ko = excluded.name_ko, name_en = excluded.name_en, description = excluded.description, category = excluded.category;
