-- 0078: 새 활동 템플릿 "듣고 그림에 맞게 쓰기"(lpwrite): 듣기 버튼 하나로 지문 전체를 듣고, 그림 카드마다 알맞은 답(가격 등)을 직접 쓰기
insert into public.activity_types(key, name_ko, name_en, description, category, sort, importance, active)
values ('lpwrite', '듣고 그림에 맞게 쓰기', 'Listen & Write (Picture)', '듣기 버튼을 누르면 대화 전체가 나오고, 그림 카드(최대 4개)마다 대화에 맞는 정답(예: 가격)을 숫자로 직접 씁니다. 맞으면 칸이 채워지고, 힌트를 볼 수 있습니다. 들을 수 있는 횟수를 정할 수 있습니다.', '듣기', 311, '확장', true)
on conflict (key) do update set name_ko = excluded.name_ko, name_en = excluded.name_en, description = excluded.description, category = excluded.category;
