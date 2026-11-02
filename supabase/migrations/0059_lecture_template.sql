-- 0059: 새 활동 템플릿 "강의 슬라이드"(lecture): Lesson 의 표현·문법을 강의처럼 슬라이드로 설명 (표현 카드·문장 구조 식·비교표·알아 두기)
insert into public.activity_types(key, name_ko, name_en, description, category, sort, importance, active)
values ('lecture', '강의 슬라이드', 'Lecture Slides', 'Lesson 의 핵심 표현·문법을 학습 활동 전에 강의처럼 설명하는 슬라이드 (표현 카드 눌러 듣기, 문장 구조 식, 비교표, 알아 두기)', '표현', 9, '확장', true)
on conflict (key) do update set name_ko = excluded.name_ko, name_en = excluded.name_en, description = excluded.description, category = excluded.category;
