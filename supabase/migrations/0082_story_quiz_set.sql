-- 0082: 새 활동 템플릿 "글 읽고 답하기 (세트)"(sqset): 본문 하나에 문항 최대 5개(선다·T/F·복수선택을 문항마다 선택). 기존 글 읽고 답하기 3종은 새 문항을 만들 수 없게 숨김.
insert into public.activity_types(key, name_ko, name_en, description, category, sort, importance, active)
values ('sqset', '글 읽고 답하기 (세트)', 'Story Quiz (Set)', '본문 하나(왼쪽, 듣기·해석 보기)를 보며 오른쪽에서 문항을 차례로 풉니다. 문항은 최대 5개이고 선다·T/F·복수선택을 문항마다 고를 수 있습니다. 본문과 해석은 한 번만 입력합니다.', '읽기', 504, '핵심', true)
on conflict (key) do update set name_ko = excluded.name_ko, name_en = excluded.name_en, description = excluded.description, category = excluded.category;
-- 기존 3종은 이미 입력된 문항이 있을 수 있어 행은 지우지 않고 목록에서만 숨긴다(새 문항 생성 불가, 기존 문항은 그대로 재생).
update public.activity_types set active = false where key in ('sqchoice', 'sqtf', 'sqmulti');
