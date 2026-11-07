-- 0071: 새 활동 템플릿 "듣고 짝지어 쓰기"(lmwrite): 카드마다 대화를 듣고, 질문에 맞는 정답(가격 등)을 직접 써서 완성
insert into public.activity_types(key, name_ko, name_en, description, category, sort, importance, active)
values ('lmwrite', '듣고 짝지어 쓰기', 'Listen & Matching (Write)', '왼쪽 카드(이름)의 소리 버튼으로 짧은 대화를 듣고, 오른쪽 칸에 질문에 맞는 정답(예: 가격)을 직접 씁니다. 맞으면 카드 색이 채워지고, 힌트를 볼 수 있습니다.', '듣기', 310, '확장', true)
on conflict (key) do update set name_ko = excluded.name_ko, name_en = excluded.name_en, description = excluded.description, category = excluded.category;
