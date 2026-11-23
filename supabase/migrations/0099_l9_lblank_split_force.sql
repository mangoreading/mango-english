-- 0099: L9 6차시 'Listen & Write (Blank)' 문항 분리
--  · 기존: 문제 1개 = 대화 2개(No.1/No.2) + 문장 2줄(1)·2)) + 빈칸 2개 (문제 2개)
--  · 변경: 대화마다 문제 1개 = 음원 1개 + 문장 한 줄 + 빈칸 1개 (문제 4개 = 활동 4문항)
--  · 0098 은 기존 문항 2개가 draft 가 아니어서(승인됨) 건너뛰었다. 관리자 요청에 따라 상태와 관계없이 교체하고, 새 문항 4개는 draft 로 넣는다 (승인·발행 필요)
do $do$
declare v_unit uuid; v_cnt int; v_l6 uuid; v_step uuid; v_pos int; v_old int; v_draft int; v_n int := 0; j jsonb;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise notice 'L9 unit lookup: % match(es) - skipped', v_cnt; return; end if;
  select id into v_l6 from flow_lessons where unit_id = v_unit and no = 6;
  select id, pos into v_step, v_pos from flow_steps where lesson_id = v_l6 and kind = 'lblank';
  if v_step is null then raise notice '6차시 lblank step not found - skipped'; return; end if;
  select count(*), count(*) filter (where status = 'draft') into v_old, v_draft from items where step_id = v_step;
  if v_old = 4 and v_draft = 4 then raise notice 'already split (4 draft items) - skipped'; return; end if;
  raise notice 'replacing % item(s), statuses: %', v_old, (select string_agg(distinct status::text, ',') from items where step_id = v_step);
  delete from items where step_id = v_step;
  for j in select * from jsonb_array_elements($j$[{"tag": "listen", "k": "lblank", "inst": "잘 듣고, 어떤 물건의 가격을 묻고 있는지 써 봅니다.", "say": "Lily(girl): How much are these sunglasses?\nClerk(woman): They're twenty thousand won.", "lines": ["How much are these {}?"], "ans": ["sunglasses"], "hint": ["물건 이름을 써요. s로 끝나요."]}, {"tag": "listen", "k": "lblank", "inst": "잘 듣고, 어떤 물건의 가격을 묻고 있는지 써 봅니다.", "say": "Clerk(woman): May I help you?\nKen(boy): Yes, please. How much are these shorts?\nClerk(woman): They're twenty-five thousand won.", "lines": ["How much are these {}?"], "ans": ["shorts"], "hint": ["물건 이름을 써요. s로 끝나요."]}, {"tag": "listen", "k": "lblank", "inst": "잘 듣고, 어떤 물건의 가격을 묻고 있는지 써 봅니다.", "say": "Tom(boy): How much is this hat?\nClerk(woman): It's ten thousand won.", "lines": ["How much is this {}?"], "ans": ["hat"], "hint": ["물건 이름을 써요. 하나인지 여러 개인지 잘 들어요."]}, {"tag": "listen", "k": "lblank", "inst": "잘 듣고, 어떤 물건의 가격을 묻고 있는지 써 봅니다.", "say": "Clerk(woman): May I help you?\nMia(girl): Yes, please. How much are these socks?\nClerk(woman): They're two thousand won.", "lines": ["How much are these {}?"], "ans": ["socks"], "hint": ["물건 이름을 써요. 하나인지 여러 개인지 잘 들어요."]}]$j$::jsonb) loop
    insert into items(unit_id, lesson, act_idx, level, template, tag, payload, status, step_id, created_at)
      values (v_unit, 6, v_pos, 'CORE', 'lblank', 'listen', j, 'draft', v_step, now() + v_n * interval '1 millisecond');
    v_n := v_n + 1;
  end loop;
  raise notice '6차시 Listen & Write (Blank): % -> % draft items', v_old, v_n;
end $do$;
