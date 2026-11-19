-- 0083: 이름의 "(세트)"가 화면에서 한 번 더 붙어 두 번 보이던 것을 정리 ("글 읽고 답하기 (세트)" → "글 읽고 답하기")
update public.activity_types set name_ko = '글 읽고 답하기', name_en = 'Story Quiz' where key = 'sqset';
