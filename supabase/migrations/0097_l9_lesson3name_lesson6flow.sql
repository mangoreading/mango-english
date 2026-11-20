-- 0097: L9 3차시 활동 이름 + 6차시 흐름 정리 (관리자 확인 반영)
--  · 3차시 'Say in English' -> 'Say It in English'
--  · 6차시: 'Listen & Match'(학습) 활동 추가(Story Check 다음), Sentence Build-up 은 숙제만, Listen & Choose (Number) 는 숙제만
--  · 새 Listen & Match 문항 4쌍은 draft 로 넣는다 (승인·발행 필요)
do $do$
declare v_unit uuid; v_cnt int; v_l3 uuid; v_l6 uuid; v_step uuid; v_n int;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise notice 'L9 unit lookup: % match(es) - skipped', v_cnt; return; end if;
  select id into v_l3 from flow_lessons where unit_id = v_unit and no = 3;
  select id into v_l6 from flow_lessons where unit_id = v_unit and no = 6;

  update flow_steps set name_en = 'Say It in English' where lesson_id = v_l3 and kind = 'saykor';
  get diagnostics v_n = row_count;
  raise notice '3차시 renamed: % step(s)', v_n;

  if not exists (select 1 from flow_steps where lesson_id = v_l6 and kind = 'lmatch') then
    update flow_steps set pos = pos + 1 where lesson_id = v_l6 and pos >= 8;
    insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, kind, qty, homework, study)
      values (v_l6, 8, 'Listen & Match', '듣고 짝짓기', 2, 'lmatch', 4, false, true) returning id into v_step;
    insert into items(unit_id, lesson, act_idx, level, template, tag, payload, status, step_id, created_at)
      values (v_unit, 6, 0, 'CORE', 'lmatch', 'listen', $j${"k":"lmatch","tag":"listen","pairs":[
        {"left":"Ken","say":"How much is this jacket? It's thirty thousand won.","right":"jacket"},
        {"left":"Lily","say":"How much are these sunglasses? They're twenty thousand won.","right":"sunglasses"},
        {"left":"Mia","say":"How much are these socks? They're two thousand won.","right":"socks"},
        {"left":"Tom","say":"How much is this hat? It's ten thousand won.","right":"hat"}]}$j$::jsonb, 'draft', v_step, now());
  end if;

  update flow_steps set homework = true, study = false where lesson_id = v_l6 and kind in ('sbuild', 'lnum');
  get diagnostics v_n = row_count;
  raise notice '6차시 homework-only steps: %', v_n;
  raise notice '6차시 now: %', (select string_agg((pos + 1) || ' ' || name_en || case when study then ' 학' else '' end || case when homework then ' 숙' else '' end, ' | ' order by pos) from flow_steps where lesson_id = v_l6);
end $do$;
