-- 0095: L9 단계의 학습(study)·숙제(homework) 체크를 관리자 '흐름 템플릿'에 표시된 값 그대로 가져온다.
-- (엑셀에는 이 표시가 없고 템플릿에 있다. 0093·0094 는 추정이었으므로 템플릿 값으로 덮어쓴다.)
-- 템플릿 찾기: 차시 번호·순서·활동 이름(또는 종류)이 L9 단계와 가장 많이 겹치는 템플릿 1개. 겹침이 30개 미만이면 아무것도 바꾸지 않는다.
-- 반영하려면 문항을 다시 발행해야 학습앱에 보인다.
do $do$
declare v_unit uuid; v_cnt int; v_tpl uuid; v_best int := 0; v_sc int; t record; v_m int; v_un text; v_tn text;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise notice 'L9 unit lookup: % match(es) - flags skipped', v_cnt; return; end if;
  for t in select id, name from flow_templates loop
    select count(*) into v_sc from flow_steps ts join flow_lessons tl on tl.id = ts.lesson_id and tl.template_id = t.id
      join flow_lessons ul on ul.unit_id = v_unit and ul.no = tl.no join flow_steps us on us.lesson_id = ul.id and us.pos = ts.pos
      where lower(btrim(ts.name_en)) = lower(btrim(us.name_en)) or (ts.kind is not null and ts.kind = us.kind);
    if v_sc > v_best then v_best := v_sc; v_tpl := t.id; v_tn := t.name; end if;
  end loop;
  if v_tpl is null or v_best < 30 then raise notice 'no matching flow template (best overlap %) - flags unchanged', v_best; return; end if;
  update flow_steps us set study = ts.study, homework = ts.homework
    from flow_lessons ul, flow_lessons tl, flow_steps ts
    where us.lesson_id = ul.id and ul.unit_id = v_unit and tl.template_id = v_tpl and tl.no = ul.no and ts.lesson_id = tl.id and ts.pos = us.pos
      and (lower(btrim(ts.name_en)) = lower(btrim(us.name_en)) or (ts.kind is not null and ts.kind = us.kind));
  get diagnostics v_m = row_count;
  select string_agg(ul.no || '-' || (us.pos + 1) || ' ' || us.name_en, ' / ' order by ul.no, us.pos) into v_un from flow_steps us join flow_lessons ul on ul.id = us.lesson_id where ul.unit_id = v_unit
    and not exists (select 1 from flow_lessons tl join flow_steps ts on ts.lesson_id = tl.id where tl.template_id = v_tpl and tl.no = ul.no and ts.pos = us.pos and (lower(btrim(ts.name_en)) = lower(btrim(us.name_en)) or (ts.kind is not null and ts.kind = us.kind)));
  raise notice 'flags copied from template "%": % steps matched (L9 has 52). unmatched: %', v_tn, v_m, coalesce(v_un, '-');
end $do$;
