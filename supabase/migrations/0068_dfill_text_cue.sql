-- 0068: 대화 완성하기 세부 유형 구분 — (그림) / (글 단서)
update public.activity_types set name_ko='대화 완성하기 (그림)', name_en='Complete the Dialogue (Picture)' where key='dfill';
insert into public.activity_types(key, name_ko, name_en, description, category, sort, importance, active) values
('dfillt', '대화 완성하기 (글 단서)', 'Complete the Dialogue (Text Cue)', '그림 대신 "선글라스 • 13,000원" 같은 글 단서를 보고, 대화의 빈칸에 들어갈 단어를 직접 써서 완성합니다.', '쓰기', 610, '핵심', true)
on conflict (key) do update set name_ko = excluded.name_ko, name_en = excluded.name_en, description = excluded.description, category = excluded.category;
