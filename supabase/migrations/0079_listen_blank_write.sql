-- 0079: 새 활동 템플릿 "듣고 빈칸 쓰기"(lblank): 소리 막대로 대화를 듣고, 문장의 빈칸에 들은 말(물건 이름 등)을 직접 쓰기
insert into public.activity_types(key, name_ko, name_en, description, category, sort, importance, active)
values ('lblank', '듣고 빈칸 쓰기', 'Listen & Write (Blank)', '소리 막대(▶)를 눌러 대화를 듣고, 화면의 문장 빈칸에 들은 말(예: 물건 이름)을 직접 씁니다. 빈칸은 여러 개도 가능하고, 들을 수 있는 횟수를 정할 수 있습니다. 힌트를 볼 수 있습니다.', '듣기', 312, '확장', true)
on conflict (key) do update set name_ko = excluded.name_ko, name_en = excluded.name_en, description = excluded.description, category = excluded.category;
