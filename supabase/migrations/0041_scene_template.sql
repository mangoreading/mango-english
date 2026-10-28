-- 0041: 새 활동 템플릿 "장면 영상 보기"(scene): 그림·대사가 이어지는 30초 안팎의 장면 + 선택 확인 문항
insert into public.activity_types(key, name_ko, name_en, description, category, sort, importance, active)
values ('scene', '장면 영상 보기', 'Scene Story', '그림과 대사가 이어지는 짧은 장면을 보고 듣고, 이어서 내용 확인 문항을 풀기 (자막 영어/영어+한글/없음, 다시 보기 횟수 설정)', '듣기', 57, '확장', true)
on conflict (key) do update set name_ko = excluded.name_ko, name_en = excluded.name_en, description = excluded.description, category = excluded.category;
