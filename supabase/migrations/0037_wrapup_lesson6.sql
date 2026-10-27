-- 0037: 6차시를 "정리해요 / Wrap-up"(핵심 총정리 + 통합 체크)으로 변경. 맞춤 보강 단계는 뺀다(학생이 결과 화면의 [더 연습해요]로 선택).
do $$
declare l record; v_step uuid; u9 uuid; gp jsonb;
begin
  select u.id into u9 from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9;
  for l in select * from flow_lessons where no = 6 and en = 'Try It Yourself' loop
    update flow_lessons set en = 'Wrap-up', ko = '정리해요', goal = '배운 표현을 정리하고, 새로운 상황에서 확인해요' where id = l.id;
    delete from flow_steps where lesson_id = l.id and special = 'adaptive';
    update flow_steps set pos = pos + 1 where lesson_id = l.id;
    insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, kind, qty)
      values (l.id, 0, 'Key Expressions Recap', '핵심 표현 총정리', 4, 'goal', 1) returning id into v_step;
    if u9 is not null and l.unit_id = u9 then
      update items set act_idx = act_idx + 100 where unit_id = u9 and lesson = 6;
      select payload into gp from items where unit_id = u9 and lesson = 1 and template = 'goal' limit 1;
      if gp is not null then
        insert into items(unit_id, lesson, act_idx, level, template, tag, payload, status, step_id)
          values (u9, 6, 0, 'CORE', 'goal', 'expr', gp, 'draft', v_step);
      end if;
    end if;
  end loop;
end $$;
