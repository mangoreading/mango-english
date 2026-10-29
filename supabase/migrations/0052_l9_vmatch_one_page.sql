-- 1차시 단어-뜻 매칭(숙제): 3개씩 쪼갠 3문항 → 6단어 1문항(한 화면)으로. 템플릿·L9 흐름의 문항 수(qty)도 1로.
update flow_steps s set qty = 1
  from flow_lessons l
 where s.lesson_id = l.id and l.no = 1 and s.kind = 'vmatch' and s.qty = 3
   and (l.template_id = (select id from flow_templates where name = '비상 초5 6차시')
        or l.unit_id = (select u.id from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9));

do $do$
declare v_unit uuid; v_step uuid; v_n int;
begin
  select u.id into v_unit from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9;
  select s.id into v_step from flow_steps s join flow_lessons l on l.id = s.lesson_id where l.unit_id = v_unit and l.no = 1 and s.kind = 'vmatch';
  if v_step is null then raise exception 'L9 1차시 vmatch step not found'; end if;
  delete from items where step_id = v_step and level = 'CORE' and template = 'vmatch';
  insert into items(unit_id, lesson, act_idx, level, template, tag, payload, status, step_id)
  values (v_unit, 1, 6, 'CORE', 'vmatch', 'vocab', '{"k":"vmatch","tag":"vocab","words":["hat","sunglasses","jacket","shorts","socks","shoes"]}'::jsonb, 'draft', v_step);
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'vmatch insert failed'; end if;
end $do$;
