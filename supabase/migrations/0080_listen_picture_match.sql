-- 0080: 새 활동 템플릿 "듣고 그림·글 연결하기"(lpmatch): 소리 막대로 대화를 듣고, 왼쪽 그림과 오른쪽 글(가격표 등)을 연결
insert into public.activity_types(key, name_ko, name_en, description, category, sort, importance, active)
values ('lpmatch', '듣고 그림·글 연결하기', 'Listen & Match (Picture)', '소리 막대(▶)로 대화 전체를 듣고, 왼쪽 그림(2~3개)을 누른 다음 알맞은 오른쪽 글(예: 가격표)을 눌러 연결합니다. 정답이 없는 보기를 1~2개 더 둘 수 있고, 들을 수 있는 횟수를 정할 수 있습니다. 힌트를 볼 수 있습니다.', '듣기', 313, '확장', true)
on conflict (key) do update set name_ko = excluded.name_ko, name_en = excluded.name_en, description = excluded.description, category = excluded.category;
