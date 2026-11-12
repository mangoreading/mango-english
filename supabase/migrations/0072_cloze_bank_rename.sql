-- 0072: 같은 화면을 쓰는 두 템플릿을 영역으로 구분 — 글 빈칸 채우기 (읽기) / 모범 글 완성 (쓰기)
update public.activity_types set name_ko = '글 빈칸 채우기 (읽기)', description = '글을 읽고 보기 단어로 빈칸을 채우며 내용을 이해했는지 확인합니다. (읽기 영역으로 기록)' where key = 'scloze';
update public.activity_types set name_ko = '모범 글 완성 (쓰기)', description = '보기 단어를 골라 모범 글의 빈칸을 채우며 문장 구조와 표현을 익힙니다. 내 글을 쓰기 전 준비 활동입니다. (쓰기 영역으로 기록)' where key = 'mwbank';
-- 흐름 단계 이름 중 예전 기본 이름 그대로인 것만 함께 변경(직접 고친 이름은 그대로 둠)
update public.flow_steps set name_ko = '글 빈칸 채우기 (읽기)' where kind = 'scloze' and name_ko = '글 빈칸 채우기';
update public.flow_steps set name_ko = '모범 글 완성 (쓰기)' where kind = 'mwbank' and name_ko in ('모범 글 완성', '모범 글 완성 (보기)');
