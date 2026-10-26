-- 0029: 6차시 개편 전 테스트 콘텐츠 정리 (인호 승인 2026-10-26). 0028 의 backup_20261026 에 복사본이 있다.
-- 남김: Template Samples 단원(문항·흐름·번들), 단어/이미지, 출판사·교재·표지·단원 목차, 활동 템플릿 45종.
-- 한 트랜잭션으로 실행되며, 마지막 확인에서 어긋나면 전부 되돌아간다.
do $$
declare u9 uuid; utest uuid; usamp uuid; n_before int; n_after int;
begin
  select u.id into u9 from public.units u join public.books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9;
  select id into utest from public.units where title = 'Words Template Test';
  select id into usamp from public.units where title like 'Template Samples%';
  if usamp is null then raise exception 'Template Samples 단원을 찾지 못했어요'; end if;
  select count(*) into n_before from public.items where unit_id = usamp;

  delete from public.attempts;
  delete from public.activity_progress;
  delete from public.progress;

  delete from public.unit_bundles where unit_id in (u9, utest);
  delete from public.items where unit_id in (u9, utest);
  delete from public.flow_lessons where unit_id in (u9, utest);
  delete from public.flow_templates;              -- 8차시 기본 템플릿 (차시·활동 칸은 연쇄 삭제)
  delete from public.units where id = utest;      -- 어휘 테스트 단원 (샘플 단원과 중복)

  -- 옛 활동 12종 (숨겨 둔 것)
  delete from public.activity_types where key in ('learn','text','brief','choose','match','build','fill','write','compose','speak','fade','dialog');

  select count(*) into n_after from public.items where unit_id = usamp;
  if n_after <> n_before then raise exception 'Template Samples 문항 수가 달라졌어요 (% -> %)', n_before, n_after; end if;
end $$;
