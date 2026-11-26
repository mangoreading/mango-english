-- 비상 초5 영어 Lesson 1 삽화 파일을 PNG(약 1.3MB·350KB) 에서 WebP(약 100KB·30KB)로 바꿔 불러오는 시간을 줄인다. 경로의 확장자만 바꾼다(그림은 같다).
-- 문항은 승인 상태 그대로 내용만 바꾸므로 재발행해야 학생 화면에 반영된다.
do $do$
declare v_unit uuid; v_n int;
begin
  select u.id into strict v_unit from units u join books b on b.id = u.book_id where u.no = 1 and u.kind = 'lesson' and b.grade = 5 and b.title = '초5 영어';
  update items i set payload = regexp_replace(i.payload::text, 'illus/(l1-[a-z0-9-]+)\.png', 'illus/\1.webp', 'g')::jsonb
   where i.unit_id = v_unit and i.template in ('goal', 'lecture') and i.lesson = 1 and i.payload::text ~ 'illus/l1-[a-z0-9-]+\.png';
  get diagnostics v_n = row_count;
  if v_n <> 2 then raise exception 'L1 illus webp: % item(s) updated (expected 2)', v_n; end if;
  raise notice 'L1 illus: png -> webp on % items; remaining png refs: %', v_n, (select count(*) from items where unit_id = v_unit and payload::text like '%illus/l1-%.png%');
end $do$;
